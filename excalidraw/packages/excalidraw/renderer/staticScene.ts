import { FRAME_STYLE, throttleRAF } from "@excalidraw/common";
import { isElementLink } from "@excalidraw/element";
import { createPlaceholderEmbeddableLabel } from "@excalidraw/element";
import { getBoundTextElement } from "@excalidraw/element";
import {
  isEmbeddableElement,
  isIframeLikeElement,
  isTextElement,
} from "@excalidraw/element";
import {
  elementOverlapsWithFrame,
  getTargetFrame,
  shouldApplyFrameClip,
} from "@excalidraw/element";
import { renderElement } from "@excalidraw/element";
import { getElementAbsoluteCoords } from "@excalidraw/element";

import type {
  ElementsMap,
  ExcalidrawFrameLikeElement,
  NonDeletedExcalidrawElement,
} from "@excalidraw/element/types";

import {
  EXTERNAL_LINK_IMG,
  ELEMENT_LINK_IMG,
  getLinkHandleFromCoords,
} from "../components/hyperlink/helpers";

import { bootstrapCanvas, getNormalizedCanvasDimensions } from "./helpers";
import { renderInfiniteGrid, GridStyle, getAdaptiveGridSize } from "./infiniteGrid";

import type {
  StaticCanvasRenderConfig,
  StaticSceneRenderConfig,
} from "../scene/types";
import type { StaticCanvasAppState } from "../types";

// ==== GRID KOLORY ====
const GRID_COLORS = {
  minor: "#e5e5e5",
  major: "#dddddd",
} as const;

// ==== FRAME CLIP ====
export const frameClip = (
  frame: ExcalidrawFrameLikeElement,
  context: CanvasRenderingContext2D,
  renderConfig: StaticCanvasRenderConfig,
  appState: StaticCanvasAppState,
) => {
  context.translate(frame.x + appState.scrollX, frame.y + appState.scrollY);
  context.beginPath();
  if (context.roundRect) {
    context.roundRect(
      0,
      0,
      frame.width,
      frame.height,
      FRAME_STYLE.radius / appState.zoom.value,
    );
  } else {
    context.rect(0, 0, frame.width, frame.height);
  }
  context.clip();
  context.translate(
    -(frame.x + appState.scrollX),
    -(frame.y + appState.scrollY),
  );
};

// ==== LINK ICON CACHE ====
type LinkIconCanvas = HTMLCanvasElement & { zoom: number };
const linkIconCanvasCache: {
  regularLink: LinkIconCanvas | null;
  elementLink: LinkIconCanvas | null;
} = { regularLink: null, elementLink: null };

const renderLinkIcon = (
  element: NonDeletedExcalidrawElement,
  context: CanvasRenderingContext2D,
  appState: StaticCanvasAppState,
  elementsMap: ElementsMap,
) => {
  if (element.link && !appState.selectedElementIds[element.id]) {
    const [x1, y1, x2, y2] = getElementAbsoluteCoords(element, elementsMap);
    const [x, y, width, height] = getLinkHandleFromCoords(
      [x1, y1, x2, y2],
      element.angle,
      appState,
    );
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    context.save();
    context.translate(appState.scrollX + centerX, appState.scrollY + centerY);
    context.rotate(element.angle);

    const canvasKey = isElementLink(element.link)
      ? "elementLink"
      : "regularLink";
    let linkCanvas = linkIconCanvasCache[canvasKey];

    if (!linkCanvas || linkCanvas.zoom !== appState.zoom.value) {
      linkCanvas = Object.assign(document.createElement("canvas"), {
        zoom: appState.zoom.value,
      });
      linkCanvas.width = width * window.devicePixelRatio * appState.zoom.value;
      linkCanvas.height =
        height * window.devicePixelRatio * appState.zoom.value;
      linkIconCanvasCache[canvasKey] = linkCanvas;

      const cc = linkCanvas.getContext("2d")!;
      cc.scale(
        window.devicePixelRatio * appState.zoom.value,
        window.devicePixelRatio * appState.zoom.value,
      );
      cc.fillStyle = appState.viewBackgroundColor || "#fff";
      cc.fillRect(0, 0, width, height);
      if (canvasKey === "elementLink") {
        cc.drawImage(ELEMENT_LINK_IMG, 0, 0, width, height);
      } else {
        cc.drawImage(EXTERNAL_LINK_IMG, 0, 0, width, height);
      }
      cc.restore?.();
    }
    context.drawImage(linkCanvas, x - centerX, y - centerY, width, height);
    context.restore();
  }
};

// ==== RENDER ====
const _renderStaticScene = ({
  canvas,
  rc,
  elementsMap,
  allElementsMap,
  visibleElements,
  scale,
  appState,
  renderConfig,
}: StaticSceneRenderConfig) => {
  if (!canvas) return;

  const { renderGrid = true, isExporting } = renderConfig;

  const [normalizedWidth, normalizedHeight] = getNormalizedCanvasDimensions(
    canvas,
    scale,
  );

  const context = bootstrapCanvas({
    canvas,
    scale,
    normalizedWidth,
    normalizedHeight,
    theme: appState.theme,
    isExporting,
    viewBackgroundColor: appState.viewBackgroundColor,
  });

  // 1) GRID (screen-space, bez setTransform; zakotwiczony w world-space)
  if (renderGrid && appState.gridModeEnabled) {
    const sizeWorld = getAdaptiveGridSize(
      Math.max(1, appState.gridSize || 16),
      appState.zoom,
    );
    renderInfiniteGrid(context, normalizedWidth, normalizedHeight, {
      size: sizeWorld,
      scrollX: appState.scrollX,
      scrollY: appState.scrollY,
      zoom: appState.zoom,
      style: GridStyle.LINES,               // DOTS / CROSS jeśli chcesz
      color: GRID_COLORS.minor,
      majorColor: GRID_COLORS.major,
      opacity: 0.35,
      lineWidth: 1,
      majorGridMultiplier: Math.max(1, appState.gridStep || 5),
      majorLineWidth: 1.5,
    });
  }

  // 2) CONTENT (world-space, transform kamery)
  context.scale(appState.zoom.value, appState.zoom.value);

  const groupsToBeAddedToFrame = new Set<string>();
  visibleElements.forEach((element) => {
    if (
      element.groupIds.length > 0 &&
      appState.frameToHighlight &&
      appState.selectedElementIds[element.id] &&
      (elementOverlapsWithFrame(
        element,
        appState.frameToHighlight,
        elementsMap,
      ) ||
        element.groupIds.find((gid) => groupsToBeAddedToFrame.has(gid)))
    ) {
      element.groupIds.forEach((gid) => groupsToBeAddedToFrame.add(gid));
    }
  });
  const inFrameGroupsMap = new Map<string, boolean>();

  // Rysuj elementy (poza iframe'ami)
  visibleElements
    .filter((el) => !isIframeLikeElement(el))
    .forEach((element) => {
      try {
        const frameId = element.frameId || appState.frameToHighlight?.id;

        if (
          isTextElement(element) &&
          element.containerId &&
          elementsMap.has(element.containerId)
        ) {
          return; // tekst wyrenderuje się z kontenerem
        }

        context.save();

        if (
          frameId &&
          appState.frameRendering.enabled &&
          appState.frameRendering.clip
        ) {
          const frame = getTargetFrame(element, elementsMap, appState);
          if (
            frame &&
            shouldApplyFrameClip(
              element,
              frame,
              appState,
              elementsMap,
              inFrameGroupsMap,
            )
          ) {
            frameClip(frame, context, renderConfig, appState);
          }
        }

        renderElement(
          element,
          elementsMap,
          allElementsMap,
          rc,
          context,
          renderConfig,
          appState,
        );

        const boundTextElement = getBoundTextElement(element, elementsMap);
        if (boundTextElement) {
          renderElement(
            boundTextElement,
            elementsMap,
            allElementsMap,
            rc,
            context,
            renderConfig,
            appState,
          );
        }

        context.restore();

        if (!isExporting) {
          renderLinkIcon(element, context, appState, elementsMap);
        }
      } catch (error: any) {
        console.error(
          error,
          element.id,
          element.x,
          element.y,
          element.width,
          element.height,
        );
      }
    });

  // Iframe/embeds na wierzchu
  visibleElements
    .filter((el) => isIframeLikeElement(el))
    .forEach((element) => {
      try {
        const render = () => {
          renderElement(
            element,
            elementsMap,
            allElementsMap,
            rc,
            context,
            renderConfig,
            appState,
          );

          if (
            isIframeLikeElement(element) &&
            (isExporting ||
              (isEmbeddableElement(element) &&
                renderConfig.embedsValidationStatus.get(element.id) !== true)) &&
            element.width &&
            element.height
          ) {
            const label = createPlaceholderEmbeddableLabel(element);
            renderElement(
              label,
              elementsMap,
              allElementsMap,
              rc,
              context,
              renderConfig,
              appState,
            );
          }
          if (!isExporting) {
            renderLinkIcon(element, context, appState, elementsMap);
          }
        };

        const frameId = element.frameId || appState.frameToHighlight?.id;
        if (
          frameId &&
          appState.frameRendering.enabled &&
          appState.frameRendering.clip
        ) {
          context.save();
          const frame = getTargetFrame(element, elementsMap, appState);
          if (
            frame &&
            shouldApplyFrameClip(
              element,
              frame,
              appState,
              elementsMap,
              inFrameGroupsMap,
            )
          ) {
            frameClip(frame, context, renderConfig, appState);
          }
          render();
          context.restore();
        } else {
          render();
        }
      } catch (error: any) {
        console.error(error);
      }
    });

  // flowchart pending
  renderConfig.pendingFlowchartNodes?.forEach((element) => {
    try {
      renderElement(
        element,
        elementsMap,
        allElementsMap,
        rc,
        context,
        renderConfig,
        appState,
      );
    } catch (error) {
      console.error(error);
    }
  });
};

/** throttled to animation framerate */
export const renderStaticSceneThrottled = throttleRAF(
  (config: StaticSceneRenderConfig) => {
    _renderStaticScene(config);
  },
  { trailing: true },
);

/** Static scene canvas (elements). */
export const renderStaticScene = (
  renderConfig: StaticSceneRenderConfig,
  throttle?: boolean,
) => {
  if (throttle) {
    renderStaticSceneThrottled(renderConfig);
    return;
  }
  _renderStaticScene(renderConfig);
};
