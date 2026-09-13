require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const bcrypt = require("bcryptjs");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const skills = [
  "JavaScript",
  "Python",
  "Project Management",
  "Public Speaking",
  "Data Analysis",
  "Customer Service",
  "Leadership",
  "Aviation Safety",
  "Flight Operations",
  "Marketing",
  "Finance",
  "Human Resources",
  "Sales",
  "Graphic Design",
  "Networking (Professional)",
  "Mentoring",
  "Negotiation",
  "Logistics",
  "Cybersecurity",
  "UX/UI Design",
];

const interests = [
  "Career Development",
  "Aviation Industry Trends",
  "Entrepreneurship",
  "Technology",
  "Travel",
  "Community Service",
  "Sustainability",
  "Personal Finance",
  "Leadership Development",
  "Networking Events",
  "Public Speaking",
  "Wellness & Mental Health",
  "Diversity & Inclusion",
  "Sports",
  "Arts & Culture",
];

// Fake test stakeholders -- realistic enough to demo search/filter/directory
// behavior. All are pre-verified (isVerified: true) since they're seed data,
// not real registrations, so you don't need to click email links for them.
const TEST_PASSWORD = "Test1234!";

const testUsers = [
  {
    email: "grace.mwangi@example.com",
    fullName: "Grace Mwangi",
    role: "STAFF",
    department: "Cabin Crew Operations",
    bio: "Senior cabin crew trainer with a focus on onboarding new hires.",
    mentorshipRole: "MENTOR",
    availability: "Weekday evenings",
    skills: ["Leadership", "Public Speaking", "Mentoring", "Aviation Safety"],
    interests: ["Career Development", "Leadership Development", "Wellness & Mental Health"],
  },
  {
    email: "peter.kamau@example.com",
    fullName: "Peter Kamau",
    role: "ALUMNI",
    department: "Pride Centre Alumni Network",
    bio: "Pride Centre graduate now working in ground operations logistics.",
    mentorshipRole: "MENTEE",
    availability: "Weekends",
    skills: ["Logistics", "Project Management", "Data Analysis"],
    interests: ["Aviation Industry Trends", "Career Development", "Technology"],
  },
  {
    email: "wanjiru.simiyu@example.com",
    fullName: "Wanjiru Simiyu",
    role: "STAFF",
    department: "Training & Development",
    bio: "Training coordinator passionate about structured mentorship programs.",
    mentorshipRole: "BOTH",
    availability: "Flexible",
    skills: ["Mentoring", "Human Resources", "Public Speaking", "Leadership"],
    interests: ["Leadership Development", "Diversity & Inclusion", "Community Service"],
  },
  {
    email: "david.otieno@example.com",
    fullName: "David Otieno",
    role: "FORMER_STAFF",
    department: "Finance",
    bio: "Former finance analyst, now consulting in the aviation sector.",
    mentorshipRole: "MENTOR",
    availability: "Weekday mornings",
    skills: ["Finance", "Data Analysis", "Negotiation"],
    interests: ["Personal Finance", "Entrepreneurship", "Aviation Industry Trends"],
  },
  {
    email: "amina.hassan@example.com",
    fullName: "Amina Hassan",
    role: "FREQUENT_FLYER",
    department: "N/A",
    bio: "Frequent business traveler interested in aviation networking and travel tech.",
    mentorshipRole: "",
    availability: "Occasional",
    skills: ["Marketing", "Networking (Professional)"],
    interests: ["Travel", "Technology", "Networking Events"],
  },
  {
    email: "john.mutua@example.com",
    fullName: "John Mutua",
    role: "STAFF",
    department: "Information Technology",
    bio: "Software engineer on the digital platforms team, into cybersecurity.",
    mentorshipRole: "MENTOR",
    availability: "Weekday evenings",
    skills: ["JavaScript", "Python", "Cybersecurity", "UX/UI Design"],
    interests: ["Technology", "Career Development", "Sustainability"],
  },
  {
    email: "esther.njoroge@example.com",
    fullName: "Esther Njoroge",
    role: "ALUMNI",
    department: "Pride Centre Alumni Network",
    bio: "Recent Pride Centre graduate exploring customer experience roles.",
    mentorshipRole: "MENTEE",
    availability: "Weekends",
    skills: ["Customer Service", "Sales"],
    interests: ["Career Development", "Public Speaking", "Arts & Culture"],
  },
  {
    email: "brian.kiptoo@example.com",
    fullName: "Brian Kiptoo",
    role: "STAFF",
    department: "Flight Operations",
    bio: "First officer with an interest in mentoring aspiring pilots.",
    mentorshipRole: "MENTOR",
    availability: "Flexible",
    skills: ["Flight Operations", "Aviation Safety", "Leadership"],
    interests: ["Aviation Industry Trends", "Sports", "Leadership Development"],
  },
  {
    email: "faith.wambui@example.com",
    fullName: "Faith Wambui",
    role: "FORMER_STAFF",
    department: "Marketing",
    bio: "Former marketing lead, now runs a small travel media business.",
    mentorshipRole: "MENTOR",
    availability: "Weekday afternoons",
    skills: ["Marketing", "Graphic Design", "Networking (Professional)"],
    interests: ["Entrepreneurship", "Arts & Culture", "Travel"],
  },
  {
    email: "samuel.ochieng@example.com",
    fullName: "Samuel Ochieng",
    role: "FREQUENT_FLYER",
    department: "N/A",
    bio: "Corporate account manager who flies weekly and enjoys community projects.",
    mentorshipRole: "",
    availability: "Occasional",
    skills: ["Sales", "Negotiation", "Project Management"],
    interests: ["Community Service", "Networking Events", "Personal Finance"],
  },
];

async function main() {
  // 1. Seed skills and interests
  for (const name of skills) {
    await prisma.skill.upsert({ where: { name }, update: {}, create: { name } });
  }
  for (const name of interests) {
    await prisma.interest.upsert({ where: { name }, update: {}, create: { name } });
  }
  console.log(`Seeded ${skills.length} skills and ${interests.length} interests.`);

  // Build name -> id lookup maps for linking
  const allSkills = await prisma.skill.findMany();
  const allInterests = await prisma.interest.findMany();
  const skillIdByName = Object.fromEntries(allSkills.map((s) => [s.name, s.id]));
  const interestIdByName = Object.fromEntries(allInterests.map((i) => [i.name, i.id]));

  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);

  // 2. Seed test users + profiles + skill/interest links
  for (const t of testUsers) {
    const user = await prisma.user.upsert({
      where: { email: t.email },
      update: {},
      create: {
        email: t.email,
        passwordHash,
        role: t.role,
        isVerified: true,
        profile: {
          create: {
            fullName: t.fullName,
            bio: t.bio,
            department: t.department,
            mentorshipRole: t.mentorshipRole || null,
            availability: t.availability,
            isPublic: true,
          },
        },
      },
      include: { profile: true },
    });

    if (!user.profile) continue; // already existed from a prior run, skip re-linking

    const skillIds = t.skills.map((name) => skillIdByName[name]).filter(Boolean);
    const interestIds = t.interests.map((name) => interestIdByName[name]).filter(Boolean);

    if (skillIds.length) {
      await prisma.profileSkill.createMany({
        data: skillIds.map((skillId) => ({ profileId: user.profile.id, skillId })),
        skipDuplicates: true,
      });
    }
    if (interestIds.length) {
      await prisma.profileInterest.createMany({
        data: interestIds.map((interestId) => ({ profileId: user.profile.id, interestId })),
        skipDuplicates: true,
      });
    }
  }

  console.log(`Seeded ${testUsers.length} test stakeholder profiles.`);
  console.log(`All test accounts use the password: ${TEST_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
