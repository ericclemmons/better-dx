/// <reference path="../../.wxt/wxt.d.ts" />

import { newHttpBatchRpcSession } from "capnweb";

interface BetterDevApi {
  info(): Promise<{
    baseUrl: string;
    directory: string;
    projectId: string;
    projectUrl: string;
  }>;
  sessionCreate(params: {
    prompt: string;
    sourcePath?: string;
    screenshot?: string;
  }): Promise<{ sessionId: string }>;
  openInEditor(path: string): Promise<{ success: boolean }>;
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

const RPC_URL = "http://127.0.0.1:1337/rpc";

const mainContainer = document.getElementById(
  "main-container"
) as HTMLDivElement;
const emptyState = document.getElementById("empty-state") as HTMLDivElement;
const componentPathEl = document.getElementById(
  "component-path"
) as HTMLDivElement;
const sourcePathEl = document.getElementById("source-path") as HTMLDivElement;
const viewSourceBtn = document.getElementById(
  "view-source-btn"
) as HTMLButtonElement;
const thumbnailPlaceholder = document.getElementById(
  "thumbnail-placeholder"
) as HTMLDivElement;
const thumbnailImg = document.getElementById("thumbnail") as HTMLImageElement;
const promptTextarea = document.getElementById(
  "prompt-textarea"
) as HTMLTextAreaElement;
const submitBtn = document.getElementById("submit-btn") as HTMLButtonElement;

let currentElement: ElementInfo | null = null;
let currentScreenshot: string | null = null;
let projectInfo: { projectId: string; projectUrl: string } | null = null;

function showEmptyState() {
  mainContainer.classList.add("hidden");
  emptyState.classList.remove("hidden");
}

function showMainContainer() {
  mainContainer.classList.remove("hidden");
  emptyState.classList.add("hidden");
}

function updateComponentPath(el: ElementInfo) {
  if (el.ownerName) {
    componentPathEl.innerHTML = `<span class="owner">${el.ownerName}</span><span class="separator">&gt;</span><span class="element">${el.elementName}</span>`;
  } else {
    componentPathEl.innerHTML = `<span class="element">${el.elementName}</span>`;
  }
}

function updateSourcePath(dataSource: string | null) {
  if (dataSource) {
    sourcePathEl.textContent = dataSource;
    sourcePathEl.classList.remove("hidden");
    viewSourceBtn.classList.remove("hidden");
  } else {
    sourcePathEl.classList.add("hidden");
    viewSourceBtn.classList.add("hidden");
  }
}

function updateThumbnail(screenshot: string | null) {
  if (screenshot) {
    thumbnailImg.src = screenshot;
    thumbnailImg.classList.remove("hidden");
    thumbnailPlaceholder.classList.add("hidden");
  } else {
    thumbnailImg.classList.add("hidden");
    thumbnailPlaceholder.classList.remove("hidden");
  }
}

function updateSubmitButton() {
  const hasPrompt = promptTextarea.value.trim().length > 0;
  const hasElement = currentElement !== null;
  submitBtn.disabled = !(hasPrompt && hasElement);
}

function updateElementInfo(el: ElementInfo | null, screenshot: string | null) {
  currentElement = el;
  currentScreenshot = screenshot;

  if (!el) {
    showEmptyState();
    return;
  }

  showMainContainer();
  updateComponentPath(el);
  updateSourcePath(el.dataSource);
  updateThumbnail(screenshot);
  updateSubmitButton();
  promptTextarea.focus();
}

async function handleSubmit() {
  if (!(currentElement && projectInfo)) {
    return;
  }

  const prompt = promptTextarea.value.trim();
  if (!prompt) {
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Creating...";

  try {
    const rpc = newHttpBatchRpcSession<BetterDevApi>(RPC_URL);
    const result = await rpc.sessionCreate({
      prompt: `Element: ${currentElement.componentPath}\n\n${prompt}`,
      sourcePath: currentElement.dataSource || undefined,
      screenshot: currentScreenshot || undefined,
    });

    browser.runtime.sendMessage({
      type: "opencode:navigate",
      projectId: projectInfo.projectId,
      sessionId: result.sessionId,
    });

    promptTextarea.value = "";
  } catch (err) {
    console.error("[opencode-elements-pane] Failed to create session:", err);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Start Session";
    updateSubmitButton();
  }
}

async function handleViewSource() {
  if (!currentElement?.dataSource) {
    return;
  }
  try {
    const rpc = newHttpBatchRpcSession<BetterDevApi>(RPC_URL);
    await rpc.openInEditor(currentElement.dataSource);
  } catch (err) {
    console.error("[opencode-elements-pane] Failed to open in editor:", err);
  }
}

browser.runtime.onMessage.addListener(
  (message: {
    type: string;
    projectId?: string;
    sessionId?: string;
    element?: ElementInfo;
    screenshot?: string;
  }) => {
    if (message.type === "opencode:element-selected") {
      updateElementInfo(message.element ?? null, message.screenshot ?? null);
    }
  }
);

promptTextarea.addEventListener("input", updateSubmitButton);
submitBtn.addEventListener("click", handleSubmit);
viewSourceBtn.addEventListener("click", handleViewSource);

async function init() {
  try {
    const rpc = newHttpBatchRpcSession<BetterDevApi>(RPC_URL);
    const info = await rpc.info();
    projectInfo = { projectId: info.projectId, projectUrl: info.projectUrl };
    updateSubmitButton();

    browser.runtime.sendMessage({ type: "opencode:request-selected-element" });
  } catch (err) {
    console.error("[opencode-elements-pane] Failed to connect to RPC:", err);
  }
}

init();
