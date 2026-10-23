"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { KQLogo } from "@/components/KQBrand";
import { Icon } from "@/components/KQIcons";
import { ViewModeToggle } from "@/components/ViewMode";

export default function Home() {
  const { data: session } = useSession();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const portalHref = session?.user?.role === "ADMIN" ? "/admin" : "/recommendations";
  const enterPortal = () => router.push(session?.user ? portalHref : "/login");

  const links = [
    { href: "#community", label: "The community" },
    { href: "#connections", label: "Connections" },
    { href: "/directory", label: "Member directory" },
    { href: "/flight-reconnect", label: "Flight reconnect" },
  ];

  return (
    <div className="home-page pc-landing">
      <main>
        <section className="pc-hero" aria-labelledby="pc-hero-title">
          <div className="pc-hero-photo" role="img" aria-label="Kenya Airways aircraft flying above the clouds" />
          <div className="pc-hero-grid" aria-hidden="true" />
          <svg className="pc-flight-path" viewBox="0 0 900 500" aria-hidden="true">
            <path d="M-80 420C160 420 155 120 415 150s245 210 560-40" />
            <circle cx="415" cy="150" r="7" />
          </svg>

          <header className="pc-nav">
            <KQLogo light />
            <nav className="pc-nav-links" aria-label="Main navigation">
              {links.map((link) => link.href.startsWith("#") ? (
                <a key={link.href} href={link.href}>{link.label}</a>
              ) : (
                <Link key={link.href} href={link.href}>{link.label}</Link>
              ))}
            </nav>
            <div className="pc-nav-actions">
              <ViewModeToggle compact />
              <Link className="pc-nav-signin" href={session?.user ? portalHref : "/login"}>
                {session?.user ? "Open portal" : "Sign in"}
              </Link>
              <Link className="pc-nav-join" href={session?.user ? portalHref : "/register"}>
                {session?.user ? "Go to workspace" : "Join the network"}<Icon name="arrow" size={15} />
              </Link>
            </div>
            <button
              type="button"
              className="pc-menu-button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={mobileMenuOpen}
            >
              <Icon name={mobileMenuOpen ? "close" : "menu"} size={21} />
            </button>
          </header>

          {mobileMenuOpen && (
            <nav className="pc-mobile-menu" aria-label="Mobile navigation">
              {links.map((link) => link.href.startsWith("#") ? (
                <a key={link.href} href={link.href} onClick={() => setMobileMenuOpen(false)}>{link.label}</a>
              ) : (
                <Link key={link.href} href={link.href} onClick={() => setMobileMenuOpen(false)}>{link.label}</Link>
              ))}
              <Link className="pc-mobile-cta" href={session?.user ? portalHref : "/login"}>
                {session?.user ? "Open your portal" : "Sign in to PrideConnect"}<Icon name="arrow" size={16} />
              </Link>
            </nav>
          )}

          <div className="pc-hero-content">
            <p className="pc-eyebrow"><span /> Kenya Airways stakeholder network</p>
            <h1 id="pc-hero-title">Your network.<br /><em>In motion.</em></h1>
            <p className="pc-hero-copy">
              Reconnect across routes, roles and years. A professional community for the people who make every journey possible.
            </p>
            <div className="pc-hero-actions">
              <button type="button" className="pc-primary-cta" onClick={enterPortal}>
                {session?.user ? "Open your portal" : "Find your people"}<Icon name="arrow" size={17} />
              </button>
              <span className="pc-hero-note">For current staff, alumni,<br />frequent flyers and partners.</span>
            </div>
          </div>

          <div className="pc-hero-bottom">
            <a className="pc-scroll-cue" href="#community"><span>↓</span> Discover the community</a>
            <div className="pc-hero-caption"><span>KENYA AIRWAYS</span><i /> PEOPLE CONNECTED BY THE JOURNEY</div>
          </div>
        </section>

        <section className="pc-intro" id="community">
          <div className="pc-intro-heading">
            <p className="pc-section-kicker">A community with a shared horizon</p>
            <h2>Every journey brings<br />a new <em>connection.</em></h2>
          </div>
          <div className="pc-intro-copy">
            <p>From the flight deck to the ground team, from first roles to the next chapter, PrideConnect brings the Kenya Airways community closer together.</p>
            <Link href="/directory" className="pc-text-link">Explore the community <Icon name="arrow" size={16} /></Link>
          </div>
        </section>

        <section className="pc-pillars" id="connections" aria-label="Ways to connect">
          <Link href="/recommendations" className="pc-pillar-card pc-pillar-red">
            <span className="pc-pillar-index">01 / DISCOVER</span>
            <span className="pc-pillar-icon"><Icon name="sparkles" size={21} /></span>
            <span className="pc-pillar-title">Meet people<br />who move you forward.</span>
            <span className="pc-pillar-foot">Recommendations shaped by shared skills and interests <Icon name="arrow" size={16} /></span>
          </Link>
          <Link href="/requests" className="pc-pillar-card pc-pillar-light">
            <span className="pc-pillar-index">02 / GROW</span>
            <span className="pc-pillar-icon"><Icon name="users" size={21} /></span>
            <span className="pc-pillar-title">Turn experience<br />into opportunity.</span>
            <span className="pc-pillar-foot">Build meaningful mentorship and professional connections <Icon name="arrow" size={16} /></span>
          </Link>
          <Link href="/flight-reconnect" className="pc-pillar-card pc-pillar-navy">
            <span className="pc-pillar-index">03 / RECONNECT</span>
            <span className="pc-pillar-icon"><Icon name="flight" size={21} /></span>
            <span className="pc-pillar-title">Cross paths<br />once more.</span>
            <span className="pc-pillar-foot">Reconnect with people from flights you have taken <Icon name="arrow" size={16} /></span>
          </Link>
        </section>

        <footer className="pc-footer">
          <KQLogo light />
          <p>A stronger network starts with a conversation.</p>
          <Link href={session?.user ? portalHref : "/register"}>Join PrideConnect <Icon name="arrow" size={15} /></Link>
        </footer>
      </main>
    </div>
  );
}
