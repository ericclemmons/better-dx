import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  webExt: {
    binaries: {
      chrome:
        "/Applications/Google Chrome Beta.app/Contents/MacOS/Google Chrome Beta",
    },
    chromiumArgs: [
      "--auto-open-devtools-for-tabs",
      "--hide-crash-restore-bubble",
      "--remote-debugging-port=9222",
      "--user-data-dir=./.wxt/chrome-data",
    ],
    startUrls: ["http://localhost:5173"],
  },
});
