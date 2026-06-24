# Medical Aid Navigator — Styling Guide

> Design thesis: **Clarity under pressure.**
> The person using this is often stressed, on a phone, and short on time.
> Every choice serves calm, legibility, and trust — never decoration.

This guide is the single source of truth for the visual system. All design
tokens live in `src/styles/tokens.css` and are referenced here.

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

## 2. Colour

A restrained, meaningful palette. Colour carries **status**, not mood.

| Token | Hex | Role |
|---|---|---|
| `--ink` | `#13232B` | Primary text — deep desaturated teal-charcoal, softer than black |
| `--ink-soft` | `#4A5D63` | Secondary text, captions |
| `--paper` | `#F7F5F0` | Page background — warm paper, low glare on mobile |
| `--surface` | `#FFFFFF` | Cards, raised surfaces |
| `--line` | `#E2DED5` | Hairlines, borders |
| `--teal` | `#0E6E66` | Primary brand / actions — trustworthy, clinical-calm green-teal |
| `--teal-deep` | `#0A4F49` | Hover/active, headings accent |
| `--teal-wash` | `#E6F0EE` | Tinted panels, selected states |
| `--amber` | `#B5731A` | "Ask / check / confirm" caution — the navigator's signature status colour |
| `--amber-wash` | `#FBF1E2` | Caution panel background |
| `--alert` | `#B3261E` | EMERGENCY ONLY — never used decoratively |
| `--alert-wash` | `#FBEAE8` | Emergency panel background |

**Rule:** `--alert` red is reserved exclusively for the emergency safety layer.
If red appears anywhere else, it dilutes the one signal that must never be
missed. Caution/uncertainty uses **amber**, never red.

Contrast: body text (`--ink` on `--paper`) and all interactive text meet
WCAG AA. Never rely on colour alone — pair every status colour with an icon
and a text label.

---

## 3. Typography

Two families, chosen for trust and screen legibility, not novelty.

- **Display / headings:** `"Fraunces", Georgia, serif` — a warm, slightly
  literary serif used **only** at large sizes for headings and the wordmark.
  It signals "considered and human," which counters the cold-system feeling
  people dread from medical aid.
- **Body / UI:** `"Inter", system-ui, sans-serif` — neutral, highly legible at
  small sizes on mobile, excellent for dense checklists.
- **Utility / data:** `"IBM Plex Mono", monospace` — for codes the user will
  copy (ICD-10, authorisation numbers, tariff codes). Monospacing makes codes
  scannable and signals "this is a literal value to write down."

### Type scale (mobile-first, rem)

| Token | Size / line | Use |
|---|---|---|
| `--fs-display` | 2.0rem / 1.15 | Page hero heading |
| `--fs-h1` | 1.5rem / 1.2 | Screen titles |
| `--fs-h2` | 1.2rem / 1.3 | Section headings |
| `--fs-body` | 1.0rem / 1.55 | Body, checklist items |
| `--fs-small` | 0.85rem / 1.45 | Captions, disclaimers |
| `--fs-code` | 0.9rem / 1.4 | Codes (mono) |

Headings use Fraunces at `--fs-h1`+ only. Everything ≤ h2 in dense UI uses
Inter for clarity. Sentence case everywhere. No all-caps except small eyebrow
labels with `letter-spacing: 0.08em`.

---

## 4. Layout & spacing

Mobile-first. Single column, generous vertical rhythm, comfortable tap targets.

- Spacing scale (`--sp-*`): 4, 8, 12, 16, 24, 32, 48, 64 px.
- Content max-width: `--measure: 40rem` (≈640px) — keeps line length readable
  on desktop; full-width on mobile with `--sp-16` gutters.
- Tap targets: minimum 44×44px.
- Border radius: `--radius: 14px` for cards, `--radius-sm: 8px` for inputs and
  chips. Soft but not pill-shaped — calm, not playful.
- Cards: `--surface` on `--paper`, 1px `--line` border, soft shadow
  `0 1px 2px rgba(19,35,43,.04), 0 8px 24px rgba(19,35,43,.05)`.

### Signature element

The **status rail**: every checklist section is introduced by a short vertical
coloured rail (4px) on its left edge in the section's status colour — teal for
"do this", amber for "ask/confirm", red for emergency. It turns the checklist
into a glanceable wayfinding strip: a stressed reader can scan the left edge
and immediately see what is action vs. what is a question to ask. This is the
one memorable device; everything else stays quiet.

---

## 5. Components

- **Scenario card:** icon (lucide) in a teal-wash rounded square, title
  (Inter 600), one-line blurb (`--ink-soft`). Whole card is tappable, with a
  clear focus ring (`2px solid --teal`, 2px offset).
- **Buttons:** primary = solid `--teal`, white text; hover `--teal-deep`.
  Secondary = `--surface` with `--line` border. Destructive styling is **not
  used** — nothing here deletes user data. Emergency actions use `--alert`.
- **Inputs / choices:** large radio "chips" for guided questions; selected =
  `--teal-wash` fill + `--teal` border. Free-text uses a calm bordered
  textarea. "Skip" is always a quiet text link (FR3: users can skip).
- **Caution callout:** amber-wash panel, amber rail, info icon — used for
  "confirm with your scheme" type notes.
- **Emergency banner:** red rail, alert-wash background, siren icon, the
  static emergency copy. Appears at top of result when emergency is detected.
- **Code chip:** mono font, teal-wash background, copy icon — for ICD-10 /
  authorisation numbers.
- **Disclaimer footer:** small, `--ink-soft`, always visible — never hidden
  behind a toggle (FR13).

---

## 6. Motion

Minimal and purposeful (respect `prefers-reduced-motion`).

- Card tap: 120ms ease scale to 0.99.
- Result reveal: sections fade+rise 160ms, staggered 40ms — only on first
  render, never on emergency content (emergency appears instantly).
- No looping/ambient animation. This is a tool, not a showpiece.

---

## 7. Accessibility floor (non-negotiable)

- Visible keyboard focus on every interactive element.
- Colour never the sole signal — icon + label always accompany status.
- Tap targets ≥ 44px; inputs have real `<label>`s.
- `prefers-reduced-motion` disables all transitions.
- Emergency content is reachable and readable with zero JS (server-rendered
  fallback) — safety must not depend on a script loading.
- Tested down to 320px width.

---

## 8. Tone of copy (paired with section 25 of the spec)

Calm, plain, active voice. Buttons say what happens ("Get my checklist", not
"Submit"). Empty/error states give direction, not apology. Never use guarantee
language in UI copy either ("Ask your scheme whether…", not "This is covered").
