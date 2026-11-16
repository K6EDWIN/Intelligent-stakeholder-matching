const fs = require("node:fs");
const path = require("node:path");
const { execSync } = require("node:child_process");
const bcrypt = require("bcryptjs");

const root = path.resolve(__dirname, "..");
const schemaSqlOutput = execSync(
  "npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script",
  { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] }
);
// Prisma's environment loader writes its status banner to stdout in this setup;
// that banner is not part of the generated SQL and must never reach Neon Editor.
const schemaSql = schemaSqlOutput
  .split(/\r?\n/)
  .filter((line) => !line.startsWith("◇ injected env") && !line.startsWith("Loaded Prisma config from"))
  .join("\n");

function parseCsv(filePath) {
  const lines = fs.readFileSync(filePath, "utf8").trim().split(/\r?\n/);
  const headers = lines.shift().split(",");
  return lines.map((line) => {
    const cells = [];
    let cell = "";
    let quoted = false;
    for (const char of line) {
      if (char === '"') quoted = !quoted;
      else if (char === "," && !quoted) {
        cells.push(cell);
        cell = "";
      } else cell += char;
    }
    cells.push(cell);
    return Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""]));
  });
}

function sql(value) {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  if (typeof value === "number") return String(value);
  return `'${String(value).replaceAll("'", "''")}'`;
}

function insert(table, columns, rows) {
  if (!rows.length) return "";
  return `INSERT INTO "${table}" (${columns.map((column) => `"${column}"`).join(", ")})\nVALUES\n${rows
    .map((row) => `  (${row.map(sql).join(", ")})`)
    .join(",\n")};\n`;
}

function jaccard(a, b) {
  const left = new Set(a.map((value) => typeof value === "string" ? value : value.name));
  const right = new Set(b.map((value) => typeof value === "string" ? value : value.name));
  if (!left.size && !right.size) return 0;
  let shared = 0;
  for (const value of left) if (right.has(value)) shared++;
  return shared / new Set([...left, ...right]).size;
}

async function main() {
  const [{ availabilityPairFeatures }, { profileSemanticSimilarity }] = await Promise.all([
    import("../src/lib/availability.js"),
    import("../src/lib/profile-vectors.js"),
  ]);
  const stakeholders = parseCsv(path.join(__dirname, "data", "stakeholders.csv"));
  const interactions = parseCsv(path.join(__dirname, "data", "interactions.csv"));
  const skills = [...new Set(stakeholders.flatMap((row) => row.skills.split(";").filter(Boolean)))].sort();
  const interests = [...new Set(stakeholders.flatMap((row) => row.interests.split(";").filter(Boolean)))].sort();
  const skillIds = new Map(skills.map((name, index) => [name, `demo-skill-${String(index + 1).padStart(3, "0")}`]));
  const interestIds = new Map(interests.map((name, index) => [name, `demo-interest-${String(index + 1).padStart(3, "0")}`]));
  const userIds = new Map(stakeholders.map((row) => [row.user_id, `demo-user-${row.user_id}`]));
  const profileIds = new Map(stakeholders.map((row) => [row.user_id, `demo-profile-${row.user_id}`]));
  const profiles = new Map(stakeholders.map((row) => [row.user_id, {
    department: row.department,
    bio: row.bio,
    professionalBackground: null,
    trainingHistory: null,
    careerGoals: null,
    mentorshipNeeds: null,
    mentorshipRole: row.mentorship_role || null,
    availability: row.availability,
    skills: row.skills.split(";").filter(Boolean).map((name) => ({ name })),
    interests: row.interests.split(";").filter(Boolean).map((name) => ({ name })),
  }]));
  const passwordHash = await bcrypt.hash("Test1234!", 10);
  const users = stakeholders.map((row) => [
    userIds.get(row.user_id), row.email, passwordHash, row.role,
    row.is_verified === "True", false, false, "CURRENT_TIMESTAMP", "CURRENT_TIMESTAMP",
  ]);
  users.push(["demo-admin", "admin@example.com", passwordHash, "ADMIN", true, false, false, "CURRENT_TIMESTAMP", "CURRENT_TIMESTAMP"]);

  // Render CURRENT_TIMESTAMP as SQL rather than a quoted string.
  const currentTimeRows = (rows) => rows.map((row) => row.map((value) => value === "CURRENT_TIMESTAMP" ? { __sql: "CURRENT_TIMESTAMP" } : value));
  const insertWithExpressions = (table, columns, rows) => {
    const values = rows.map((row) => `  (${row.map((value) => value && value.__sql ? value.__sql : value === "CURRENT_TIMESTAMP" ? value : sql(value)).join(", ")})`).join(",\n");
    return rows.length ? `INSERT INTO "${table}" (${columns.map((column) => `"${column}"`).join(", ")})\nVALUES\n${values};\n` : "";
  };

  const userProfiles = stakeholders.map((row) => [
    profileIds.get(row.user_id), userIds.get(row.user_id), row.full_name, row.bio || null,
    row.department === "N/A" ? null : row.department, null, null, null, null,
    row.mentorship_role || null, row.availability || null, row.is_public === "True",
    "CURRENT_TIMESTAMP", "CURRENT_TIMESTAMP",
  ]);
  userProfiles.push(["demo-admin-profile", "demo-admin", "Platform Admin", null, "Administration", null, null, null, null, null, null, false, "CURRENT_TIMESTAMP", "CURRENT_TIMESTAMP"]);

  const profileSkills = stakeholders.flatMap((row) => row.skills.split(";").filter(Boolean).map((name) => [profileIds.get(row.user_id), skillIds.get(name)]));
  const profileInterests = stakeholders.flatMap((row) => row.interests.split(";").filter(Boolean).map((name) => [profileIds.get(row.user_id), interestIds.get(name)]));
  const mentorshipRequests = [];
  const connectionRequests = [];
  const feedback = [];

  for (const row of interactions) {
    const sender = profiles.get(row.requester_id);
    const recipient = profiles.get(row.recipient_id);
    const mentorship = row.request_type === "MENTORSHIP";
    const roleFit = ["MENTEE", "BOTH"].includes(sender.mentorshipRole) && ["MENTOR", "BOTH"].includes(recipient.mentorshipRole);
    const features = {
      skillOverlap: jaccard(sender.skills, recipient.skills),
      interestOverlap: jaccard(sender.interests, recipient.interests),
      sameDepartment: sender.department !== "N/A" && recipient.department !== "N/A" && sender.department.toLowerCase() === recipient.department.toLowerCase() ? 1 : 0,
      mentorshipRoleFit: mentorship && roleFit ? 1 : 0,
      sharedNetwork: 0,
      isMentorshipRequest: mentorship ? 1 : 0,
      semanticProfileOverlap: profileSemanticSimilarity(sender, recipient),
      ...availabilityPairFeatures(sender.availability, recipient.availability),
    };
    const requestId = `demo-${mentorship ? "mentorship" : "connection"}-${row.interaction_id}`;
    const common = [requestId, userIds.get(row.requester_id), userIds.get(row.recipient_id), row.status, JSON.stringify(features), "CURRENT_TIMESTAMP", "CURRENT_TIMESTAMP"];
    if (mentorship) mentorshipRequests.push([requestId, common[1], common[2], null, common[3], common[4], common[5], common[6]]);
    else connectionRequests.push(common);
    if (row.rating) feedback.push([
      `demo-feedback-${row.interaction_id}`, userIds.get(row.requester_id), null,
      mentorship ? requestId : null, mentorship ? null : requestId, Number(row.rating), null,
      null, "CURRENT_TIMESTAMP",
    ]);
  }

  const parts = [
    `-- TEST DATABASE ONLY: synthetic sample accounts and interactions for development/Preview demos.\n-- Do not run this file against Production or any database containing real member records.\n-- The guard below refuses to run if the app's User table already exists.\n-- Seeded addresses use example.com and are not real Gmail/KQ identities.\n-- Test login: admin@example.com / Test1234! (all sample accounts share this test password).\n-- isDemo is FALSE so the current app can display and score these records; isolation of this database is essential.\n\nBEGIN;\n\nDO $$\nBEGIN\n  IF to_regclass('public."User"') IS NOT NULL THEN\n    RAISE EXCEPTION 'Refusing to install demo dataset: public.User already exists. Use a new, empty test database.';\n  END IF;\nEND $$;\n\n`,
    schemaSql,
    "\n-- Synthetic stakeholder accounts and profiles\n",
    insertWithExpressions("User", ["id", "email", "passwordHash", "role", "isVerified", "isSuspended", "isDemo", "createdAt", "updatedAt"], currentTimeRows(users)),
    insertWithExpressions("Profile", ["id", "userId", "fullName", "bio", "department", "professionalBackground", "trainingHistory", "careerGoals", "mentorshipNeeds", "mentorshipRole", "availability", "isPublic", "createdAt", "updatedAt"], currentTimeRows(userProfiles)),
    insert("Skill", ["id", "name"], skills.map((name) => [skillIds.get(name), name])),
    insert("Interest", ["id", "name"], interests.map((name) => [interestIds.get(name), name])),
    insert("ProfileSkill", ["profileId", "skillId"], profileSkills),
    insert("ProfileInterest", ["profileId", "interestId"], profileInterests),
    "\n-- Synthetic request outcomes used by the recommender / training demonstrations\n",
    insertWithExpressions("MentorshipRequest", ["id", "senderId", "receiverId", "message", "status", "modelFeatures", "createdAt", "updatedAt"], mentorshipRequests.map((row) => [row[0], row[1], row[2], row[3], row[4], { __sql: `${sql(row[5])}::jsonb` }, row[6], row[7]])),
    insertWithExpressions("ConnectionRequest", ["id", "senderId", "receiverId", "status", "modelFeatures", "createdAt", "updatedAt"], connectionRequests.map((row) => [row[0], row[1], row[2], row[3], { __sql: `${sql(row[4])}::jsonb` }, row[5], row[6]])),
    insertWithExpressions("Feedback", ["id", "userId", "recommendationId", "mentorshipRequestId", "connectionRequestId", "rating", "comment", "modelFeatures", "createdAt"], feedback.map((row) => [row[0], row[1], row[2], row[3], row[4], row[5], row[6], row[7], row[8]])),
    "\nCOMMIT;\n",
  ];

  const outputPath = path.join(__dirname, "demo-test-database.sql");
  fs.writeFileSync(outputPath, parts.join("\n"), "utf8");
  const dataOnlyGuard = `-- TEST DATABASE ONLY: run only after confirming this is your isolated, empty test database.\n-- Requires the Prisma schema to already exist. Refuses to import into non-empty tables.\n-- Synthetic addresses use example.com; these are not real Gmail/KQ identities.\n-- Test login: admin@example.com / Test1234! (all sample accounts share this test password).\n-- isDemo is FALSE so the current app can display and score these records; database isolation is essential.\n\nBEGIN;\n\nDO $$\nDECLARE\n  table_name TEXT;\n  table_has_rows BOOLEAN;\n  required_tables TEXT[] := ARRAY['User', 'Profile', 'Skill', 'Interest', 'ProfileSkill', 'ProfileInterest', 'MentorshipRequest', 'ConnectionRequest', 'Feedback'];\nBEGIN\n  FOREACH table_name IN ARRAY required_tables LOOP\n    IF to_regclass(format('public.%I', table_name)) IS NULL THEN\n      RAISE EXCEPTION 'Required table public.% is missing. Apply the project schema to this test database first.', table_name;\n    END IF;\n    EXECUTE format('SELECT EXISTS (SELECT 1 FROM public.%I LIMIT 1)', table_name) INTO table_has_rows;\n    IF table_has_rows THEN\n      RAISE EXCEPTION 'Refusing demo import: public.% already contains rows. Use a separate empty test database.', table_name;\n    END IF;\n  END LOOP;\nEND $$;\n\n`;
  const seedStatements = parts.slice(2).join("\n");
  const dataOnlyPath = path.join(__dirname, "demo-test-data-only.sql");
  fs.writeFileSync(dataOnlyPath, `${dataOnlyGuard}${seedStatements}`, "utf8");
  const resetTables = [
    "AdminAction", "AuthSession", "ConnectionRequest", "Conversation", "Event",
    "EventParticipant", "Feedback", "FlightReconnect", "Interest", "MentorshipRequest",
    "Message", "MLModelArtifact", "Notification", "Opportunity", "Profile",
    "ProfileInterest", "ProfileSkill", "Recommendation", "Skill", "User",
    "VerificationToken", "playing_with_neon", "_prisma_migrations",
  ];
  const resetSql = `-- DESTRUCTIVE TEST-DATABASE RESET. Run only on the isolated Neon test database.\n-- This script proceeds only if it finds exactly 103 users and every email is @example.com.\n-- Synthetic records remain @example.com; they are not real Google accounts.\n-- Test login after import: admin@example.com / Test1234!\n\nBEGIN;\n\nDO $$\nDECLARE\n  user_count BIGINT;\n  non_demo_count BIGINT;\nBEGIN\n  IF to_regclass('public."User"') IS NULL THEN\n    RAISE EXCEPTION 'Expected the existing test database public.User table; reset cancelled.';\n  END IF;\n  SELECT COUNT(*), COUNT(*) FILTER (WHERE lower(split_part("email", '@', 2)) <> 'example.com')\n    INTO user_count, non_demo_count\n    FROM public."User";\n  IF user_count <> 103 OR non_demo_count <> 0 THEN\n    RAISE EXCEPTION 'Reset cancelled: expected exactly 103 @example.com users; found % users, including % non-example.com addresses.', user_count, non_demo_count;\n  END IF;\nEND $$;\n\n${resetTables.map((table) => `DROP TABLE IF EXISTS public."${table}" CASCADE;`).join("\n")}\n\nDROP TYPE IF EXISTS public."UserRole";\nDROP TYPE IF EXISTS public."RequestStatus";\nDROP TYPE IF EXISTS public."MentorshipRole";\nDROP TYPE IF EXISTS public."MLModelType";\n\n`;
  const resetPath = path.join(__dirname, "demo-test-reset-current-db.sql");
  fs.writeFileSync(resetPath, `${resetSql}${schemaSql}\n${seedStatements}`, "utf8");
  console.log(`Created ${path.relative(root, outputPath)}`);
  console.log(`Created ${path.relative(root, dataOnlyPath)} for a schema-ready, empty test database.`);
  console.log(`Created ${path.relative(root, resetPath)}; destructive reset requires exactly 103 @example.com accounts.`);
  console.log(`${stakeholders.length} synthetic members + 1 test admin; ${skills.length} skills; ${interests.length} interests; ${profileSkills.length} skill links; ${profileInterests.length} interest links; ${mentorshipRequests.length} mentorship requests; ${connectionRequests.length} connection requests; ${feedback.length} feedback records.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
