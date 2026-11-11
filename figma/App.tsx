import { useState, type ReactNode } from "react";

const photos = {
  grace:
    "https://images.unsplash.com/photo-1563132337-f159f484226c?crop=faces&fit=crop&fm=jpg&h=600&q=85&w=600",
  amina:
    "https://images.unsplash.com/photo-1573497491765-dccce02b29df?crop=faces&fit=crop&fm=jpg&h=600&q=85&w=600",
  nyambura:
    "https://images.unsplash.com/photo-1666867540898-aaa1993ffabc?crop=faces&fit=crop&fm=jpg&h=600&q=85&w=600",
  cockpit:
    "https://images.unsplash.com/photo-1769678750254-fc938ce9da7a?crop=entropy&fit=crop&fm=jpg&h=900&q=80&w=1200",
};

type IconName =
  | "arrow"
  | "bell"
  | "calendar"
  | "check"
  | "chevron"
  | "clock"
  | "close"
  | "dashboard"
  | "directory"
  | "events"
  | "filter"
  | "flight"
  | "menu"
  | "message"
  | "opportunity"
  | "profile"
  | "requests"
  | "search"
  | "shield"
  | "sparkles"
  | "star"
  | "users";

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    chevron: <path d="m9 18 6-6-6-6" />,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    close: <><path d="M6 6l12 12M18 6 6 18" /></>,
    dashboard: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    directory: <><circle cx="9" cy="8" r="3" /><path d="M3 20c0-4 2-7 6-7s6 3 6 7M17 11h4M19 9v4" /></>,
    events: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18M8 14h3M13 14h3M8 17h3" /></>,
    filter: <path d="M4 6h16M7 12h10M10 18h4" />,
    flight: <path d="m22 2-8 20-3-9-9-3 20-8Z" />,
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
    message: <><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" /><path d="M8 9h8M8 13h5" /></>,
    opportunity: <><path d="M9 18h6M10 22h4" /><path d="M8 14a7 7 0 1 1 8 0c-1 1-1 2-1 2H9s0-1-1-2Z" /></>,
    profile: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-5 3-8 8-8s8 3 8 8" /></>,
    requests: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    shield: <><path d="M12 2 4 5v6c0 5 3 9 8 11 5-2 8-6 8-11V5Z" /><path d="m9 12 2 2 4-5" /></>,
    sparkles: <><path d="m12 3 1.4 3.6L17 8l-3.6 1.4L12 13l-1.4-3.6L7 8l3.6-1.4ZM5 15l.8 2.2L8 18l-2.2.8L5 21l-.8-2.2L2 18l2.2-.8Z" /></>,
    star: <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9Z" />,
    users: <><circle cx="9" cy="8" r="3" /><path d="M3 20c0-4 2-7 6-7s6 3 6 7M16 4a3 3 0 0 1 0 6M17 13c3 0 4 3 4 6" /></>,
  };
  return <svg aria-hidden="true" className="icon" fill="none" height={size} viewBox="0 0 24 24" width={size}>{paths[name]}</svg>;
}

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <button className="logo" onClick={() => location.reload()}>
      <span className="logo-mark"><span>KQ</span></span>
      {!compact && <span className="logo-copy"><b>KQ PrideConnect</b><small>STAKEHOLDER NETWORK</small></span>}
    </button>
  );
}

function Button({
  children,
  className = "",
  icon,
  onClick,
  variant = "primary",
}: {
  children: ReactNode;
  className?: string;
  icon?: IconName;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "success";
}) {
  return <button className={`btn btn-${variant} ${className}`} onClick={onClick}>{children}{icon && <Icon name={icon} size={16} />}</button>;
}

function Tag({ children, gold = false }: { children: ReactNode; gold?: boolean }) {
  return <span className={`tag ${gold ? "tag-gold" : ""}`}>{children}</span>;
}

function Avatar({ name, src, size = "md" }: { name: string; src: string; size?: "sm" | "md" | "lg" | "xl" }) {
  return <img alt={name} className={`avatar avatar-${size}`} src={src} />;
}

function Landing({ onJoin, onEnter }: { onJoin: () => void; onEnter: () => void }) {
  const segments = [
    ["01", "Pride Centre Alumni & Trainees", "Build career momentum with guidance from experienced KQ professionals."],
    ["02", "Active KQ Flight & Ground Staff", "Exchange operational expertise across departments, fleets and stations."],
    ["03", "Former Employees & Retirees", "Keep decades of aviation knowledge moving through the KQ community."],
    ["04", "Asante & Frequent Flyers", "Connect trusted industry insight with the people shaping every journey."],
  ];
  return (
    <div className="landing">
      <nav className="topnav">
        <Logo />
        <div className="navlinks">
          <button>How Matching Works</button><button>Stakeholders</button><button>Mentorship</button><button>Flight Reconnect</button><button>Pride Centre</button>
        </div>
        <div className="nav-actions"><Button onClick={onEnter} variant="ghost">Log In</Button><Button onClick={onJoin}>Join Network</Button></div>
        <button aria-label="Menu" className="mobile-menu"><Icon name="menu" /></button>
      </nav>

      <main>
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-line" />Official Kenya Airways Stakeholder Ecosystem</div>
            <h1>Connecting the Pride of Africa: <em>Intelligent Mentorship</em> & Professional Networking</h1>
            <p>Empowering Pride Centre alumni, active crew, aviation engineers, and frequent flyers through AI-driven hybrid matching.</p>
            <div className="hero-actions"><Button icon="arrow" onClick={onEnter}>Get Matched</Button><Button onClick={onEnter} variant="secondary">Explore Member Directory</Button></div>
            <div className="proof"><b>1,200+ <span>Verified Stakeholders</span></b><i /><b>450+ <span>Active Mentorships</span></b><i /><b>94% <span>Relevance Match</span></b></div>
          </div>
          <div className="hero-visual">
            <div className="route-map"><svg viewBox="0 0 600 460"><path d="M20 300C180 90 370 120 570 25" /><path d="M70 410C170 210 310 260 540 125" /><circle cx="20" cy="300" r="5" /><circle cx="570" cy="25" r="5" /><circle cx="70" cy="410" r="5" /><circle cx="540" cy="125" r="5" /></svg></div>
            <div className="match-label"><Icon name="sparkles" size={15} /> LIVE AI MATCH</div>
            <div className="hero-card">
              <div className="hero-card-photo"><img alt="Captain Grace M." src={photos.grace} /><span className="role-badge">ACTIVE KQ STAFF</span><span className="match-pill">94%<small>MATCH</small></span></div>
              <div className="hero-card-body">
                <small>RECOMMENDED MENTOR</small><h3>Captain Grace M.</h3><p>Senior Check Captain · Boeing 787</p>
                <div className="tags"><Tag>Flight Safety</Tag><Tag>CRM</Tag><Tag>Long-haul Ops</Tag></div>
                <div className="matched-reason"><Icon name="sparkles" size={15} /><span><b>Why this match?</b> 4 shared skills & aligned career goals</span></div>
                <Button className="wide" icon="arrow" onClick={onEnter}>Accept Connection</Button>
              </div>
            </div>
            <div className="verified-float"><Icon name="shield" /><span><b>KQ Verified</b><small>Identity protected</small></span></div>
          </div>
        </section>

        <section className="segments section">
          <div className="section-heading"><div><div className="eyebrow">BUILT FOR THE ENTIRE KQ ECOSYSTEM</div><h2>One network. Every chapter<br />of the aviation journey.</h2></div><p>Purpose-built professional connections across the people who make Kenya Airways a global community.</p></div>
          <div className="segment-grid">{segments.map(([num, title, desc]) => <article className="segment-card" key={num}><span className="segment-num">{num}</span><div className="segment-icon"><Icon name={num === "02" ? "flight" : num === "04" ? "star" : "users"} /></div><h3>{title}</h3><p>{desc}</p><button>Discover members <Icon name="arrow" size={15} /></button></article>)}</div>
        </section>

        <section className="algorithm section">
          <div className="algorithm-intro"><div className="eyebrow">THE ENGINE BEHIND EVERY INTRODUCTION</div><h2>Human connection,<br /><em>precision matched.</em></h2><p>Our hybrid recommendation engine combines profile intelligence with community outcomes—then tells you exactly why each match makes sense.</p><div className="trust-note"><Icon name="shield" /><span><b>Your data stays yours.</b><small>Consent-led, explainable and built for the KQ community.</small></span></div></div>
          <div className="steps">
            {[
              ["01", "Content-Based Similarity", "We map the professional signals that matter.", ["Skills & certifications", "Aircraft & department", "Career goals"]],
              ["02", "Collaborative Patterns", "The engine learns from real community outcomes.", ["Accepted connections", "Mentorship success", "Peer feedback"]],
              ["03", "Explainable Precision Score", "No black box. Every recommendation is transparent.", ["Clear match reasons", "Relevance percentage", "You stay in control"]],
            ].map(([n, title, desc, items], index) => <article className="step" key={n as string}><span className="step-num">{n as string}</span><div className={`step-icon step-${index}`}><Icon name={index === 0 ? "profile" : index === 1 ? "users" : "sparkles"} /></div><div><h3>{title as string}</h3><p>{desc as string}</p><ul>{(items as string[]).map(item => <li key={item}><Icon name="check" size={14} />{item}</li>)}</ul></div></article>)}
          </div>
        </section>

        <section className="reconnect section">
          <div className="reconnect-visual"><img alt="Airline cockpit overlooking the runway" src={photos.cockpit} /><div className="route-ticket"><div><small>UPCOMING ROUTE</small><b>NBO <Icon name="flight" /> LHR</b></div><span>2 peers<br />on this route</span></div></div>
          <div className="reconnect-copy"><div className="eyebrow">FLIGHT RECONNECT</div><h2>Turn travel into<br /><em>professional synergy.</em></h2><p>Match with verified peers on your next KQ flight or layover. Connect before boarding, share insights in transit, and grow your network at 35,000 feet.</p><div className="privacy-grid"><span><Icon name="shield" /><b>Privacy-first</b><small>Your itinerary is never public.</small></span><span><Icon name="check" /><b>Mutual consent</b><small>Both members confirm first.</small></span></div><Button icon="arrow" onClick={onEnter}>Explore Flight Reconnect</Button></div>
        </section>
      </main>
      <footer><Logo /><p>Connecting the people who carry the Pride of Africa forward.</p><div><button>Pride Centre</button><button>Privacy Policy</button><button>Data Consent</button><button>SkyTeam Partner Notice</button></div><small>© 2025 Kenya Airways. Internal stakeholder platform.</small></footer>
    </div>
  );
}

function Sidebar({ page, setPage }: { page: string; setPage: (page: string) => void }) {
  const items: [string, IconName, string, string?][] = [
    ["dashboard", "dashboard", "Dashboard"],
    ["matches", "sparkles", "Recommended Matches", "6"],
    ["directory", "directory", "Stakeholder Directory"],
    ["requests", "requests", "Mentorship Requests", "3"],
    ["flight", "flight", "Flight Reconnect"],
    ["opportunities", "opportunity", "Opportunities"],
    ["events", "events", "Events"],
    ["profile", "profile", "My Profile"],
  ];
  return <aside className="sidebar"><Logo /><nav>{items.map(([id, icon, label, count]) => <button className={page === id ? "active" : ""} key={id} onClick={() => ["flight", "requests", "matches"].includes(id) && setPage(id)}><Icon name={icon} /><span>{label}</span>{count && <b>{count}</b>}</button>)}</nav><div className="sidebar-profile"><Avatar name="James Mwangi" size="sm" src="https://images.unsplash.com/photo-1764592620890-ea1611b07b34?crop=faces&fit=crop&fm=jpg&h=200&q=80&w=200" /><span><b>James Mwangi</b><small>Alumni · Class of '22</small></span><Icon name="chevron" size={15} /></div></aside>;
}

function AppHeader({ page, setPage }: { page: string; setPage: (page: string) => void }) {
  return <header className="app-header"><div className="mobile-brand"><Logo compact /><select aria-label="Current screen" onChange={e => setPage(e.target.value)} value={page}><option value="matches">Matches</option><option value="flight">Flight Reconnect</option><option value="requests">Requests</option></select></div><div className="header-right"><button className="icon-btn"><Icon name="search" /></button><button className="icon-btn notify"><Icon name="bell" /></button><Avatar name="James Mwangi" size="sm" src="https://images.unsplash.com/photo-1764592620890-ea1611b07b34?crop=faces&fit=crop&fm=jpg&h=200&q=80&w=200" /></div></header>;
}

const matches = [
  { name: "Captain Grace M.", role: "ACTIVE KQ STAFF", title: "Senior Check Captain · B787", dept: "Flight Operations", score: 94, photo: photos.grace, skills: ["Aviation Safety", "SMS", "Crew Resource Mgmt", "+2 more"], why: "4 shared skills · Both Flight Ops · 4.9 mentor rating" },
  { name: "Dr. Amina Njoroge", role: "FORMER KQ EMPLOYEE", title: "Aviation Safety Consultant", dept: "Safety & Compliance", score: 91, photo: photos.amina, skills: ["SMS", "Aviation Law", "Risk Analysis"], why: "3 shared skills · Similar career path · Alumni mentor" },
  { name: "Faith Nyambura", role: "PRIDE CENTRE ALUMNI", title: "B787 First Officer", dept: "Flight Operations", score: 88, photo: photos.nyambura, skills: ["B787 Ops", "CRM", "Flight Planning"], why: "3 shared skills · Same programme · Active peer mentor" },
];

function MatchCard({ item, onProfile }: { item: typeof matches[number]; onProfile: () => void }) {
  return <article className="match-card"><div className="match-image"><img alt={item.name} src={item.photo} /><span className="role-badge">{item.role}</span><span className="score-pill"><Icon name="sparkles" size={13} />{item.score}% Match</span></div><div className="match-content"><h3>{item.name}</h3><p>{item.title}</p><small>{item.dept}</small><div className="why-box"><span><Icon name="sparkles" size={14} /> Why matched</span><p>{item.why}</p></div><div className="tags">{item.skills.map(skill => <Tag key={skill}>{skill}</Tag>)}</div><div className="card-actions"><Button onClick={onProfile}>Request Mentorship</Button><Button onClick={onProfile} variant="ghost">View Profile</Button></div></div></article>;
}

function Matches({ onProfile }: { onProfile: () => void }) {
  return <div className="app-page"><div className="page-title"><div><div className="eyebrow">RECOMMENDATION ENGINE</div><h1>AI Stakeholder Matches</h1><p>Ranked by Hybrid Recommendation Engine <span>Content + Collaborative</span></p></div><Button icon="sparkles">Refine my profile</Button></div><div className="toolbar"><label><Icon name="search" /><input placeholder="Search by name, skill or role..." /></label><button><Icon name="users" />Role<Icon name="chevron" size={14} /></button><button>Department<Icon name="chevron" size={14} /></button><button>Min score: <b>&gt;80%</b><Icon name="chevron" size={14} /></button><button>Mentorship availability<Icon name="chevron" size={14} /></button><button className="filter-mobile"><Icon name="filter" />Filters</button></div><div className="results-bar"><span><b>6 high-relevance matches</b> based on your profile</span><span>Sorted by <b>Best match</b> <Icon name="chevron" size={14} /></span></div><div className="matches-grid">{matches.map((item) => <MatchCard item={item} key={item.name} onProfile={onProfile} />)}</div><div className="privacy-callout"><Icon name="shield" /><span><b>Recommendations improve with your feedback</b><small>Your ratings help us surface stronger professional connections while keeping your profile data private.</small></span><button>How matching works <Icon name="arrow" size={14} /></button></div></div>;
}

function FlightReconnect() {
  return <div className="app-page"><section className="flight-banner"><div><div className="eyebrow">FLIGHT RECONNECT</div><h1>Professional connection, <em>in transit.</em></h1><p>Privacy-first networking with verified stakeholders travelling your route.</p></div><div className="banner-plane"><Icon name="flight" size={56} /></div></section><div className="flight-layout"><section className="panel add-flight"><div className="panel-heading"><span className="panel-icon"><Icon name="flight" /></span><div><h2>Add Upcoming Flight</h2><p>We'll look for verified stakeholders on your route.</p></div></div><div className="form-grid"><label><span>Flight Number</span><input defaultValue="KQ 102" /></label><label><span>Route</span><div className="route-fields"><input defaultValue="NBO" /><Icon name="arrow" /><input defaultValue="LHR" /></div></label><label><span>Travel Date</span><div className="input-icon"><Icon name="calendar" /><input defaultValue="14 Oct 2025" /></div></label></div><label className="consent"><input defaultChecked type="checkbox" /><span><b>I consent to match only with verified passengers on this route.</b><small>Your identity remains hidden until mutual confirmation.</small></span></label><Button icon="arrow">Find people on my flight</Button></section><section className="panel active-flights"><div className="panel-heading row"><div><h2>Active flights</h2><p>1 upcoming journey</p></div><button>Manage</button></div><div className="flight-ticket"><div className="ticket-date"><b>14</b><small>OCT</small></div><div className="ticket-route"><small>KENYA AIRWAYS · KQ 102</small><b>NBO <span><Icon name="flight" /><i /></span> LHR</b><small>Nairobi · 09:05 &nbsp;&nbsp; London · 16:15</small></div><span className="status-live">Matching active</span></div></section></div><section className="panel discovered"><div className="discovered-heading"><div><span className="panel-icon"><Icon name="users" /></span><div><h2>2 Verified Stakeholders found</h2><p>Travelling on KQ 102 on October 14</p></div></div><Tag gold>PRIVATE UNTIL MUTUAL</Tag></div><div className="anonymous-grid">{[["Active KQ Staff", "Engineering & Maintenance", "87%"], ["Pride Centre Alumni", "Commercial & Cargo", "82%"]].map(([role, dept, score], i) => <article className="anonymous-card" key={role}><div className="anon-avatar"><Icon name="profile" size={28} /></div><div><small>{role}</small><h3>Verified stakeholder {i + 1}</h3><p>{dept}</p><div className="tags"><Tag>London layover</Tag><Tag>{score} match</Tag></div></div><Button variant="secondary">Express interest</Button></article>)}</div><p className="lock-note"><Icon name="shield" size={15} />Full names and contact details unlock only after both stakeholders confirm.</p></section></div>;
}

function Requests() {
  const [accepted, setAccepted] = useState(false);
  const requests = [
    { name: "Mary Wanjiku", role: "PRIDE CENTRE ALUMNI", title: "Graduate Trainee · Commercial", photo: photos.nyambura, time: "2 hours ago", note: "Hi James, your journey from Pride Centre into network planning really stood out. I'd value your guidance as I explore commercial aviation roles." },
    { name: "David Ochieng", role: "ACTIVE KQ STAFF", title: "Aircraft Technician · B787", photo: "https://images.unsplash.com/photo-1764592620890-ea1611b07b34?crop=faces&fit=crop&fm=jpg&h=500&q=80&w=500", time: "Yesterday", note: "I'd love to connect and learn more about cross-functional opportunities between engineering and operations." },
  ];
  return <div className="app-page"><div className="page-title"><div><div className="eyebrow">YOUR NETWORK</div><h1>Mentorship Requests</h1><p>Review connection requests and keep your professional network moving.</p></div></div><div className="request-tabs"><button className="active">Pending Requests <b>2</b></button><button>Sent Requests <b>1</b></button><button>Active Connections <b>8</b></button></div>{accepted && <section className="rating-card"><button className="dismiss" onClick={() => setAccepted(false)}><Icon name="close" /></button><span className="rating-icon"><Icon name="sparkles" /></span><div><h3>Connection accepted. How was this recommendation?</h3><p>Your rating improves future matches for the whole KQ community.</p></div><div className="stars">{[1,2,3,4,5].map(n => <button aria-label={`${n} stars`} key={n}><Icon name="star" /></button>)}</div></section>}<div className="request-list">{requests.map((request, index) => <article className="request-card" key={request.name}><div className="request-person"><Avatar name={request.name} size="lg" src={request.photo} /><span><small>{request.role}</small><h3>{request.name}</h3><p>{request.title}</p></span><time><Icon name="clock" size={14} />{request.time}</time></div><blockquote>“{request.note}”</blockquote><div className="request-reason"><Icon name="sparkles" size={15} /><span><b>{index === 0 ? "91%" : "86%"} recommendation match</b> · {index === 0 ? "3 shared interests · Both Pride Centre alumni" : "2 shared goals · Cross-functional interest"}</span></div><div className="request-actions"><Button onClick={() => setAccepted(true)} variant="success">Accept & Connect</Button><Button variant="ghost">Decline</Button><Button variant="secondary">View Full Profile</Button></div></article>)}</div></div>;
}

function AppShell({ onProfile }: { onProfile: () => void }) {
  const [page, setPage] = useState("matches");
  return <div className="shell"><Sidebar page={page} setPage={setPage} /><div className="shell-main"><AppHeader page={page} setPage={setPage} />{page === "flight" ? <FlightReconnect /> : page === "requests" ? <Requests /> : <Matches onProfile={onProfile} />}</div></div>;
}

function Modal({ children, onClose, className = "" }: { children: ReactNode; onClose: () => void; className?: string }) {
  return <div className="modal-backdrop" onMouseDown={onClose}><div className={`modal ${className}`} onMouseDown={e => e.stopPropagation()}>{children}<button aria-label="Close" className="modal-close" onClick={onClose}><Icon name="close" /></button></div></div>;
}

function Onboarding({ onClose, onComplete }: { onClose: () => void; onComplete: () => void }) {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState("Active KQ Staff");
  const stepContent = [
    <><div className="modal-title"><div className="eyebrow">LET'S BUILD YOUR PROFILE</div><h2>Where do you fit in the KQ ecosystem?</h2><p>This helps us verify your profile and tailor the right introductions.</p></div><div className="role-grid">{[["Pride Centre Alumni", "Graduates and current trainees", "users"], ["Active KQ Staff", "Flight and ground teams", "flight"], ["Former KQ Employee", "Alumni and retirees", "star"], ["Frequent Flyer", "Asante members and partners", "users"]].map(([label, desc, icon]) => <button className={role === label ? "selected" : ""} key={label} onClick={() => setRole(label)}><span><Icon name={icon as IconName} /></span><div><b>{label}</b><small>{desc}</small></div><i>{role === label && <Icon name="check" size={14} />}</i></button>)}</div><label className="field"><span>Staff ID / Registration Number <small>OPTIONAL</small></span><div><Icon name="shield" /><input placeholder="e.g. KQ-10482" /></div><small>Used only for verification. Never shown publicly.</small></label></>,
    <><div className="modal-title"><div className="eyebrow">YOUR AVIATION DOMAIN</div><h2>Which teams know your name?</h2><p>Select your primary department and any areas you collaborate with.</p></div><div className="choice-tags">{["Flight Operations", "In-flight Crew", "Engineering & Maintenance", "Ground Services", "Commercial & Cargo"].map((x, i) => <button className={i < 2 ? "selected" : ""} key={x}>{x}{i < 2 && <Icon name="check" size={14} />}</button>)}</div></>,
    <><div className="modal-title"><div className="eyebrow">SKILLS & GOALS</div><h2>What expertise are you bringing aboard?</h2><p>Add skills to make your recommendations more precise.</p></div><label className="field"><span>Skills and certifications</span><div><Icon name="search" /><input placeholder="Search or add a skill..." /></div></label><div className="skill-cloud">{["Boeing 737/787 Ops", "Safety Management Systems", "Aviation Law", "Revenue Management"].map((x, i) => <button className={i < 2 ? "selected" : ""} key={x}>{x}{i < 2 ? <Icon name="check" size={14} /> : <span>+</span>}</button>)}</div></>,
    <><div className="modal-title"><div className="eyebrow">MENTORSHIP MODE</div><h2>What kind of connection are you ready for?</h2><p>You can update your preferences whenever your goals change.</p></div><div className="segment-toggle"><button className="active">Seeking Mentor</button><button>Available to Mentor</button><button>Peer Networking Only</button></div><label className="field"><span>Availability per month</span><div className="range-labels"><button>1 hour</button><button className="selected">2–3 hours</button><button>4+ hours</button></div></label></>,
  ];
  return <Modal className="onboarding" onClose={onClose}><div className="progress-top"><span>PROFILE SETUP</span><b>{step} of 4</b></div><div className="progress-track"><i style={{ width: `${step * 25}%` }} /></div><div className="step-labels">{["Persona", "Aviation Domain", "Skills & Goals", "Mentorship Mode"].map((label, i) => <span className={step >= i + 1 ? "active" : ""} key={label}>{i + 1}<small>{label}</small></span>)}</div><div className="modal-body">{stepContent[step - 1]}</div><div className="modal-footer">{step > 1 ? <Button onClick={() => setStep(step - 1)} variant="ghost">Back</Button> : <span />}<Button icon="arrow" onClick={() => step === 4 ? onComplete() : setStep(step + 1)}>{step === 4 ? "Complete profile" : "Continue"}</Button></div></Modal>;
}

function ProfileModal({ onClose }: { onClose: () => void }) {
  return <Modal className="profile-modal" onClose={onClose}><div className="profile-cover"><div className="cover-route" /><Avatar name="Captain Grace M." size="xl" src={photos.grace} /></div><div className="profile-body"><div className="profile-intro"><div><span className="verified-label"><Icon name="shield" size={14} /> VERIFIED KQ STAFF</span><h2>Captain Grace M.</h2><p>Senior Check Captain · Boeing 787</p><span>Nairobi, Kenya · 18 years at KQ</span></div><span className="score-big"><b>94%</b><small>MATCH</small></span></div><p className="bio">Aviation leader and instructor passionate about building confident flight crews, strengthening safety culture, and helping the next generation navigate the command pathway.</p><div className="profile-facts"><span><small>EXPERIENCE</small><b>18 years at KQ</b></span><span><small>EDUCATION</small><b>KQ Pride Centre, 2007</b></span></div><section><h3>Career objectives</h3><p>Advancing evidence-based safety leadership and supporting more women into flight-deck command roles across Africa.</p></section><section><h3>Mentorship approach</h3><p>“I offer direct, practical guidance grounded in real operations—with space to reflect, ask questions and grow at your own pace.”</p></section><div className="send-request"><h3>Send mentorship request</h3><textarea placeholder="Hi Grace, I'd love to connect regarding your experience transitioning from First Officer to Captain on the Dreamliner..." /><div><small>Optional · Add context to improve acceptance</small><Button icon="arrow">Send Request</Button></div></div></div></Modal>;
}

export default function App() {
  const [view, setView] = useState<"landing" | "app">("landing");
  const [modal, setModal] = useState<"onboarding" | "profile" | null>(null);
  return <>{view === "landing" ? <Landing onEnter={() => setView("app")} onJoin={() => setModal("onboarding")} /> : <AppShell onProfile={() => setModal("profile")} />}{modal === "onboarding" && <Onboarding onClose={() => setModal(null)} onComplete={() => { setModal(null); setView("app"); }} />}{modal === "profile" && <ProfileModal onClose={() => setModal(null)} />}</>;
}
