"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { KQLogo, Button, Tag } from "@/components/KQBrand";
import { Icon } from "@/components/KQIcons";
import { ViewModeToggle } from "@/components/ViewMode";

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
      if (session.user.role === "ADMIN") {
        router.push("/admin");
      } else {
        router.push("/recommendations");
      }
    } else {
      router.push("/login");
    }
  };

  const segments = [
    {
      num: "01",
      title: "Pride Centre Alumni & Trainees",
      desc: "Accelerate career momentum with direct guidance from experienced Kenya Airways flight crew and technical specialists.",
      icon: "users",
    },
    {
      num: "02",
      title: "Active Flight & Ground Staff",
      desc: "Exchange operational expertise across flight deck, cabin services, ground handling, and engineering departments.",
      icon: "flight",
    },
    {
      num: "03",
      title: "Former Staff & Retirees",
      desc: "Preserve decades of institutional aviation heritage and mentor the next generation of Kenya Airways leaders.",
      icon: "star",
    },
    {
      num: "04",
      title: "Frequent Flyers & Asante Members",
      desc: "Bridge aviation operations with loyal passengers and commercial leaders on shared routes and industry initiatives.",
      icon: "shield",
    },
  ];

  return (
    <div className="home-page min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 w-full bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <KQLogo />

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-slate-600">
            <a href="#how-it-works" className="hover:text-[#c8102e] transition">
              Matching Architecture
            </a>
            <a href="#stakeholders" className="hover:text-[#c8102e] transition">
              Ecosystem
            </a>
            <Link href="/directory" className="hover:text-[#c8102e] transition">
              Member Directory
            </Link>
            <Link href="/flight-reconnect" className="hover:text-[#c8102e] transition">
              Flight Reconnect
            </Link>
            <a href="#pride-centre" className="hover:text-[#c8102e] transition">
              Pride Centre
            </a>
          </nav>

          {/* Header Action Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            <ViewModeToggle compact />
            {session?.user ? (
              <Link
                href={session.user.role === "ADMIN" ? "/admin" : "/recommendations"}
                className="btn btn-primary text-xs px-5"
              >
                {session.user.role === "ADMIN" ? "Admin Console" : "Open Portal"}
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="btn btn-ghost text-xs px-4 text-slate-700 hover:text-[#c8102e]"
                >
                  Sign In
                </Link>
                <Link href="/register" className="btn btn-primary text-xs px-5">
                  Join PrideConnect
                </Link>
              </>
            )}
          </div>

          {/* Mobile Hamburger Toggle */}
          <div className="md:hidden flex items-center gap-2">
            <ViewModeToggle compact />
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-slate-700 hover:bg-slate-100 transition"
              aria-label="Toggle navigation menu"
            >
              <Icon name={mobileMenuOpen ? "close" : "menu"} size={20} />
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-3 shadow-md">
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-slate-700 py-1 hover:text-[#c8102e]"
            >
              Matching Architecture
            </a>
            <a
              href="#stakeholders"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-slate-700 py-1 hover:text-[#c8102e]"
            >
              Ecosystem
            </a>
            <Link
              href="/directory"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-slate-700 py-1 hover:text-[#c8102e]"
            >
              Member Directory
            </Link>
            <Link
              href="/flight-reconnect"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-slate-700 py-1 hover:text-[#c8102e]"
            >
              Flight Reconnect
            </Link>
            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
              {session?.user ? (
                <Link href="/recommendations" className="btn btn-primary text-xs w-full">
                  Open Portal
                </Link>
              ) : (
                <>
                  <Link href="/login" className="btn btn-secondary text-xs w-full">
                    Sign In
                  </Link>
                  <Link href="/register" className="btn btn-primary text-xs w-full">
                    Join PrideConnect
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="w-full">
        {/* ================= HERO SECTION ================= */}
        <section className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Column */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-red-50 text-[#c8102e] text-xs font-bold tracking-wider uppercase border border-red-100">
                <span className="w-2 h-2 rounded-full bg-[#c8102e]" />
                Kenya Airways Stakeholder Network
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight text-[#0e2740] tracking-tight">
                Connecting the Pride of Africa:{" "}
                <span className="text-[#c8102e]">
                  Intelligent Mentorship
                </span>{" "}
                &amp; Professional Collaboration
              </h1>

              <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-2xl">
                Uniting Kenya Airways Pride Centre trainees, active flight crew, aeronautical
                engineers, and alumni in a unified network. Powered by hybrid recommendations
                integrating aviation competencies with community interaction history.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleGetStarted}
                  className="btn btn-primary text-sm px-6 py-2.5 flex items-center gap-2"
                >
                  <span>{session?.user ? "Access Portal Matches" : "Get Matched"}</span>
                  <Icon name="arrow" size={16} />
                </button>
                <Link
                  href="/directory"
                  className="btn btn-secondary text-sm px-5 py-2.5"
                >
                  Explore Member Directory
                </Link>
              </div>

              {/* Verified Institutional Telemetry */}
              <div className="pt-6 border-t border-slate-200 grid grid-cols-3 gap-4">
                <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-xs">
                  <b className="block text-2xl font-bold text-[#0e2740]">
                    150+
                  </b>
                  <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                    Verified Stakeholders
                  </span>
                </div>
                <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-xs">
                  <b className="block text-2xl font-bold text-[#c8102e]">
                    440+
                  </b>
                  <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                    Community Handshakes
                  </span>
                </div>
                <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-xs">
                  <b className="block text-2xl font-bold text-emerald-700">
                    5 Roles
                  </b>
                  <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                    Unified Ecosystem
                  </span>
                </div>
              </div>
            </div>

            {/* Right Stakeholder Match Showcase Card */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-[380px] bg-white rounded-xl border border-slate-200 shadow-md overflow-hidden">
                {/* Header Tag inside card */}
                <div className="px-4 py-3 bg-[#0e2740] text-white flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-[#c59b27] uppercase tracking-wider text-[11px]">
                    <Icon name="sparkles" size={14} />
                    Verified Stakeholder Match
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-300">
                    <Icon name="shield" size={13} className="text-emerald-400" />
                    <span>Pride Centre Certified</span>
                  </div>
                </div>

                {/* Profile Image with Overlay Badge */}
                <div className="relative h-52 w-full bg-slate-100 overflow-hidden">
                  <img
                    alt="Captain Grace M."
                    src={photos.grace}
                    className="w-full h-full object-cover object-top"
                  />
                  <div className="absolute bottom-3 left-3 bg-[#0e2740]/90 text-white text-[11px] font-bold px-2.5 py-1 rounded">
                    Active Flight Deck Staff
                  </div>
                  <div className="absolute top-3 right-3 bg-emerald-700 text-white px-2.5 py-1 rounded font-bold text-xs shadow-sm flex items-center gap-1">
                    <span>92%</span>
                    <span className="text-[10px] opacity-90">COMPATIBILITY</span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 space-y-3">
                  <div>
                    <span className="text-xs font-bold text-[#c59b27] uppercase tracking-wider block">
                      Recommended Mentor
                    </span>
                    <h3 className="text-xl font-bold text-[#0e2740] mt-0.5">
                      Captain Grace M.
                    </h3>
                    <p className="text-xs text-slate-500">
                      Senior Check Captain · Boeing 787 Fleet
                    </p>
                  </div>

                  {/* Skills Tags */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <Tag>Flight Operations</Tag>
                    <Tag>B787 Type Rating</Tag>
                    <Tag>Crew Resource Management</Tag>
                  </div>

                  {/* Rationale Box */}
                  <div className="p-3 bg-slate-50 border-l-3 border-emerald-600 rounded-r-md text-xs text-slate-800 flex items-start gap-2.5">
                    <Icon name="check" size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <b className="block text-xs font-bold text-slate-900">Matching Competencies</b>
                      <span className="text-xs text-slate-600 leading-tight">
                        Shared flight deck technical background and aligned mentorship goals.
                      </span>
                    </div>
                  </div>

                  {/* CTA inside card */}
                  <button
                    type="button"
                    onClick={handleGetStarted}
                    className="w-full btn btn-primary text-xs py-2 rounded-md flex items-center justify-center gap-1.5"
                  >
                    <span>Connect with Captain Grace</span>
                    <Icon name="arrow" size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= ECOSYSTEM PILLARS ================= */}
        <section className="w-full border-t border-slate-200 bg-white py-14 sm:py-18" id="stakeholders">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
              <div>
                <div className="text-xs font-bold tracking-wider uppercase text-[#c8102e] mb-1">
                  Built for the Entire Kenya Airways Ecosystem
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0e2740] leading-tight">
                  One network. Every stage of the aviation career.
                </h2>
              </div>
              <p className="text-slate-600 text-xs sm:text-sm max-w-md leading-relaxed">
                Purpose-built connections across the individuals who uphold Kenya Airways operational excellence.
              </p>
            </div>

            {/* 4 Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {segments.map((seg) => (
                <article
                  key={seg.num}
                  className="card p-6 flex flex-col justify-between min-h-[240px]"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400">
                        {seg.num}
                      </span>
                      <div className="w-9 h-9 rounded-md bg-slate-100 flex items-center justify-center text-[#0e2740]">
                        <Icon name={seg.icon} size={18} />
                      </div>
                    </div>
                    <h3 className="text-base font-bold text-[#0e2740] mt-4 mb-2 leading-snug">
                      {seg.title}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {seg.desc}
                    </p>
                  </div>
                  <div className="pt-4 border-t border-slate-100 mt-4">
                    <Link
                      href="/directory"
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#c8102e] hover:underline"
                    >
                      <span>Explore Directory</span>
                      <Icon name="arrow" size={13} />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ================= ARCHITECTURE SECTION ================= */}
        <section className="w-full border-t border-slate-200 bg-slate-50 py-14 sm:py-18" id="how-it-works">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
              {/* Left Column */}
              <div className="lg:col-span-5 space-y-4">
                <div className="text-xs font-bold tracking-wider uppercase text-[#c8102e]">
                  Recommendation Architecture
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0e2740] leading-tight">
                  Transparent, verifiable matching.
                </h2>
                <p className="text-slate-600 text-sm leading-relaxed">
                  The platform uses a weighted hybrid recommendation formulation that balances profile
                  similarity (Content-Based Filtering) with real accepted connections (Collaborative Filtering)
                  to mitigate early cold-start limitations.
                </p>

                {/* Privacy Card */}
                <div className="p-4 bg-white rounded-lg border border-slate-200 flex items-start gap-3 text-xs shadow-xs">
                  <div className="p-2 rounded bg-emerald-50 text-emerald-700">
                    <Icon name="shield" size={18} />
                  </div>
                  <div>
                    <b className="block text-slate-900 font-bold">Consent-Governed Data Visibility</b>
                    <span className="text-slate-500 leading-relaxed block mt-0.5">
                      Contact details and private itineraries unlock solely upon mutual acceptance of connection requests.
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: 3 Steps */}
              <div className="lg:col-span-7 space-y-4">
                {[
                  {
                    n: "01",
                    title: "Content-Based Attribute Matching (CBF)",
                    desc: "Computes weighted Jaccard similarity across aviation technical skills (60%) and professional interest domains (40%).",
                    items: ["Flight & ground credentials", "Department taxonomy", "Mentorship role"],
                    icon: "profile",
                  },
                  {
                    n: "02",
                    title: "Collaborative Interaction Graph (CF)",
                    desc: "Maps peer connections across accepted mentorship and networking handshakes to identify second-order community alignments.",
                    items: ["Accepted handshakes", "Peer similarity", "Bilateral feedback"],
                    icon: "users",
                  },
                  {
                    n: "03",
                    title: "Dynamic Cold-Start Hybrid Scoring",
                    desc: "Applies α · CBF + β · CF where α starts at 90% and progressively shifts toward collaborative signal as interaction volume accumulates.",
                    items: ["Cold-start mitigation", "Transparent score rationale", "Ranked suggestions"],
                    icon: "sparkles",
                  },
                ].map((step) => (
                  <article
                    key={step.n}
                    className="card p-5"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-9 h-9 rounded bg-slate-100 text-[#0e2740] font-bold flex items-center justify-center shrink-0 border border-slate-200">
                        <Icon name={step.icon} size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-slate-400">
                            PHASE {step.n}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-[#0e2740] mt-0.5 mb-1">
                          {step.title}
                        </h3>
                        <p className="text-xs text-slate-600 leading-relaxed mb-3">
                          {step.desc}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {step.items.map((item) => (
                            <span
                              key={item}
                              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-100 text-[11px] text-slate-700 font-medium"
                            >
                              <Icon name="check" size={11} className="text-emerald-700" />
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

        {/* ================= FLIGHT RECONNECT BANNER ================= */}
        <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="rounded-xl overflow-hidden bg-[#0e2740] text-white shadow-lg grid grid-cols-1 lg:grid-cols-12">
            {/* Visual Column */}
            <div className="lg:col-span-5 relative min-h-[240px] lg:min-h-full">
              <img
                alt="Airline runway"
                src={photos.cockpit}
                className="w-full h-full object-cover opacity-60"
              />
              <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-transparent via-[#0e2740]/40 to-[#0e2740]" />
              
              {/* Route Ticket */}
              <div className="absolute bottom-4 left-4 right-4 sm:right-auto bg-white text-[#0e2740] rounded-lg shadow-md flex items-center overflow-hidden">
                <div className="px-4 py-3">
                  <small className="block text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                    SHARED TRAVEL ROUTE
                  </small>
                  <div className="flex items-center gap-2 text-sm font-bold">
                    <span>NBO</span>
                    <Icon name="flight" size={14} className="text-[#c8102e]" />
                    <span>LHR</span>
                  </div>
                </div>
                <div className="bg-[#c8102e] text-white px-3 py-4 text-xs font-bold leading-tight">
                  Mutual Layover Match
                </div>
              </div>
            </div>

            {/* Copy Column */}
            <div className="lg:col-span-7 p-6 sm:p-10 space-y-4">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-white/10 text-[#c59b27] text-xs font-bold uppercase tracking-wider">
                FLIGHT RECONNECT MODULE
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold leading-tight">
                Connect with verified colleagues on shared flight routes.
              </h2>

              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-xl">
                Match with verified crew, staff, and executive flyers traveling on the same itinerary.
                Establish professional connections before departure or during station layovers under strict
                mutual opt-in privacy controls.
              </p>

              <div className="pt-2">
                <Link
                  href="/flight-reconnect"
                  className="btn btn-primary text-xs px-6 py-2.5 inline-flex items-center gap-2"
                >
                  <span>Explore Flight Reconnect</span>
                  <Icon name="arrow" size={14} />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ================= ACADEMIC & ENTERPRISE FOOTER ================= */}
      <footer className="w-full bg-[#071626] text-slate-300 border-t border-slate-800 pt-14 pb-10" id="pride-centre">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8">
            {/* Column 1 */}
            <div className="lg:col-span-5 space-y-3">
              <KQLogo light />
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-sm">
                Intelligent stakeholder matching platform for the Kenya Airways community. Uniting Pride Centre
                trainees, operational staff, former employees, and verified frequent flyers.
              </p>
              
              <div className="pt-2 text-xs text-slate-400 space-y-1">
                <div><b>Institution:</b> Strathmore University, Nairobi, Kenya</div>
                <div><b>Degree:</b> Informatics and Computer Science (ICS 4)</div>
                <div><b>Author:</b> Kamau Edwin Kamau (Adm No: 152803)</div>
                <div><b>Supervisor:</b> Madam Julliet Kirui</div>
              </div>
            </div>

            {/* Column 2: Navigation Links */}
            <div className="lg:col-span-3 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#c59b27]">
                Platform Modules
              </h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li>
                  <Link href="/recommendations" className="hover:text-white transition">
                    Stakeholder Recommendations
                  </Link>
                </li>
                <li>
                  <Link href="/directory" className="hover:text-white transition">
                    Member Directory
                  </Link>
                </li>
                <li>
                  <Link href="/requests" className="hover:text-white transition">
                    Mentorship &amp; Connection Requests
                  </Link>
                </li>
                <li>
                  <Link href="/flight-reconnect" className="hover:text-white transition">
                    Flight Reconnect
                  </Link>
                </li>
                <li>
                  <Link href="/opportunities" className="hover:text-white transition">
                    Aviation Opportunities
                  </Link>
                </li>
                <li>
                  <Link href="/events" className="hover:text-white transition">
                    Pride Centre Events
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Telemetry Context */}
            <div className="lg:col-span-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#c59b27]">
                Recommendation Architecture
              </h4>
              <p className="text-slate-400 text-xs leading-relaxed">
                Hybrid algorithm fusing Jaccard content similarity over technical competencies with user-based collaborative interaction graphs.
              </p>
              <div className="p-3 bg-slate-900/60 rounded border border-slate-800 text-xs space-y-1 text-slate-300">
                <div className="text-emerald-400 font-semibold text-xs">
                  Active Algorithm Status: Operational
                </div>
                <div className="text-slate-400 text-[11px]">
                  Evaluation Framework: Precision@K · Recall@K · NDCG@10 · MRR
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              © 2026 Kenya Airways PLC / Strathmore University Capstone Prototype.
            </div>
            <div className="flex items-center gap-4">
              <span>Academic Prototype</span>
              <span>•</span>
              <span>Kenya Airways Pride Centre</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
