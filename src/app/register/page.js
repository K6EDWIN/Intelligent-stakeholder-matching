"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { KQLogo, Button } from "@/components/KQBrand";
import { Icon, GoogleIcon } from "@/components/KQIcons";

const PERSONAS = [
  {
    id: "ALUMNI",
    title: "Pride Centre Alumni",
    subtitle: "Graduates & current aviation trainees",
    icon: "academic",
    tag: "Graduates",
  },
  {
    id: "STAFF",
    title: "Active Flight & Ground Staff",
    subtitle: "Pilots, cabin crew, engineers, ops",
    icon: "flight",
    tag: "Active Crew",
  },
  {
    id: "FORMER_STAFF",
    title: "Former Employee / Retiree",
    subtitle: "Alumni network & institutional advisors",
    icon: "star",
    tag: "Advisory",
  },
  {
    id: "FREQUENT_FLYER",
    title: "Frequent Flyer",
    subtitle: "Asante Rewards & executive travelers",
    icon: "shield",
    tag: "Asante Elite",
  },
];

export default function RegisterPage() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    fullName: "",
    role: "ALUMNI",
    department: "Flight Operations",
    identifier: "",
  });
  const [consent, setConsent] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleSelect = (roleId) => {
    setForm((prev) => ({ ...prev, role: roleId }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!consent) {
      setError("Please accept the privacy and stakeholder consent agreement.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          fullName: form.fullName,
          role: form.role,
        }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.error || "Registration failed. Please verify your details.");
        return;
      }

      setSubmitted(true);
    } catch (err) {
      setLoading(false);
      setError("Network error: " + err.message);
    }
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden dynamic-mesh-bg text-[#182231] flex flex-col justify-between relative">
      {/* Dynamic Ambient Background Orbs */}
      <div className="ambient-orb-primary" />
      <div className="ambient-orb-secondary" />

      {/* Top Brand Bar */}
      <header className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 flex items-center justify-between">
        <KQLogo />
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-block text-xs font-semibold text-gray-300">
            Already registered?
          </span>
          <Link
            href="/login"
            className="btn btn-secondary text-xs px-4 py-2 border-white/20 bg-white/10 text-white hover:bg-white hover:text-[#0e2740] transition backdrop-blur-sm"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 my-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">
          {/* Left Column: Value Proposition & Onboarding Guide */}
          <section className="lg:col-span-5 text-white space-y-5 lg:pt-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs text-[#e5b842] font-semibold tracking-wide">
              <span className="w-2 h-2 rounded-full bg-[#1b8755]" />
              JOIN KENYA AIRWAYS PRIDECONNECT
            </div>

            <h1 className="font-['Fraunces',serif] text-3xl sm:text-4xl lg:text-5xl font-normal leading-[1.12] text-white tracking-tight">
              Elevate Your Career with the{" "}
              <span className="text-[#e5b842] block sm:inline">Wings of Africa.</span>
            </h1>

            <p className="text-gray-300 text-sm leading-relaxed">
              Create your verified profile to get matched with experienced mentors, discover aviation opportunities, and build peer networks across Kenya Airways stations.
            </p>

            {/* Checklist of Member Privileges with SVG Icons */}
            <div className="space-y-3 pt-3 border-t border-white/15">
              {[
                {
                  icon: "sparkles",
                  title: "AI-Powered Hybrid Matching",
                  desc: "Algorithms evaluate shared skills, aircraft types, and career goals.",
                },
                {
                  icon: "flight",
                  title: "Flight Reconnect at 35,000 Ft",
                  desc: "Privacy-first route networking on scheduled Kenya Airways flights.",
                },
                {
                  icon: "academic",
                  title: "Pride Centre Masterclasses & Events",
                  desc: "Access verified webinars, cadet workshops, and job openings.",
                },
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 text-xs text-gray-300">
                  <div className="w-6 h-6 rounded-full bg-[#1b8755]/20 text-[#1b8755] border border-[#1b8755]/40 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon name={item.icon} size={13} />
                  </div>
                  <div>
                    <b className="text-white block">{item.title}</b>
                    <span className="text-gray-400 text-[11px]">{item.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Right Column: Comprehensive Registration Card */}
          <section className="lg:col-span-7 w-full max-w-2xl mx-auto">
            <div className="glass-panel p-5 sm:p-8 rounded-2xl shadow-2xl relative">
              {submitted ? (
                /* Post-Submission Verification Screen */
                <div className="text-center py-6 space-y-4">
                  <div className="w-14 h-14 bg-green-50 text-[#1b8755] border border-green-200 rounded-full flex items-center justify-center mx-auto mb-2 animate-bounce">
                    <Icon name="shield" size={28} />
                  </div>
                  <h2 className="text-2xl font-bold font-['Fraunces',serif] text-[#0e2740]">
                    Verify Your Email Address
                  </h2>
                  <p className="text-sm text-gray-600 max-w-md mx-auto">
                    We sent a secure activation link to <b>{form.email}</b>. Please check your inbox to confirm your Kenya Airways stakeholder registration.
                  </p>
                  <div className="p-3 bg-[#fbf9f5] border border-[#dce0e3] rounded-xl text-xs text-gray-500 max-w-md mx-auto text-left">
                    <b className="text-gray-700 block mb-1">Developer &amp; Testing Note:</b>
                    If testing locally without live SMTP mail, the activation link is also printed directly in your dev server terminal.
                  </div>
                  <div className="pt-2">
                    <Link href="/login" className="btn btn-primary px-8">
                      Proceed to Sign In
                    </Link>
                  </div>
                </div>
              ) : (
                /* Registration Form */
                <>
                  <div className="flex items-center justify-between pb-4 border-b border-[#dce0e3]">
                    <div>
                      <div className="text-[10px] uppercase font-bold tracking-widest text-[#bb162b]">
                        New Stakeholder Enrollment
                      </div>
                      <h2 className="text-xl sm:text-2xl font-bold font-['Fraunces',serif] text-[#0e2740] mt-0.5">
                        Create Your Account
                      </h2>
                    </div>
                    <div className="flex bg-[#f2f1ed] p-1 rounded-lg text-xs font-semibold">
                      <Link
                        href="/login"
                        className="px-3 py-1 rounded-md text-gray-600 hover:text-[#bb162b] transition"
                      >
                        Sign In
                      </Link>
                      <button className="px-3 py-1 rounded-md bg-white text-[#0e2740] shadow-sm">
                        Register
                      </button>
                    </div>
                  </div>

                  {/* Google One-Click OAuth Button */}
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => signIn("google", { callbackUrl: "/recommendations" })}
                      className="w-full py-2.5 px-4 bg-white hover:bg-gray-50 border border-[#dce0e3] rounded-xl text-xs font-bold text-gray-700 flex items-center justify-center gap-2.5 transition shadow-sm hover:border-gray-400"
                    >
                      <GoogleIcon size={18} />
                      <span>Sign up with Google</span>
                    </button>
                  </div>

                  {/* Divider */}
                  <div className="flex items-center gap-3 my-4">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      or register with credentials
                    </span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-3.5">
                    {/* Persona Selector (4 Cards with wrap, no truncation) */}
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-2">
                        Step 1: Choose Your Stakeholder Persona
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {PERSONAS.map((p) => {
                          const isSelected = form.role === p.id;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => handleRoleSelect(p.id)}
                              className={`p-3 rounded-xl text-left flex items-start gap-2.5 transition border ${
                                isSelected
                                  ? "border-[#bb162b] bg-[#fff8f8] shadow-sm ring-1 ring-[#bb162b]"
                                  : "bg-[#fbf9f5] border-[#dce0e3] hover:border-gray-400"
                              }`}
                            >
                              <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                  isSelected
                                    ? "bg-[#bb162b] text-white"
                                    : "bg-white text-gray-600 border border-[#dce0e3]"
                                }`}
                              >
                                <Icon name={p.icon} size={15} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1">
                                  <b
                                    className={`text-xs ${
                                      isSelected ? "text-[#bb162b]" : "text-[#0e2740]"
                                    }`}
                                  >
                                    {p.title}
                                  </b>
                                  <span className="text-[9px] uppercase font-bold text-gray-400 shrink-0">
                                    {p.tag}
                                  </span>
                                </div>
                                <p className="text-[10px] text-gray-500 mt-0.5 leading-snug">
                                  {p.subtitle}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Basic Info Fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                          Full Name
                        </label>
                        <input
                          name="fullName"
                          placeholder="e.g. Edwin Kamau"
                          value={form.fullName}
                          onChange={handleChange}
                          className="w-full bg-[#fbf9f5] border border-[#dce0e3] rounded-lg px-3 py-2 text-sm outline-none focus:bg-white focus:border-[#bb162b] focus:ring-1 focus:ring-[#bb162b] transition"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                          Official or Personal Email
                        </label>
                        <input
                          name="email"
                          type="email"
                          placeholder="you@kenya-airways.com"
                          value={form.email}
                          onChange={handleChange}
                          className="w-full bg-[#fbf9f5] border border-[#dce0e3] rounded-lg px-3 py-2 text-sm outline-none focus:bg-white focus:border-[#bb162b] focus:ring-1 focus:ring-[#bb162b] transition"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                            Account Password
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
                          name="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Minimum 8 characters"
                          value={form.password}
                          onChange={handleChange}
                          className="w-full bg-[#fbf9f5] border border-[#dce0e3] rounded-lg px-3 py-2 text-sm outline-none focus:bg-white focus:border-[#bb162b] focus:ring-1 focus:ring-[#bb162b] transition"
                          required
                          minLength={6}
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                          Staff ID / Student Reg{" "}
                          <span className="text-gray-400 font-normal lowercase">(optional)</span>
                        </label>
                        <input
                          name="identifier"
                          placeholder="e.g. KQ-10294 or PC-2024"
                          value={form.identifier}
                          onChange={handleChange}
                          className="w-full bg-[#fbf9f5] border border-[#dce0e3] rounded-lg px-3 py-2 text-sm outline-none focus:bg-white focus:border-[#bb162b] focus:ring-1 focus:ring-[#bb162b] transition"
                        />
                      </div>
                    </div>

                    {/* Privacy & Consent */}
                    <div className="pt-1">
                      <label className="flex items-start gap-2.5 cursor-pointer select-none text-xs text-gray-600">
                        <input
                          type="checkbox"
                          checked={consent}
                          onChange={(e) => setConsent(e.target.checked)}
                          className="accent-[#bb162b] rounded mt-0.5"
                        />
                        <span>
                          <b>I agree to the Kenya Airways PrideConnect Community Charter</b> and consent to explainable recommendation matching and mutual contact verification.
                        </span>
                      </label>
                    </div>

                    {/* Submit CTA */}
                    <Button
                      type="submit"
                      className="w-full py-3 text-sm font-bold shadow-md mt-2"
                      disabled={loading}
                      icon="arrow"
                    >
                      {loading ? "Creating Stakeholder Account..." : "Complete Registration & Get Matched"}
                    </Button>
                  </form>
                </>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 text-center text-xs text-gray-400 border-t border-white/10 mt-auto">
        Kenya Airways PrideConnect · Intelligent Stakeholder Matching Framework · Strathmore University Research
      </footer>
    </div>
  );
}