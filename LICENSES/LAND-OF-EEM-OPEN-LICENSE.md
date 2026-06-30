# Land of Eem Open License (LOEL)

<!-- ACTION REQUIRED BEFORE PUBLISHING --------------------------------
     Paste the full text of the Land of Eem Open License here.
     The official LOEL text is published by the Land of Eem creators
     at https://landofeem.com (check their SRD / legal page).

     Do NOT publish or distribute this repository without replacing
     this placeholder with the actual LOEL text, or confirming that
     a reference link satisfies the license's attribution requirements.
     ----------------------------------------------------------------- -->

**[PLACEHOLDER — insert official LOEL text here]**

---

## How this project uses the LOEL

The following elements in this codebase are derived from the
Land of Eem System Reference Document (SRD) and are governed by the LOEL:

| Element | Location | Notes |
|---------|----------|-------|
| d12 result band names and numeric ranges (Complete Failure, Failure with a Plus, Success with a Twist, Success, Complete Success) | `src/roll.ts` | Core roll resolution table from SRD §[verify section] |
| Attribute names (Vim, Vigor, Knack, Knowhow) | `src/db.ts`, `src/embeds.ts`, `src/handlers/rolls.ts` | Character stat terminology |
| Dread die mechanic and label | `src/db.ts`, `src/embeds.ts`, `src/handlers/rolls.ts` | Damage roll mechanic |
| Courage stat label and default value (6) | `src/db.ts`, `src/embeds.ts` | Resource track — verify default against SRD |
| Quest Points label | `src/db.ts`, `src/embeds.ts` | Resource track |
| Folk, Class, Homeland character fields | `src/db.ts`, `src/handlers/character.ts` | Character creation terminology |
| Result band table in README | `README.md` | Reproduced from SRD for user reference |

## Content flagged for manual review (may not be in SRD)

The following items appear in the codebase and may reference official
Land of Eem setting material that is NOT part of the SRD.  Review
each against the LOEL and the SRD's scope before publishing:

| Item | Location | Risk |
|------|----------|------|
| Folk examples "Hobble, Mellow" | `src/handlers/character.ts` label text | May be setting-specific named folk, not generic SRD terms — verify or replace with generic placeholder |
| "Ben Costa and James Parks", "Rickety Stitch", "Dungeoneer Adventures" | `README.md` | Creator/product names — permissible for attribution but review whether the phrasing implies endorsement |
| "Lord of the Rings meets The Muppets" | `README.md` | Third-party IP in a marketing-style description — remove or rephrase |
| `landofeem.com` link | `README.md` | Fine as attribution; confirm LOEL does not restrict linking |

## What this project does NOT do

- This project does not reproduce the full Land of Eem SRD text.
- This project does not use Land of Eem logos, cover art, maps, or
  other official artwork.  (Verify your deployment has none.)
- This project does not claim to be official, endorsed, or affiliated
  with the creators or publishers of Land of Eem.

---

*Land of Eem is a trademark of its creators.  [verify trademark holder
name against LOEL text]*
