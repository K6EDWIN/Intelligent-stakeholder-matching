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
    <div className="min-h-screen w-full overflow-x-hidden dynamic-mesh-bg text-[#182231] flex flex-col justify-between relative">
      {/* Subtle Ambient Background Orbs */}
      <div className="ambient-orb-primary" />
      <div className="ambient-orb-secondary" />

      {/* Top Header Bar */}
      <header className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 flex items-center justify-between">
        <KQLogo />
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-block text-xs font-semibold text-gray-300">
            Need an account?
          </span>
          <Link
            href="/register"
            className="btn btn-secondary text-xs px-4 py-2 border-white/20 bg-white/10 text-white hover:bg-white hover:text-[#0e2740] transition backdrop-blur-sm"
          >
            Create Account
          </Link>
        </div>
      </header>

      {/* Main Responsive Grid Layout */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 my-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">
          {/* Left Column: Brand Showcase & Live Intelligence Metrics */}
          <section className="lg:col-span-5 text-white space-y-5 lg:pt-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs text-[#e5b842] font-semibold tracking-wide">
              <span className="w-2 h-2 rounded-full bg-[#1b8755]" />
              KENYA AIRWAYS ENTERPRISE ECOSYSTEM
            </div>

            <h1 className="font-['Fraunces',serif] text-3xl sm:text-4xl lg:text-5xl font-normal leading-[1.12] text-white tracking-tight">
              Aviation Mentorship &amp; Networking,{" "}
              <span className="text-[#e5b842] block sm:inline">Intelligently Connected.</span>
            </h1>

            <p className="text-gray-300 text-sm leading-relaxed max-w-xl">
              Connect with verified Pride Centre alumni, active flight crew, senior engineers, and frequent flyers across Kenya Airways routes through transparent hybrid recommendations.
            </p>

            {/* Live Metrics Grid */}
            <div className="grid grid-cols-3 gap-2.5 pt-3 border-t border-white/15">
              <div className="bg-white/5 backdrop-blur-md p-3 rounded-xl border border-white/10">
                <b className="block text-lg sm:text-xl font-['Fraunces',serif] text-white">1,200+</b>
                <span className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">
                  Verified Members
                </span>
              </div>
              <div className="bg-white/5 backdrop-blur-md p-3 rounded-xl border border-white/10">
                <b className="block text-lg sm:text-xl font-['Fraunces',serif] text-[#e5b842]">94%</b>
                <span className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">
                  Hybrid Precision
                </span>
              </div>
              <div className="bg-white/5 backdrop-blur-md p-3 rounded-xl border border-white/10">
                <b className="block text-lg sm:text-xl font-['Fraunces',serif] text-[#1b8755]">35k ft</b>
                <span className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">
                  Flight Reconnect
                </span>
              </div>
            </div>

            {/* Privacy callout */}
            <div className="p-3.5 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 text-xs text-gray-300 flex items-start gap-3">
              <Icon name="shield" size={18} className="text-[#e5b842] shrink-0 mt-0.5" />
              <div>
                <b className="text-white block font-semibold mb-0.5">Privacy &amp; Mutual Consent Guarantee</b>
                Personal flight itineraries and contact info unlock only upon bilateral acceptance between verified Kenya Airways stakeholders.
              </div>
            </div>
          </section>

          {/* Right Column: High-Contrast Sign In Card */}
          <section className="lg:col-span-7">
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/20 relative">
              <div className="flex items-center justify-between pb-4 border-b border-[#dce0e3]">
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-widest text-[#bb162b]">
                    Sign In Portal
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold font-['Fraunces',serif] text-[#0e2740] mt-0.5">
                    Access Your KQ Network
                  </h2>
                </div>
                <div className="flex bg-[#f2f1ed] p-1 rounded-lg text-xs font-semibold">
                  <button className="px-3 py-1 rounded-md bg-white text-[#0e2740] shadow-sm">
                    Sign In
                  </button>
                  <Link
                    href="/register"
                    className="px-3 py-1 rounded-md text-gray-600 hover:text-[#bb162b] transition"
                  >
                    Register
                  </Link>
                </div>
              </div>

              {/* Status Alert Banners */}
              {verified && (
                <div className="mt-3 p-2.5 bg-green-50 border border-green-200 text-[#1b8755] text-xs rounded-lg flex items-center gap-2">
                  <Icon name="check" size={16} />
                  <span>Email verified successfully! You can now sign in.</span>
                </div>
              )}

              {urlErrorMessage && (
                <div className="mt-3 p-2.5 bg-red-50 border border-red-200 text-[#bb162b] text-xs rounded-lg flex items-center gap-2">
                  <Icon name="close" size={16} />
                  <span>{urlErrorMessage}</span>
                </div>
              )}

              {error && (
                <div className="mt-3 p-2.5 bg-red-50 border border-red-200 text-[#bb162b] text-xs rounded-lg flex items-center gap-2">
                  <Icon name="close" size={16} />
                  <span>{error}</span>
                </div>
              )}

              {/* Google One-Click OAuth Button */}
              <div className="mt-5">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="w-full py-2.5 px-4 bg-white hover:bg-gray-50 border border-[#dce0e3] rounded-xl text-xs font-bold text-gray-700 flex items-center justify-center gap-2.5 transition shadow-sm hover:border-gray-400"
                >
                  <GoogleIcon size={18} />
                  <span>Sign in with Google</span>
                </button>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  or sign in with email
                </span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {/* Persona Selection Pills */}
              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                  Sign In As:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: "STAFF", label: "Active Staff", icon: "flight" },
                    { id: "ALUMNI", label: "Pride Centre", icon: "academic" },
                    { id: "FORMER_STAFF", label: "Former Staff", icon: "star" },
                    { id: "FREQUENT_FLYER", label: "Frequent Flyer", icon: "shield" },
                  ].map((p) => {
                    const isSelected = selectedPersona === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedPersona(p.id)}
                        className={`px-2.5 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition border ${
                          isSelected
                            ? "bg-[#bb162b] text-white border-[#bb162b] shadow-sm"
                            : "bg-[#fbf9f5] border-[#dce0e3] text-gray-700 hover:border-gray-400"
                        }`}
                      >
                        <Icon name={p.icon} size={14} className={isSelected ? "text-white" : "text-gray-500"} />
                        <span className="text-[11px] leading-tight font-medium">{p.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sign In Form */}
              <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Official Email / Membership ID
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. yourname@kenya-airways.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#fbf9f5] border border-[#dce0e3] rounded-lg px-3 py-2 text-sm outline-none focus:bg-white focus:border-[#bb162b] focus:ring-1 focus:ring-[#bb162b] transition"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-xs text-gray-500 hover:text-[#bb162b] flex items-center gap-1 font-medium"
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
                    className="w-full bg-[#fbf9f5] border border-[#dce0e3] rounded-lg px-3 py-2 text-sm outline-none focus:bg-white focus:border-[#bb162b] focus:ring-1 focus:ring-[#bb162b] transition"
                    required
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-gray-600 pt-0.5">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="accent-[#bb162b] rounded"
                    />
                    <span>Remember this device</span>
                  </label>
                  <Link href="/register" className="text-[#bb162b] hover:underline font-semibold">
                    Need an account?
                  </Link>
                </div>

                <Button
                  type="submit"
                  className="w-full py-2.5 text-sm font-bold shadow-md mt-2"
                  disabled={loading}
                  icon="arrow"
                >
                  {loading ? "Authenticating..." : "Sign In to KQ PrideConnect"}
                </Button>
              </form>
            </div>
          </section>
        </div>
      </main>

      {/* Footer Branding */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 text-center text-xs text-gray-400 border-t border-white/10 mt-auto">
        Kenya Airways PrideConnect · Intelligent Stakeholder Matching Framework · Strathmore University Research
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