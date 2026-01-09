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

interface ElementInfo {
  tagName: string;
  className: string;
  id: string;
  elementName: string;
  ownerName: string | null;
  componentPath: string;
  dataSource: string | null;
  bounds: { x: number; y: number; width: number; height: number };
}

function evalElementInfo(): Promise<ElementInfo | null> {
  return new Promise((resolve) => {
    chrome.devtools.inspectedWindow.eval(
      `(function() {
        const el = $0;
        if (!el) return null;

        function getReactInstanceForElement(element) {
          if ('__REACT_DEVTOOLS_GLOBAL_HOOK__' in window) {
            const { renderers } = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
            for (const renderer of renderers.values()) {
              try {
                const fiber = renderer.findFiberByHostInstance(element);
                if (fiber) return fiber;
              } catch (e) {}
            }
          }
          for (const key in element) {
            if (key.startsWith('__reactFiber')) return element[key];
            if (key.startsWith('__reactInternalInstance$')) return element[key];
          }
          return null;
        }

        function getDisplayNameForInstance(instance) {
          if (!instance) return null;
          const { elementType, tag } = instance;
          switch (tag) {
            case 0: case 1:
              return elementType?.displayName || elementType?.name || 'Anonymous';
            case 5:
              return elementType;
            case 11:
              return elementType?.displayName || 'forwardRef';
            case 14: case 15:
              return elementType?.type?.name || 'memo';
            default:
              return null;
          }
        }

        function findDataSource(element) {
          let current = element;
          while (current) {
            const source = current.getAttribute?.('data-tsd-source');
            if (source) return source;
            current = current.parentElement;
          }
          return null;
        }

        const fiber = getReactInstanceForElement(el);
        const elementName = getDisplayNameForInstance(fiber);
        const ownerFiber = fiber?._debugOwner;
        const ownerName = getDisplayNameForInstance(ownerFiber);
        const dataSource = findDataSource(el);
        const rect = el.getBoundingClientRect();

        return {
          tagName: el.tagName?.toLowerCase() || '',
          className: el.getAttribute?.('class') || '',
          id: el.id || '',
          elementName: elementName || el.tagName?.toLowerCase() || '',
          ownerName: ownerName || null,
          componentPath: ownerName ? ownerName + ' > ' + (elementName || el.tagName?.toLowerCase()) : (elementName || el.tagName?.toLowerCase()),
          dataSource: dataSource,
          bounds: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
        };
      })()`,
      (result, error) => {
        if (error) {
          console.error("[opencode] Failed to eval element:", error);
          resolve(null);
          return;
        }
        resolve(result as ElementInfo | null);
      }
    );
  });
}

try {
  chrome.devtools.panels.elements.createSidebarPane("OpenCode", (sidebar) => {
    sidebar.setPage("opencode-elements-pane.html");

    async function updateElementInfo() {
      const tabId = chrome.devtools.inspectedWindow.tabId;
      const element = await evalElementInfo();

      if (!element) {
        chrome.runtime.sendMessage({
          type: "opencode:element-selected",
          element: null,
          screenshot: null,
          tabId,
        });
        return;
      }

      let screenshot: string | null = null;
      if (element.bounds.width > 0 && element.bounds.height > 0) {
        screenshot = await chrome.runtime.sendMessage({
          type: "opencode:capture-screenshot",
          tabId,
          bounds: element.bounds,
        });
      }

      chrome.runtime.sendMessage({
        type: "opencode:element-selected",
        element,
        screenshot,
        tabId,
      });
    }

    chrome.devtools.panels.elements.onSelectionChanged.addListener(() => {
      updateElementInfo();
    });

    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === "opencode:request-selected-element") {
        updateElementInfo();
      }
    });

    updateElementInfo();
  });
} catch (error) {
  console.error("Failed to create OpenCode sidebar pane:", error);
}
