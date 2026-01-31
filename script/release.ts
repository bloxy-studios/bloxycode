#!/usr/bin/env bun
import { $ } from "bun"
import fs from "fs"
import path from "path"
import pkg from "../package.json"

// Parse args
const args = process.argv.slice(2)
const type = args.includes("--minor") ? "minor" : args.includes("--major") ? "major" : "patch"
const messageIndex = args.indexOf("-m")
const message = messageIndex !== -1 ? args[messageIndex + 1] : "Update version"

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

console.log(`Bumping version: ${pkg.version} -> ${newVersion}`)

// 2. Update package.json
pkg.version = newVersion

// Update optionalDependencies versions too
if (pkg.optionalDependencies) {
  const deps = pkg.optionalDependencies as Record<string, string>
  for (const key of Object.keys(deps)) {
    deps[key] = newVersion
  }
}

await Bun.file("package.json").write(JSON.stringify(pkg, null, 2) + "\n")

// Get current date
const date = new Date().toISOString().split("T")[0]

// 3. Update CHANGELOG.md
const changelogPath = "CHANGELOG.md"
let changelog = await Bun.file(changelogPath).text()

// Find the first version entry and insert before it
const firstVersionRegex = /## \[[\d.]+\] - \d{4}-\d{2}-\d{2}/
const changelogEntry = `## [${newVersion}] - ${date}

### ${category}
- ${message}

`

if (firstVersionRegex.test(changelog)) {
  changelog = changelog.replace(firstVersionRegex, changelogEntry + "$&")
} else {
  // If no existing entries, add after header
  const headerEnd = changelog.indexOf("\n\n") + 2
  changelog = changelog.slice(0, headerEnd) + changelogEntry + changelog.slice(headerEnd)
}

await Bun.file(changelogPath).write(changelog)
console.log("Updated CHANGELOG.md")

// 4. Update RELEASES.md
const releasesPath = "RELEASES.md"
let releases = await Bun.file(releasesPath).text()

const releasesEntry = `## [${newVersion}] - ${date}

### ${category}
- ${message}

`

// Insert after "# Release Notes" header
const releasesHeaderEnd = releases.indexOf("\n\n") + 2
releases = releases.slice(0, releasesHeaderEnd) + releasesEntry + releases.slice(releasesHeaderEnd)

await Bun.file(releasesPath).write(releases)
console.log("Updated RELEASES.md")

// 5. Update README.md
const readmePath = "README.md"
let readme = await Bun.file(readmePath).text()

// Update badge
const versionBadgeRegex = /!\[Version\]\(https:\/\/img\.shields\.io\/badge\/Version-([0-9.]+)-blue\?style=for-the-badge\)/
readme = readme.replace(versionBadgeRegex, `![Version](https://img.shields.io/badge/Version-${newVersion}-blue?style=for-the-badge)`)

// Add Changelog entry in README
const changelogHeader = "## Changelog\n\n"
const newEntry = `### ${newVersion} - ${date}\n- ${message}\n\n`

if (readme.includes(changelogHeader)) {
  readme = readme.replace(changelogHeader, changelogHeader + newEntry)
} else {
  if (readme.includes("## License")) {
    readme = readme.replace("## License", `${changelogHeader}${newEntry}## License`)
  }
}

await Bun.file(readmePath).write(readme)
console.log("Updated README.md")

// 6. Git Commit and Tag
console.log("\nCommitting and tagging...")
try {
  await $`git add .`
  await $`git commit -m "chore: release v${newVersion}"`
  await $`git tag v${newVersion}`

  console.log(`\n✅ Success! Version bumped to ${newVersion}.`)
  console.log(`\nNext steps:`)
  console.log(`  git push && git push --tags`)
  console.log(`\nOr to push and trigger release workflow:`)
  console.log(`  git push origin dev --tags`)
} catch (error) {
  console.error("Git operations failed:", error)
  process.exit(1)
}
