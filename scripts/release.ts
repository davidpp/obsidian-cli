#!/usr/bin/env bun

/**
 * Release script for obsidian-cli
 *
 * Usage:
 *   bun run release patch   # 0.1.0 -> 0.1.1
 *   bun run release minor   # 0.1.0 -> 0.2.0
 *   bun run release major   # 0.1.0 -> 1.0.0
 */

import { $ } from "bun";

const bumpType = process.argv[2] as "patch" | "minor" | "major";

if (!["patch", "minor", "major"].includes(bumpType)) {
  console.error("Usage: bun run release <patch|minor|major>");
  process.exit(1);
}

// Read current version
const pkg = await Bun.file("package.json").json();
const [major, minor, patch] = pkg.version.split(".").map(Number);

// Calculate new version
let newVersion: string;
switch (bumpType) {
  case "major":
    newVersion = `${major + 1}.0.0`;
    break;
  case "minor":
    newVersion = `${major}.${minor + 1}.0`;
    break;
  case "patch":
    newVersion = `${major}.${minor}.${patch + 1}`;
    break;
}

console.log(`\n📦 Releasing v${newVersion}\n`);

// Check for uncommitted changes
const status = await $`git status --porcelain`.text();
if (status.trim()) {
  console.error("❌ Uncommitted changes detected. Please commit or stash them first.");
  process.exit(1);
}

// Update package.json
pkg.version = newVersion;
await Bun.write("package.json", JSON.stringify(pkg, null, 2) + "\n");
console.log(`✅ Updated package.json to v${newVersion}`);

// Update CHANGELOG.md - replace [Unreleased] with new version
const changelog = await Bun.file("CHANGELOG.md").text();
const today = new Date().toISOString().split("T")[0];
const updatedChangelog = changelog.replace(
  "## [Unreleased]",
  `## [Unreleased]\n\n## [${newVersion}] - ${today}`
);
await Bun.write("CHANGELOG.md", updatedChangelog);
console.log(`✅ Updated CHANGELOG.md`);

// Build to verify
console.log(`\n🔨 Building...`);
await $`bun run build`;
console.log(`✅ Build successful`);

// Commit and tag
console.log(`\n📝 Committing...`);
await $`git add package.json CHANGELOG.md`;
await $`git commit -m "Release v${newVersion}"`;
await $`git tag -a v${newVersion} -m "Release v${newVersion}"`;
console.log(`✅ Created tag v${newVersion}`);

// Push
console.log(`\n🚀 Pushing to origin...`);
await $`git push && git push --tags`;

console.log(`\n✨ Released v${newVersion}!`);
console.log(`\n📋 GitHub Actions will now build and create the release.`);
console.log(`   Watch progress at: https://github.com/davidpp/obsidian-cli/actions`);
