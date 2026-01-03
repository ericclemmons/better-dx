/// <reference path="../.wxt/wxt.d.ts" />

export default defineBackground(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});
