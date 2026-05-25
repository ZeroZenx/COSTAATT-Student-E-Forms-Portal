import fs from "fs/promises";
import path from "path";

const nextDir = path.join(process.cwd(), ".next");

await fs.rm(nextDir, { recursive: true, force: true });
console.log("Cleaned .next build output.");
