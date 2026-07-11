# Medical Aid Navigator — Styling Guide

> Design thesis: **Clarity under pressure.**
> The person using this is often stressed, on a phone, and short on time.
> Every choice serves calm, legibility, and trust — never decoration.

This guide is the single source of truth for the visual system. All design
tokens live in `src/styles/tokens.css`; component rules live in
`src/styles/globals.css`. This document describes intent — the tokens are
authoritative for exact values.

---

## 1. Voice of the design

It should feel like **well-made health wayfinding** — the calm, confident
signage you follow in a good hospital — not a slick fintech app and not a
government PDF. Quiet, ordered, reassuring. The one place we allow boldness is
the **emergency state**, which must be unmistakable.

Deliberately avoided: cream-and-terracotta editorial, black-with-acid-accent,
and broadsheet hairline layouts. Those are generic AI defaults and would
undercut trust here.

---

## 2. Colour — one signal vocabulary

Colour carries **status and category**, not mood. The core idea: **three
category colours that mean the same thing everywhere.**

- **coral** = urgent / emergency
- **pine** = care & planning (also the brand / primary colour)
- **violet** = cover & claims (admin)

| Token | Hex | Role |
|---|---|---|
| `--ink` | `#16231f` | Primary text — deep desaturated green-charcoal, softer than black |
| `--ink-soft` | `#5c6b65` | Secondary text, captions |
| `--bone` | `#f1eee6` | Page background — warm paper, low glare on mobile |
| `--surface` | `#ffffff` | Cards, raised surfaces |
| `--line` | `#e2ddd0` | Hairlines, borders |
| `--pine` | `#123a36` | Brand / primary actions / "do this" — trustworthy, clinical-calm |
| `--pine-deep` | `#0c2a27` | Hover / active, heading accents |
| `--pine-tint` | `#e5efec` | Tinted panels, selected states |
| `--gold` | `#b5731a` | "Ask / check / confirm" — the navigator's signature caution status |
| `--gold-tint` | `#f8efdd` | Caution panel background |
| `--coral` | `#c2410c` | Urgent / emergency / "what not to do" — the safety signal |
| `--coral-deep` | `#9a330a` | Emergency hover / active |
| `--coral-tint` | `#fbeee7` | Emergency & caution-warn panel background |
| `--violet` | `#6b5ba8` | Cover & claims (admin) category |
| `--violet-tint` | `#e9e5f5` | Cover & claims panel background |

**Rule:** `--coral` carries the safety signal — emergency states and the
"what not to do / cost risk" rails. It must stay meaningful; never use it
decoratively. Ordinary caution / "confirm with your scheme" uses **gold**.

Never rely on colour alone — pair every status colour with an icon and a text
label. Body and interactive text meet WCAG AA on their backgrounds.

---

## 3. Typography

Three families, loaded via `next/font` (see `src/app/layout.tsx`), chosen for
trust and screen legibility, not novelty.

- **Display / headings:** `Fraunces` (`--font-display`) — a warm, slightly
  literary serif used **only** at large sizes for headings and the wordmark.
  It signals "considered and human," countering the cold-system feeling people
  dread from medical aid.
- **Body / UI:** `Inter` (`--font-body`) — neutral, highly legible at small
  sizes on mobile, excellent for dense checklists.
- **Utility / data:** `IBM Plex Mono` (`--font-mono`) — for codes the user will
  copy (ICD-10, authorisation numbers, tariff codes). Monospacing makes codes
  scannable and signals "this is a literal value to write down."

### Type scale (mobile-first, scales up at ≥640px)

| Token | Mobile → ≥640px | Use |
|---|---|---|
| `--fs-display` | 2.1rem → 2.9rem | Page hero heading |
| `--fs-h1` | 1.5rem → 1.85rem | Screen titles |
| `--fs-h2` | 1.2rem | Section headings |
| `--fs-lead` | 1.5rem | Lead paragraph |
| `--fs-body` | 1.0rem | Body, checklist items |
| `--fs-small` | 0.85rem | Captions, disclaimers |
| `--fs-code` | 0.9rem | Codes (mono) |

Headings use Fraunces at `--fs-h1`+ only; dense UI ≤ h2 uses Inter for clarity.
Sentence case everywhere. No all-caps except small eyebrow labels with
`letter-spacing` ~0.06em.

---

## 4. Layout & spacing

Mobile-first. Single column, generous vertical rhythm, comfortable tap targets.

- Spacing scale (`--sp-*`): 4, 8, 12, 16, 20, 24, 32, 40, 48, 64 px.
- Content width: `--reading-measure: 42rem` for prose shells; `--measure: 44rem`
  for wider desktop layouts.
- Tap targets: minimum 44×44px.
- Border radius: `--radius: 12px` for cards, `--radius-sm: 8px` for inputs and
  chips. Soft but not pill-shaped — calm, not playful.
- Cards: `--surface` on `--bone`, 1px `--line` border, restrained shadow
  (`--shadow-card`).

### Signature element

The **status rail**: every checklist section is introduced by a short vertical
coloured rail on its left edge in the section's status colour — pine for "do
this", gold for "ask / confirm", coral for caution / what-not-to-do. It turns
the checklist into a glanceable wayfinding strip: a stressed reader can scan the
left edge and immediately see what is action vs. what is a question to ask. The
scenario cards echo the same logic via `cat-urgent` / `cat-care` / `cat-claims`.

---

## 5. Components

- **Scenario card:** a numbered chip in a category-tinted rounded square, title
  (Inter 600), one-line blurb (`--ink-soft`), and a CTA row. Whole card is
  tappable with a clear focus ring (`--ring`). Category class (`cat-*`)
  colour-codes the chip.
- **Buttons:** primary = solid `--pine`, white text, hover `--pine-deep`.
  Secondary = `--surface` with `--line` border. Emergency actions use `--coral`
  (`.btn-alert`). Destructive styling is **not** used — nothing here deletes
  user data.
- **Inputs / choices:** large "chips" for guided questions; selected =
  `--pine-tint` fill + `--pine` border. Free-text uses a calm bordered textarea.
  "Skip" is always a quiet text link (FR3: users can skip).
- **Caution callout:** gold-tint panel, gold rail, info icon — for "confirm
  with your scheme" notes.
- **Emergency banner:** coral, siren icon, the static emergency copy. Appears at
  the top of the result when emergency is detected.
- **Code chip:** mono font, pine-tint background, copy icon — for ICD-10 /
  authorisation numbers.
- **Pine band (`.band-pine`):** one accent band per page to break long pale
  runs. Structural, not decorative — at most one per page.
- **Disclaimer footer:** small, `--ink-soft`, always visible — never hidden
  behind a toggle (FR13).

---

## 6. Motion

Calm and purposeful — trustworthy micro-motion, with **one signature moment**.
All easing/duration comes from tokens (`--ease-out`, `--dur-micro`,
`--dur-move`, `--dur-reveal`).

- **Micro-interactions:** card hover lift, chip select feedback, button press —
  short (`--dur-micro`/`--dur-move`), soft ease-out, no bounce.
- **Flow transitions:** calm crossfade + small vertical shift between the
  question, generating, and result views; subtle slide/fade between question
  steps.
- **The signature moment:** on the result screen the **decision brief assembles
  itself** — sections enter in a gentle stagger (`--dur-reveal`). This is the
  one memorable flourish; everything else stays quiet.
- **Emergency content appears instantly** — never staggered or delayed.
- No looping / ambient animation. This is a tool, not a showpiece.

---

## 7. Accessibility floor (non-negotiable)

- Visible keyboard focus on every interactive element (`--ring`).
- Colour is never the sole signal — icon + label always accompany status.
- Tap targets ≥ 44px; inputs have real `<label>`s.
- `prefers-reduced-motion` disables decorative/large motion and JS-driven
  animation (via `useReducedMotion`) while keeping essential state feedback and
  content visible.
- Emergency content is reachable and readable without relying on animation —
  safety must not depend on motion.
- Tested down to 320px width.

---

## 8. Tone of copy

Calm, plain, active voice. Buttons say what happens ("Generate checklist", not
"Submit"). Empty/error states give direction, not apology. Never use guarantee
language in UI copy ("Ask your scheme whether…", not "This is covered").
