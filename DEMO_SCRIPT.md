# BloxyCode Demo Video Script
## Vibeathon Submission (3-5 minutes)

---

## Pre-Recording Checklist

### Setup
- [ ] Clean terminal with dark theme (for visibility)
- [ ] Font size increased (at least 16pt for readability)
- [ ] Create a demo project folder: `~/demo-project`
- [ ] Have a sample PRD.md ready (provided below)
- [ ] Configure BloxyCode with your API key
- [ ] Close unnecessary applications
- [ ] Screen recording software ready (OBS, QuickTime, or similar)

### Sample PRD.md for Demo
Create this file in your demo project:

```markdown
# Todo App PRD

## Tasks
- [ ] Create a basic Express.js server with TypeScript
- [ ] Add a GET /todos endpoint that returns a list of todos
- [ ] Add a POST /todos endpoint to create new todos
- [ ] Add basic input validation for the POST endpoint
```

---

## Video Script

### INTRO (0:00 - 0:30) — 30 seconds

**[SCREEN: BloxyCode logo or terminal with `bloxycode` command]**

**SAY:**
> "Hey everyone! I'm [Your Name], and this is BloxyCode — an AI-powered CLI tool that makes vibe coding actually autonomous.
>
> You know that feeling when you have a list of tasks and you just want the AI to handle them while you grab coffee? That's exactly what BloxyCode does with a feature called Bloxy.
>
> Let me show you how it works."

**DO:**
- Show the terminal
- Maybe show the GitHub repo briefly

---

### PROBLEM STATEMENT (0:30 - 1:00) — 30 seconds

**[SCREEN: Show a typical AI coding workflow - copy/paste between browser and IDE]**

**SAY:**
> "Here's the problem: Most AI coding tools require constant babysitting. You prompt, wait, copy, paste, fix errors, prompt again... it's exhausting.
>
> What if you could just write a PRD — a simple markdown file with checkboxes — and let the AI execute each task autonomously until everything is done?
>
> That's Bloxy mode."

**DO:**
- Optionally show a brief example of traditional workflow frustration
- Or just stay on terminal and gesture to the concept

---

### DEMO SETUP (1:00 - 1:30) — 30 seconds

**[SCREEN: Terminal in demo project directory]**

**SAY:**
> "Let me show you. I have a simple PRD here — it's just a markdown file with four tasks to build a basic Todo API."

**DO:**
1. `cd ~/demo-project`
2. `cat PRD.md` — show the file contents
3. Highlight that it's just markdown checkboxes

**SAY:**
> "Nothing fancy — just checkboxes. Each unchecked box is a task Bloxy will execute."

---

### BLOXY IN ACTION (1:30 - 3:30) — 2 minutes

**[SCREEN: Terminal running BloxyCode]**

**SAY:**
> "Now watch this. I'll start Bloxy mode with one command."

**DO:**
1. Run: `bloxycode`
2. Once in the TUI, type: `/bloxy PRD.md`
3. Press Enter

**SAY:**
> "Bloxy reads the PRD, parses each task, and starts executing them one by one.
>
> Watch — it's creating the Express server... now it's adding the GET endpoint...
>
> I'm not doing anything. Just watching. This is the magic of autonomous execution."

**DO:**
- Let it run through at least 2-3 tasks
- You can speed up the video slightly here if needed (1.5x) but keep audio normal
- Show the TUI status updating as tasks complete

**SAY (while it runs):**
> "Each task runs sequentially. If something fails, Bloxy retries automatically. When a task completes, it moves to the next one.
>
> The state is saved, so if I need to stop and resume later, it picks up right where it left off."

**DO:**
- When tasks complete, briefly show: `cat .bloxycode/bloxy-state.json` (optional)
- Or show the created files: `ls -la` then `cat src/index.ts` or similar

---

### SHOW THE RESULT (3:30 - 4:00) — 30 seconds

**[SCREEN: Show the generated code]**

**SAY:**
> "And just like that — we have a working Todo API. Let me show you what it created."

**DO:**
1. `cat src/index.ts` or whatever file was created
2. Optionally run `bun run dev` or `npm start` and hit the endpoint with curl
3. `curl http://localhost:3000/todos`

**SAY:**
> "Real, working code. Created autonomously from a simple PRD."

---

### KEY FEATURES HIGHLIGHT (4:00 - 4:30) — 30 seconds

**[SCREEN: Terminal or slides with bullet points]**

**SAY:**
> "What makes BloxyCode special for vibe coders:
>
> **One** — Autonomous execution. Write a PRD, run Bloxy, walk away.
>
> **Two** — Multi-provider support. Works with Claude, GPT-4, Gemini, and 15+ other models. If one hits rate limits, it automatically switches to another.
>
> **Three** — It's open source. Built on Bun, fully extensible with plugins and custom agents.
>
> This is vibe coding taken to its logical conclusion — you vibe, the AI codes."

---

### CALL TO ACTION (4:30 - 5:00) — 30 seconds

**[SCREEN: GitHub repo URL]**

**SAY:**
> "BloxyCode is open source and ready to use. Check it out on GitHub at github.com/bloxystudios/bloxycode.
>
> If you're tired of babysitting AI coding tools, give Bloxy mode a try. Write your PRD, start Bloxy, and let it cook.
>
> Thanks for watching, and happy vibe coding!"

**DO:**
- Show GitHub URL on screen
- Wave or smile at camera (if showing face)
- End screen with logo/URL

---

## Post-Recording

### Editing Tips
1. Trim any long pauses or loading times
2. Add subtle background music (lo-fi, low volume)
3. Add text overlays for key commands:
   - `/bloxy PRD.md`
   - `github.com/bloxystudios/bloxycode`
4. Speed up long AI generation sections (1.5x-2x) but keep audio at normal speed
5. Target final length: 3:30 - 4:30 (sweet spot)

### Thumbnail Suggestions
- Terminal screenshot with Bloxy running
- Text: "Autonomous AI Coding"
- BloxyCode logo

---

## Alternative Quick Demo (If Short on Time)

If you need a faster 2-minute version:

1. **Intro (15 sec)**: "BloxyCode - autonomous AI coding from PRDs"
2. **Show PRD (15 sec)**: `cat PRD.md`
3. **Run Bloxy (60 sec)**: `/bloxy PRD.md` - let it execute
4. **Show Result (15 sec)**: Show generated code
5. **CTA (15 sec)**: GitHub link

---

## Key Phrases to Emphasize

These align with Vibeathon judging criteria:

| Criteria | What to Say |
|----------|-------------|
| **Usefulness (40%)** | "Write a PRD, run Bloxy, walk away" |
| **Impact (25%)** | "No more babysitting AI tools" |
| **Execution (20%)** | "Open source, built on Bun, 15+ providers" |
| **Innovation (15%)** | "Autonomous task execution from markdown" |

---

## Backup: If Something Goes Wrong

1. **Bloxy errors out**: Show retry logic, explain it handles failures gracefully
2. **API rate limit**: Show it switching providers (this is actually a feature!)
3. **Slow generation**: Speed up in post, or cut and show final result

Good luck with the recording! 🎬
