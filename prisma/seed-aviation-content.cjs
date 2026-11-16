require("dotenv").config();

if (process.env.NODE_ENV === "production") {
  console.error("Aviation sample listings are local test data and cannot be seeded in production.");
  process.exit(1);
}

const connectionString = process.env.DATABASE_URL;
let databaseUrl;
try {
  databaseUrl = new URL(connectionString);
} catch {
  console.error("Set DATABASE_URL to a local PostgreSQL database before seeding sample listings.");
  process.exit(1);
}

if (!["localhost", "127.0.0.1", "::1", "[::1]"].includes(databaseUrl.hostname)) {
  console.error("Sample listings are restricted to local PostgreSQL. Your DATABASE_URL is not local.");
  process.exit(1);
}

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const events = [
  {
    title: "TEST EVENT · Aircraft Systems & Safety Masterclass",
    description: "SAMPLE FOR PAGE TESTING ONLY — not an official Kenya Airways event. A practical session covering aircraft systems, safety culture, and operational decision-making, followed by a question-and-answer session with aviation professionals.",
    location: "Pride Centre Training Room, Nairobi",
    bannerUrl: "/event-banners/aircraft-systems-masterclass.svg",
    daysAhead: 14,
    hour: 9,
  },
  {
    title: "TEST EVENT · Aviation Career Pathways Forum",
    description: "SAMPLE FOR PAGE TESTING ONLY — not an official Kenya Airways event. Explore career pathways across flight operations, engineering, ground services, safety, and commercial aviation. Includes a peer networking session and mentorship sign-up information.",
    location: "Pride Centre Auditorium, Nairobi",
    bannerUrl: "/event-banners/aviation-career-pathways.svg",
    daysAhead: 28,
    hour: 14,
  },
  {
    title: "TEST EVENT · Sustainable Aviation & Operations Roundtable",
    description: "SAMPLE FOR PAGE TESTING ONLY — not an official Kenya Airways event. A discussion on fuel efficiency, responsible operations, service reliability, and practical ways aviation teams can make progress toward more sustainable travel.",
    location: "Online · Community meeting link to follow",
    bannerUrl: "/event-banners/sustainable-aviation-roundtable.svg",
    daysAhead: 42,
    hour: 10,
  },
];

const opportunities = [
  {
    title: "TEST LISTING · Graduate Flight Operations Trainee",
    description: "SAMPLE FOR PAGE TESTING ONLY — not a live vacancy. A fictional early-career opportunity to learn about flight dispatch, operational planning, safety procedures, and coordination between airport teams. Requirements and application details are illustrative.",
    type: "Career Opening",
  },
  {
    title: "TEST LISTING · Aircraft Maintenance Engineering Intern",
    description: "SAMPLE FOR PAGE TESTING ONLY — not a live vacancy. A fictional internship listing for an aviation engineering student interested in maintenance planning, technical records, quality processes, and safe aircraft operations. No applications are being accepted.",
    type: "Internship",
  },
  {
    title: "TEST LISTING · Aviation Safety & Human Factors Workshop",
    description: "SAMPLE FOR PAGE TESTING ONLY — not a live opportunity. A fictional workshop listing focused on safety management systems, human factors, incident learning, and practical communication across flight and ground teams.",
    type: "Industry Workshop",
  },
];

function eventDate(daysAhead, hour) {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  date.setHours(hour, 0, 0, 0);
  return date;
}

async function main() {
  const admin = await prisma.user.findUnique({
    where: { email: "admin@example.com" },
    select: { id: true, isDemo: true },
  });

  if (!admin?.isDemo) {
    throw new Error("Local demo admin not found. Run the standard seed against local PostgreSQL first.");
  }

  for (const sample of events) {
    const { daysAhead, hour, ...data } = sample;
    const existing = await prisma.event.findFirst({
      where: { createdById: admin.id, title: data.title },
      select: { id: true },
    });
    const eventData = { ...data, eventDate: eventDate(daysAhead, hour), isHidden: false };

    if (existing) {
      await prisma.event.update({ where: { id: existing.id }, data: eventData });
    } else {
      await prisma.event.create({ data: { ...eventData, createdById: admin.id } });
    }
  }

  for (const data of opportunities) {
    const existing = await prisma.opportunity.findFirst({
      where: { postedById: admin.id, title: data.title },
      select: { id: true },
    });

    if (existing) {
      await prisma.opportunity.update({ where: { id: existing.id }, data: { ...data, isHidden: false } });
    } else {
      await prisma.opportunity.create({ data: { ...data, postedById: admin.id } });
    }
  }

  console.log(`Seeded ${events.length} sample events and ${opportunities.length} sample opportunities locally.`);
  console.log("Sample events use local SVG banners and do not send announcement emails.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
