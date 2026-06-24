// ─────────────────────────────────────────────────────────────
// Pakistan Territories Seed Script
// Run: node seedTerritories.js
// Ye script poore Pakistan ki territory hierarchy add kar dega
// ─────────────────────────────────────────────────────────────

import mongoose from "mongoose";
import dotenv from "dotenv";
import Territory from "./models/Territory.js";
import Company from "./models/Company.js";

dotenv.config();

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("MongoDB connected");

  // Pehle company dhundo
  const company = await Company.findOne();
  if (!company) {
    console.error("No company found in database. Create a company first.");
    process.exit(1);
  }
  console.log(`Using company: ${company.name}`);

  const cid = company._id;

  // Purani territories mat delete karo — sirf nayi add karo
  // Agar fresh start chahiye to neeche wali line uncomment karo:
  // await Territory.deleteMany({ company: cid });

  // ── Helper ───────────────────────────────────────────────
  const create = async (name, type, parentId = null) => {
    const existing = await Territory.findOne({ company: cid, name, type });
    if (existing) {
      console.log(`  Already exists: ${name}`);
      return existing;
    }
    const t = await Territory.create({
      company: cid,
      name,
      type,
      parent: parentId,
      isActive: true,
    });
    console.log(`  Created [${type}]: ${name}`);
    return t;
  };

  console.log("\n── Provinces (Regions) ──────────────────────────");
  const punjab      = await create("Punjab",              "region");
  const sindh       = await create("Sindh",               "region");
  const kpk         = await create("Khyber Pakhtunkhwa",  "region");
  const balochistan = await create("Balochistan",          "region");
  const gb          = await create("Gilgit-Baltistan",     "region");
  const ajk         = await create("Azad Jammu & Kashmir", "region");
  const islamabad   = await create("Islamabad Capital Territory", "region");

  // ── PUNJAB Cities ────────────────────────────────────────
  console.log("\n── Punjab Cities ────────────────────────────────");
  const lahore      = await create("Lahore",       "city", punjab._id);
  const faisalabad  = await create("Faisalabad",   "city", punjab._id);
  const rawalpindi  = await create("Rawalpindi",   "city", punjab._id);
  const multan      = await create("Multan",       "city", punjab._id);
  const gujranwala  = await create("Gujranwala",   "city", punjab._id);
  const sialkot     = await create("Sialkot",      "city", punjab._id);
  const bahawalpur  = await create("Bahawalpur",   "city", punjab._id);
  const sargodha    = await create("Sargodha",     "city", punjab._id);
  const sheikhupura = await create("Sheikhupura",  "city", punjab._id);
  const jhang       = await create("Jhang",        "city", punjab._id);
  const rahim_yar   = await create("Rahim Yar Khan","city", punjab._id);
  const gujrat      = await create("Gujrat",       "city", punjab._id);
  const kasur       = await create("Kasur",        "city", punjab._id);
  const okara       = await create("Okara",        "city", punjab._id);
  const sahiwal     = await create("Sahiwal",      "city", punjab._id);

  // ── SINDH Cities ─────────────────────────────────────────
  console.log("\n── Sindh Cities ─────────────────────────────────");
  const karachi     = await create("Karachi",      "city", sindh._id);
  const hyderabad   = await create("Hyderabad",    "city", sindh._id);
  const sukkur      = await create("Sukkur",       "city", sindh._id);
  const larkana     = await create("Larkana",      "city", sindh._id);
  const nawabshah   = await create("Nawabshah",    "city", sindh._id);
  const mirpurkhas  = await create("Mirpur Khas",  "city", sindh._id);
  const thatta      = await create("Thatta",       "city", sindh._id);
  const shikarpur   = await create("Shikarpur",    "city", sindh._id);

  // ── KPK Cities ───────────────────────────────────────────
  console.log("\n── KPK Cities ───────────────────────────────────");
  const peshawar    = await create("Peshawar",     "city", kpk._id);
  const mardan      = await create("Mardan",       "city", kpk._id);
  const abbottabad  = await create("Abbottabad",   "city", kpk._id);
  const mingora     = await create("Mingora",      "city", kpk._id);
  const kohat       = await create("Kohat",        "city", kpk._id);
  const mansehra    = await create("Mansehra",     "city", kpk._id);
  const dera_ismail = await create("Dera Ismail Khan","city", kpk._id);

  // ── BALOCHISTAN Cities ───────────────────────────────────
  console.log("\n── Balochistan Cities ───────────────────────────");
  const quetta      = await create("Quetta",       "city", balochistan._id);
  const turbat      = await create("Turbat",       "city", balochistan._id);
  const khuzdar     = await create("Khuzdar",      "city", balochistan._id);
  const gwadar      = await create("Gwadar",       "city", balochistan._id);
  const hub         = await create("Hub",          "city", balochistan._id);
  const dera_murad  = await create("Dera Murad Jamali","city", balochistan._id);

  // ── ISLAMABAD ────────────────────────────────────────────
  console.log("\n── Islamabad ────────────────────────────────────");
  await create("Islamabad",    "city", islamabad._id);

  // ── GB Cities ────────────────────────────────────────────
  console.log("\n── Gilgit-Baltistan Cities ──────────────────────");
  await create("Gilgit",       "city", gb._id);
  await create("Skardu",       "city", gb._id);
  await create("Chilas",       "city", gb._id);

  // ── AJK Cities ───────────────────────────────────────────
  console.log("\n── AJK Cities ───────────────────────────────────");
  await create("Mirpur",       "city", ajk._id);
  await create("Muzaffarabad", "city", ajk._id);
  await create("Rawalakot",    "city", ajk._id);

  // ── LAHORE Zones ─────────────────────────────────────────
  console.log("\n── Lahore Zones ─────────────────────────────────");
  const lhe_north = await create("Lahore North", "zone", lahore._id);
  const lhe_south = await create("Lahore South", "zone", lahore._id);
  const lhe_east  = await create("Lahore East",  "zone", lahore._id);
  const lhe_west  = await create("Lahore West",  "zone", lahore._id);
  const lhe_central = await create("Lahore Central","zone", lahore._id);

  // ── KARACHI Zones ────────────────────────────────────────
  console.log("\n── Karachi Zones ────────────────────────────────");
  await create("Karachi East",    "zone", karachi._id);
  await create("Karachi West",    "zone", karachi._id);
  await create("Karachi Central", "zone", karachi._id);
  await create("Karachi South",   "zone", karachi._id);
  await create("Karachi North",   "zone", karachi._id);
  await create("Malir",           "zone", karachi._id);
  await create("Korangi",         "zone", karachi._id);

  // ── LAHORE North Routes ───────────────────────────────────
  console.log("\n── Lahore North Routes ──────────────────────────");
  await create("Gulberg Route",        "route", lhe_north._id);
  await create("Model Town Route",     "route", lhe_north._id);
  await create("Garden Town Route",    "route", lhe_north._id);
  await create("Johar Town Route",     "route", lhe_north._id);
  await create("DHA Phase 1-4 Route",  "route", lhe_north._id);

  // ── LAHORE South Routes ───────────────────────────────────
  console.log("\n── Lahore South Routes ──────────────────────────");
  await create("Ichhra Route",         "route", lhe_south._id);
  await create("Mozang Route",         "route", lhe_south._id);
  await create("Anarkali Route",       "route", lhe_south._id);
  await create("Township Route",       "route", lhe_south._id);

  console.log("\n✅ Pakistan territories seeded successfully!");
  console.log(`Total: ${await Territory.countDocuments({ company: cid })} territories`);

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
});