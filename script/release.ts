#!/usr/bin/env bun
import { $ } from "bun"
import pkg from "../package.json"

/**
 * BloxyCode Release Script
 *
 * Usage:
 *   bun script/release.ts -m "Your release message"
 *   bun script/release.ts --minor -m "New feature description"
 *   bun script/release.ts --major -m "Breaking change description"
 *
 * Options:
 *   --patch (default)  Bump patch version (1.0.0 -> 1.0.1)
 *   --minor            Bump minor version (1.0.0 -> 1.1.0)
 *   --major            Bump major version (1.0.0 -> 2.0.0)
 *   --fixed (default)  Mark as bug fix
 *   --added            Mark as new feature
 *   --changed          Mark as change/improvement
 *   -m "message"       Release message (required)
 *   --dry-run          Preview changes without committing
 *
 * This script automatically:
 *   1. Bumps version in package.json
 *   2. Updates CHANGELOG.md
 *   3. Updates RELEASES.md
 *   4. Updates README.md badge
 *   5. Commits and tags
 *   6. Pushes to remote
 *   7. Creates GitHub Release
 *   8. Triggers NPM publish workflow
 */

// Parse args
const args = process.argv.slice(2)
const dryRun = args.includes("--dry-run")
const type = args.includes("--minor") ? "minor" : args.includes("--major") ? "major" : "patch"
const messageIndex = args.indexOf("-m")
const message = messageIndex !== -1 ? args[messageIndex + 1] : ""

if (!message) {
  console.error("❌ Error: Release message required. Use -m \"Your message\"")
  console.error("\nUsage: bun script/release.ts -m \"Fixed something important\"")
  console.error("       bun script/release.ts --minor -m \"Added new feature\"")
  process.exit(1)
}

// Parse category (--fixed, --added, --changed)
const category = args.includes("--added") ? "Added" : args.includes("--changed") ? "Changed" : "Fixed"

// 1. Bump version
const [major, minor, patch] = pkg.version.split(".").map(Number)
let newVersion = ""

if (type === "major") {
  newVersion = `${major + 1}.0.0`
} else if (type === "minor") {
  newVersion = `${major}.${minor + 1}.0`
} else {
  newVersion = `${major}.${minor}.${patch + 1}`
}

const date = new Date().toISOString().split("T")[0]

console.log(`\n🚀 BloxyCode Release Script`)
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
console.log(`📦 Version: ${pkg.version} → ${newVersion}`)
console.log(`📝 Category: ${category}`)
console.log(`💬 Message: ${message}`)
console.log(`📅 Date: ${date}`)
if (dryRun) console.log(`⚠️  DRY RUN - No changes will be made`)
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)

if (dryRun) {
  console.log("Would update: package.json, CHANGELOG.md, RELEASES.md, README.md")
  console.log("Would commit, tag, push, and create GitHub release")
  process.exit(0)
}

// 2. Update package.json
console.log("📝 Updating package.json...")
pkg.version = newVersion
if (pkg.optionalDependencies) {
  const deps = pkg.optionalDependencies as Record<string, string>
  for (const key of Object.keys(deps)) {
    deps[key] = newVersion
  }
}
await Bun.file("package.json").write(JSON.stringify(pkg, null, 2) + "\n")

// 3. Update CHANGELOG.md
console.log("📝 Updating CHANGELOG.md...")
const changelogPath = "CHANGELOG.md"
let changelog = await Bun.file(changelogPath).text()
const firstVersionRegex = /## \[[\d.]+\] - \d{4}-\d{2}-\d{2}/
const changelogEntry = `## [${newVersion}] - ${date}\n\n### ${category}\n- ${message}\n\n`
if (firstVersionRegex.test(changelog)) {
  changelog = changelog.replace(firstVersionRegex, changelogEntry + "$&")
} else {
  const headerEnd = changelog.indexOf("\n\n") + 2
  changelog = changelog.slice(0, headerEnd) + changelogEntry + changelog.slice(headerEnd)
}
await Bun.file(changelogPath).write(changelog)

// 4. Update RELEASES.md
console.log("📝 Updating RELEASES.md...")
const releasesPath = "RELEASES.md"
let releases = await Bun.file(releasesPath).text()
const releasesEntry = `## [${newVersion}] - ${date}\n\n### ${category}\n- ${message}\n\n`
const releasesHeaderEnd = releases.indexOf("\n\n") + 2
releases = releases.slice(0, releasesHeaderEnd) + releasesEntry + releases.slice(releasesHeaderEnd)
await Bun.file(releasesPath).write(releases)

// 5. Update README.md
console.log("📝 Updating README.md...")
const readmePath = "README.md"
let readme = await Bun.file(readmePath).text()
const versionBadgeRegex = /!\[Version\]\(https:\/\/img\.shields\.io\/badge\/Version-([0-9.]+)-blue\?style=for-the-badge\)/
readme = readme.replace(versionBadgeRegex, `![Version](https://img.shields.io/badge/Version-${newVersion}-blue?style=for-the-badge)`)
const changelogHeader = "## Changelog\n\n"
const newEntry = `### ${newVersion} - ${date}\n- ${message}\n\n`
if (readme.includes(changelogHeader)) {
  readme = readme.replace(changelogHeader, changelogHeader + newEntry)
} else if (readme.includes("## License")) {
  readme = readme.replace("## License", `${changelogHeader}${newEntry}## License`)
}
await Bun.file(readmePath).write(readme)

// 6. Git Commit and Tag
console.log("\n📦 Committing and tagging...")
try {
  await $`git add .`
  await $`git commit -m "chore: release v${newVersion}"`
  await $`git tag v${newVersion}`
  console.log("   ✓ Committed and tagged")
} catch (error) {
  console.error("❌ Git operations failed:", error)
  process.exit(1)
}

// 7. Push to remote
console.log("\n🚀 Pushing to remote...")
try {
  await $`git push origin dev`
  await $`git push origin v${newVersion}`
  console.log("   ✓ Pushed to origin")
} catch (error) {
  console.error("❌ Push failed:", error)
  process.exit(1)
}

// 8. Create GitHub Release
console.log("\n📋 Creating GitHub Release...")
const releaseNotes = `### ${category}\n- ${message}`
try {
  await $`gh release create v${newVersion} --title "v${newVersion}" --notes ${releaseNotes}`
  console.log("   ✓ GitHub Release created")
} catch (error) {
  console.error("⚠️  GitHub Release creation failed (may need to create manually):", error)
}

// Done!
console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Release v${newVersion} complete!

📦 NPM:    npm install -g @bloxystudios/bloxycode@${newVersion}
🔗 GitHub: https://github.com/bloxy-studios/bloxycode/releases/tag/v${newVersion}

The publish workflow should now be running automatically.
Check status: gh run list --repo bloxy-studios/bloxycode --limit 3
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`)
