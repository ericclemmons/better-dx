const VIDEO_METADATA_TIMEOUT_MS = 5000;
const VIDEO_READY_TIMEOUT_MS = 5000;
const VIDEO_READY_POLL_INTERVAL_MS = 10;

interface ElementBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

function getElementBounds(element: Element): ElementBounds {
  const rect = element.getBoundingClientRect();
  return {
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
  };
}

function captureVideoFrame(
  video: HTMLVideoElement,
  bounds: ElementBounds
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      reject(new Error("Failed to get canvas context"));
      return;
    }

    const scaleX = video.videoWidth / window.innerWidth;
    const scaleY = video.videoHeight / window.innerHeight;
    const scaledBounds = {
      x: bounds.x * scaleX,
      y: bounds.y * scaleY,
      width: bounds.width * scaleX,
      height: bounds.height * scaleY,
    };

    canvas.width = scaledBounds.width;
    canvas.height = scaledBounds.height;

    context.drawImage(
      video,
      scaledBounds.x,
      scaledBounds.y,
      scaledBounds.width,
      scaledBounds.height,
      0,
      0,
      scaledBounds.width,
      scaledBounds.height
    );

    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Failed to create image blob"));
        }
      },
      "image/png",
      1.0
    );
  });
}

/**
 * Capture a screenshot of an element using getDisplayMedia.
 *
 * @param element - The element to capture. Defaults to document.body.
 * @returns A Promise resolving to a PNG Blob of the element.
 *
 * @example
 * ```ts
 * // Capture the entire page
 * const blob = await screenshot();
 *
 * // Capture a specific element
 * const blob = await screenshot(document.querySelector('.my-component'));
 *
 * // In DevTools console, capture the selected element
 * const blob = await screenshot($0);
 * ```
 */
export async function screenshot(
  element: Element = document.body
): Promise<Blob> {
  const bounds = getElementBounds(element);

  const stream = await navigator.mediaDevices.getDisplayMedia({
    video: {
      displaySurface: "browser",
    },
    preferCurrentTab: true,
  } as DisplayMediaStreamOptions);

  const video = document.createElement("video");
  video.srcObject = stream;
  video.autoplay = true;
  video.playsInline = true;

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Video metadata loading timed out"));
    }, VIDEO_METADATA_TIMEOUT_MS);

    video.onerror = () => {
      clearTimeout(timeout);
      reject(new Error("Video failed to load"));
    };

    video.onloadedmetadata = () => {
      clearTimeout(timeout);
      video.play().then(resolve, resolve);
    };
  });

  await new Promise<void>((resolve, reject) => {
    const startTime = Date.now();

    const checkReady = () => {
      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        resolve();
        return;
      }

      if (Date.now() - startTime >= VIDEO_READY_TIMEOUT_MS) {
        reject(new Error("Video frame not ready within timeout"));
        return;
      }

      setTimeout(checkReady, VIDEO_READY_POLL_INTERVAL_MS);
    };

    checkReady();
  });

  try {
    return await captureVideoFrame(video, bounds);
  } finally {
    for (const track of stream.getTracks()) {
      track.stop();
    }
    video.srcObject = null;
  }
}

/**
 * Copy a Blob to the clipboard.
 *
 * @param blob - A Blob or Promise<Blob> to copy.
 * @returns The resolved Blob after copying.
 *
 * @example
 * ```ts
 * // Copy a screenshot to clipboard
 * const blob = await copyToClipboard(screenshot($0));
 *
 * // Or chain directly
 * await copyToClipboard(screenshot(element));
 * ```
 */
export async function copyToClipboard(
  blob: Blob | Promise<Blob>
): Promise<Blob> {
  const resolvedBlob = await blob;
  await navigator.clipboard.write([
    new ClipboardItem({ [resolvedBlob.type]: resolvedBlob }),
  ]);
  return resolvedBlob;
}

/**
 * Convert a Blob to a base64 data URL.
 *
 * @param blob - The Blob to convert.
 * @returns A Promise resolving to a base64 data URL string.
 *
 * @example
 * ```ts
 * const dataUrl = await toBase64(await screenshot($0));
 * // "data:image/png;base64,iVBORw0KGgo..."
 * ```
 */
export function toBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to read blob as base64"));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read blob"));
    reader.readAsDataURL(blob);
  });
}
