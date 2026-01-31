#!/usr/bin/env bun
import { $ } from "bun"
import pkg from "../package.json"

/**
 * BloxyCode Release Script
 *
 * Usage:
 *   bun script/release.ts                    # Auto-generate release notes from git diff
 *   bun script/release.ts -m "Your message"  # Use custom message
 *   bun script/release.ts --minor            # Minor version bump
 *   bun script/release.ts --major            # Major version bump
 *
 * Options:
 *   --patch (default)  Bump patch version (1.0.0 -> 1.0.1)
 *   --minor            Bump minor version (1.0.0 -> 1.1.0)
 *   --major            Bump major version (1.0.0 -> 2.0.0)
 *   --fixed (default)  Mark as bug fix
 *   --added            Mark as new feature
 *   --changed          Mark as change/improvement
 *   -m "message"       Custom release message (optional - AI generates if not provided)
 *   --dry-run          Preview changes without committing
 *   --no-ai            Skip AI generation even if no message provided
 *
 * Environment:
 *   OPENROUTER_API_KEY  Required for AI-generated release notes
 *
 * This script automatically:
 *   1. Analyzes git diff and generates release notes (AI-powered)
 *   2. Bumps version in package.json
 *   3. Updates CHANGELOG.md, RELEASES.md, README.md
 *   4. Commits, tags, pushes, and creates GitHub Release
 */

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || ""

// Free models on OpenRouter (in order of preference)
const AI_MODELS = [
  "tngtech/deepseek-r1t2-chimera:free",
  "arcee-ai/trinity-large-preview:free",
  "z-ai/glm-4.5-air:free",
  "qwen/qwen3-coder:free"
]

// Parse args
const args = process.argv.slice(2)
const dryRun = args.includes("--dry-run")
const noAI = args.includes("--no-ai")
const type = args.includes("--minor") ? "minor" : args.includes("--major") ? "major" : "patch"
const messageIndex = args.indexOf("-m")
let message = messageIndex !== -1 ? args[messageIndex + 1] : ""

// Parse category (--fixed, --added, --changed)
let category = args.includes("--added") ? "Added" : args.includes("--changed") ? "Changed" : "Fixed"

/**
 * Generate release notes using AI (OpenRouter + Qwen)
 */
async function generateReleaseNotes(): Promise<{ message: string; category: string } | null> {
  if (!OPENROUTER_API_KEY) {
    console.log("⚠️  No OPENROUTER_API_KEY found. Skipping AI generation.")
    console.log("   Set it with: export OPENROUTER_API_KEY=sk-or-v1-...")
    return null
  }

  console.log("\n🤖 Generating release notes with AI...")

  // Get git diff for staged/committed changes
  let diff = ""
  try {
    // Get diff of staged changes or last commit
    diff = await $`git diff --cached --stat`.text()
    if (!diff.trim()) {
      diff = await $`git diff HEAD~1 --stat`.text()
    }
    if (!diff.trim()) {
      diff = await $`git status --short`.text()
    }

    // Get the actual code changes (limited)
    const codeDiff = await $`git diff --cached -U3`.text() || await $`git diff HEAD~1 -U3`.text()
    if (codeDiff) {
      // Limit to first 4000 chars to avoid token limits
      diff += "\n\nCode changes:\n" + codeDiff.slice(0, 4000)
    }
  } catch {
    console.log("   Could not get git diff")
    return null
  }

  if (!diff.trim()) {
    console.log("   No changes detected")
    return null
  }

  const prompt = `You are a release notes generator for a software project called BloxyCode (an AI coding CLI tool).

Based on the following git diff/changes, generate a concise release note.

RULES:
1. Be concise - one or two sentences max
2. Focus on what changed from the USER's perspective
3. Start with a verb (Fixed, Added, Improved, Updated, etc.)
4. Don't mention file names unless critical
5. Don't be overly technical

RESPOND WITH ONLY JSON in this exact format:
{"category": "Fixed|Added|Changed", "message": "Your release note here"}

GIT CHANGES:
${diff}

JSON RESPONSE:`

  // Try each model until one works
  for (const model of AI_MODELS) {
    try {
      console.log(`   Trying ${model.split("/")[1]?.split(":")[0] || model}...`)

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://github.com/bloxy-studios/bloxycode",
          "X-Title": "BloxyCode Release Script"
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: "user", content: prompt }],
          max_tokens: 200,
          temperature: 0.3
        })
      })

      if (!response.ok) {
        const error = await response.text()
        // If rate limited, try next model
        if (response.status === 429) {
          console.log(`   Rate limited, trying next model...`)
          continue
        }
        console.log(`   API error: ${response.status}`)
        continue
      }

      const data = await response.json() as {
        choices?: Array<{ message?: { content?: string } }>
      }
      const content = data.choices?.[0]?.message?.content?.trim() || ""

      // Parse JSON response
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as { category?: string; message?: string }
        if (parsed.message) {
          console.log(`   ✓ AI generated: "${parsed.message}"`)
          return {
            message: parsed.message,
            category: parsed.category || "Fixed"
          }
        }
      }

      // If we got a response but couldn't parse JSON, try to extract message
      if (content && content.length > 10) {
        console.log(`   ✓ AI generated: "${content.slice(0, 100)}..."`)
        return {
          message: content.slice(0, 200),
          category: "Fixed"
        }
      }
    } catch (error) {
      console.log(`   Model failed, trying next...`)
      continue
    }
  }

  console.log("   All models failed or rate limited")
  return null
}

// If no message provided, try AI generation
if (!message && !noAI) {
  const aiResult = await generateReleaseNotes()
  if (aiResult) {
    message = aiResult.message
    category = aiResult.category as "Fixed" | "Added" | "Changed"
  }
}

// Still no message? Require manual input
if (!message) {
  console.error("❌ Error: Release message required.")
  console.error("\nOptions:")
  console.error("  1. Provide message: bun script/release.ts -m \"Your message\"")
  console.error("  2. Set OPENROUTER_API_KEY for AI generation")
  console.error("  3. Get free API key at: https://openrouter.ai/settings/keys")
  process.exit(1)
}

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
