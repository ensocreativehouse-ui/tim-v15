import { getDb } from "./queries/connection";
import { users, sessions, outputs } from "./schema";

async function seed() {
  const db = getDb();
  console.log("[T.I.M.] Seeding database...");

  // Create a test admin user
  const [testUser] = await db.insert(users).values({
    unionId: "test-user-001",
    name: "Test Producer",
    email: "test@tim.ai",
    role: "user",
    tier: "pro",
    trialActive: true,
    onboarded: true,
    firstCreateVisit: false,
  }).$returningId();

  console.log(`[T.I.M.] Created test user: ${testUser.id}`);

  // Create test sessions
  const [session1] = await db.insert(sessions).values({
    userId: testUser.id,
    title: "SnowFlake Winter Track",
    mode: "TIM",
    currentLayer: 2,
  }).$returningId();

  const [session2] = await db.insert(sessions).values({
    userId: testUser.id,
    title: "Dark DnB Experiment",
    mode: "TIM",
    currentLayer: 1,
  }).$returningId();

  console.log(`[T.I.M.] Created test sessions`);

  // Create test outputs
  await db.insert(outputs).values({
    sessionId: session1.id,
    userId: testUser.id,
    layerNumber: 1,
    styleField: "hyper-realistic, gravelly raspy male, behind-the-beat storytelling, Wu Tang RZA boom bap, hard cracking snare + dusty kick, 93 BPM, dark minor, frost imagery, lo-fi grit",
    lyrics: "[Intro]\nYeah... SnowFlake in the building...\nFrost on the window, frost on the mic...\n\n[Verse 1]\nGlacier in my veins, polar in my vision\nIce crystals form on every decision\nRZA loop spinning, winter wind howling\n[End — hold for extend]",
    excludeField: "bright pop, tropical, happy major",
    weirdness: 48,
    styleAccuracy: 88,
    userSaved: true,
    rating: "up",
  });

  await db.insert(outputs).values({
    sessionId: session2.id,
    userId: testUser.id,
    layerNumber: 1,
    styleField: "hyper-realistic, deep menacing male, aggressive drill flow, UK drill meets dark trap, sliding 808 bass, sparse trap hats, cinematic minor key strings, 140 BPM",
    lyrics: "[Intro]\nDarkness creeping in...\n[Beat drops]\n\n[Verse 1]\nShadows moving in the dark\nHeartbeat syncs with the breakbeat\nSliding bass through concrete walls\n[End — hold for extend]",
    excludeField: "cheesy synths, four-on-the-floor, bright major",
    weirdness: 46,
    styleAccuracy: 88,
    userSaved: true,
  });

  await db.insert(outputs).values({
    sessionId: session1.id,
    userId: testUser.id,
    layerNumber: 2,
    styleField: "hyper-realistic, raspy male, storytelling continuation, same RZA loop, 93 BPM, winter atmosphere deepening, frost melting reveal",
    lyrics: "[Verse 2]\nFrost melts on the glass, truth comes clear\nEvery bar I drop freezes the atmosphere\nSnowFlake falling, no two alike\nMy story's unique, take it or hike\n[End — hold for extend]",
    excludeField: "happy, tropical, pop structure",
    weirdness: 50,
    styleAccuracy: 90,
    userSaved: true,
    rating: "up",
  });

  console.log(`[T.I.M.] Created test outputs`);
  console.log("[T.I.M.] Seed complete!");
}

seed().catch(console.error);
