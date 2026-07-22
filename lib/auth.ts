/**
 * The studio intentionally has no application-level sign-in. Keep these
 * route-facing guards as no-ops so editor and worker actions remain callable
 * without a cookie or access token.
 *
 * Deploy only behind a trusted network boundary if it is hosted publicly.
 */
export const requireStudioAccess = (_request: Request) => undefined;

export const requireStudioPageAccess = async () => undefined;
