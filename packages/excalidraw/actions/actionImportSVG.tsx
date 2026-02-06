import { register } from "./register";
import { StoreAction } from "../store";
import { t } from "../i18n";
import { randomId } from "../random";
import { KEYS } from "../keys";
import type { ExcalidrawElement } from "../element/types";
import { newElementWith } from "../element/mutateElement";

// @ts-ignore - local package
import svgToEx from "svg-to-excalidraw";

export const actionImportSVG = register({
  name: "importSVG",
  label: "labels.importSVG",
  trackEvent: { category: "export" },
  perform: (_elements, appState, _data, app) => {
    // Create hidden file input
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".svg,image/svg+xml";
    input.multiple = false;

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        document.body.removeChild(input);
        return;
      }

      try {
        const svgContent = await file.text();

        // Convert SVG using svg-to-excalidraw
        const { hasErrors, errors, content } = svgToEx.convert(svgContent);

        if (hasErrors) {
          const errorMessage = errors
            ? Array.from(errors)
                .map((e) => e.textContent || "Unknown error")
                .join(", ")
            : "Unknown error";

          app.syncActionResult({
            appState: {
              ...app.state,
              toast: {
                message: t("toast.importSVGError", {
                  error: errorMessage,
                }),
                closable: true,
                duration: 5000,
              },
            },
            storeAction: StoreAction.NONE,
          });
          document.body.removeChild(input);
          return;
        }

        // Parse the result
        const result = typeof content === "string" ? JSON.parse(content) : content;
        const importedElements: ExcalidrawElement[] = result.elements || [];

        if (importedElements.length === 0) {
          app.syncActionResult({
            appState: {
              ...app.state,
              toast: {
                message: t("toast.noElementsImported"),
                closable: true,
                duration: 3000,
              },
            },
            storeAction: StoreAction.NONE,
          });
          document.body.removeChild(input);
          return;
        }

        // Create a group ID for all imported elements
        const groupId = randomId();

        // Apply grouping to elements
        const newElements = importedElements.map((el) => {
          return newElementWith(el, {
            groupIds: [groupId],
          });
        });

        // Use addElementsFromPasteOrLibrary to add elements at center
        app.addElementsFromPasteOrLibrary({
          elements: newElements,
          files: null,
          position: "center",
          retainSeed: false,
        });

        // Show success toast
        app.syncActionResult({
          appState: {
            ...app.state,
            toast: {
              message: t("toast.importedElements", {
                count: newElements.length.toString(),
              }),
              closable: true,
              duration: 3000,
            },
          },
          storeAction: StoreAction.CAPTURE,
        });
      } catch (error: any) {
        console.error("SVG import failed:", error);
        app.syncActionResult({
          appState: {
            ...app.state,
            toast: {
              message: t("toast.importSVGFailed", {
                error: error.message || "Unknown error",
              }),
              closable: true,
              duration: 5000,
            },
          },
          storeAction: StoreAction.NONE,
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
      storeAction: StoreAction.NONE,
    };
  },
  keyTest: (event) =>
    event[KEYS.CTRL_OR_CMD] && event.shiftKey && event.key === KEYS.I,
});
