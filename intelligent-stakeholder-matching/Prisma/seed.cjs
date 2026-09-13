require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

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

async function main() {
  for (const name of skills) {
    await prisma.skill.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  for (const name of interests) {
    await prisma.interest.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log(`Seeded ${skills.length} skills and ${interests.length} interests.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
