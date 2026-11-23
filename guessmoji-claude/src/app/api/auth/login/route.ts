import { notImplemented } from "../notImplemented";

// TODO(backend): validate body, check password hash, create session,
// set HttpOnly/Secure/SameSite=Lax SESSION_COOKIE, return 200. Return 401 on bad credentials.
export async function POST() {
  return notImplemented();
}
