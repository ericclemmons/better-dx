/// <reference path="../../.wxt/wxt.d.ts" />

try {
  chrome.devtools.panels.create(
    "Turborepo",
    "icon/128.png",
    "turbo-panel.html"
  );
} catch (error) {
  console.error("Failed to create Turborepo panel:", error);
}

try {
  chrome.devtools.panels.create("AI", "icon/128.png", "ai-panel.html");
} catch (error) {
  console.error("Failed to create AI panel:", error);
}
