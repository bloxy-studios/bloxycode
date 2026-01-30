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

// 3. Update README.md
const readmePath = "README.md"
let readme = await Bun.file(readmePath).text()

// Update badge
// [![Version](https://img.shields.io/badge/Version-1.0.1-blue?style=for-the-badge)]
const versionBadgeRegex = /!\[Version\]\(https:\/\/img\.shields\.io\/badge\/Version-([0-9.]+)-blue\?style=for-the-badge\)/
readme = readme.replace(versionBadgeRegex, `![Version](https://img.shields.io/badge/Version-${newVersion}-blue?style=for-the-badge)`)

// Add Changelog entry
const date = new Date().toISOString().split("T")[0]
const changelogHeader = "## Changelog\n\n"
const newEntry = `### ${newVersion} - ${date}\n- ${message}\n\n`

if (readme.includes(changelogHeader)) {
  readme = readme.replace(changelogHeader, changelogHeader + newEntry)
} else {
  // If no changelog section, append it (or find a good place)
  // Look for License section to insert before
  if (readme.includes("## License")) {
    readme = readme.replace("## License", `${changelogHeader}${newEntry}## License`)
  }
}

await Bun.file(readmePath).write(readme)

// 4. Git Commit and Tag
console.log("Committing and tagging...")
try {
  await $`git add package.json README.md`
  await $`git commit -m "chore: release v${newVersion}"`
  await $`git tag v${newVersion}`
  
  console.log(`\nSuccess! Version bumped to ${newVersion}.`)
  console.log(`Run 'git push && git push --tags' to trigger the release workflow.`)
} catch (error) {
  console.error("Git operations failed:", error)
  process.exit(1)
}
