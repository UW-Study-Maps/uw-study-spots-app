#!/usr/bin/env node
/**
 * Checks the Google Maps API key in .env.local.
 *
 * What this can and cannot prove:
 *
 *   CAN  — that the key exists, is well-formed, is live on a project with
 *          billing, and is not blocked from this machine.
 *   CANNOT — that "Maps SDK for Android" and "Maps SDK for iOS" are in the
 *          key's API allow-list. Those SDKs have no HTTP endpoint to test
 *          against; only the Cloud Console or a device log can confirm them.
 *
 * The key is sent only to Google's own APIs, and is masked in all output.
 *
 * Usage: node scripts/check-maps-key.mjs
 */
import { readFileSync } from "node:fs";

const ENV_FILE = ".env.local";
const VAR = "GOOGLE_MAPS_API_KEY";

function readKey() {
  let text;
  try {
    text = readFileSync(ENV_FILE, "utf8");
  } catch {
    fail(`${ENV_FILE} not found. Copy .env.example to ${ENV_FILE} and fill it in.`);
  }
  const match = text.match(new RegExp(`^\\s*${VAR}\\s*=\\s*(.*)$`, "m"));
  if (!match) fail(`${VAR} is not set in ${ENV_FILE}.`);

  let value = match[1].trim();
  if (/^["'].*["']$/.test(value)) {
    warn("Value is wrapped in quotes; remove them.");
    value = value.slice(1, -1);
  }
  if (!value) fail(`${VAR} is empty.`);
  return value;
}

const ok = (m) => console.log(`  ok    ${m}`);
const warn = (m) => console.log(`  warn  ${m}`);
const bad = (m) => console.log(`  FAIL  ${m}`);
function fail(m) {
  console.log(`  FAIL  ${m}`);
  process.exit(1);
}

const key = readKey();
const mask = (s) => String(s).split(key).join("<KEY>");

console.log(`\nKey ${key.slice(0, 6)}…${key.slice(-4)}\n`);

console.log("Format");
key.startsWith("AIza") ? ok("starts with AIza") : bad("does not start with AIza");
key.length === 39 ? ok("39 characters") : warn(`${key.length} characters (expected 39)`);
/\s/.test(key) ? bad("contains whitespace") : ok("no whitespace");

console.log("\nLive check (Static Maps)");
const staticUrl =
  "https://maps.googleapis.com/maps/api/staticmap?center=43.07,-89.40&zoom=14&size=120x120&key=" +
  encodeURIComponent(key);

try {
  const res = await fetch(staticUrl);
  const type = res.headers.get("content-type") ?? "";
  if (type.startsWith("image")) {
    ok("returned a map image — the key is real, active and billing-enabled");
  } else {
    const body = await res.text();
    bad(`HTTP ${res.status}: ${mask(body).slice(0, 200)}`);
    if (/not authorized/i.test(body)) {
      warn("Static Maps is not in this key's API allow-list. That alone is fine;");
      warn("it means this script cannot confirm the key any further from here.");
    }
  }
} catch (error) {
  bad(`could not reach Google: ${mask(error.message)}`);
}

console.log(`
Still to confirm by hand — no HTTP endpoint can test these:

  1. Cloud Console > APIs & Services > Enabled APIs:
     "Maps SDK for Android" and "Maps SDK for iOS" must both be enabled.

  2. Credentials > your key > API restrictions:
     if set to "Restrict key", both SDKs must be in the list.

  3. Credentials > your key > Application restrictions:
     if restricted by app, the identifiers must match app.config.js —
     currently com.uwstudyspots.app for both platforms. Android also needs
     the signing SHA-1 of the build you are running.

On device, a rejected key is loud:
  Android   adb logcat | grep -i "Google Maps Android API"
  iOS       the Xcode console prints a GMSServices authorization error
`);
