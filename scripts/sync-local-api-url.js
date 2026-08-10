/* global __dirname */
const fs = require("fs");
const os = require("os");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const ENV_PATH = path.join(ROOT, ".env");
const PORT = process.env.API_PORT || "8001";

function lanIpv4() {
  const preferred = [];
  const fallback = [];
  const interfaces = os.networkInterfaces();

  for (const [name, entries] of Object.entries(interfaces)) {
    for (const entry of entries || []) {
      const family = entry.family === "IPv4" || entry.family === 4;
      if (!family || entry.internal) {
        continue;
      }
      const item = { name, address: entry.address };
      if (/wi-?fi|wlan|wireless/i.test(name)) {
        preferred.push(item);
      } else {
        fallback.push(item);
      }
    }
  }

  return (preferred[0] || fallback[0] || { address: "127.0.0.1" }).address;
}

function resolveHost(target) {
  switch ((target || "device").toLowerCase()) {
    case "android-emulator":
    case "emulator":
      return "10.0.2.2";
    case "ios-simulator":
    case "simulator":
      return "127.0.0.1";
    case "device":
    case "lan":
    default:
      return lanIpv4();
  }
}

function upsertEnv(contents, key, value) {
  const line = `${key}=${value}`;
  const pattern = new RegExp(`^${key}=.*$`, "m");
  if (pattern.test(contents)) {
    return contents.replace(pattern, line);
  }
  const suffix = contents.endsWith("\n") || contents.length === 0 ? "" : "\n";
  return `${contents}${suffix}${line}\n`;
}

const target = process.argv[2] || "device";
const host = resolveHost(target);
const apiBaseUrl = `http://${host}:${PORT}`;

let existing = "";
if (fs.existsSync(ENV_PATH)) {
  existing = fs.readFileSync(ENV_PATH, "utf8");
} else {
  existing = [
    "APP_ENV=development",
    "EXPO_PUBLIC_APP_ENV=development",
    "EXPO_PUBLIC_API_BASE_URL=",
    ""
  ].join("\n");
}

let next = existing;
next = upsertEnv(next, "APP_ENV", "development");
next = upsertEnv(next, "EXPO_PUBLIC_APP_ENV", "development");
next = upsertEnv(next, "EXPO_PUBLIC_API_BASE_URL", apiBaseUrl);

fs.writeFileSync(ENV_PATH, next, "utf8");
console.log(`Updated ${path.relative(ROOT, ENV_PATH)}`);
console.log(`EXPO_PUBLIC_API_BASE_URL=${apiBaseUrl}`);
console.log("Restart Expo with a clean cache if it was already running: npm run start:local");
