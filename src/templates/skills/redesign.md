---
description: Audit or fix UI so it does NOT look AI-generated — enforces OpenWolf's anti-generic design principles
argument-hint: [target] [--mode audit|fix] [--scope page|component|app]
---

Arguments: $ARGUMENTS
Defaults: mode=audit, scope=app, target=the project's UI.

Read the **Design Principles** section of `.wolf/reframe-frameworks.md` first — it
defines the anti-generic mandate this command enforces. Use `.wolf/anatomy.md` to
locate UI files instead of scanning.

## What "AI-generated look" means (the tell blocklist)

Flag every instance of:
- Purple/indigo/violet gradient heroes; gradient text on centered headlines
- Glassmorphism cards everywhere; rounded-2xl + soft shadow as the only surface style
- ✨ 🚀 🎉 emoji in headings or feature lists
- Generic 3-column feature grids with icon-title-blurb repetition
- Gradient blob/mesh backgrounds; floating 3D shapes with no meaning
- Stock Tailwind palette used as-is; Inter/system font for every role
- Identical 8px-scale spacing rhythm with no density variation
- Dark-purple SaaS landing template structure (hero → logos → 3 features → CTA)
- Filler microcopy: "Supercharge your workflow", "Built for developers, by developers"

## Mode: audit
Walk the target and produce a findings table: file/component, which tell it matches,
severity (how loudly it screams "AI made this"), and a specific replacement direction.
End with the 3 changes that would most increase distinctiveness.

## Mode: fix
Apply the audit, then fix findings in severity order. Fixes must move toward, not
merely away: typography chosen with intent (a real pairing, optical sizes, tightened
headline tracking), a palette derived from the product's actual brand/domain,
asymmetry where it serves hierarchy, real copy specific to what the product does,
density appropriate to the audience. Preserve the existing framework and component
API; this is a design pass, not a rewrite. After each fix, state what changed and why
it reads as designed-on-purpose.

Rule: distinctiveness is an acceptance criterion. If the result could be swapped onto
any other product's site without anyone noticing, it fails.
