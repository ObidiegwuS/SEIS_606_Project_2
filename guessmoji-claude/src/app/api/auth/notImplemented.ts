import { NextResponse } from "next/server";

/**
 * Placeholder response until the real authentication backend is built.
 * Returns 501 so the UI reports an honest failure rather than a fake success.
 */
export function notImplemented() {
  return NextResponse.json(
    { error: "not_implemented", message: "Authentication backend is not implemented yet." },
    { status: 501 },
  );
}
