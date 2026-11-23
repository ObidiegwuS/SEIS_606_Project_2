import { defineConfig, devices } from "@playwright/test";
import os from "node:os";
import path from "node:path";

/**
 * End-to-end tests: a production build of the app with a fresh SQLite
 * database, sending real SMTP to a local test mail sink. Runs in installed
 * Google Chrome on a desktop and an emulated phone.
 */
const APP_PORT = 3100;
const SMTP_PORT = 2525;
process.env.E2E_DIR ??= path.join(os.tmpdir(), `guessmoji-e2e-${Date.now()}`);
process.env.E2E_DB ??= path.join(process.env.E2E_DIR, "e2e.db");

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: true,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${APP_PORT}`,
    channel: "chrome",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], channel: "chrome" } },
    { name: "mobile", use: { ...devices["Pixel 7"], channel: "chrome" } },
    // iPad Mini viewport and touch, rendered in Chrome.
    { name: "tablet", use: { ...devices["iPad Mini"], browserName: "chromium", channel: "chrome" } },
  ],
  webServer: [
    {
      command: "node e2e/smtp-sink.mjs",
      port: SMTP_PORT,
      env: { E2E_DIR: process.env.E2E_DIR, SMTP_SINK_PORT: String(SMTP_PORT) },
      reuseExistingServer: false,
    },
    {
      command: `npm run build && npm run start -- -p ${APP_PORT}`,
      url: `http://localhost:${APP_PORT}/login`,
      timeout: 180_000,
      reuseExistingServer: false,
      env: {
        DATABASE_PATH: process.env.E2E_DB,
        APP_URL: `http://localhost:${APP_PORT}`,
        SMTP_HOST: "127.0.0.1",
        SMTP_PORT: String(SMTP_PORT),
        SMTP_FROM: "GuessMoji <no-reply@guessmoji.test>",
      },
    },
  ],
});
