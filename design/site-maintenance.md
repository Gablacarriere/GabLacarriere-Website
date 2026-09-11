# Website maintenance contract

Edit source pages and shared scripts/styles at the repository root. Treat `public/` as generated output, not the source of truth. Zoukable source lives under `zoukable/` and is integrated after branding. Build with the `buildCommand` in `vercel.json`; run its three stages in order.

The branding build starts clean. Only approved static file extensions and the assets, vendor and zoukable directories are copied. Add a new asset directory deliberately to ASSET_DIRS if necessary. Keep development tools, database migrations, design notes and tests outside the served output. Never put secret credentials in client-side files; browser configuration must contain publishable values only.

The finalizer shares identical large inline CSS blocks while preserving cascade order. It versions local stylesheet and script references from their actual content. Manual version labels in source are no longer required for HTML references. Dynamic imports and URLs constructed by JavaScript are outside this mechanism and need separate cache consideration. Do not add immutable long-term caching to stable asset filenames: filenames remain stable while their query versions change.

Missing local CSS/JS references and development files in output fail the build. Run `node tests/build-output.cjs` after changing the finalizer. Existing Atlas and Zoukable tests cover simulated behavior; they do not replace real account tests.

Before release, run the full build, the tests in tests/, and phone/desktop browser checks. Check mobile navigation, image loading and overflow. For changes to authentication, payments, feedback or student progress, additionally verify the real authorized flow through its storage layer, using clearly marked test data. Never infer successful saving from a success message alone.

Keep public teaching pages, Zoukable practice and Atlas assessment independent at their data boundaries. Shared visuals may evolve centrally, but practice XP must never automatically certify coach-assessed competence. Preserve consent and approval requirements for public student reviews.

September 2026 audit: 27 page shells checked at 390px and 1440px in a clean signed-out browser. No local load failures, page exceptions or horizontal overflow observed. Signed-in workflows were not part of that browser sweep.
