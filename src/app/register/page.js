"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getProviders, signIn } from "next-auth/react";
import { KQLogo, Button } from "@/components/KQBrand";
import { Icon, GoogleIcon } from "@/components/KQIcons";
import { ViewModeToggle } from "@/components/ViewMode";

const PERSONAS = [
  {
    id: "ALUMNI",
    title: "Pride Centre Alumni",
    tag: "Graduates",
    subtitle: "Graduates & current aviation trainees",
    icon: "academic",
  },
  {
    id: "STAFF",
    title: "Active Flight & Ground Staff",
    tag: "Active Crew",
    subtitle: "Pilots, cabin crew, engineers, operations",
    icon: "flight",
  },
  {
    id: "FORMER_STAFF",
    title: "Former Staff / Retiree",
    tag: "Advisory",
    subtitle: "Alumni network & institutional advisors",
    icon: "star",
  },
  {
    id: "FREQUENT_FLYER",
    title: "Frequent Flyer",
    tag: "Asante Elite",
    subtitle: "Asante Rewards & executive passengers",
    icon: "shield",
  },
];

export default function RegisterPage() {
  const [googleAvailable, setGoogleAvailable] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    fullName: "",
    role: "",
    department: "",
    bio: "",
    mentorshipRole: "",
    identifier: "",
  });
  const [consent, setConsent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let isMounted = true;
    getProviders()
      .then((providers) => { if (isMounted) setGoogleAvailable(Boolean(providers?.google)); })
      .catch(() => { if (isMounted) setGoogleAvailable(false); });
    return () => { isMounted = false; };
  }, []);

  const selectedPersona = PERSONAS.find((p) => p.id === form.role) || null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleSelect = (roleId) => {
    setForm((prev) => ({ ...prev, role: roleId }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.role) {
      setError("Choose your stakeholder type to continue.");
      return;
    }
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
          department: form.department,
          bio: form.bio,
          mentorshipRole: form.mentorshipRole,
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
    <div className="auth-page min-h-screen w-full bg-[#071626] text-slate-100 flex flex-col justify-between">
      {/* Top Brand Bar */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
        <KQLogo light />
        <div className="flex items-center gap-3">
          <ViewModeToggle compact />
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
      {/* Main Content Area */}
      <main className="w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-10 lg:py-16 my-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          {/* Left Column */}
          <section className="lg:col-span-5 text-white space-y-6 lg:pt-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-white/10 text-[#c59b27] text-xs font-bold tracking-wider uppercase">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              JOIN KENYA AIRWAYS PRIDECONNECT
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight tracking-tight text-white">
              Elevate Your Aviation Career with the{" "}
              <span className="text-[#c8102e]">Pride of Africa.</span>
            </h1>

            <p className="text-slate-300 text-sm leading-relaxed">
              Create your verified profile to connect with experienced mentors, explore aviation opportunities, and build relationships across Kenya Airways stations.
            </p>

            {/* Checklist */}
            <div className="space-y-4 pt-4 border-t border-slate-800">
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
                <div key={idx} className="flex items-start gap-3.5 text-xs text-slate-300">
                  <div className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-800 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon name={item.icon} size={14} />
                  </div>
                  <div>
                    <b className="text-white block font-semibold text-sm mb-0.5">{item.title}</b>
                    <span className="text-slate-400 text-xs leading-relaxed">{item.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Right Column */}
          <section className="lg:col-span-7 w-full">
            <div className="bg-white rounded-2xl p-8 sm:p-10 shadow-2xl border border-slate-200/90 text-slate-900">
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
                  <div className="flex items-center justify-between pb-5 border-b border-slate-100">
                    <div>
                      <div className="text-xs uppercase font-bold tracking-wider text-[#c8102e]">
                        Stakeholder Enrollment
                      </div>
                      <h2 className="text-xl font-bold text-slate-900 mt-1">
                        Create Your Account
                      </h2>
                    </div>
                    <div className="flex bg-slate-100 p-1 rounded-lg text-xs font-semibold">
                      <Link
                        href="/login"
                        className="px-3.5 py-1.5 rounded-md text-slate-600 hover:text-[#c8102e] transition"
                      >
                        Sign In
                      </Link>
                      <span className="px-3.5 py-1.5 rounded-md bg-white text-slate-900 shadow-xs">
                        Register
                      </span>
                    </div>
                  </div>

                  {googleAvailable && (
                    <>
                      <div className="mt-5">
                        <button
                          type="button"
                          onClick={() => signIn("google", { callbackUrl: "/recommendations" })}
                          className="w-full py-3 px-4 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 flex items-center justify-center gap-3 transition cursor-pointer shadow-xs"
                        >
                          <GoogleIcon size={18} />
                          <span>Sign up with Google</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-3 my-5">
                        <div className="flex-1 h-px bg-slate-200" />
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                          or register with email
                        </span>
                        <div className="flex-1 h-px bg-slate-200" />
                      </div>
                    </>
                  )}

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 text-[#c8102e] text-xs rounded-lg mb-4 flex items-center gap-2">
                      <Icon name="close" size={16} />
                      <span>{error}</span>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Persona Selector */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-semibold text-slate-700">
                          Step 1: Choose Your Stakeholder Persona
                        </label>
                        <span className="text-[11px] text-slate-500 font-medium">
                          Used for account access and directory filters
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {PERSONAS.map((p) => {
                          const isSelected = form.role === p.id;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => handleRoleSelect(p.id)}
                              className={`p-3.5 rounded-xl text-left flex items-start gap-3 transition border cursor-pointer relative overflow-hidden ${
                                isSelected
                                  ? "border-[#c8102e] bg-red-50/70 shadow-sm ring-2 ring-[#c8102e]/25"
                                  : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                              }`}
                            >
                              <div
                                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition ${
                                  isSelected
                                    ? "bg-[#c8102e] text-white shadow-xs"
                                    : "bg-slate-100 text-slate-600 border border-slate-200"
                                }`}
                              >
                                <Icon name={p.icon} size={16} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1.5 mb-0.5">
                                  <b
                                    className={`text-xs font-bold ${
                                      isSelected ? "text-[#c8102e]" : "text-slate-900"
                                    }`}
                                  >
                                    {p.title}
                                  </b>
                                  <span
                                    className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded tracking-wide shrink-0 ${
                                      isSelected
                                        ? "bg-[#c8102e] text-white"
                                        : "bg-slate-100 text-slate-600 border border-slate-200"
                                    }`}
                                  >
                                    {p.tag}
                                  </span>
                                </div>
                                <p className="text-[11px] font-medium text-slate-600 leading-snug">
                                  {p.subtitle}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {/* Member-entered profile details */}
                      <div className="mt-3.5 p-3.5 bg-slate-50 border border-slate-200/90 rounded-xl space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-xs font-bold text-slate-800">
                              Profile details {selectedPersona ? `for ${selectedPersona.title}` : ""}
                            </span>
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-600 italic">
                          {selectedPersona?.subtitle || "Choose your stakeholder type above. Your profile details are entered by you."}
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-0.5">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                              Department / Unit
                            </label>
                            <input
                              name="department"
                              value={form.department}
                              onChange={handleChange}
                              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 outline-none focus:border-[#c8102e] focus:ring-1 focus:ring-[#c8102e]/20 transition"
                              placeholder="e.g. Flight Operations"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 mb-1">Mentorship preference</label>
                            <select name="mentorshipRole" value={form.mentorshipRole} onChange={handleChange} className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 outline-none focus:border-[#c8102e] focus:ring-1 focus:ring-[#c8102e]/20 transition">
                              <option value="">Choose later</option>
                              <option value="MENTOR">I can mentor</option>
                              <option value="MENTEE">I am seeking mentorship</option>
                              <option value="BOTH">Open to both</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                              Profile bio (optional)
                          </label>
                          <input
                            name="bio"
                            value={form.bio}
                            onChange={handleChange}
                            className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 outline-none focus:border-[#c8102e] focus:ring-1 focus:ring-[#c8102e]/20 transition"
                            placeholder="Enter brief stakeholder summary"
                          />
                        </div>

                        <div className="text-[10px] text-slate-500 flex items-center gap-1.5 pt-0.5">
                          <Icon name="sparkles" size={12} className="text-[#c59b27] shrink-0" />
                          <span>
                            Only the details you provide are saved. Your profile stays private until you choose to make it visible.
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Basic Info Fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Full Name
                        </label>
                        <input
                          name="fullName"
                          placeholder="e.g. Edwin Kamau"
                          value={form.fullName}
                          onChange={handleChange}
                          className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-[#c8102e] focus:ring-2 focus:ring-[#c8102e]/10 transition text-slate-900 shadow-2xs"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Official or Personal Email
                        </label>
                        <input
                          name="email"
                          type="email"
                          placeholder="you@kenya-airways.com"
                          value={form.email}
                          onChange={handleChange}
                          className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-[#c8102e] focus:ring-2 focus:ring-[#c8102e]/10 transition text-slate-900 shadow-2xs"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
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
                          className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-[#c8102e] focus:ring-2 focus:ring-[#c8102e]/10 transition text-slate-900 shadow-2xs"
                          required
                          minLength={8}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Staff ID / Student Reg{" "}
                          <span className="text-slate-400 font-normal">(optional)</span>
                        </label>
                        <input
                          name="identifier"
                          placeholder="e.g. KQ-10294 or PC-2024"
                          value={form.identifier}
                          onChange={handleChange}
                          className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-[#c8102e] focus:ring-2 focus:ring-[#c8102e]/10 transition text-slate-900 shadow-2xs"
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
                      className="w-full py-3 text-sm font-semibold rounded-lg mt-3"
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
