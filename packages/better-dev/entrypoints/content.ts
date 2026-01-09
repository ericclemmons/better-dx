/// <reference path="../.wxt/wxt.d.ts" />

interface ClickedElementInfo {
  tagName: string;
  className: string;
  id: string;
  textContent: string;
  dataSource: string;
}

let lastClickedElement: Element | null = null;

function getElementInfo(el: Element | null): ClickedElementInfo | null {
  if (!el) {
    return null;
  }
  const classAttr = el.getAttribute("class") || "";
  return {
    tagName: el.tagName?.toLowerCase() || "",
    className: classAttr,
    id: el.id || "",
    textContent: (el.textContent || "").slice(0, 100).trim(),
    dataSource: el.getAttribute("data-tsd-source") || "",
  };
}

export default defineContentScript({
  matches: ["<all_urls>"],
  main() {
    document.addEventListener(
      "contextmenu",
      (e) => {
        lastClickedElement = e.target as Element;
      },
      true
    );

    browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message.type === "better-dev:get-clicked-element") {
        const info = getElementInfo(lastClickedElement);
        sendResponse(info);
        return true;
      }
      return false;
    });
  },
});
