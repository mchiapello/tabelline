# MathQuest — Research, Design & Implementation Plan

> A professional, evidence-based educational math webapp for students ages 6–12.
> Built on the existing `tabelline` Flask app. Math-only for Phase 1.

---

## Table of Contents

1. [Competitor Analysis](#1-competitor-analysis)
2. [Learning Science Research](#2-learning-science-research)
3. [Multiplication Tables Challenges & Games](#3-multiplication-tables-challenges--games)
4. [Rewards & Motivation Systems](#4-rewards--motivation-systems)
5. [Game Journey Structure](#5-game-journey-structure)
6. [UI/UX Design Guidelines](#6-uiux-design-guidelines)
7. [Technical Architecture](#7-technical-architecture)
8. [Implementation Roadmap](#8-implementation-roadmap)

---

## 1. Competitor Analysis

### Summary Table

| Platform | Core Focus | Adaptive? | Multiplayer? | Progression Depth | Cost | Ages |
|---|---|---|---|---|---|---|
| **Times Tables Rock Stars** | ×tables only | Yes (heatmap) | Yes (live arena) | Medium (rock star) | Subscription | 6–14 |
| **Prodigy Math** | Broad K–8 math | Yes | No (PvE battles) | Deep RPG world | Free / Premium | 6–14 |
| **Arcademics** | Broad K–8 | No | Yes (live racing) | Low (badges) | Free / Plus | 5–12 |
| **Multiplication.com** | ×tables only | No | No | None | Free | 6–12 |
| **Khan Academy Kids** | Broad early math | Yes | No | Medium (learning path) | Free | 2–8 |
| **Mathletics** | Broad K–12 | Yes (diagnostic) | Yes (live global) | Medium (avatar/certs) | $99.99/yr | 5–16 |
| **Math Playground** | Broad pre-K–6 | No | No | None | Free / sub | 4–12 |
| **SplashLearn** | Broad pre-K–5 | Yes | No | Medium | Free / Premium | 4–10 |

---

### 1.1 Times Tables Rock Stars (TTRS)

**What it is:** The most focused, research-backed app dedicated specifically to times tables fluency. Hugely popular in UK schools. Stated goal: answer any fact up to 12×12 in under 3 seconds.

**Key mechanics:**
- **Multiple modes:** Garage (learning), Studio (recording), Soundcheck (assessment), Gig (challenge), Jamming (free practice), Arena (live multiplayer)
- **Per-fact heatmap:** Tracks accuracy per individual question (e.g., 7×8 in red = needs work)
- **Speed as core metric:** "Coins per minute" becomes your rock star rating
- **Rock star avatar:** Buy costumes, instruments, backgrounds with earned coins
- **Leaderboards:** Class, school, and global rankings
- **Timer anxiety option:** Can hide the timer for students with math anxiety

**Progression:** Earn coins → buy avatar items → move from "Wannabe" to "Rock Hero"

**What works:** Heatmap, avatar investment, live multiplayer create genuine engagement. Teacher integration (assign table sets) means it fits school use.

**What doesn't:** Heavy speed emphasis can cause anxiety. UK-subscription model ($15/mo) limits access. Aesthetic may not appeal to all kids.

**Lesson for us:** Adopt heatmap per-fact tracking + themed avatar progression. Timer must always be optional.

---

### 1.2 Prodigy Math

**What it is:** Full RPG educational platform. Kids create wizard characters, battle monsters, and explore worlds — all by solving math questions.

**Key mechanics:**
- **RPG world:** Character creation, pets, mounts, wizard battles, world exploration
- **Adaptive algorithm:** Adjusts difficulty in real-time; backtracks to prerequisite skills when needed
- **Spiral review:** New content delivered while essential missed concepts get reinforced
- **Curriculum-aligned:** Grades 1–8 across all topics (not just multiplication)
- **Parent/teacher dashboards:** Detailed reports on progress, weak areas, time spent

**Progression:** Defeat monsters → earn gold → buy gear/pets → unlock world zones

**What works:** The RPG narrative keeps kids engaged for the story, not just the math. Adaptive difficulty is genuinely sophisticated. Free base tier removes access barrier.

**What doesn't:** Increased premium gating means the best content is paywalled. Competitive reviewers note it's "no longer the clear winner it once was." Breadth means less depth per topic.

**Lesson for us:** Light narrative world (one planet per table) dramatically increases engagement without requiring full RPG complexity. Keep core learning free — never paywall practice.

---

### 1.3 Arcademics

**What it is:** Free multiplayer educational game platform for K–8, famous for real-time racing games.

**Key mechanics:**
- **Racing metaphor:** Your car/character moves faster when you answer correctly and quickly
- **Live multiplayer:** Race against classmates or global players in real time
- **Grand Prix Multiplication:** Dedicated racing game for ×tables
- **No login required:** Instant play, no friction
- **Performance stats:** Accuracy + speed per session

**What works:** The racing mechanic is universally understood and immediately exciting. Live competition is a powerful motivator. Zero-friction access means kids use it spontaneously.

**What doesn't:** No persistent progression means kids don't return to grow — they come for the race and leave. No adaptive difficulty. Limited depth beyond the racing mechanic.

**Lesson for us:** Include a timed racing/speed-run mode as one of several game types. Make it a special challenge, not the only experience.

---

### 1.4 Multiplication.com

**What it is:** Free browser platform with dozens of games targeting multiplication facts.

**Key mechanics:**
- Dozens of distinct mini-games (soccer, skateboarding, painting) each wrapping multiplication practice
- No account required — instant play
- Mix of pure drill (speed) and strategy games (4-in-a-row)

**What works:** Huge game variety keeps practice fresh. Zero friction. Completely free.

**What doesn't:** Flash-era aesthetic. No progression system. No analytics. No adaptive difficulty. No reason to return beyond enjoying the games themselves.

**Lesson for us:** Variety of game types for each table (not just one mechanic). But pair it with progression so kids have a reason to return.

---

### 1.5 Khan Academy Kids

**What it is:** Free, comprehensive early learning app backed by strong pedagogical research.

**Key mechanics:**
- **Learning Path:** Cycles through math, literacy, and social-emotional content adaptively
- **Characters** (Kodi, Peck, Clip) guide learning with voice narration
- **Short activity bursts:** 3–5 minutes per session
- **Mastery-based unlocks:** Progress when demonstrated competent, not just when time is spent

**What works:** Evidence-based. Free. Genuinely adaptive. Designed for very young children (large targets, minimal text, audio instructions). Parent app shows detailed progress.

**What doesn't:** Strongest for ages 2–8. Not specifically focused on multiplication tables. Gentle UX may feel "babyish" to 9–12 year olds.

**Lesson for us:** Short daily sessions (5–10 min). Mastery-based rewards, not time-based. Always show improvement in session summaries.

---

### 1.6 Mathletics

**What it is:** Established school/home platform (used by 3M+ students worldwide). Ages 5–16.

**Key mechanics:**
- **1,000+ activities:** Quizzes, games, multimedia across K–12 curriculum
- **Live Mathletics:** Real-time global arithmetic competition
- **Diagnostic assessments:** Identify strengths and weaknesses, then personalize path
- **Certificates:** Weekly/monthly/yearly gold/silver/bronze awarded at milestones
- **Mathlete avatar:** Points earned per activity → avatar upgrades

**What works:** Structured, curriculum-aligned, teacher-friendly. Certificates are motivating for achievement-oriented students. Global competition provides excitement.

**What doesn't:** $99.99/year is a barrier. Competitive elements can demotivate lower-performing students. Can feel more like "school work" than a game.

**Lesson for us:** Certificate-style achievements (printable/shareable) are motivating. Group/self competition > pure head-to-head ranking.

---

## 2. Learning Science Research

### 2.1 Spaced Repetition — The Most Evidence-Backed Technique

The single most effective technique for memorizing multiplication facts, supported by hundreds of cognitive psychology studies.

**Core finding (Rea & Modigliani, 1985):** Spaced practice with Grade 3 students produced retention nearly twice as high as massed practice for multiplication facts. The "spacing effect" is amplified with gradually increasing intervals between sessions.

**How it works:**
1. Show a fact (7×8)
2. Student attempts recall
3. Correct → schedule again later (longer interval)
4. Wrong → schedule again soon (short interval)
5. Intervals grow as mastery increases

**SM-2 Algorithm** (already implemented in `srs.py` for Italian verbs):
- Each fact has an Easiness Factor (EF, starts at 2.5)
- Quality score 0–5 after each answer
- EF adjusted based on quality; interval calculated from EF and repetition count
- **This exact code can be reused for math facts**

**Design implication:** Build a fact queue that schedules re-review based on SM-2. Facts answered incorrectly return within minutes; mastered facts return in days.

---

### 2.2 Retrieval Practice (The Testing Effect)

**Core finding:** The act of attempting to recall an answer — even when the student draws a blank — is itself a powerful memory-building mechanism. This is stronger than re-reading, re-watching, or passive review.

**Mechanism:** Retrieval practice forces the brain to reconstruct knowledge, strengthening the neural pathway. Immediate feedback (seeing the correct answer after attempting) followed by another retrieval attempt dramatically improves retention.

**Design implication:**
- Always show the question first, require an answer attempt, then reveal correct answer
- Never show the answer without requiring an attempt
- Immediate feedback after each response is essential

---

### 2.3 Interleaving vs. Blocked Practice

This is one of the most important — and counter-intuitive — findings in educational psychology.

**Blocked practice:** Study 3× table, then 4× table, then 5× table separately. Feels easier in the moment, better performance immediately after. Kids (and parents) prefer it.

**Interleaved practice:** Mix problems from different tables together. Feels harder in the moment, lower immediate performance. But dramatically better long-term retention.

**Evidence (Rohrer et al., published via ERIC):**
- After 24 hours: interleaved 77% vs. blocked 38% test performance
- After 1 month (study of 800 seventh-graders): interleaved 61% vs. blocked 38%

**Why it works:** Interleaving forces students to discriminate between problem types, combining spacing and retrieval effects simultaneously.

**Design implication:**
- **Explorer mode (learning new table):** Use blocked practice for initial introduction
- **All other modes:** Use interleaved practice mixing all learned tables
- Communicate this to students/parents: "Mixing is harder but you learn more!"

---

### 2.4 Adaptive Difficulty — Zone of Proximal Flow

Two complementary theories converge here:

**Flow State (Csikszentmihalyi):** State of full immersion when challenge is just above current skill level.
- Too easy → boredom
- Too hard → frustration
- The sweet spot → peak engagement AND peak learning

**Zone of Proximal Development (Vygotsky):** The range of tasks a child can do with slight support — the optimal learning zone.

**Research-backed adaptive rules:**
- 3 consecutive correct answers → increase difficulty slightly
- 2 consecutive wrong → decrease difficulty slightly
- Never make large jumps (skip from ×3 to ×9 in one step)
- Adjust which facts appear in the queue, not just which table is practiced

**Computer-Assisted Learning (CAL) research:** Interactive digital tools improve math test scores by 24.2% vs. 8.3% for traditional methods. Adaptive CAL shows even better results — boosting performance, self-confidence, motivation, and engagement simultaneously.

---

### 2.5 Session Length and Frequency

**Finding:** Daily short practice (5–10 minutes) dramatically outperforms weekly longer sessions for fact memorization.

**Why:** Memory consolidation happens during sleep. Spacing practice across days allows sleep-based consolidation between sessions. A child who practices 7 minutes per day for 7 days retains far more than one who practices 49 minutes in a single session.

**Duolingo data:** Users who practice daily retain content 5× better than weekly users. Daily streak mechanics drive this behavior effectively.

**Design implication:**
- Design sessions for 5–10 minutes maximum (20 questions or 5 minutes)
- Daily streak mechanics (current streak, longest streak, streak shield)
- Push notification reminder if the app has native capability

---

### 2.6 Interference Effects in Multiplication

**Key finding (PMC, 2022):** Facts that are numerically close or follow similar patterns create interference — they compete in memory and confuse each other.

**High-interference pairs:** 6×7, 7×8, 6×8 — these are the most commonly confused facts, because students apply rules from similar facts incorrectly.

**Low-similarity facts** are learned faster and retained better.

**Design implication:**
- Don't group high-interference pairs in the same practice session during initial learning
- In Explorer mode (introduction), introduce potentially-confusing pairs with explicit contrast ("7×8=56, not 54 like 6×9")
- The SRS system naturally handles this over time (wrong answers resurface sooner)

---

## 3. Multiplication Tables Challenges & Games

### 3.1 Why Multiplication Tables Are Hard

- 144 unique facts (1–12 × 1–12), or 55 unique if removing commutatives
- Cannot be reasoned out quickly — must be memorized for fluency
- Interference effects make similar-sounding facts confuse each other
- Math anxiety is real and impedes retrieval even of known facts
- Fluency (fast recall) vs. understanding (conceptual) require different practice types

### 3.2 Most Effective Game Mechanics for ×Tables

Based on research and competitor analysis, these mechanics produce the best results:

| Mechanic | What it does | Evidence base |
|---|---|---|
| **Timed response** | Builds retrieval speed (fluency) | TTRS speed metrics |
| **Heatmap visualization** | Shows students exactly which facts are weak | TTRS, research on metacognition |
| **Boss Battle (mastery gate)** | Must achieve 80%+ before advancing | Mastery learning research |
| **Daily Mission (interleaved)** | Mixes all learned tables; SM-2 scheduled | Interleaving research |
| **Speed Run (60s burst)** | Competitive against self/others; personal best | Arcademics success |
| **Explorer (blocked intro)** | Visual pattern discovery for new table | Initial learning research |
| **Galaxy Cup (relaxed free play)** | Low-stakes practice after mastery | Intrinsic motivation research |

### 3.3 Table Introduction Order (Science-Based)

Not alphabetical or numerical! Based on ease, pattern clarity, and interference minimization:

| Order | Table | Why first? |
|---|---|---|
| 1 | ×2 | Doubling — most intuitive, fewest interference issues |
| 2 | ×5 | Strong skip-counting pattern (ends in 0 or 5) |
| 3 | ×10 | Trivial pattern (add zero) — quick win builds confidence |
| 4 | ×1 | Almost trivial — "anything times 1 is itself" |
| 5 | ×3 | Simple skip-count, low interference |
| 6 | ×4 | Double-double (4×n = 2×(2×n)) — relatable strategy |
| 7 | ×11 | Pattern-heavy (up to ×9: 11, 22, 33…) — memorable |
| 8 | ×6 | Moderate difficulty, builds on previous tables |
| 9 | ×9 | Finger trick + digit-sum trick make it learnable |
| 10 | ×7 | Highest interference, most isolated — learn last |
| 11 | ×8 | Second hardest — multiple confusable facts (6×8, 7×8) |
| 12 | ×12 | Extension beyond core — optional/bonus planet |

### 3.4 The "Hard Core" Facts

Studies consistently show these facts are the last to be mastered and most often wrong in adults too:
- **6×7 = 42** (often confused with 6×8=48)
- **7×8 = 56** (most frequently wrong fact globally)
- **6×8 = 48** (high interference with 6×7)
- **8×9 = 72** (confused with 8×8=64)
- **7×9 = 63** (confused with 7×8=56)

These deserve extra attention in the SRS queue and explicit "Boss Challenge" treatment.

---

## 4. Rewards & Motivation Systems

### 4.1 Core Reward Mechanics

#### Stars (per-question feedback)
- 1–3 stars per question based on speed + accuracy
- Correct + fast = ⭐⭐⭐
- Correct + slow = ⭐⭐
- Correct after hint = ⭐
- Wrong = 0 stars but no negative feedback (gentle shake)
- Universally understood. Creates graded achievement beyond binary correct/wrong.

#### Coins (currency)
- Earned by answering correctly (more coins for harder facts)
- Spent in avatar shop (costumes, accessories, backgrounds)
- Token economy: accumulation toward larger reward sustains engagement longer
- Research shows children with ADHD respond especially well to immediate, accumulating rewards

#### XP + Player Level
- XP earned per session (scales with difficulty and accuracy)
- Level up every 100 XP
- Level shown on profile and leaderboard
- Satisfies long-term growth visualization

#### Daily Streaks
- Increment when daily Mission is completed
- Duolingo data: users with 7-day streak are 3.6× more likely to stay engaged long-term
- **Streak Shield** (optional purchase with coins): protects one missed day without breaking streak
- Show longest streak alongside current — celebrates past achievement even if streak resets

#### Badges / Achievements
Research shows both "achievement badges" (skill) and "participation badges" (effort) serve different motivational needs. Include both.

**Proposed 15+ Badges:**

| Badge | Trigger | Type |
|---|---|---|
| First Contact | Answer first question | Participation |
| Explorer | Unlock first planet | Achievement |
| Speed Demon | 60s run with 100% accuracy | Skill |
| Streak Starter | 3-day streak | Participation |
| Week Warrior | 7-day streak | Achievement |
| Month Master | 30-day streak | Achievement |
| Master of ×2 | Beat Boss Battle for ×2 | Skill |
| Master of ×5 | Beat Boss Battle for ×5 | Skill |
| *(one per table)* | *(nine more)* | Skill |
| Galaxy Explorer | All planets unlocked | Achievement |
| Perfect Mission | 20/20 in daily practice | Skill |
| Comeback Kid | 3 wrong → 3 right in a row | Participation |
| Speed Record | Beat personal best speed run | Achievement |
| Night Owl | Practice after 8pm | Participation |
| Early Bird | Practice before 8am | Participation |

#### Planet Unlocks
- Each planet = one multiplication table
- Unlock by completing Boss Battle (≥80% score on 20 questions)
- The galaxy map shows locked planets ahead — visual pull toward the next goal
- **Goal-gradient effect:** acceleration as students approach unlock threshold

### 4.2 Avatar Customization

**Why it matters:** Avatar investment creates emotional attachment to the app. Children are more motivated when they can express identity.

**Examples:**
- Astronaut helmet styles (basic → space ranger → galaxy commander)
- Suit colors and patterns
- Rocket ship designs
- Profile background (nebulas, galaxies, planets)
- Badge display on profile

**Pricing (in coins):** Accessible within 2–3 sessions of play. No real-money purchases. All items earnable through gameplay.

### 4.3 What NOT to Do (Research Warnings)

**Overjustification Effect:** Over-reliance on extrinsic rewards can undermine intrinsic motivation. Children who learn to expect rewards for activities they would otherwise enjoy may lose interest when rewards stop.

**Best practice:** Use rewards to get children started, then shift emphasis to mastery, competence, and improvement satisfaction.

- ✅ "You answered all 7× questions correctly!" (mastery-based)
- ❌ "You spent 10 minutes in the app!" (time-based)

**Leaderboard risks:** Pure head-to-head rankings demotivate students at the bottom. Use:
- Personal bests ("beat your own record")
- Class leaderboards only (not global by default)
- Group competition (teams vs. teams) rather than individual vs. individual

---

## 5. Game Journey Structure

### 5.1 World Theme: "Math Galaxy"

A young astronaut travels through a galaxy where each planet = one multiplication table. Unlock planets by mastering each table. The goal: become a **Galaxy Math Champion**.

```
🚀 Launch Pad (Tutorial)
    ↓
🌍 Planet 2 (×2 Table)
    ↓
🌕 Planet 5 (×5 Table)
    ↓
☀️  Planet 10 (×10 Table)
    ↓
🌱 Planet 1 (×1 Table)
    ↓
🌀 Planet 3 (×3 Table)
    ↓
🔴 Planet 4 (×4 Table)
    ↓
⭐  Planet 11 (×11 Table)
    ↓
🟣 Planet 6 (×6 Table)
    ↓
🟠 Planet 9 (×9 Table)
    ↓
⚡  Planet 7 (×7 Table)   ← hardest
    ↓
🔵 Planet 8 (×8 Table)   ← hardest
    ↓
🌟 Planet 12 (×12 Bonus) ← optional
    ↓
🏆 Galaxy Champion!
```

### 5.2 Five Game Modes

#### Mode 1: Explorer (Learning)
- **Purpose:** Introduce a new table to a student who hasn't seen it before
- **Mechanics:** Blocked practice (one table at a time), no timer, visual pattern display, unlimited hints
- **Example:** "Let's discover the ×3 table! 3×1=3, 3×2=6, 3×3=9… see the pattern?"
- **Progression gate:** None — free to explore any unlocked table
- **Ideal session:** 10–15 questions on the new table

#### Mode 2: Daily Mission (Core Loop)
- **Purpose:** Daily practice using SM-2 spaced repetition across all learned tables
- **Mechanics:** Interleaved questions from all unlocked tables, adaptive difficulty, 20 questions or 5 minutes
- **SM-2 queue:** Surfaces weak facts (recent errors) more frequently; mastered facts return after days
- **Completion reward:** Streak +1, coins, XP
- **Ideal session:** 5–8 minutes

#### Mode 3: Speed Run (Challenge)
- **Purpose:** Fluency building — how many can you answer in 60 seconds?
- **Mechanics:** Timed burst, all learned tables interleaved, accuracy + speed both scored
- **Personal best:** Always show vs. previous record
- **Unlock:** Unlocked after first planet
- **Ideal session:** 60 seconds + 30s summary

#### Mode 4: Boss Battle (Mastery Gate)
- **Purpose:** Prove mastery of one table to unlock the next planet
- **Mechanics:** 20 questions from the target table only (blocked), must score ≥80% (16/20) to pass
- **On fail:** Gentle "almost there! practice more and try again" — not a punishment
- **On pass:** Planet unlocked, special badge earned, coins + XP reward
- **Unlock:** Available for current table after 3+ Explorer sessions

#### Mode 5: Galaxy Cup (Free Play)
- **Purpose:** Low-stakes relaxed practice after planets are unlocked
- **Mechanics:** Mix of all tables, no timer requirement, no progression pressure
- **Purpose:** Intrinsic enjoyment — play without progress pressure
- **Ideal session:** Any length

### 5.3 Guest Mode vs. Registered Mode

#### Guest (no login)
- Access to all 5 game modes
- Progress stored in `localStorage` (device-specific, persists across visits)
- No badges, no leaderboard, no cross-device sync
- Prompted to register when they unlock a planet: "Save your progress! You've unlocked Planet ×3 — create a free account so you never lose it."

#### Registered User
- Full progress tracking server-side (SRS queue, coins, badges, streaks, heatmap)
- Cross-device sync
- Badge display
- Class/group leaderboard (if teacher assigns code)
- Optional: teacher/parent can see progress dashboard

### 5.4 Session Flow

```
[Home / Galaxy Map]
       |
       |-- [Daily Mission button: "Today's Quest 🚀"]
       |         → 20 questions (SM-2 adaptive)
       |         → Summary screen (score, XP gained, streak)
       |         → Badge check (award if milestone hit)
       |
       |-- [Planet card: click to select]
       |         → [Explorer] [Boss Battle] [Speed Run]
       |
       |-- [Profile / Avatar]
                 → Heatmap, badges, streak, coins
                 → Avatar shop
```

---

## 6. UI/UX Design Guidelines

### 6.1 Visual Theme

**Aesthetic:** Deep space / galaxy. Modern flat design with subtle glow effects. Feels like a premium game, not a school worksheet.

**Color Palette:**
```
Background:     #0a0a1a  (deep space)
Surface:        #1a1a2e  (dark navy)
Card/Panel:     #16213e  (navy)
Primary action: #FFD700  (gold — XP, stars, rewards)
Secondary:      #00D4FF  (cyan — correct answers, progress)
Danger/wrong:   #FF6B6B  (coral — gentle, not harsh red)
Success:        #4CAF50  (green — completion, streaks)
Text primary:   #FFFFFF
Text secondary: #B0B8D0
Accent purple:  #7B2FBE  (planet borders, special items)
```

**Typography:**
- **Headings:** Fredoka One or Nunito ExtraBold — rounded, friendly, high readability
- **Body/UI:** Nunito Regular — excellent legibility for children
- **Numbers:** Nunito SemiBold, large size (min 32px for question display)
- Load via Google Fonts (already used in project)

**Animations:**
- Correct answer: sparkle burst + coin increment counter animation
- Wrong answer: gentle horizontal shake, no harsh sound
- Level up: full-screen particle celebration (< 2 seconds, then returns to game)
- Badge earned: badge flips in from bottom with glow
- Planet unlock: Boss Battle completion → planet "lights up" on galaxy map

### 6.2 Touch Targets & Accessibility

- All interactive elements ≥75px tall (mobile children)
- Number pad buttons ≥80×80px with 8px gaps between
- Minimum 16px font; 24px+ for primary content; 32px+ for question numbers
- Timer always hideable (toggle in settings)
- High contrast mode option
- Colorblind-safe: use icons alongside color for state (never color alone)
- Option to adjust font size (at least 3 preset sizes)

### 6.3 Mobile-First Layout

- Primary breakpoints: 320px (small phone), 768px (tablet), 1024px+ (desktop)
- Full-screen game mode on mobile (hide browser chrome)
- Bottom navigation on mobile (thumbs can reach)
- Galaxy map uses pinch-to-zoom on mobile
- Number pad always on-screen during questions (no keyboard popup issues)

### 6.4 Feedback Principles

| Event | Feedback |
|---|---|
| Correct answer | ✅ Green flash, sparkle, positive sound, "⭐⭐⭐ Amazing!" |
| Correct (slow) | ✅ Green flash, "⭐⭐ Correct!" |
| Wrong answer | ❌ Gentle shake, coral flash, correct answer shown: "7×8 = **56**" |
| Level up | 🎉 Full celebration animation, "Level X!" banner |
| Badge earned | 🏅 Badge slides in with glow, "New Badge: Speed Demon!" |
| Planet unlocked | 🌟 Galaxy map animates, planet lights up, fireworks |
| Streak milestone | 🔥 Streak counter pulses, "7-day streak!" toast |
| Session complete | 📊 Summary card: score, XP, improvement vs. last session |

**Key principle:** Wrong answers are "not yet" — never "failure." The correct answer is shown immediately. No harsh sounds, no red X icons, no shame.

### 6.5 Navigation Structure

```
/ (Galaxy Map / Home)
├── /play/mission      (Daily Mission game)
├── /play/explorer/:table  (Explorer mode)
├── /play/boss/:table      (Boss Battle)
├── /play/speedrun         (Speed Run)
├── /play/cup              (Galaxy Cup)
├── /profile               (Heatmap, badges, stats)
├── /shop                  (Avatar items)
├── /auth/login
└── /auth/register
```

Max 2 taps/clicks from home to any game. No deep menu trees.

---

## 7. Technical Architecture

### 7.1 Design Principle: Central Node + Independent Modules

The app is structured as a **central core** with **independent service modules** plugged in via API tokens. Each module is self-contained — it owns its routes, DB tables, and business logic. The core knows nothing about module internals; modules know nothing about core internals. Communication goes through a defined `RewardEvent` contract (see §7.8).

```
                    ┌─────────────────────────────┐
                    │         CORE APP             │
                    │  • Auth (JWT + bcrypt)       │
                    │  • Module Registry           │
                    │  • Token Validator           │
                    │  • Galaxy Map (shell UI)     │
                    │  • Profile / Wallet / Streak │
                    │  • RewardEvent processor     │
                    └──────────┬──────────────────┘
                               │ checks module_tokens at startup
               ┌───────────────┼──────────────────────────────┐
               │               │                              │
    ┌──────────▼──────┐ ┌──────▼───────────┐  ┌─────────────▼──────┐
    │ math.            │ │ math.            │  │ italiano.verbi     │
    │ moltiplicazioni  │ │ addizioni        │  │ (Phase 2 — locked  │
    │ MODULE           │ │ MODULE           │  │  until token added)│
    │                  │ │                  │  └────────────────────┘
    │ /api/v1/modules/ │ │ /api/v1/modules/ │
    │  moltiplicazioni │ │  addizioni       │    ┌──────────────────────┐
    └──────────────────┘ └──────────────────┘    │ future.module        │
                                                 │ (not yet built —     │
                                                 │  plug in later)      │
                                                 └──────────────────────┘
```

**How a new module is added:**
1. Create `/modules/<module_id>/` folder with Blueprint, manifest, models
2. Insert a token row in `module_tokens` DB table (or set `built_in=True`)
3. **Restart the app** — Flask Blueprints must be registered at startup; they cannot be added at runtime
4. Frontend calls `GET /api/v1/modules/active` → new module appears in galaxy map

> **Important constraint:** Module activation always requires an app restart. The token insertion step marks a module as `pending_restart=True` in the DB. The frontend shows a "will be available after next update" state until the server restarts and the Blueprint is registered. This is an intentional design trade-off — it keeps the architecture simple and avoids the complexity of a dynamic plugin loader.

---

### 7.2 Tech Stack

**Backend:** Flask (existing) — keep what's already working
- `PyJWT` + `bcrypt` — auth already implemented in `app.py`; keep JWT approach, do NOT replace with Flask-Login
- `Flask-WTF` — CSRF protection on HTML form submissions only (not needed for JWT API calls)
- SQLite with WAL mode for dev (`PRAGMA journal_mode=WAL` enables concurrent reads); PostgreSQL for production
- Use Flask's `g` object for per-request DB connection (one connection per request, not one per function call)

**Frontend:** Vanilla JS + CSS (no framework)
- CSS custom properties for theming
- Web Animations API for smooth animations
- `localStorage` for guest progress (with migration path to server on register — see §7.9)
- `Lottie-web` (lightweight CDN) for celebration animations

**Deployment:** Render.com (free tier: Flask + PostgreSQL)

---

### 7.3 Module System

#### Module Manifest (`manifest.json`)

Each module ships a manifest that describes itself to the core. The `ui_script` field tells `game.html` which JS file to dynamically import for that module's game UI. The `free` field determines whether the module is accessible to all users without a personal token.

```json
{
  "id": "math.moltiplicazioni",
  "name": "Tabelline",
  "version": "1.0.0",
  "description": "Multiplication tables — Galaxy Journey",
  "icon": "🪐",
  "planet_order": 1,
  "built_in": true,
  "free": true,
  "api_prefix": "/api/v1/modules/moltiplicazioni",
  "ui_script": "/static/modules/moltiplicazioni/game.js",
  "dependencies": []
}
```

#### Three-Layer Activation Model

Module access is controlled at three independent levels:

```
Layer 1 — Global (operator):       module_tokens table
  Is the Blueprint registered in the app?
  Requires: server restart
  Scope: platform-wide (everyone or no one)

Layer 2 — Organisation (school):   org_module_access table
  Has the user's school/group purchased this module?
  Requires: org admin redeems a token → instant, no restart
  Scope: all current and future members of the organisation

Layer 3 — Per-user (individual):   user_module_access table
  Has this specific user purchased or been granted this module?
  Requires: user redeems a personal token → instant, no restart
  Scope: that user only
```

A module is accessible when Layer 1 is satisfied AND at least one of the following is true:
- `free: true` in the manifest (auto-granted to everyone)
- User's organisation has access (Layer 2)
- User has personal access (Layer 3)

```python
def user_can_access_module(user_id, module_id):
    if not registry.is_registered(module_id):      # Layer 1
        return False
    if manifest(module_id).free:
        return True
    if db.exists("org_module_access",              # Layer 2
                 org_id=IN(user_orgs(user_id)),
                 module_id=module_id):
        return True
    if db.exists("user_module_access",             # Layer 3
                 user_id=user_id, module_id=module_id):
        return True
    return False
```

#### Real-world scenarios

| Scenario | Layer used | Token issued to | Who benefits |
|---|---|---|---|
| Free built-in module (moltiplicazioni) | Layer 1 + `free:true` | Nobody | All users automatically |
| School buys moltiplicazioni for all students | Layer 2 | School admin | Every student in the school |
| Student buys addizioni for herself | Layer 3 | Individual student | That student only |
| Teacher grants a module to one student | Layer 3 | That student | That student only |
| New student joins the school | — | Nobody | Inherits all org's Layer 2 grants |

#### Layer 1 — Operator Activation (restart required)

```
1. App starts → registry.load_active_modules(app)
2. Reads module_tokens: built_in=True OR is_active=True AND pending_restart=False
3. Blueprints registered; failed imports logged as 'broken'
4. GET /api/v1/modules/health → registered / broken / pending_restart
```

#### Layer 2 — Organisation Activation (instant, no restart)

```
1. Admin generates an org token:
   POST /api/v1/admin/access-tokens/generate
   Body: { "module_id": "math.moltiplicazioni", "org_id": 42, "expires_at": "..." }
   → stores token_hash; returns plaintext ONCE

2. School admin redeems it:
   POST /api/v1/org/<org_id>/modules/activate
   Body: { "token": "MOLT-XXXX-YYYY-ZZZZ" }
   → validates token, inserts into org_module_access
   → all org members instantly gain access (no restart)

3. New student joins org → access inherited automatically via org membership
```

#### Layer 3 — Per-User Activation (instant, no restart)

```
1. Admin generates a personal token:
   POST /api/v1/admin/access-tokens/generate
   Body: { "module_id": "math.addizioni", "user_email": "...", "expires_at": "..." }
   → stores token_hash; returns plaintext ONCE

2. User redeems it:
   POST /api/v1/user/modules/activate
   Body: { "token": "ADDI-XXXX-YYYY-ZZZZ" }
   → validates token, inserts into user_module_access
   → user instantly gains access (no restart)
   → token marked used (single-use by default)
```

#### `GET /api/v1/modules/active` is user-aware (three-layer check)

Returns the intersection: Blueprint registered AND (free OR org access OR personal access).
Guest users see only `free: true` modules.

#### Module API Convention (versioned)

All API endpoints use the `/api/v1/` prefix for forward compatibility.

Module endpoints:
```
GET  /api/v1/modules/<module_id>/manifest       → module metadata
GET  /api/v1/modules/<module_id>/session        → generate question session
POST /api/v1/modules/<module_id>/answer         → submit answer → returns RewardEvent
GET  /api/v1/modules/<module_id>/stats          → user stats / heatmap data
GET  /api/v1/modules/<module_id>/progress       → planet unlock status
POST /api/v1/modules/<module_id>/boss-battle    → submit boss battle result
```

Core endpoints:
```
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh                       → new access token
POST /api/v1/auth/logout

GET  /api/v1/modules/active                     → user-aware three-layer check
GET  /api/v1/modules/health                     → operator: registered/broken/pending
POST /api/v1/modules/activate                   → operator: global activation (pending restart)

GET  /api/v1/user/modules/active                → explicit per-user module list + grant source
POST /api/v1/user/modules/activate              → Layer 3: user redeems personal token
GET  /api/v1/user/profile
GET  /api/v1/user/badges

GET  /api/v1/org/<org_id>/modules/active        → modules accessible to the organisation
POST /api/v1/org/<org_id>/modules/activate      → Layer 2: org admin redeems org token
GET  /api/v1/org/<org_id>/members               → list org members
POST /api/v1/org/<org_id>/members               → add user to org

POST /api/v1/admin/access-tokens/generate       → issue token for user or org + module
GET  /api/v1/admin/access-tokens                → list all tokens + redemption status
POST /api/v1/admin/organisations                → create organisation
```

---

### 7.4 Database Schema

**Core tables** (always present, owned by core):

```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'student',      -- 'student' | 'teacher' | 'parent' | 'admin'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Refresh tokens (JWT access tokens are short-lived 1h; refresh tokens last 30d)
CREATE TABLE refresh_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    token_hash TEXT UNIQUE NOT NULL,  -- hash of the refresh token (never store raw)
    expires_at TIMESTAMP NOT NULL,
    revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE module_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token_key TEXT UNIQUE,            -- NULL if built_in
    module_id TEXT NOT NULL,          -- matches manifest "id"
    built_in BOOLEAN DEFAULT FALSE,
    pending_restart BOOLEAN DEFAULT FALSE,  -- activated but not yet live
    issued_to TEXT,
    expires_at TIMESTAMP,             -- NULL = never expires
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seeded at init_db() time (INSERT OR IGNORE):
-- INSERT OR IGNORE INTO module_tokens (module_id, built_in) VALUES
--   ('math.moltiplicazioni', TRUE),
--   ('math.addizioni', TRUE),
--   ('math.sottrazioni', TRUE);

CREATE TABLE user_wallet (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE REFERENCES users(id),
    coins INTEGER DEFAULT 0,
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1
);

CREATE TABLE user_streaks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE REFERENCES users(id),
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_practice_date DATE,
    streak_shields INTEGER DEFAULT 0
);

CREATE TABLE user_badges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    badge_id TEXT NOT NULL,           -- namespaced: "<module_id>:<slug>"
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, badge_id)
);

-- Personal access tokens issued by admin to individual users (Layer 2 activation)
CREATE TABLE user_access_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token_hash TEXT UNIQUE NOT NULL,  -- bcrypt hash of plaintext token (never stored raw)
    module_id TEXT NOT NULL,          -- which module this token unlocks
    issued_to_email TEXT,             -- who it was issued for (informational)
    issued_by INTEGER REFERENCES users(id),  -- admin who generated it
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,             -- NULL = never expires
    max_uses INTEGER DEFAULT 1,       -- 1 = single-use (default); NULL = unlimited
    use_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

-- Per-user module access grants (result of redeeming a user_access_token)
CREATE TABLE user_module_access (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    module_id TEXT NOT NULL,
    granted_by TEXT NOT NULL,         -- 'system' | 'token' | 'teacher' | 'admin'
    access_token_id INTEGER REFERENCES user_access_tokens(id),  -- NULL if granted by system
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,             -- NULL = permanent
    UNIQUE(user_id, module_id)
);

-- Auto-grant free modules to every user at registration:
-- INSERT INTO user_module_access (user_id, module_id, granted_by)
--   SELECT <new_user_id>, module_id, 'system'
--   FROM module_tokens WHERE built_in = TRUE
--   AND module_id IN (SELECT id FROM manifest WHERE free = TRUE);

-- Organisation layer (Layer 2)
CREATE TABLE organizations (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    name      TEXT NOT NULL,              -- "Scuola Elementare Roma"
    org_type  TEXT DEFAULT 'school',      -- 'school' | 'family' | 'district'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE organization_members (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    org_id    INTEGER REFERENCES organizations(id),
    user_id   INTEGER REFERENCES users(id),
    role      TEXT DEFAULT 'student',     -- 'student' | 'teacher' | 'admin'
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(org_id, user_id)
);

CREATE TABLE org_module_access (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    org_id          INTEGER REFERENCES organizations(id),
    module_id       TEXT NOT NULL,
    granted_by      TEXT DEFAULT 'purchase',  -- 'purchase' | 'admin'
    access_token_id INTEGER REFERENCES user_access_tokens(id),
    granted_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at      TIMESTAMP,            -- NULL = permanent
    UNIQUE(org_id, module_id)
);
```

**Module-owned tables** (each module creates its own in `init_db()`):

```sql
-- math.moltiplicazioni module
CREATE TABLE moltiplicazioni_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    table_number INTEGER NOT NULL,
    status TEXT DEFAULT 'locked',
    mastery_level REAL DEFAULT 0.0,
    total_attempts INTEGER DEFAULT 0,
    correct_attempts INTEGER DEFAULT 0,
    last_practiced TIMESTAMP,
    UNIQUE(user_id, table_number)
);

CREATE TABLE moltiplicazioni_srs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    multiplicand INTEGER NOT NULL,
    multiplier INTEGER NOT NULL,
    ef REAL DEFAULT 2.5,
    interval_days INTEGER DEFAULT 1,
    reps INTEGER DEFAULT 0,
    next_review TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_quality INTEGER DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- for concurrent session conflict detection
    UNIQUE(user_id, multiplicand, multiplier)
);
-- addizioni and sottrazioni follow the same pattern with their own prefixed tables
```

---

### 7.5 `srs.py` — Pure Algorithm, No DB Dependency

`srs.py` must be refactored to be a **pure algorithm library** with no database imports. Each module handles its own DB reads/writes; `srs.py` only computes the next interval.

```python
# srs.py — pure functions only, no imports from database.py

def update(ef: float, reps: int, quality: int) -> tuple[float, int, int]:
    """SM-2: returns (new_ef, new_interval_days, new_reps)"""
    if quality < 3:
        return ef, 1, 0  # reset
    new_ef = max(1.3, ef + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    if reps == 0:   interval = 1
    elif reps == 1: interval = 6
    else:           interval = round(reps * ef)  # previous interval * EF
    return new_ef, interval, reps + 1
```

Each module's `game_logic.py` reads the SRS row from its own table, calls `srs.update()`, and writes the result back. No shared DB access through `srs.py`.

> **Migration note:** The current `srs.py` imports `from database import get_connection` at line 19. This coupling must be removed before implementing the module system. The DB operations in `srs.py` move into each module's `models.py`.

---

### 7.6 File Structure

```
tabelline/
├── app.py                    ← REWRITE: app factory, module auto-discovery
├── database.py               ← MODIFY: core DB init + module_tokens seeding
├── srs.py                    ← REFACTOR: remove DB import, pure algorithm only
├── verbi_data.py             ← KEEP AT ROOT during Phase 1 (italiano_verbi module
│                                imports from here; move only when module is complete)
├── requirements.txt          ← UPDATE: PyJWT, bcrypt, flask-wtf (remove flask-login)
│
├── core/
│   ├── __init__.py
│   ├── auth.py               ← JWT helpers, @token_required, refresh token logic
│   ├── registry.py           ← module discovery, Blueprint loader, health checker
│   └── models.py             ← core DB tables (users, wallet, streaks, badges, tokens)
│
├── modules/
│   ├── math_moltiplicazioni/
│   │   ├── __init__.py       ← Blueprint definition
│   │   ├── api.py            ← /api/v1/modules/moltiplicazioni/* routes
│   │   ├── models.py         ← moltiplicazioni_progress, moltiplicazioni_srs
│   │   ├── game_logic.py     ← session generation, SRS calls, boss battle
│   │   ├── static/
│   │   │   └── game.js       ← module UI (loaded by game.html via ui_script)
│   │   └── manifest.json
│   ├── math_addizioni/       ← same pattern
│   ├── math_sottrazioni/     ← same pattern
│   └── italiano_verbi/       ← Phase 2; token-gated; verbi_data.py stays at root
│       ├── api.py
│       ├── models.py
│       └── manifest.json
│
├── static/
│   ├── css/style.css         ← REWRITE: space theme design system
│   └── js/
│       ├── core.js           ← module loader, active-module fetch, JWT refresh
│       ├── journey.js        ← galaxy map rendering
│       ├── srs_client.js     ← guest-mode SM-2 queue (localStorage)
│       └── auth.js           ← login/register/logout
│
└── templates/
    ├── base.html             ← nav, login state, JWT expiry handler
    ├── landing.html          ← galaxy map (reads /api/v1/modules/active)
    ├── game.html             ← universal shell: dynamically imports module's ui_script
    └── auth/
        ├── login.html
        └── register.html
```

---

### 7.7 App Factory (`app.py`)

```python
def create_app():
    app = Flask(__name__)
    app.config['SECRET_KEY'] = os.environ['SECRET_KEY']
    # 1. Init core DB (creates core tables + seeds module_tokens built-ins)
    with app.app_context():
        database.init_db()
    # 2. Init auth (JWT config)
    core.auth.init_app(app)
    # 3. Register active module Blueprints; log broken ones
    registry.load_active_modules(app)
    return app
```

`registry.load_active_modules()`:
1. Queries `module_tokens` for `built_in=True OR (is_active=True AND pending_restart=False)`
2. For each: `importlib.import_module(f"modules.{module_id}.api")` → get Blueprint
3. On success: `app.register_blueprint(bp)`, mark healthy
4. On `ImportError`: log error, mark module as broken — app still starts

---

### 7.8 Module → Core Reward Contract (`RewardEvent`)

Modules never import from `core/`. Instead, `POST /answer` returns a `RewardEvent` dict. The core API gateway (a thin wrapper in `app.py`) processes it and updates `user_wallet`, `user_streaks`, and `user_badges`.

```python
# Contract: every module's answer endpoint returns this shape
RewardEvent = {
    "correct": bool,
    "coins": int,          # 0–3 depending on speed + difficulty
    "xp": int,             # 5–15 per correct answer
    "badges_earned": [],   # list of namespaced badge IDs to award
    "streak_activity": bool,  # True = counts as today's practice
    "srs_updated": bool,
    "module_data": {}      # module-specific payload (heatmap update, etc.)
}
```

The gateway in `app.py` receives this, calls `core.models.apply_reward(user_id, event)`, and returns the merged response to the client. No module code touches core tables directly.

---

### 7.9 Guest → Registered User Migration

When a guest registers, `POST /api/v1/auth/register` accepts an optional `guest_progress` payload containing the localStorage state. The server merges it:

```json
{
  "username": "...",
  "email": "...",
  "password": "...",
  "guest_progress": {
    "math.moltiplicazioni": {
      "planets_unlocked": [2, 5, 10],
      "srs_queue": [
        {"multiplicand": 7, "multiplier": 8, "ef": 2.1, "reps": 3}
      ]
    }
  }
}
```

Server-side merge rules:
- Planet unlocks: accept if the boss battle score is also provided and ≥ 80%
- SRS state: merge directly (guest had no server state to conflict with)
- Coins/XP/badges: guest progress is not migrated (earn from scratch on server — prevents abuse)

`core.js` always serializes guest progress to the register payload automatically.

---

### 7.10 Known Limitations

| # | Limitation | Impact | Mitigation |
|---|---|---|---|
| 1 | Global module activation requires app restart | Operator UX only (not student UX) | `pending_restart` state shown; acceptable for infrequent module additions |
| 2 | SQLite WAL still has write serialization | Fine for < 100 concurrent users | Migrate to PostgreSQL before public launch |
| 3 | Concurrent SRS reviews (two devices same user) | Rare; last-write-wins if reviews < 60s apart | `last_updated` column allows detection; conservative merge planned for v2 |
| 4 | JWT access token cannot be revoked mid-session | If user is banned, old JWT valid for up to 1h | Short (1h) access token + refresh token revocation covers 99% of cases |
| 5 | `italiano_verbi` module cannot be incrementally ported | Must cut over fully or keep dual code | `verbi_data.py` stays at root during Phase 1 |
| 6 | Teacher/parent roles exist in DB but no dashboard built | Phase 1 scope only | `role` field is in schema; dashboard is Phase 3 |
| 7 | `user_access_tokens` are single-use by default | Cannot share one token across a class | Set `max_uses > 1` or generate per-student tokens via admin API |

---

## 8. Implementation Roadmap

### Phase 1 — Core Foundation (2–3 days)
**Goal:** Core app shell + module system + auth working

1. Update `requirements.txt` (`PyJWT`, `bcrypt`, `flask-wtf`; remove `flask-login`)
2. Refactor `srs.py` to remove `database` import — pure algorithm only
3. Create `core/` package: `auth.py` (JWT helpers, keep existing logic), `registry.py` (module loader + health checker), `models.py` (core DB tables)
4. Rewrite `app.py` as app factory with `registry.load_active_modules()`
5. Seed `module_tokens` in `database.init_db()` with `built_in=True` rows for math modules (`INSERT OR IGNORE`)
5. Implement `GET /api/modules/active` endpoint
6. Rewrite `static/css/style.css` with space theme design system
7. Create `templates/base.html` (nav, login state) + `templates/auth/*.html`
8. **Test:** register, login, logout, `GET /api/modules/active` returns math modules

### Phase 2 — Multiplication Module (3–4 days)
**Goal:** `modules/math_moltiplicazioni/` fully working end-to-end

1. Create module skeleton: `__init__.py` (Blueprint), `manifest.json`, `models.py`, `api.py`, `game_logic.py`
2. Implement all 5 API endpoints (session, answer, stats, progress, boss-battle)
3. Integrate SM-2 via `srs.py` for per-fact scheduling
4. Rewrite `templates/landing.html` as galaxy map (reads `/api/modules/active`)
5. Create `static/js/journey.js` (planet rendering, lock/unlock states)
6. Create `templates/game.html` as universal game shell
7. Port existing multiplication game logic into module's `game_logic.py`
8. Implement 5 game modes (Explorer, Mission, Speed Run, Boss Battle, Galaxy Cup)
9. **Test:** full journey from Planet ×2 Explorer → Boss Battle → planet unlock

### Phase 3 — Rewards & Progression (2–3 days)
**Goal:** Full reward loop; tokens activate additional modules

1. Coins + XP earned via module answer endpoints → stored in core `user_wallet`
2. Badge system: modules emit badge events, core awards them
3. Daily streak: core checks `last_practice_date` on any module answer
4. Heatmap: per-user 12×12 accuracy grid via `GET /api/modules/moltiplicazioni/stats`
5. Avatar shop skeleton (coins → cosmetic items)
6. `POST /api/modules/activate` endpoint — test with a dummy token for `math_addizioni`
7. Add `math_addizioni` module (same pattern as moltiplicazioni)
8. **Test:** earn coins, badge triggered, streak increments, addizioni activates via token

### Phase 4 — Polish & Deploy (2–3 days)
**Goal:** Ship-ready, public URL

1. Mobile optimization at 375px and 768px
2. CSS animations: sparkle (correct), shake (wrong), level-up particles
3. Sound effects (optional: correct chime, wrong thud, fanfare)
4. Rate-limit auth endpoints (`Flask-Limiter`)
5. Environment variable config (`SECRET_KEY`, `DATABASE_URL`)
6. Deploy to Render.com (Flask + PostgreSQL)
7. Smoke test: full journey on mobile + desktop
3. Create unified `templates/matematica/game.html` (all 5 modes share one container)
4. Port existing multiplication game into new design
5. Implement Explorer mode (blocked practice, new table introduction)
6. Implement Daily Mission with SM-2 SRS backend (adapt `srs.py` for math facts)
7. Implement Speed Run (60s burst + personal best)
8. Implement Boss Battle (20q, 80% gate, planet unlock)
9. Implement Galaxy Cup (free play, no pressure)
10. Test: all 5 modes playable, progression gates working

### Phase 3 — Rewards & Progression (2–3 days)
**Goal:** Full reward loop implemented

1. Coins: earned per correct answer, balance tracked in DB (or localStorage for guest)
2. XP + leveling: XP per session, level thresholds, visual level-up celebration
3. Streak: increment on daily Mission completion, streak shield, longest streak display
4. Badge system: implement all 15+ badges, award checks in API layer
5. Per-user heatmap: 12×12 grid, color-coded accuracy per fact
6. Avatar shop: basic items purchasable with coins
7. Profile page: heatmap, badges, streak, level, stats summary
8. Test: earn coins, buy item, badge triggered, streak increments, heatmap updates

### Phase 4 — Polish & Deploy (2–3 days)
**Goal:** Ship-ready product

1. Mobile optimization: test at 375px (iPhone SE), 768px (iPad)
2. Animations: CSS sparkles for correct, shake for wrong, Lottie for level-up/badge
3. Sound effects: correct (chime), wrong (soft thud), level-up (fanfare)
4. Performance: lazy-load images, minimize JS, cache static assets
5. Security: rate-limit auth endpoints, validate all inputs, HTTPS redirect
6. Deploy to Render.com: env vars (`SECRET_KEY`, `DATABASE_URL`), PostgreSQL
7. Smoke test: complete full journey from registration → Planet ×2 boss battle → badge

---

## Key Decisions Summary

| Decision | Choice | Reason |
|---|---|---|
| App architecture | Central core + independent modules via API tokens | Each module is self-contained; new subjects/features added without touching core |
| Module activation | Token in DB (`module_tokens` table) | Allows built-in modules (always on) and token-gated modules (future paid/institutional access) |
| Module discovery | App factory auto-discovers Blueprints from `modules/` folder | Zero core-code changes to add a new module |
| API convention | `GET/POST /api/modules/<module_id>/<action>` | Uniform, predictable, easy to document and test |
| Framework | Flask (keep existing) | Zero migration cost; Blueprint-per-module pattern works natively |
| Auth | JWT + bcrypt (keep existing `app.py` implementation) | Already implemented; Flask-Login would be a regression; add refresh tokens |
| Database | SQLite+WAL dev → PostgreSQL production; core + per-module tables | Module owns its tables; core owns users/tokens/wallet/streaks |
| Frontend | Vanilla JS | No build step, tiny bundle; `core.js` fetches active modules, dynamically imports module `ui_script` |
| SRS Algorithm | SM-2 (`srs.py` refactored to pure functions) | Remove DB import from srs.py; each module handles its own DB reads/writes |
| Module activation | Requires app restart (`pending_restart` state in DB) | Flask Blueprints cannot be registered at runtime; restart is simpler and safer than dynamic plugin loading |
| Badge IDs | Namespaced `<module_id>:<slug>` | Prevents collision when multiple modules define same badge name |
| Guest migration | `POST /register` accepts `guest_progress` payload | Merges planet unlocks + SRS state; coins/XP not migrated (anti-abuse) |
| Theme | Space / Galaxy | Universal appeal across genders and ages 6–12 |
| Timer | Always optional | Research shows mandatory timers increase math anxiety |
| Monetization | None (free) | Primary goal is student access; token system leaves door open for institutional premium |
| Login | Optional (guest mode always works) | Removes barrier to first-time use |
| Interleaving | After initial blocked introduction | Evidence-based: blocked first, then interleaved for retention |

---

## Sources

- Rea & Modigliani (1985) — Spaced practice and multiplication retention in Grade 3
- Rohrer et al. (ERIC) — Interleaving vs blocked practice in mathematics
- Csikszentmihalyi — Flow Theory
- Vygotsky — Zone of Proximal Development
- PMC (2022) — Interference effects in multiplication fact learning
- Kang (2016, SAGE) — Spaced repetition promotes efficient and economical learning
- Hechinger Report — Flashcards vs repetition for multiplication memorization
- BPS Critique of TTRS — Timer anxiety in speed-based math practice
- Frontiers in Education (2024) — Game-based learning in primary mathematics
- Springer Nature (2022) — Adaptive game-based math learning outcomes
- Nielsen Norman Group — UX design for children: physical development considerations
- Duolingo Engineering Blog — Streak system and engagement data
- Common Sense Education — Reviews of TTRS, Math Playground, Arcademics
- AFT American Educator (Spring 2020) — Interleaving in mathematics: Agarwal & Agostinelli
