## Context

See proposal.md. This document describes the mechanism actually shipped (retroactive, per HW6's "review your whole codebase").

## Goals / Non-Goals

**Goals:**
- Document the matching mechanism precisely enough for the spec's scenarios to be testable.

**Non-Goals:**
- Enumerating every individual keyword in `js/keywords.js` - the spec documents the matching *mechanism* (substring vs. whole-word), not an exhaustive keyword list, consistent with how the existing spec already only gives representative examples ("Lidl", "Spar").

## Decisions

**Whole-word matching via existing text padding, not a new matching function.**
`categorizeTransaction()` (`js/categorize.js`) already wraps its search text in a leading/trailing space before calling `matchesAny()`. A keyword written with its own leading/trailing space (e.g. `' one '`) therefore only matches when it appears as an isolated word - "vodafone" has no space before "one", so it is not a match. No new code path was needed; this is a property of how a keyword is *written*, not a new mechanism. Alternative considered: a dedicated word-boundary regex per risky keyword - rejected as unnecessary complexity given the existing padding already provides the same guarantee for free.

## Risks / Trade-offs

- **Relies on every keyword list being matched against pre-padded text** → Accepted; this is already true for every existing categorization call site (verified by the regression test described in the next task list).
