import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";

const rootDir = path.resolve(new URL("..", import.meta.url).pathname);
const sourceDir = path.join(rootDir, ".cache/custom-assets/files/s");
const targetDir = path.join(rootDir, "dist/site/s");

if (!existsSync(sourceDir)) {
  console.log(
    "No materialized custom assets found. Run pnpm materialize:custom-assets first.",
  );
  process.exit(0);
}

mkdirSync(path.dirname(targetDir), { recursive: true });
rmSync(targetDir, { recursive: true, force: true });
cpSync(sourceDir, targetDir, { recursive: true });

console.log(`Synced local custom font assets to ${targetDir}`);
