import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const authOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    ...(() => {
      const googleClientId = (process.env.GOOGLE_CLIENT_ID || "")
        .replace(/^["']|["']$/g, "")
        .trim();
      const googleClientSecret = (process.env.GOOGLE_CLIENT_SECRET || "")
        .replace(/^["']|["']$/g, "")
        .trim();

      return googleClientId && googleClientSecret
        ? [
            GoogleProvider({
              clientId: googleClientId,
              clientSecret: googleClientSecret,
            }),
          ]
        : [
            GoogleProvider({
              clientId: googleClientId || "placeholder_client_id",
              clientSecret: googleClientSecret || "placeholder_secret",
            }),
          ];
    })(),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          throw new Error("No account found with that email");
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isValid) {
          throw new Error("Incorrect password");
        }

        if (!user.isVerified) {
          throw new Error(
            "Please verify your email before logging in. Check your inbox for the verification link."
          );
        }

        if (user.isSuspended) {
          throw new Error(
            "This account has been suspended. Contact an administrator."
          );
        }

        return {
          id: user.id,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        if (!user.email) return false;

        let existingUser = await prisma.user.findUnique({
          where: { email: user.email },
        });

        if (!existingUser) {
          // Auto-provision verified user from Google OAuth
          existingUser = await prisma.user.create({
            data: {
              email: user.email,
              passwordHash: "",
              role: "STAFF",
              isVerified: true,
              isSuspended: false,
              profile: {
                create: {
                  fullName: user.name || "Kenya Airways Member",
                  department: "Flight Operations",
                  mentorshipRole: "BOTH",
                  isPublic: true,
                },
              },
            },
          });
        }

        if (existingUser.isSuspended) {
          return false;
        }

        user.id = existingUser.id;
        user.role = existingUser.role;
        return true;
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.isSuspended = Boolean(user.isSuspended);
      }

      // Check database for active suspension status on existing session tokens
      if (token?.id) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id },
            select: { isSuspended: true, role: true },
          });

          if (dbUser) {
            token.isSuspended = dbUser.isSuspended;
            token.role = dbUser.role;
          } else {
            token.isSuspended = true;
          }
        } catch {
          // Fallback gracefully on transient DB connection issues
        }
      }

      return token;
    },
    async session({ session, token }) {
      // Immediately invalidate session if the account has been suspended by an admin
      if (token?.isSuspended) {
        return null;
      }

      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.isSuspended = token.isSuspended || false;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};