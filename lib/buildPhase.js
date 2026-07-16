/**
 * Detect if we're running during `next build` (production build phase).
 * Used to skip database connections at build time — no live DB needed in CI/Vercel build.
 */
export function isNextProductionBuild() {
  return process.env.NEXT_PHASE === 'phase-production-build';
}
