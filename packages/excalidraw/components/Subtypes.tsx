import React from "react";
import { updateActiveTool } from "@excalidraw/common";
import { getShortcutKey } from "../shortcut";
import { t } from "../i18n";
import type { Action } from "../actions/types";
import { makeCustomActionName } from "../actions/types";
import clsx from "clsx";
import type { Subtype, SubtypeRecord } from "../subtypes";
import {
  getSubtypeNames,
  hasAlwaysEnabledActions,
  isSubtypeAction,
  isValidSubtype,
  subtypeCollides,
  getSubtypeMethods,
} from "../subtypes";
import type { ExcalidrawElement, Theme } from "@excalidraw/element/types";
import {
  isTextElement,
  newElementWith,
  redrawTextBoundingBox,
  getBoundTextElement,
  hasBoundTextElement,
  getContainerElement,
  isBindableElement,
} from "@excalidraw/element";
import {
  useExcalidrawActionManager,
  useExcalidrawContainer,
  useExcalidrawSetAppState,
} from "./App";
import type { ContextMenuItems } from "./ContextMenu";
import { Island } from "./Island";

export const SubtypeButton = (
  subtype: Subtype,
  parentType: SubtypeRecord["parents"][number],
  icon: ({ theme }: { theme: Theme }) => React.ReactElement,
  key?: string,
) => {
  const title = key !== undefined ? ` - ${getShortcutKey(key)}` : "";
  const keyTest: Action["keyTest"] =
    key !== undefined ? (event) => event.code === `Key${key}` : undefined;
  const subtypeAction: Action = {
    name: makeCustomActionName(subtype),
    label: t(`toolBar.${subtype}` as any),
    trackEvent: false,
    predicate: (elements, appState, appProps, app) => {
      // Always show the subtype button - the active state is handled by className
      return true;
    },
    perform: (elements, appState, _value, app) => {
      // Get selected text elements
      const selectedTextElements = elements.filter(
        (el) => appState.selectedElementIds[el.id] && isTextElement(el),
      );

      // Get selected containers with bound text
      const selectedContainersWithText = elements.filter(
        (el) =>
          appState.selectedElementIds[el.id] &&
          isBindableElement(el) &&
          hasBoundTextElement(el),
      );

      // Get the bound text elements from selected containers
      const boundTextElementsFromContainers: ExcalidrawElement[] = [];
      const elementsMap = app.scene.getNonDeletedElementsMap();
      for (const container of selectedContainersWithText) {
        const boundText = getBoundTextElement(container, elementsMap);
        if (boundText) {
          boundTextElementsFromContainers.push(boundText);
        }
      }

      // Combine all text elements that should be toggled
      const allTextToToggle = [
        ...selectedTextElements,
        ...boundTextElementsFromContainers,
      ];

      // If text elements are selected (directly or via containers), toggle their subtype
      if (allTextToToggle.length > 0) {
        const subtypeMethods = getSubtypeMethods(subtype);

        // Create a Set of text element IDs to toggle for efficient lookup
        const textIdsToToggle = new Set(allTextToToggle.map((el) => el.id));

        const updatedElements = elements.map((el) => {
          // Only process text elements that should be toggled
          if (!textIdsToToggle.has(el.id) || !isTextElement(el)) {
            return el;
          }

          // Toggle: if element has this subtype, remove it; otherwise add it
          const hasSubtype = el.subtype === subtype;

          if (hasSubtype) {
            // Remove subtype - convert to regular text
            const { subtype: _, customData: __, ...rest } = el as any;
            const newElement = newElementWith(el, {
              ...rest,
              subtype: undefined,
              customData: undefined,
            });

            // Use standard measurement for regular text
            const container = getContainerElement(newElement, app.scene.getNonDeletedElementsMap());
            redrawTextBoundingBox(newElement, container, app.scene);

            return newElement;
          } else {
            // Add subtype - convert to math text
            const customData = appState.customData?.[subtype] || {};
            const newElement = newElementWith(el, {
              subtype,
              customData,
            });

            // Use subtype's measurement if available
            const container = getContainerElement(newElement, app.scene.getNonDeletedElementsMap());

            if (subtypeMethods?.measureText && subtypeMethods?.wrapText) {
              const customMeasureFn = (text: string, font: string, lineHeight: number) => {
                return subtypeMethods.measureText(newElement, {
                  text,
                  fontSize: newElement.fontSize,
                });
              };
              const customWrapFn = (text: string, font: string, maxWidth: number) => {
                return subtypeMethods.wrapText(newElement, maxWidth, {
                  text,
                  fontSize: newElement.fontSize,
                });
              };

              redrawTextBoundingBox(newElement, container, app.scene, customMeasureFn, customWrapFn);
            } else {
              redrawTextBoundingBox(newElement, container, app.scene);
            }

            return newElement;
          }
        });

        return {
          elements: updatedElements,
          appState,
          captureUpdate: "IMMEDIATELY",
        };
      }

      // No text selected - original behavior (toggle active tool)
      const inactive = !appState.activeSubtypes?.includes(subtype);
      const activeSubtypes: Subtype[] = [];
      if (appState.activeSubtypes) {
        activeSubtypes.push(...appState.activeSubtypes);
      }
      let activated = false;
      if (inactive) {
        // Ensure `element.subtype` is well-defined
        if (!subtypeCollides(subtype, activeSubtypes)) {
          activeSubtypes.push(subtype);
          activated = true;
        }
      } else {
        // Can only be active if appState.activeSubtypes is defined
        // and contains subtype.
        activeSubtypes.splice(activeSubtypes.indexOf(subtype), 1);
      }
      const type =
        appState.activeTool.type !== "custom" &&
        isValidSubtype(subtype, appState.activeTool.type)
          ? appState.activeTool.type
          : parentType;
      const activeTool = !inactive
        ? appState.activeTool
        : updateActiveTool(appState, { type });
      const selectedElementIds = activated ? {} : appState.selectedElementIds;
      const selectedGroupIds = activated ? {} : appState.selectedGroupIds;

      return {
        appState: {
          ...appState,
          activeSubtypes,
          selectedElementIds,
          selectedGroupIds,
          activeTool,
        },
        captureUpdate: "IMMEDIATELY",
      };
    },
    keyTest,
    PanelComponent: ({ elements, appState, updateData, data }) => {
      // Check if any selected text elements have this subtype
      const selectedTextElements = elements.filter(
        (el) => appState.selectedElementIds[el.id] && isTextElement(el),
      );
      const hasSelectedMathText = selectedTextElements.some((el) => el.subtype === subtype);

      // Check if any selected containers have bound text with this subtype
      // Build elementsMap from elements array
      const elementsMap = new Map(elements.map((el) => [el.id, el]));
      const selectedContainersWithMathText = elements.some((el) => {
        if (
          appState.selectedElementIds[el.id] &&
          isBindableElement(el) &&
          hasBoundTextElement(el)
        ) {
          const boundText = getBoundTextElement(el, elementsMap);
          return boundText?.subtype === subtype;
        }
        return false;
      });

      // Determine if button should be selected
      const isSelected = hasSelectedMathText ||
        selectedContainersWithMathText ||
        (appState.activeSubtypes !== undefined && appState.activeSubtypes.includes(subtype));

      // Update tooltip based on context
      const hasTextSelection = selectedTextElements.length > 0 || selectedContainersWithMathText;
      const baseLabel = t(`toolBar.${subtype}` as any);
      const tooltipText = hasTextSelection
        ? `Toggle ${baseLabel}${title}`
        : `${baseLabel}${title}`;

      return (
        <button
          className={clsx("ToolIcon_type_button", "ToolIcon_type_button--show", {
            ToolIcon: true,
            "ToolIcon--selected": isSelected,
            "ToolIcon--plain": true,
          })}
          title={tooltipText}
          aria-label={t(`toolBar.${subtype}` as any)}
          onClick={() => {
            updateData(null);
          }}
          onContextMenu={
            data && "onContextMenu" in data
              ? (event: React.MouseEvent) => {
                  if (
                    appState.activeSubtypes === undefined ||
                    (appState.activeSubtypes !== undefined &&
                      !appState.activeSubtypes.includes(subtype))
                  ) {
                    updateData(null);
                  }
                  data.onContextMenu(event, subtype);
                }
              : undefined
          }
        >
          {
            <div className="ToolIcon__icon" aria-hidden="true">
              {icon.call(this, { theme: appState.theme })}
            </div>
          }
        </button>
      );
    },
  };
  if (key === "") {
    delete subtypeAction.keyTest;
  }
  return subtypeAction;
};

export const SubtypeToggles = () => {
  const am = useExcalidrawActionManager();
  const { container } = useExcalidrawContainer();
  const setAppState = useExcalidrawSetAppState();

  const onContextMenu = (
    event: React.MouseEvent<HTMLButtonElement>,
    subtype: string,
  ) => {
    event.preventDefault();

    const { top: offsetTop, left: offsetLeft } =
      container!.getBoundingClientRect();
    const left = event.clientX - offsetLeft;
    const top = event.clientY - offsetTop;

    const items: ContextMenuItems = [];
    // Filter actions manually since filterActions doesn't exist
    const elements = am.getElementsIncludingDeleted();
    const appState = am.getAppState();
    Object.values(am.actions).forEach((action) => {
      if (
        isSubtypeAction(action, elements, appState, am.app) &&
        am.isActionEnabled(action)
      ) {
        items.push(action);
      }
    });
    setAppState({}, () => {
      setAppState({
        contextMenu: { top, left, items },
      });
    });
  };

  // Only render if one or more subtypes are registered
  if (getSubtypeNames().length === 0) {
    return <></>;
  }
  return (
    <>
      <Island
        style={{
          marginLeft: 8,
          alignSelf: "center",
          height: "fit-content",
        }}
      >
        {getSubtypeNames().map((subtype) => (
          <React.Fragment key={subtype}>
            {am.renderAction(
              makeCustomActionName(subtype) as any,
              hasAlwaysEnabledActions(subtype) ? { onContextMenu } : {},
            )}
          </React.Fragment>
        ))}
      </Island>
    </>
  );
};

SubtypeToggles.displayName = "SubtypeToggles";

export const SubtypeShapeActions = (props: {
  elements: readonly ExcalidrawElement[];
}) => {
  const am = useExcalidrawActionManager();
  // Filter actions manually since filterActions doesn't exist
  const elements = am.getElementsIncludingDeleted();
  const appState = am.getAppState();
  const subtypeActions = Object.values(am.actions).filter((action) =>
    isSubtypeAction(action, elements, appState, am.app)
  );
  return (
    <>
      {subtypeActions.map((action) => (
        <React.Fragment key={action.name}>
          {am.renderAction(action.name as any)}
        </React.Fragment>
      ))}
    </>
  );
};

SubtypeShapeActions.displayName = "SubtypeShapeActions";
