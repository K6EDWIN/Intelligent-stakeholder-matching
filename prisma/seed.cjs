require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const bcrypt = require("bcryptjs");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Synthetic stakeholder/interaction dataset -- see docs/DATA.md for what
// this is and why it's synthetic. Source files live in prisma/data/; this
// script is the only consumer, so its parsing only needs to handle the
// format those files actually use: a header row, plain comma-separated
// fields, and at most one quoted field per row (bio, which may contain
// commas but never an embedded literal quote character). It is NOT a
// general-purpose CSV parser -- don't reuse this for arbitrary CSV input.
function parseCsv(filePath) {
  const text = fs.readFileSync(filePath, "utf8").trim();
  const lines = text.split(/\r?\n/);
  const header = lines[0].split(",");

  return lines.slice(1).map((line) => {
    const fields = [];
    let current = "";
    let inQuotes = false;
    for (const ch of line) {
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === "," && !inQuotes) {
        fields.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
    fields.push(current);

    const row = {};
    header.forEach((key, i) => (row[key] = fields[i]));
    return row;
  });
}

const stakeholderRows = parseCsv(path.join(__dirname, "data", "stakeholders.csv"));
const interactionRows = parseCsv(path.join(__dirname, "data", "interactions.csv"));

// Skills/interests are derived from the dataset itself rather than a
// separately maintained list, so there's one source of truth and no risk of
// a hand-maintained list silently drifting out of sync with what the
// stakeholder rows actually reference.
const skillNames = [
  ...new Set(stakeholderRows.flatMap((r) => r.skills.split(";").filter(Boolean))),
].sort();
const interestNames = [
  ...new Set(stakeholderRows.flatMap((r) => r.interests.split(";").filter(Boolean))),
].sort();

// All seeded accounts share this password -- fine for demo/test data, never
// use a shared password for real accounts.
const TEST_PASSWORD = "Test1234!";

async function main() {
  // 1. Seed skills and interests
  for (const name of skillNames) {
    await prisma.skill.upsert({ where: { name }, update: {}, create: { name } });
  }
  for (const name of interestNames) {
    await prisma.interest.upsert({ where: { name }, update: {}, create: { name } });
  }
  console.log(`Seeded ${skillNames.length} skills and ${interestNames.length} interests.`);

  const allSkills = await prisma.skill.findMany();
  const allInterests = await prisma.interest.findMany();
  const skillIdByName = Object.fromEntries(allSkills.map((s) => [s.name, s.id]));
  const interestIdByName = Object.fromEntries(allInterests.map((i) => [i.name, i.id]));

  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);

  // 2. Seed stakeholders + profiles + skill/interest links
  const userIdByCsvId = {};

  for (const row of stakeholderRows) {
    const user = await prisma.user.upsert({
      where: { email: row.email },
      update: {},
      create: {
        email: row.email,
        passwordHash,
        role: row.role,
        isVerified: row.is_verified === "True",
        profile: {
          create: {
            fullName: row.full_name,
            bio: row.bio,
            department: row.department,
            mentorshipRole: row.mentorship_role || null,
            availability: row.availability,
            isPublic: row.is_public === "True",
          },
        },
      },
      include: { profile: true },
    });

    userIdByCsvId[row.user_id] = user.id;

    if (!user.profile) continue; // already existed from a prior run, skip re-linking

    const skillIds = row.skills
      .split(";")
      .filter(Boolean)
      .map((name) => skillIdByName[name])
      .filter(Boolean);
    const interestIds = row.interests
      .split(";")
      .filter(Boolean)
      .map((name) => interestIdByName[name])
      .filter(Boolean);

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
  console.log(`Seeded ${stakeholderRows.length} stakeholder profiles.`);

  // 3. Seed mentorship/connection requests and feedback on accepted ones --
  // the interaction history collaborative filtering scores against. Neither
  // request model has a unique constraint on (senderId, receiverId) -- a
  // real user can legitimately re-request after a decline -- so idempotency
  // is handled by checking existing pairs up front rather than relying on
  // upsert; interactions.csv itself has no duplicate (requester,recipient)
  // pairs, so this only matters across repeated `npm run seed` runs.
  const [existingMentorships, existingConnections] = await Promise.all([
    prisma.mentorshipRequest.findMany({ select: { senderId: true, receiverId: true } }),
    prisma.connectionRequest.findMany({ select: { senderId: true, receiverId: true } }),
  ]);
  const existingMentorshipPairs = new Set(
    existingMentorships.map((r) => `${r.senderId}->${r.receiverId}`)
  );
  const existingConnectionPairs = new Set(
    existingConnections.map((r) => `${r.senderId}->${r.receiverId}`)
  );

  let mentorshipCount = 0;
  let connectionCount = 0;
  let feedbackCount = 0;

  for (const row of interactionRows) {
    const senderId = userIdByCsvId[row.requester_id];
    const receiverId = userIdByCsvId[row.recipient_id];
    const pairKey = `${senderId}->${receiverId}`;
    const rating = row.rating ? Number(row.rating) : null;

    if (row.request_type === "MENTORSHIP") {
      if (existingMentorshipPairs.has(pairKey)) continue;

      const mentorshipRequest = await prisma.mentorshipRequest.create({
        data: { senderId, receiverId, status: row.status },
      });
      mentorshipCount++;

      if (rating) {
        await prisma.feedback.create({
          data: { userId: senderId, mentorshipRequestId: mentorshipRequest.id, rating },
        });
        feedbackCount++;
      }
    } else if (row.request_type === "CONNECTION") {
      if (existingConnectionPairs.has(pairKey)) continue;

      const connectionRequest = await prisma.connectionRequest.create({
        data: { senderId, receiverId, status: row.status },
      });
      connectionCount++;

      if (rating) {
        await prisma.feedback.create({
          data: { userId: senderId, connectionRequestId: connectionRequest.id, rating },
        });
        feedbackCount++;
      }
    }
  }
  console.log(
    `Seeded ${mentorshipCount} mentorship requests, ${connectionCount} connection requests, ${feedbackCount} feedback ratings.`
  );

  console.log(`All test accounts use the password: ${TEST_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
