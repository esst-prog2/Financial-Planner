---
version: 1
slug: "promo-index-html"
primary_target: "promo/index.html"
related_targets: []
---

## Surface brief — promo page (`promo/index.html`)

**Scope and visitor mode:** Persuade. A single static HTML page at `promo/index.html`, published alongside the live app (which stays at the repo root). Content and copy are already written (PROCESS.md step 3 / PRODUCT.md).

**Audience, job, action:** A reader who shares a household/bank account with someone else, uses more than one bank, or regularly deals with a foreign-currency account, arriving cold (a classmate, a grader, a stranger). Primary action: understand what the app does and who it's for within seconds, then click through to try the real, live app.

**Proof/content:** The real app itself (live link), the one-year synthetic sample workbook (upload to try it with no real data), and the three honest differentiation points already drafted. No testimonials, metrics, or press exist - none are invented.

**Visual authority:** Established world, inherited - the pink/rose pastel theme already in `css/style.css` (Playfair Display headings, Poppins body, pill-shaped buttons, the validated CVD-safe category palette). This surface documents and extends that identity; it does not invent a new one.

**Structure:** One long-scroll page. Hero (name + one-line promise) → What it is → Who it's for → How it's different (three short comparisons) → Try it (prominent CTA to the live app + a note about the sample workbook).

**Constraints:** No build step (plain HTML/CSS/JS, matching the main app). The app's own files and URL are untouched. English copy (matches the rest of the course). Reasonable responsive behavior (desktop + mobile); reuse the app's already-validated accessible color palette rather than inventing new colors.

**Untouched:** `index.html`, `css/style.css`, and every `js/` file - the real app is not modified by this work.

**Anti-goals:** No fabricated customer quotes, usage numbers, or press mentions. No claim the app does something it doesn't (e.g. no live bank sync, no mobile app, no accounts/login).
