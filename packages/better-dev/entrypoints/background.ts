/// <reference path="../.wxt/wxt.d.ts" />

const MENU_ID_ROOT = "better-dev";
const MENU_ID_GO_TO_SOURCE = "better-dev-go-to-source";
const MENU_ID_EDIT_WITH_OPENCODE = "better-dev-edit-with-opencode";

interface ElementBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

async function captureAndCropScreenshot(
  tabId: number,
  bounds: ElementBounds
): Promise<string | null> {
  try {
    const tab = await chrome.tabs.get(tabId);
    if (!tab.windowId) {
      return null;
    }

    const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, {
      format: "png",
    });

    const croppedDataUrl = await cropImage(dataUrl, bounds, tab.width ?? 0);
    return croppedDataUrl;
  } catch (error) {
    console.error("[better-dev] Failed to capture screenshot:", error);
    return null;
  }
}

async function cropImage(
  dataUrl: string,
  bounds: ElementBounds,
  tabWidth: number
): Promise<string> {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  const imageBitmap = await createImageBitmap(blob);

  const scale = imageBitmap.width / tabWidth;
  const scaledBounds = {
    x: Math.round(bounds.x * scale),
    y: Math.round(bounds.y * scale),
    width: Math.round(bounds.width * scale),
    height: Math.round(bounds.height * scale),
  };

  const canvas = new OffscreenCanvas(scaledBounds.width, scaledBounds.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  ctx.drawImage(
    imageBitmap,
    scaledBounds.x,
    scaledBounds.y,
    scaledBounds.width,
    scaledBounds.height,
    0,
    0,
    scaledBounds.width,
    scaledBounds.height
  );

  const croppedBlob = await canvas.convertToBlob({ type: "image/png" });
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to convert to base64"));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read blob"));
    reader.readAsDataURL(croppedBlob);
  });
}

export default defineBackground(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

  chrome.contextMenus.create({
    id: MENU_ID_ROOT,
    title: "better-dev",
    contexts: ["all"],
  });

  chrome.contextMenus.create({
    id: MENU_ID_GO_TO_SOURCE,
    parentId: MENU_ID_ROOT,
    title: "Go to Source...",
    contexts: ["all"],
  });

  chrome.contextMenus.create({
    id: MENU_ID_EDIT_WITH_OPENCODE,
    parentId: MENU_ID_ROOT,
    title: "Edit with OpenCode...",
    contexts: ["all"],
  });

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === "opencode:capture-screenshot") {
      const { tabId, bounds } = message as {
        tabId: number;
        bounds: ElementBounds;
      };
      captureAndCropScreenshot(tabId, bounds).then(sendResponse);
      return true;
    }

    if (message.type === "opencode:element-selected") {
      chrome.runtime.sendMessage(message);
      return false;
    }

    return false;
  });

  chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (!tab?.id) {
      return;
    }

    if (info.menuItemId === MENU_ID_GO_TO_SOURCE) {
      const response = await chrome.tabs.sendMessage(tab.id, {
        type: "better-dev:get-clicked-element",
      });
      if (response?.dataSource) {
        console.log("[better-dev] Go to source:", response.dataSource);
      }
    }

    if (info.menuItemId === MENU_ID_EDIT_WITH_OPENCODE) {
      const response = await chrome.tabs.sendMessage(tab.id, {
        type: "better-dev:get-clicked-element",
      });
      console.log("[better-dev] Edit with OpenCode:", response);
    }
  });
});
