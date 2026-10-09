import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    "/recommendations/:path*",
    "/directory/:path*",
    "/flight-reconnect/:path*",
    "/requests/:path*",
    "/opportunities/:path*",
    "/events/:path*",
    "/profile/:path*",
    "/admin/:path*",
  ],
};
