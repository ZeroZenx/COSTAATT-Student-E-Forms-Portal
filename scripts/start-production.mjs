import { spawnSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

if (process.env.NODE_ENV !== "production") {
  console.error("Production start refused: NODE_ENV must be production.");
  process.exit(1);
}

const root = path.dirname(fileURLToPath(import.meta.url));
const validation = spawnSync(process.execPath, [path.join(root, "validate-env.mjs"), "--production"], { stdio: "inherit" });
if (validation.status !== 0) process.exit(validation.status || 1);

const nextCli = path.join(process.cwd(), "node_modules", "next", "dist", "bin", "next");
const child = spawnSync(process.execPath, [nextCli, "start", ...process.argv.slice(2)], { stdio: "inherit" });
process.exit(child.status ?? 1);
