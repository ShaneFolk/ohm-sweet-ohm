// Fills the database with demo data. Run with: npm run seed
// Safe to re-run: it wipes the demo tables first.
import { seedDatabase } from "../lib/seed";

seedDatabase()
  .then((counts) => console.log("Seeded!", counts))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
