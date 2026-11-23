/** Name of the HttpOnly session cookie the backend will set on successful login. */
export const SESSION_COOKIE = "guessmoji_session";

/** Routes that require an authenticated session. */
export const PROTECTED_PATHS = ["/home", "/play"];
