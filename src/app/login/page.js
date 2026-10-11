"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { KQLogo, Button } from "@/components/KQBrand";
import { Icon, GoogleIcon } from "@/components/KQIcons";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const verified = searchParams.get("verified") === "true";
  const urlError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedPersona, setSelectedPersona] = useState("STAFF");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const urlErrorMessage =
    urlError === "expired_token"
      ? "That verification link expired. Please register again."
      : urlError === "invalid_token"
      ? "That verification link is invalid."
      : urlError === "missing_token"
      ? "Missing verification token."
      : "";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError(res.error);
      return;
    }

    router.push("/recommendations");
  };

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl: "/recommendations" });
  };

  return (
    <div className="min-h-screen w-full bg-[#071626] text-slate-100 flex flex-col justify-between">
      {/* Top Header Bar */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
        <KQLogo light />
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-block text-xs font-medium text-slate-400">
            Need an account?
          </span>
          <Link
            href="/register"
            className="btn btn-secondary text-xs px-4 py-2 border-slate-700 bg-slate-800 text-white hover:bg-slate-700 transition"
          >
            Create Account
          </Link>
        </div>
      </header>

      {/* Main Grid Layout */}
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 my-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Mission & Metrics */}
          <section className="lg:col-span-5 text-white space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-white/10 text-[#c59b27] text-xs font-bold tracking-wider uppercase">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              KENYA AIRWAYS ENTERPRISE PORTAL
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight tracking-tight">
              Aviation Mentorship &amp; Networking,{" "}
              <span className="text-[#c8102e]">Intelligently Connected.</span>
            </h1>

            <p className="text-slate-300 text-sm leading-relaxed max-w-xl">
              Connect with verified Pride Centre alumni, active flight crew, senior aeronautical engineers, and frequent flyers across Kenya Airways routes.
            </p>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-800">
              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                <b className="block text-xl font-bold text-white">150+</b>
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                  Stakeholders
                </span>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                <b className="block text-xl font-bold text-[#c59b27]">440+</b>
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                  Handshakes
                </span>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                <b className="block text-xl font-bold text-emerald-400">Hybrid</b>
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                  CBF + CF
                </span>
              </div>
            </div>

            {/* Privacy callout */}
            <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-300 flex items-start gap-3">
              <Icon name="shield" size={18} className="text-[#c59b27] shrink-0 mt-0.5" />
              <div>
                <b className="text-white block font-semibold mb-0.5">Privacy &amp; Mutual Consent Guaranteed</b>
                Personal itineraries and contact info unlock only upon bilateral acceptance between verified Kenya Airways stakeholders.
              </div>
            </div>
          </section>

          {/* Right Column: Sign In Card */}
          <section className="lg:col-span-7">
            <div className="bg-white rounded-xl p-6 sm:p-8 shadow-xl border border-slate-200 text-slate-900">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div>
                  <div className="text-xs uppercase font-bold tracking-wider text-[#c8102e]">
                    Sign In Portal
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                    Access Kenya Airways PrideConnect
                  </h2>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-md text-xs font-semibold">
                  <span className="px-3 py-1 rounded bg-white text-slate-900 shadow-xs">
                    Sign In
                  </span>
                  <Link
                    href="/register"
                    className="px-3 py-1 rounded text-slate-600 hover:text-[#c8102e] transition"
                  >
                    Register
                  </Link>
                </div>
              </div>

              {/* Status Alert Banners */}
              {verified && (
                <div className="mt-3 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-md flex items-center gap-2">
                  <Icon name="check" size={16} />
                  <span>Email verified successfully! You can now sign in.</span>
                </div>
              )}

              {urlErrorMessage && (
                <div className="mt-3 p-2.5 bg-red-50 border border-red-200 text-[#c8102e] text-xs rounded-md flex items-center gap-2">
                  <Icon name="close" size={16} />
                  <span>{urlErrorMessage}</span>
                </div>
              )}

              {error && (
                <div className="mt-3 p-2.5 bg-red-50 border border-red-200 text-[#c8102e] text-xs rounded-md flex items-center gap-2">
                  <Icon name="close" size={16} />
                  <span>{error}</span>
                </div>
              )}

              {/* Google OAuth Button */}
              <div className="mt-4">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-md text-xs font-semibold text-slate-700 flex items-center justify-center gap-2.5 transition cursor-pointer"
                >
                  <GoogleIcon size={18} />
                  <span>Sign in with Google</span>
                </button>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  or sign in with email
                </span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              {/* Sign In Form */}
              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Official Email / Membership ID
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. pilot@kenya-airways.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm outline-none focus:bg-white focus:border-[#c8102e] transition text-slate-900"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-xs text-slate-500 hover:text-[#c8102e] flex items-center gap-1 font-medium cursor-pointer"
                    >
                      <Icon name="eye" size={12} />
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm outline-none focus:bg-white focus:border-[#c8102e] transition text-slate-900"
                    required
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600 pt-0.5">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="accent-[#c8102e] rounded"
                    />
                    <span>Remember this session</span>
                  </label>
                  <Link href="/register" className="text-[#c8102e] hover:underline font-semibold">
                    Need an account?
                  </Link>
                </div>

                <Button
                  type="submit"
                  className="w-full py-2.5 text-sm font-bold mt-2"
                  disabled={loading}
                >
                  {loading ? "Authenticating..." : "Sign In to PrideConnect"}
                </Button>
              </form>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 text-center text-xs text-slate-500 border-t border-slate-800">
        Kenya Airways PrideConnect · Intelligent Stakeholder Matching Framework · Strathmore University
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}