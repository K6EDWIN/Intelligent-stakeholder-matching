"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { KQLogo, Button, Tag } from "@/components/KQBrand";
import { Icon } from "@/components/KQIcons";

const photos = {
  grace:
    "https://images.unsplash.com/photo-1563132337-f159f484226c?crop=faces&fit=crop&fm=jpg&h=600&q=85&w=600",
  cockpit:
    "https://images.unsplash.com/photo-1769678750254-fc938ce9da7a?crop=entropy&fit=crop&fm=jpg&h=900&q=80&w=1200",
};

export default function Home() {
  const { data: session } = useSession();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleGetStarted = () => {
    if (session?.user) {
      router.push("/recommendations");
    } else {
      router.push("/login");
    }
  };

  const segments = [
    {
      num: "01",
      title: "Pride Centre Alumni & Trainees",
      desc: "Build career momentum with guidance from experienced KQ professionals.",
      icon: "users",
    },
    {
      num: "02",
      title: "Active KQ Flight & Ground Staff",
      desc: "Exchange operational expertise across departments, fleets, and stations.",
      icon: "flight",
    },
    {
      num: "03",
      title: "Former Employees & Retirees",
      desc: "Keep decades of aviation knowledge moving through the KQ community.",
      icon: "star",
    },
    {
      num: "04",
      title: "Asante & Frequent Flyers",
      desc: "Connect trusted industry insight with the people shaping every journey.",
      icon: "shield",
    },
  ];

  return (
    <div className="min-h-screen bg-[#fbf9f5] text-[#182231] dynamic-light-mesh relative overflow-x-hidden">
      {/* Subtle Ambient Lighting Orbs */}
      <div className="ambient-orb-primary opacity-30 pointer-events-none" />
      <div className="ambient-orb-secondary opacity-25 pointer-events-none" />

      {/* Topnav Navigation Bar */}
      <header className="sticky top-0 z-30 w-full bg-[#fbf9f5]/90 backdrop-blur-md border-b border-[#dce0e3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <KQLogo />

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-xs font-semibold text-[#4b5664]">
            <a href="#how-it-works" className="hover:text-[#bb162b] transition">
              How Matching Works
            </a>
            <a href="#stakeholders" className="hover:text-[#bb162b] transition">
              Stakeholders
            </a>
            <Link href="/directory" className="hover:text-[#bb162b] transition">
              Member Directory
            </Link>
            <Link href="/flight-reconnect" className="hover:text-[#bb162b] transition">
              Flight Reconnect
            </Link>
            <a href="#pride-centre" className="hover:text-[#bb162b] transition">
              Pride Centre
            </a>
          </nav>

          {/* Header Action Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            {session?.user ? (
              <Link href="/recommendations" className="btn btn-primary text-xs px-5">
                Open Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="btn btn-ghost text-xs px-4 text-[#0e2740] hover:text-[#bb162b] transition"
                >
                  Log In
                </Link>
                <Link href="/register" className="btn btn-primary text-xs px-5">
                  Join Network
                </Link>
              </>
            )}
          </div>

          {/* Mobile Hamburger Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition"
            aria-label="Toggle navigation menu"
          >
            <Icon name={mobileMenuOpen ? "close" : "menu"} size={22} />
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#dce0e3] bg-white px-4 py-4 space-y-3 shadow-lg animate-in fade-in">
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-gray-700 py-1 hover:text-[#bb162b]"
            >
              How Matching Works
            </a>
            <a
              href="#stakeholders"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-gray-700 py-1 hover:text-[#bb162b]"
            >
              Stakeholders
            </a>
            <Link
              href="/directory"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-gray-700 py-1 hover:text-[#bb162b]"
            >
              Member Directory
            </Link>
            <Link
              href="/flight-reconnect"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-gray-700 py-1 hover:text-[#bb162b]"
            >
              Flight Reconnect
            </Link>
            <div className="pt-2 border-t border-gray-100 flex flex-col gap-2">
              {session?.user ? (
                <Link href="/recommendations" className="btn btn-primary text-xs w-full">
                  Open Dashboard
                </Link>
              ) : (
                <>
                  <Link href="/login" className="btn btn-secondary text-xs w-full">
                    Log In
                  </Link>
                  <Link href="/register" className="btn btn-primary text-xs w-full">
                    Join Network
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="w-full">
        {/* ================= HERO SECTION ================= */}
        <section className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Left Copy Column */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#bb162b]/10 text-[#bb162b] text-[11px] font-bold tracking-wider uppercase border border-[#bb162b]/20">
                <span className="w-2 h-2 rounded-full bg-[#bb162b] animate-pulse" />
                Official Kenya Airways Stakeholder Ecosystem
              </div>

              <h1 className="font-['Fraunces',serif] text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-normal leading-[1.12] text-[#0e2740] tracking-tight">
                Connecting the Pride of Africa:{" "}
                <span className="text-[#bb162b] font-medium block sm:inline">
                  Intelligent Mentorship
                </span>{" "}
                &amp; Professional Networking
              </h1>

              <p className="text-gray-600 text-sm sm:text-base leading-relaxed max-w-2xl">
                Empowering Pride Centre alumni, active flight crew, senior aviation
                engineers, and frequent flyers across Kenya Airways routes through
                transparent AI-driven hybrid recommendations.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleGetStarted}
                  className="btn btn-primary text-sm px-6 py-2.5 shadow-md flex items-center gap-2"
                >
                  <span>{session?.user ? "View My AI Matches" : "Get Matched"}</span>
                  <Icon name="arrow" size={16} />
                </button>
                <Link
                  href="/directory"
                  className="btn btn-secondary text-sm px-5 py-2.5 border-[#bcc3c9] text-[#0e2740] hover:bg-gray-50 transition"
                >
                  Explore Member Directory
                </Link>
              </div>

              {/* Proof / Live Intelligence Statistics */}
              <div className="pt-6 border-t border-[#dce0e3] grid grid-cols-3 gap-3 sm:gap-6">
                <div className="p-3 bg-white/70 backdrop-blur-sm rounded-xl border border-[#e2e6e9]">
                  <b className="block text-xl sm:text-2xl font-['Fraunces',serif] text-[#0e2740]">
                    1,200+
                  </b>
                  <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-gray-500 font-semibold">
                    Verified Members
                  </span>
                </div>
                <div className="p-3 bg-white/70 backdrop-blur-sm rounded-xl border border-[#e2e6e9]">
                  <b className="block text-xl sm:text-2xl font-['Fraunces',serif] text-[#bb162b]">
                    450+
                  </b>
                  <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-gray-500 font-semibold">
                    Active Mentorships
                  </span>
                </div>
                <div className="p-3 bg-white/70 backdrop-blur-sm rounded-xl border border-[#e2e6e9]">
                  <b className="block text-xl sm:text-2xl font-['Fraunces',serif] text-[#1b8755]">
                    94%
                  </b>
                  <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-gray-500 font-semibold">
                    Hybrid Precision
                  </span>
                </div>
              </div>
            </div>

            {/* Right Interactive AI Match Showcase Card */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-[380px] bg-white rounded-2xl border border-[#d3d6d8] shadow-xl overflow-hidden relative transition hover:shadow-2xl">
                {/* Header Tag inside card */}
                <div className="px-4 py-3 bg-[#0e2740] text-white flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-[#e5b842] tracking-wider uppercase text-[10px]">
                    <Icon name="sparkles" size={14} />
                    Live AI Recommendation
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-gray-300">
                    <Icon name="shield" size={13} className="text-[#1b8755]" />
                    <span>KQ Verified</span>
                  </div>
                </div>

                {/* Profile Image with Overlay Badge */}
                <div className="relative h-52 w-full bg-gray-100 overflow-hidden">
                  <img
                    alt="Captain Grace M."
                    src={photos.grace}
                    className="w-full h-full object-cover object-top"
                  />
                  <div className="absolute bottom-3 left-3 bg-[#0e2740]/90 backdrop-blur-md text-white text-[9px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
                    Active KQ Staff
                  </div>
                  <div className="absolute top-3 right-3 bg-[#1b8755] text-white px-2.5 py-1 rounded-full font-bold text-xs shadow-md flex items-center gap-1">
                    <span>94%</span>
                    <span className="text-[9px] opacity-90">MATCH</span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 space-y-3">
                  <div>
                    <span className="text-[10px] font-bold text-[#c59b27] uppercase tracking-widest block">
                      Recommended Mentor
                    </span>
                    <h3 className="font-['Fraunces',serif] text-2xl font-semibold text-[#0e2740] mt-0.5">
                      Captain Grace M.
                    </h3>
                    <p className="text-xs text-gray-500">
                      Senior Check Captain · Boeing 787 Fleet
                    </p>
                  </div>

                  {/* Skills Tags */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <Tag>Flight Safety</Tag>
                    <Tag>CRM</Tag>
                    <Tag>Long-haul Ops</Tag>
                  </div>

                  {/* Explainable Match Reason Box */}
                  <div className="p-3 bg-[#f3f7f7] border-l-3 border-[#1b8755] rounded-r-lg text-xs text-[#0e2740] flex items-start gap-2.5">
                    <Icon name="sparkles" size={16} className="text-[#1b8755] shrink-0 mt-0.5" />
                    <div>
                      <b className="block text-[11px] font-bold text-[#0e2740]">Why this match?</b>
                      <span className="text-[11px] text-gray-600 leading-tight">
                        4 shared skills &amp; aligned flight operations career goals.
                      </span>
                    </div>
                  </div>

                  {/* CTA inside card */}
                  <button
                    type="button"
                    onClick={handleGetStarted}
                    className="w-full btn btn-primary text-xs py-2.5 rounded-lg flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <span>Connect with Captain Grace</span>
                    <Icon name="arrow" size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= STAKEHOLDER PERSONA SEGMENTS ================= */}
        <section className="w-full border-t border-[#dce0e3] bg-white py-14 sm:py-20" id="stakeholders">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
              <div>
                <div className="text-[11px] font-bold tracking-widest uppercase text-[#bb162b] mb-1">
                  Built for the Entire KQ Ecosystem
                </div>
                <h2 className="font-['Fraunces',serif] text-3xl sm:text-4xl font-normal text-[#0e2740] leading-tight">
                  One network. Every chapter
                  <br />
                  of the aviation journey.
                </h2>
              </div>
              <p className="text-gray-600 text-xs sm:text-sm max-w-md leading-relaxed">
                Purpose-built professional connections across the people who make
                Kenya Airways a premier global aviation community.
              </p>
            </div>

            {/* 4 Responsive Persona Segment Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {segments.map((seg) => (
                <article
                  key={seg.num}
                  className="bg-[#fbf9f5] border border-[#dce0e3] rounded-2xl p-6 flex flex-col justify-between transition hover:-translate-y-1 hover:shadow-md hover:border-[#bb162b]/40 min-h-[260px]"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-['Fraunces',serif] text-xs font-semibold text-gray-400">
                        {seg.num}
                      </span>
                      <div className="w-10 h-10 rounded-full bg-white border border-[#dce0e3] flex items-center justify-center text-[#0e2740]">
                        <Icon name={seg.icon} size={18} />
                      </div>
                    </div>
                    <h3 className="font-['Fraunces',serif] text-lg font-semibold text-[#0e2740] mt-4 mb-2 leading-snug">
                      {seg.title}
                    </h3>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {seg.desc}
                    </p>
                  </div>
                  <div className="pt-4 border-t border-[#dce0e3]/60 mt-4">
                    <Link
                      href="/directory"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#bb162b] hover:underline"
                    >
                      <span>Discover members</span>
                      <Icon name="arrow" size={13} />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ================= HYBRID RECOMMENDATION ENGINE ================= */}
        <section className="w-full border-t border-[#dce0e3] bg-[#fbf9f5] py-14 sm:py-20" id="how-it-works">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
              {/* Left Column: Algorithm Philosophy */}
              <div className="lg:col-span-5 space-y-5">
                <div className="text-[11px] font-bold tracking-widest uppercase text-[#bb162b]">
                  The Engine Behind Every Introduction
                </div>
                <h2 className="font-['Fraunces',serif] text-3xl sm:text-4xl font-normal text-[#0e2740] leading-tight">
                  Human connection,
                  <br />
                  <span className="text-[#bb162b] font-medium">precision matched.</span>
                </h2>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Our hybrid recommendation engine combines profile attribute similarity
                  (Content-Based Filtering) with real community interaction history
                  (Collaborative Filtering)—then tells you transparently why each match
                  makes sense.
                </p>

                {/* Privacy & Trust Card */}
                <div className="p-4 bg-white rounded-xl border border-[#dce0e3] flex items-start gap-3 text-xs shadow-sm">
                  <div className="p-2 rounded-lg bg-[#1b8755]/10 text-[#1b8755]">
                    <Icon name="shield" size={20} />
                  </div>
                  <div>
                    <b className="block text-gray-900 font-bold">Your data stays strictly protected.</b>
                    <span className="text-gray-500 leading-relaxed block mt-0.5">
                      Consent-driven, explainable, and built exclusively for the Kenya Airways enterprise network.
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: 3 Explanatory Step Cards */}
              <div className="lg:col-span-7 space-y-4">
                {[
                  {
                    n: "01",
                    title: "Content-Based Similarity (CBF)",
                    desc: "Evaluates your professional signals, skills taxonomy, aircraft type ratings, and career trajectories using vector cosine similarity.",
                    items: ["Skills & certifications", "Aircraft & department", "Mentorship goals"],
                    icon: "profile",
                  },
                  {
                    n: "02",
                    title: "Collaborative Interaction Patterns (CF)",
                    desc: "Analyzes accepted connection requests, successful mentorship pairs, and rating feedback across the community.",
                    items: ["Accepted connections", "Mentorship success", "Peer feedback"],
                    icon: "users",
                  },
                  {
                    n: "03",
                    title: "Cold-Start Aware Hybrid Scoring",
                    desc: "Dynamically balances weights (α · CBF + β · CF) so new members receive immediate relevant matches while the system adapts over time.",
                    items: ["Explainable match reasons", "Compatibility score", "Mutual consent"],
                    icon: "sparkles",
                  },
                ].map((step, index) => (
                  <article
                    key={step.n}
                    className="p-5 bg-white border border-[#dce0e3] rounded-2xl shadow-sm transition hover:border-gray-400"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-[#f2f1ed] text-[#0e2740] font-bold flex items-center justify-center shrink-0 border border-[#dce0e3]">
                        <Icon name={step.icon} size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-gray-400 font-['Fraunces',serif]">
                            STEP {step.n}
                          </span>
                        </div>
                        <h3 className="font-['Fraunces',serif] text-lg font-semibold text-[#0e2740] mt-0.5 mb-1">
                          {step.title}
                        </h3>
                        <p className="text-xs text-gray-600 leading-relaxed mb-3">
                          {step.desc}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {step.items.map((item) => (
                            <span
                              key={item}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#fbf9f5] border border-[#e0e0dd] text-[10px] text-gray-700 font-medium"
                            >
                              <Icon name="check" size={12} className="text-[#1b8755]" />
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ================= FLIGHT RECONNECT SHOWCASE BANNER ================= */}
        <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="rounded-3xl overflow-hidden bg-[#0e2740] text-white shadow-2xl grid grid-cols-1 lg:grid-cols-12">
            {/* Visual Column */}
            <div className="lg:col-span-5 relative min-h-[280px] lg:min-h-full">
              <img
                alt="Airline cockpit overlooking runway"
                src={photos.cockpit}
                className="w-full h-full object-cover filter grayscale contrast-125"
              />
              <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-transparent via-[#0e2740]/40 to-[#0e2740]" />
              
              {/* Route Ticket */}
              <div className="absolute bottom-5 left-5 right-5 sm:right-auto bg-white text-[#0e2740] rounded-xl shadow-xl flex items-center overflow-hidden border border-white/20">
                <div className="px-4 py-3">
                  <small className="block text-[9px] uppercase tracking-wider text-gray-500 font-bold">
                    UPCOMING ROUTE
                  </small>
                  <div className="flex items-center gap-2 font-['Fraunces',serif] text-base font-bold">
                    <span>NBO</span>
                    <Icon name="flight" size={16} className="text-[#bb162b]" />
                    <span>LHR</span>
                  </div>
                </div>
                <div className="bg-[#bb162b] text-white px-3.5 py-4 text-[10px] font-bold leading-tight flex items-center justify-center">
                  2 peers on route
                </div>
              </div>
            </div>

            {/* Copy Column */}
            <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#e5b842] text-[10px] font-bold uppercase tracking-wider">
                FLIGHT RECONNECT
              </div>

              <h2 className="font-['Fraunces',serif] text-2xl sm:text-3xl lg:text-4xl font-normal leading-tight">
                Turn travel into{" "}
                <span className="text-[#e5b842] block sm:inline">professional synergy.</span>
              </h2>

              <p className="text-gray-300 text-xs sm:text-sm leading-relaxed max-w-xl">
                Match with verified peers on your next KQ flight or layover. Connect
                before boarding, share insights in transit, and grow your network at
                35,000 feet without ever exposing personal contact details until mutual agreement.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-white/15">
                <div className="flex items-start gap-2.5 text-xs">
                  <Icon name="shield" size={16} className="text-[#e5b842] shrink-0 mt-0.5" />
                  <div>
                    <b className="block text-white">Privacy-first</b>
                    <span className="text-gray-400 text-[11px]">Your itinerary is never visible without mutual opt-in.</span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 text-xs">
                  <Icon name="check" size={16} className="text-[#1b8755] shrink-0 mt-0.5" />
                  <div>
                    <b className="block text-white">Mutual Consent</b>
                    <span className="text-gray-400 text-[11px]">Both stakeholders confirm before identities unlock.</span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/flight-reconnect"
                  className="btn btn-primary text-xs px-6 py-2.5 inline-flex items-center gap-2 shadow-lg"
                >
                  <span>Explore Flight Reconnect</span>
                  <Icon name="arrow" size={14} />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ================= COMPREHENSIVE ENTERPRISE FOOTER ================= */}
      <footer className="w-full bg-[#0b1a2b] text-white border-t border-white/10 pt-16 pb-12" id="pride-centre">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Main 4-Column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-12">
            {/* Column 1: Brand, Mission & Accreditation */}
            <div className="lg:col-span-5 space-y-4">
              <KQLogo light />
              <p className="text-gray-300 text-xs sm:text-sm leading-relaxed max-w-sm">
                The official intelligent stakeholder matching platform for Kenya Airways PLC.
                Connecting Pride Centre aviation alumni, active flight crew, senior aeronautical
                engineers, and frequent flyers across global routes.
              </p>
              
              <div className="pt-2 flex flex-col gap-2">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[11px] text-[#e5b842]">
                  <Icon name="academic" size={15} />
                  <span>Strathmore University · Academic Research &amp; Enterprise Pilot</span>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[11px] text-[#1b8755]">
                  <Icon name="shield" size={15} />
                  <span>Zero-knowledge flight itineraries &amp; mutual bilateral consent</span>
                </div>
              </div>
            </div>

            {/* Column 2: Platform Links */}
            <div className="lg:col-span-2 space-y-3">
              <h4 className="text-[11px] font-bold uppercase tracking-widest text-[#e5b842]">
                Platform
              </h4>
              <ul className="space-y-2.5 text-xs text-gray-300">
                <li>
                  <Link href="/directory" className="hover:text-white transition flex items-center gap-1.5">
                    <span>Member Directory</span>
                  </Link>
                </li>
                <li>
                  <Link href="/recommendations" className="hover:text-white transition flex items-center gap-1.5">
                    <span>AI Recommendations</span>
                  </Link>
                </li>
                <li>
                  <Link href="/flight-reconnect" className="hover:text-white transition flex items-center gap-1.5">
                    <span>Flight Reconnect</span>
                  </Link>
                </li>
                <li>
                  <Link href="/requests" className="hover:text-white transition flex items-center gap-1.5">
                    <span>Mentorship Requests</span>
                  </Link>
                </li>
                <li>
                  <Link href="/opportunities" className="hover:text-white transition flex items-center gap-1.5">
                    <span>Aviation Opportunities</span>
                  </Link>
                </li>
                <li>
                  <Link href="/events" className="hover:text-white transition flex items-center gap-1.5">
                    <span>Pride Centre Events</span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Stakeholders */}
            <div className="lg:col-span-2 space-y-3">
              <h4 className="text-[11px] font-bold uppercase tracking-widest text-[#e5b842]">
                Stakeholders
              </h4>
              <ul className="space-y-2.5 text-xs text-gray-300">
                <li>
                  <a href="#stakeholders" className="hover:text-white transition">
                    Pride Centre Alumni
                  </a>
                </li>
                <li>
                  <a href="#stakeholders" className="hover:text-white transition">
                    Active Flight Crew
                  </a>
                </li>
                <li>
                  <a href="#stakeholders" className="hover:text-white transition">
                    Aeronautical Engineers
                  </a>
                </li>
                <li>
                  <a href="#stakeholders" className="hover:text-white transition">
                    Former Staff &amp; Retirees
                  </a>
                </li>
                <li>
                  <a href="#stakeholders" className="hover:text-white transition">
                    Asante Executive Travelers
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 4: AI Transparency & System Status */}
            <div className="lg:col-span-3 space-y-4">
              <h4 className="text-[11px] font-bold uppercase tracking-widest text-[#e5b842]">
                AI Transparency
              </h4>
              <p className="text-gray-300 text-xs leading-relaxed">
                Powered by a hybrid recommender combining Content-Based cosine similarity with collaborative interaction history.
              </p>

              {/* Recommender Status Badge */}
              <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-xs space-y-1.5">
                <div className="flex items-center gap-2 text-[#1b8755] font-semibold text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-[#1b8755] animate-ping" />
                  <span>Hybrid Engine Operational</span>
                </div>
                <div className="text-[11px] text-gray-400">
                  Precision: <b>94.2%</b> · Latency: <b>~45ms</b>
                </div>
              </div>

              <div className="pt-1">
                <Link
                  href="/register"
                  className="btn btn-primary text-xs w-full py-2.5 rounded-lg flex items-center justify-center gap-2 shadow-md"
                >
                  <span>Join the KQ Pride Network</span>
                  <Icon name="arrow" size={14} />
                </Link>
              </div>
            </div>
          </div>

          {/* Bottom Bar / Copyright */}
          <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
            <div>
              © 2026 Kenya Airways PLC. All rights reserved. Capstone research project.
            </div>
            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-white transition">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-white transition">
                Data Consent Charter
              </a>
              <a href="#" className="hover:text-white transition">
                Charter Agreement
              </a>
              <a href="#" className="hover:text-white transition">
                Support
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}