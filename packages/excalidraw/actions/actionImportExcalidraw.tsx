import { register } from "./register";
import { StoreAction } from "../store";
import { t } from "../i18n";
import { KEYS } from "../keys";
import { isValidExcalidrawData } from "../data/json";

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
            appState: {
              ...app.state,
              toast: {
                message: t("toast.importExcalidrawFailed"),
                closable: true,
                duration: 5000,
              },
            },
            storeAction: StoreAction.NONE,
          });
          document.body.removeChild(input);
          return;
        }

        const importedElements = data.elements || [];

        if (importedElements.length === 0) {
          app.syncActionResult({
            appState: {
              ...app.state,
              toast: {
                message: t("toast.noExcalidrawElements"),
                closable: true,
                duration: 3000,
              },
            },
            storeAction: StoreAction.NONE,
          });
          document.body.removeChild(input);
          return;
        }

        // Use addElementsFromPasteOrLibrary to handle:
        // - ID regeneration
        // - Positioning at center
        // - Binary files merging
        // - Grouping
        // - Selection
        app.addElementsFromPasteOrLibrary({
          elements: importedElements,
          files: data.files || null,
          position: "center",
          retainSeed: false,
        });

        // Show success toast
        app.syncActionResult({
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
          storeAction: StoreAction.CAPTURE,
        });
      } catch (error: any) {
        console.error("Excalidraw import failed:", error);
        app.syncActionResult({
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
    event[KEYS.CTRL_OR_CMD] && event.shiftKey && event.key === KEYS.X,
});
