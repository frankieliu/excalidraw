import { KEYS } from "@excalidraw/common";

import { getCommonBounds } from "@excalidraw/element/bounds";
import { getNonDeletedElements } from "@excalidraw/element";
import { CaptureUpdateAction } from "@excalidraw/element";

import { isValidExcalidrawData } from "../data/json";
import { t } from "../i18n";

import { register } from "./register";

export const actionImportExcalidraw = register({
  name: "importExcalidraw",
  label: "labels.importExcalidraw",
  trackEvent: { category: "export" },
  perform: (_elements, appState, _data, app) => {
    // Create hidden file input
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".excalidraw";
    input.multiple = false;

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        document.body.removeChild(input);
        return;
      }

      try {
        const fileContent = await file.text();
        const data = JSON.parse(fileContent);

        // Validate Excalidraw data
        if (!isValidExcalidrawData(data)) {
          app.syncActionResult({
            captureUpdate: CaptureUpdateAction.EVENTUALLY,
            appState: {
              ...app.state,
              toast: {
                message: t("toast.importExcalidrawFailed"),
                closable: true,
                duration: 5000,
              },
            },
          });
          document.body.removeChild(input);
          return;
        }

        const importedElements = data.elements || [];

        if (importedElements.length === 0) {
          app.syncActionResult({
            captureUpdate: CaptureUpdateAction.EVENTUALLY,
            appState: {
              ...app.state,
              toast: {
                message: t("toast.noExcalidrawElements"),
                closable: true,
                duration: 3000,
              },
            },
          });
          document.body.removeChild(input);
          return;
        }

        // Calculate smart position to avoid overlapping with existing elements
        const existingElements = getNonDeletedElements(
          app.scene.getElementsIncludingDeleted(),
        );

        // Get viewport center in scene coordinates
        const viewportCenterX = appState.scrollX + appState.width / 2;
        const viewportCenterY = appState.scrollY + appState.height / 2;

        let targetPosition: { clientX: number; clientY: number };

        if (existingElements.length === 0) {
          // No existing elements, use viewport center
          targetPosition = {
            clientX: viewportCenterX,
            clientY: viewportCenterY,
          };
        } else {
          // Get bounds of existing elements
          const existingBounds = getCommonBounds(existingElements);
          const existingCenterX = (existingBounds[0] + existingBounds[2]) / 2;
          const existingCenterY = (existingBounds[1] + existingBounds[3]) / 2;

          // Get bounds of imported elements to calculate their size
          const importedBounds = getCommonBounds(importedElements);
          const importedWidth = importedBounds[2] - importedBounds[0];
          const importedHeight = importedBounds[3] - importedBounds[1];

          // Determine position relative to viewport and existing content
          const viewportRelativeX = viewportCenterX - existingCenterX;
          const viewportRelativeY = viewportCenterY - existingCenterY;

          // Padding between existing content and imported content
          const PADDING = 50;

          // Decide placement based on viewport position
          let targetX: number;
          let targetY: number;

          // Determine horizontal placement
          if (viewportRelativeX < -existingBounds[2] / 4) {
            // Viewport is to the left, place imported content to the left
            targetX = existingBounds[0] - importedWidth - PADDING;
          } else if (viewportRelativeX > existingBounds[2] / 4) {
            // Viewport is to the right, place imported content to the right
            targetX = existingBounds[2] + PADDING;
          } else {
            // Viewport is centered horizontally, use viewport center
            targetX = viewportCenterX - importedWidth / 2;
          }

          // Determine vertical placement
          if (viewportRelativeY < -existingBounds[3] / 4) {
            // Viewport is above, place imported content above
            targetY = existingBounds[1] - importedHeight - PADDING;
          } else if (viewportRelativeY > existingBounds[3] / 4) {
            // Viewport is below, place imported content below
            targetY = existingBounds[3] + PADDING;
          } else {
            // Viewport is centered vertically, use viewport center
            targetY = viewportCenterY - importedHeight / 2;
          }

          targetPosition = { clientX: targetX, clientY: targetY };
        }

        // Use addElementsFromPasteOrLibrary to handle:
        // - ID regeneration
        // - Positioning at calculated position
        // - Binary files merging
        // - Grouping
        // - Selection
        app.addElementsFromPasteOrLibrary({
          elements: importedElements,
          files: data.files || null,
          position: targetPosition,
          retainSeed: false,
        });

        // Show success toast
        app.syncActionResult({
          captureUpdate: CaptureUpdateAction.EVENTUALLY,
          appState: {
            ...app.state,
            toast: {
              message: t("toast.importedExcalidrawElements", {
                count: importedElements.length.toString(),
              }),
              closable: true,
              duration: 3000,
            },
          },
        });
      } catch (error: any) {
        console.error("Excalidraw import failed:", error);
        app.syncActionResult({
          captureUpdate: CaptureUpdateAction.EVENTUALLY,
          appState: {
            ...app.state,
            toast: {
              message: t("toast.importExcalidrawError", {
                error: error.message || "Unknown error",
              }),
              closable: true,
              duration: 5000,
            },
          },
        });
      } finally {
        // Cleanup
        document.body.removeChild(input);
      }
    };

    // Add to DOM and trigger click
    input.style.display = "none";
    document.body.appendChild(input);
    input.click();

    return {
      captureUpdate: CaptureUpdateAction.NEVER,
    };
  },
  keyTest: (event) =>
    event[KEYS.CTRL_OR_CMD] && event.shiftKey && event.key === KEYS.X,
});
