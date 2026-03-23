import { getFontString } from "@excalidraw/common";

import { isExcalidrawElement, newElementWith } from "@excalidraw/element";
import { measureText, redrawTextBoundingBox } from "@excalidraw/element";

import {
  isTextElement,
  hasBoundTextElement,
  getBoundTextElement,
} from "@excalidraw/element";

import { CaptureUpdateAction } from "@excalidraw/element";

import type { ExcalidrawElement } from "@excalidraw/element/types";

import { getSelectedElements } from "../scene";

import { register } from "./register";

export const actionTextAutoResize = register({
  name: "autoResize",
  label: "labels.autoResize",
  icon: null,
  trackEvent: { category: "element" },
  predicate: (elements, appState, _: unknown) => {
    const selectedElements = getSelectedElements(elements, appState);
    return (
      selectedElements.length === 1 &&
      isTextElement(selectedElements[0]) &&
      !selectedElements[0].autoResize
    );
  },
  perform: (elements, appState, targetElement) => {
    const selectedElements = getSelectedElements(elements, appState);

    const targetTextElement =
      isExcalidrawElement(targetElement) && isTextElement(targetElement)
        ? targetElement
        : (selectedElements[0] as ExcalidrawElement | undefined);

    return {
      appState,
      elements: elements.map((element) => {
        if (element.id === targetTextElement?.id && isTextElement(element)) {
          const metrics = measureText(
            element.originalText,
            getFontString(element),
            element.lineHeight,
          );

          return newElementWith(element, {
            autoResize: true,
            width: metrics.width,
            height: metrics.height,
            text: element.originalText,
          });
        }
        return element;
      }),
      captureUpdate: CaptureUpdateAction.IMMEDIATELY,
    };
  },
});

export const actionRefreshTextBounds = register({
  name: "refreshTextBounds",
  label: "labels.refreshTextBounds",
  icon: null,
  trackEvent: { category: "element" },
  predicate: (_elements, appState, _props, app) => {
    // Only show when there are text elements in the scene
    const elements = app.scene.getNonDeletedElements();
    return elements.some((el) => isTextElement(el) || hasBoundTextElement(el));
  },
  perform: (_elements, appState, _, app) => {
    const scene = app.scene;
    const elements = scene.getNonDeletedElements();
    const elementsMap = scene.getNonDeletedElementsMap();

    // Refresh all text elements and text within containers
    elements.forEach((element) => {
      if (isTextElement(element)) {
        // Standalone text element
        const container = element.containerId
          ? elementsMap.get(element.containerId)
          : null;
        redrawTextBoundingBox(element, container || null, scene);
      } else if (hasBoundTextElement(element)) {
        // Container with text
        const boundText = getBoundTextElement(element, elementsMap);
        if (boundText) {
          redrawTextBoundingBox(boundText, element, scene);
        }
      }
    });

    return {
      appState,
      captureUpdate: CaptureUpdateAction.IMMEDIATELY,
    };
  },
});
