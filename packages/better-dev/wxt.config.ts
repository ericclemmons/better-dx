import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  manifest: {
    action: {},
    host_permissions: [
      "http://localhost:*/*",
      "http://127.0.0.1:*/*",
      "ws://localhost:*/*",
      "ws://127.0.0.1:*/*",
    ],
  },
  webExt: {
    binaries: {
      chrome:
        "/Applications/Google Chrome Beta.app/Contents/MacOS/Google Chrome Beta",
    },
    chromiumArgs: [
      "--hide-crash-restore-bubble",
      "--remote-debugging-port=9222",
      "--user-data-dir=./.wxt/chrome-data",
    ],
    startUrls: ["http://localhost:5173"],
  },
});
