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
    subtitle: "Pilots, cabin crew, engineers, operations",
    icon: "flight",
    tag: "Active Crew",
  },
  {
    id: "FORMER_STAFF",
    title: "Former Staff / Retiree",
    subtitle: "Alumni network & institutional advisors",
    icon: "star",
    tag: "Advisory",
  },
  {
    id: "FREQUENT_FLYER",
    title: "Frequent Flyer",
    subtitle: "Asante Rewards & executive passengers",
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
    <div className="min-h-screen w-full bg-[#071626] text-slate-100 flex flex-col justify-between">
      {/* Top Brand Bar */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
        <KQLogo light />
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-block text-xs font-medium text-slate-400">
            Already registered?
          </span>
          <Link
            href="/login"
            className="btn btn-secondary text-xs px-4 py-2 border-slate-700 bg-slate-800 text-white hover:bg-slate-700 transition"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 my-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column */}
          <section className="lg:col-span-5 text-white space-y-5 lg:pt-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-white/10 text-[#c59b27] text-xs font-bold tracking-wider uppercase">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              JOIN KENYA AIRWAYS PRIDECONNECT
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight tracking-tight">
              Elevate Your Aviation Career with the{" "}
              <span className="text-[#c8102e]">Pride of Africa.</span>
            </h1>

            <p className="text-slate-300 text-sm leading-relaxed">
              Create your verified profile to connect with experienced mentors, explore aviation opportunities, and build relationships across Kenya Airways stations.
            </p>

            {/* Checklist */}
            <div className="space-y-3 pt-3 border-t border-slate-800">
              {[
                {
                  icon: "sparkles",
                  title: "Hybrid Recommendation Matching",
                  desc: "Algorithms evaluate shared skills, fleet types, and career goals.",
                },
                {
                  icon: "flight",
                  title: "Flight Reconnect at 35,000 Ft",
                  desc: "Privacy-first route networking on scheduled Kenya Airways flights.",
                },
                {
                  icon: "academic",
                  title: "Pride Centre Events & Masterclasses",
                  desc: "Access verified industry workshops, cadet sessions, and job openings.",
                },
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 text-xs text-slate-300">
                  <div className="w-6 h-6 rounded bg-slate-900 border border-slate-800 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon name={item.icon} size={13} />
                  </div>
                  <div>
                    <b className="text-white block font-semibold">{item.title}</b>
                    <span className="text-slate-400 text-xs">{item.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Right Column */}
          <section className="lg:col-span-7 w-full max-w-2xl mx-auto">
            <div className="bg-white rounded-xl p-6 sm:p-8 shadow-xl border border-slate-200 text-slate-900">
              {submitted ? (
                /* Post-Submission Screen */
                <div className="text-center py-6 space-y-4">
                  <div className="w-14 h-14 bg-emerald-50 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Icon name="shield" size={28} />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    Verify Your Email Address
                  </h2>
                  <p className="text-sm text-slate-600 max-w-md mx-auto">
                    We sent a secure activation link to <b>{form.email}</b>. Please check your inbox to confirm your Kenya Airways stakeholder registration.
                  </p>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 max-w-md mx-auto text-left">
                    <b className="text-slate-800 block mb-1">Developer Testing Note:</b>
                    If testing locally without live SMTP credentials, the activation link is also printed in your dev server terminal.
                  </div>
                  <div className="pt-2">
                    <Link href="/login" className="btn btn-primary px-8">
                      Proceed to Sign In
                    </Link>
                  </div>
                </div>
              ) : (
                /* Form */
                <>
                  <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                    <div>
                      <div className="text-xs uppercase font-bold tracking-wider text-[#c8102e]">
                        Stakeholder Enrollment
                      </div>
                      <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                        Create Your Account
                      </h2>
                    </div>
                    <div className="flex bg-slate-100 p-1 rounded-md text-xs font-semibold">
                      <Link
                        href="/login"
                        className="px-3 py-1 rounded text-slate-600 hover:text-[#c8102e] transition"
                      >
                        Sign In
                      </Link>
                      <span className="px-3 py-1 rounded bg-white text-slate-900 shadow-xs">
                        Register
                      </span>
                    </div>
                  </div>

                  {/* Google OAuth Button */}
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => signIn("google", { callbackUrl: "/recommendations" })}
                      className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-md text-xs font-semibold text-slate-700 flex items-center justify-center gap-2.5 transition cursor-pointer"
                    >
                      <GoogleIcon size={18} />
                      <span>Sign up with Google</span>
                    </button>
                  </div>

                  {/* Divider */}
                  <div className="flex items-center gap-3 my-4">
                    <div className="flex-1 h-px bg-slate-200" />
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      or register with email
                    </span>
                    <div className="flex-1 h-px bg-slate-200" />
                  </div>

                  {error && (
                    <div className="p-2.5 bg-red-50 border border-red-200 text-[#c8102e] text-xs rounded-md mb-3 flex items-center gap-2">
                      <Icon name="close" size={16} />
                      <span>{error}</span>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-3.5">
                    {/* Persona Selector */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-2">
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
                              className={`p-2.5 rounded-lg text-left flex items-start gap-2.5 transition border cursor-pointer ${
                                isSelected
                                  ? "border-[#c8102e] bg-red-50/50 shadow-xs ring-1 ring-[#c8102e]"
                                  : "bg-slate-50 border-slate-200 hover:border-slate-300"
                              }`}
                            >
                              <div
                                className={`w-7 h-7 rounded flex items-center justify-center shrink-0 ${
                                  isSelected
                                    ? "bg-[#c8102e] text-white"
                                    : "bg-white text-slate-600 border border-slate-200"
                                }`}
                              >
                                <Icon name={p.icon} size={14} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1">
                                  <b
                                    className={`text-xs ${
                                      isSelected ? "text-[#c8102e]" : "text-slate-900"
                                    }`}
                                  >
                                    {p.title}
                                  </b>
                                  <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">
                                    {p.tag}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
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
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Full Name
                        </label>
                        <input
                          name="fullName"
                          placeholder="e.g. Edwin Kamau"
                          value={form.fullName}
                          onChange={handleChange}
                          className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm outline-none focus:bg-white focus:border-[#c8102e] transition text-slate-900"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Official or Personal Email
                        </label>
                        <input
                          name="email"
                          type="email"
                          placeholder="you@kenya-airways.com"
                          value={form.email}
                          onChange={handleChange}
                          className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm outline-none focus:bg-white focus:border-[#c8102e] transition text-slate-900"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                          name="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Minimum 8 characters"
                          value={form.password}
                          onChange={handleChange}
                          className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm outline-none focus:bg-white focus:border-[#c8102e] transition text-slate-900"
                          required
                          minLength={6}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Staff ID / Student Reg{" "}
                          <span className="text-slate-400 font-normal">(optional)</span>
                        </label>
                        <input
                          name="identifier"
                          placeholder="e.g. KQ-10294 or PC-2024"
                          value={form.identifier}
                          onChange={handleChange}
                          className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm outline-none focus:bg-white focus:border-[#c8102e] transition text-slate-900"
                        />
                      </div>
                    </div>

                    {/* Privacy & Consent */}
                    <div className="pt-1">
                      <label className="flex items-start gap-2.5 cursor-pointer select-none text-xs text-slate-600">
                        <input
                          type="checkbox"
                          checked={consent}
                          onChange={(e) => setConsent(e.target.checked)}
                          className="accent-[#c8102e] rounded mt-0.5"
                        />
                        <span>
                          <b>I agree to the Kenya Airways PrideConnect Charter</b> and consent to explainable recommendation matching.
                        </span>
                      </label>
                    </div>

                    <Button
                      type="submit"
                      className="w-full py-2.5 text-sm font-bold mt-2"
                      disabled={loading}
                    >
                      {loading ? "Creating Stakeholder Account..." : "Complete Registration"}
                    </Button>
                  </form>
                </>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 text-center text-xs text-slate-500 border-t border-slate-800">
        Kenya Airways PrideConnect · Intelligent Stakeholder Matching Framework · Strathmore University Research
      </footer>
    </div>
  );
}