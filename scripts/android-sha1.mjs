#!/usr/bin/env node
/**
 * Prints the debug-keystore SHA-1 for Google Maps key restrictions.
 *
 * Only relevant to Android — iOS application restrictions use the bundle id
 * alone. And only to *local debug* builds: every signing identity has its own
 * fingerprint, so an EAS or Play Store build needs a different one. See the
 * notes printed at the end.
 *
 * Usage: node scripts/android-sha1.mjs
 */
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const KEYSTORE = join(homedir(), ".android", "debug.keystore");

// Android's debug keystore uses fixed, publicly documented credentials — these
// are not secrets.
const ALIAS = "androiddebugkey";
const PASSWORD = "android";

/** keytool ships with any JDK; look where one is most likely to be. */
function findKeytool() {
  const candidates = [
    process.env.JAVA_HOME && join(process.env.JAVA_HOME, "bin", "keytool"),
    // Android Studio bundles its own JDK, which is often the only one present.
    "C:/Program Files/Android/Android Studio/jbr/bin/keytool",
    process.env.LOCALAPPDATA &&
      join(process.env.LOCALAPPDATA, "Programs", "Android Studio", "jbr", "bin", "keytool"),
    "/Applications/Android Studio.app/Contents/jbr/Contents/Home/bin/keytool",
    "keytool"
  ].filter(Boolean);

  for (const candidate of candidates) {
    try {
      execFileSync(candidate, ["-help"], { stdio: "ignore" });
      return candidate;
    } catch {
      // Not here; try the next one.
    }
  }
  return null;
}

if (!existsSync(KEYSTORE)) {
  console.log(`
No debug keystore at ${KEYSTORE}

It is created by the first Android build. Run:
  npx expo run:android
then try this again.
`);
  process.exit(1);
}

const keytool = findKeytool();
if (!keytool) {
  console.log(`
Could not find keytool. It ships with any JDK — set JAVA_HOME, or install
Android Studio (which bundles one at jbr/bin/keytool).
`);
  process.exit(1);
}

const output = execFileSync(
  keytool,
  ["-list", "-v", "-alias", ALIAS, "-keystore", KEYSTORE, "-storepass", PASSWORD, "-keypass", PASSWORD],
  { encoding: "utf8" }
);

const sha1 = output.match(/SHA1:\s*([0-9A-F:]+)/i)?.[1];
if (!sha1) {
  console.log("keytool ran but returned no SHA1. Raw output:\n");
  console.log(output);
  process.exit(1);
}

console.log(`
Debug SHA-1   ${sha1}
Package       com.uwstudyspots.app

Add both in Google Cloud Console:
  Credentials > your key > Application restrictions > Android apps > Add

This fingerprint covers LOCAL DEBUG BUILDS only (npx expo run:android).
Other build types are signed differently and need their own entries — a key
restriction accepts several, so add every one you use:

  EAS build     npx eas credentials         (needs eas.json at the project
                root, else it exits with "eas.json could not be found")
  Play Store    Play Console > Test and release > App signing
                Use the "App signing key certificate" SHA-1, not the upload key.

A mismatch here fails at runtime with a valid key — the map renders blank.
Confirm on device with:
  adb logcat | grep -i "Google Maps Android API"
`);
