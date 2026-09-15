# Website optimization plan

## Goal

Make gablacarriere.com feel like one deliberate system rather than a collection of projects that happen to share a domain. Optimize for clarity, speed, maintainability, accessibility and conversion without flattening Gab's visual identity or pedagogy.

## Product boundary

The domain currently contains three different kinds of product. Treat them differently.

### 1. Public website
Purpose: explain Gab's work, establish trust, help the right visitor choose a next step, and make contact or booking easy.

Core public destinations:
- Home
- Train / Learn hub
- Mentorship
- For teachers
- Journal
- About

Secondary destinations belong inside hubs or the footer rather than all competing in the primary navigation:
- Weekly classes
- Private training
- Kinesthetic Practice
- Zouk BNB
- Work with Gab / events
- Workshops
- Wedding / creative work
- Reviews and feedback
- Learning articles

### 2. Student products
Purpose: do work, not market it.
- Mentorship Hub / Mothership
- Zoukable
- Practice Planner
- Atlas / map surfaces

These should not be injected into the public navigation as if they were equivalent marketing pages. A member enters through a clear Member Login path and then sees the tools relevant to them.

### 3. Internal operations
Purpose: run the business.
- Business HQ
- Finance
- CRM
- Comms deck
- internal teaching/admin surfaces

Internal pages are not public landing pages. They must be excluded from search indexing and must use real authorization wherever private information exists. `robots.txt` is not a security mechanism.

## Homepage information architecture

The homepage should answer, in this order:
1. What does Gab teach and where?
2. What makes the teaching different?
3. Which training format is right for me?
4. Is there evidence that this works?
5. Who is Gab?
6. What should I do next?

Recommended sequence:
1. Hero: one positioning statement + two actions maximum.
2. Training chooser: Classes / Private / Mentorship, with Zouk BNB as a contextual visitor option rather than an equal fourth teaching product.
3. Proof: compact student outcomes / reviews.
4. Method: one concise explanation of the pedagogy and movement approach.
5. Teacher-development pathway: clearly secondary to student training on the homepage, but prominent enough to establish Gab's pedagogical specialization.
6. About / credentials: short trust block.
7. Final CTA.

The current Cabinet of Curiosities should not sit between the hero and the main training decision. Preserve it only if it earns a clear role as an optional creative/teaching-lab experience; otherwise remove it. The homepage should not require visitors to interpret an art experiment before they understand the offer.

## Navigation target

Primary desktop navigation target:
- Train
- Mentorship
- For teachers
- Journal
- About
- Member Login

`Work with Gab`, reviews, feedback, policies, creative work and specialist pages remain discoverable through contextual links and the footer.

## Performance rules

1. Load page-specific JavaScript only on pages that use it.
2. Do not inject decorative interaction scripts globally.
3. Keep responsive `srcset`/`sizes` for prominent imagery and avoid shipping original full-resolution files to the public build when optimized derivatives exist.
4. Prefer WebP/AVIF derivatives for raster photographs while retaining an intentional fallback strategy.
5. Remove unused originals and stale generated copies from the publication boundary rather than merely leaving them unreferenced.
6. Keep third-party scripts to a minimum and review whether each one is required on every page.
7. Keep layout dimensions on images so image loading does not cause avoidable layout shift.
8. Treat performance as a budget checked during review, not a one-time cleanup.

## Current high-value cleanup targets

- `apply_branding.cjs` currently adds multiple visual/interaction layers to nearly every page. Split structural brand CSS from optional art interactions and load the latter only where they have a purpose.
- `integrate_zoukable.cjs` previously injected Zoukable into every public navigation. Keep the app in the member journey instead.
- The homepage has a long interactive curiosity module with its own CSS and JS before visitors reach the main training chooser. Relocate or remove it from the primary conversion path.
- Raw/high-resolution images and optimized derivatives coexist in the publishable source tree. Stop copying originals that are not needed at runtime.
- Route configuration is verbose and duplicates slash/non-slash rewrites. Evaluate a clean-URL strategy only after route/link tests are in place.
- Public pages, student tools and internal tools currently share one root-level repository surface. Keep one repository if useful, but make publication categories explicit in build configuration.

## Quality gates

Every release affecting public structure should verify:
- every local destination resolves;
- every linked `#fragment` exists;
- no missing local CSS/JS assets;
- no development/database/design files ship publicly;
- internal pages receive `noindex`;
- mobile navigation works at phone width;
- no horizontal overflow;
- keyboard focus remains visible;
- reduced-motion preference is respected;
- primary imagery has explicit dimensions and responsive sources;
- signed-in workflows are tested separately when authentication, student data or payments change.

## Refactor order

### Pass A — Safety and boundaries
- build-time link/fragment audit;
- internal `noindex` boundary;
- remove student apps from public primary navigation;
- document publication contract.

### Pass B — Public experience
- simplify primary navigation;
- simplify homepage hierarchy;
- relocate/remove Cabinet of Curiosities from the primary path;
- normalize CTA language and pricing presentation;
- make Train/Learn the public hub instead of repeating all destinations everywhere.

### Pass C — Weight and architecture
- conditional-load art/interaction JS;
- inventory and remove unused public assets;
- consolidate shared CSS/page shells;
- reduce route/config duplication;
- define performance budgets and measure representative pages.

### Pass D — SEO and accessibility
- canonical/title/description audit;
- sitemap audit;
- structured data where it genuinely matches page content;
- heading/landmark/form-label/focus audit;
- contrast, touch targets and motion audit.

### Pass E — Product surfaces
- Mentorship Hub, Zoukable and teacher tools get separate UX audits;
- verify authentication and data boundaries;
- keep public marketing decisions from leaking into task-oriented app navigation.

## Deletion rule

Do not keep a section merely because it exists. A public element should earn its place by doing at least one of these jobs:
- explain the offer;
- help a visitor choose;
- provide evidence/trust;
- answer a high-value question;
- support discovery/search;
- complete an action.

If it does none of these, remove it. If it is interesting but interrupts the primary journey, relocate it.
