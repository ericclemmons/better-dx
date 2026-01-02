try {
  chrome.devtools.panels.create(
    "OpenCode",
    "icon/128.png",
    "opencode-panel.html"
  );
} catch (error) {
  console.error("Failed to create OpenCode panel:", error);
}

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
