/* eslint-disable no-param-reassign, no-unused-expressions, no-undef */
import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  memo,
  useMemo,
} from "react";
import { deepEqual, deepMerge } from "./util";
import {
  getBounds,
  getBoundsScale,
  getEdgeAtPosition,
  getFitToScreen,
  getHoverPos,
  getKeyAction,
  getMousePos,
  getNodeAtPosition,
  getNodeScreenPos,
  getNodePositions,
  getScreenEdgePan,
  getPanScaleFromMouseWheel,
  getShapeAtPos,
  getHandleAtPos,
  setShapeByHandleDrag,
} from "./util";
import { defaultLayout } from "./layout";
import { defaultOptions } from "./options";
import { Renderer } from "./Renderer";
import { RevisNode, RevisEdge } from "./components";
import { usePanScale, useInteraction } from "./hooks";

import {
  RevisNetworkProps,
  RevisScreen,
  RevisShapeDefinition,
  RevisGraph,
  RevisNodeDefinition,
  RevisEdgeDefinition,
  HoverState,
  InteractionState,
  Bounds,
  RevisOptions,
} from "./types";

interface MousePayload {
  pos: { x: number; y: number };
  ctrlClick: boolean;
  e: MouseEvent;
}

const RevisNetworkBase = (props: RevisNetworkProps) => {
  const {
    className,
    callbackFn,
    customControls,
    debug = false,
    graph,
    identifier,
    images,
    layouter = defaultLayout,
    nodeDrawingFunction,
    onMouse,
    options,
    shapeDrawingFunction,
    shapes,
    shouldRunLayouter,
  } = props;

  const { psState, panScaleDispatch } = usePanScale();
  const { interactionState, interactionDispatch } = useInteraction();

  const [keyActionState, setKeyActionState] = useState<string | null>(null);
  const [hoverState, setHoverState] = useState<HoverState>({
    item: null,
    itemType: null,
  });
  const [rolloverState, setRolloverState] = useState<RevisNode | RevisEdge | null>(null);
  const [optionState, setOptionState] = useState<RevisOptions>(
    deepMerge({}, defaultOptions, options || {})
  );

  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const uid = useRef(identifier || 'revis-' + Math.random().toString(36).slice(2));

  const nodes = useRef<Map<string, RevisNode>>(
    new Map()
  );
  const edges = useRef<Map<string, RevisEdge>>(new Map());
  const shapesRef = useRef<RevisShapeDefinition[]>();
  const lastLayouterResult = useRef<ReturnType<typeof layouter> | null>(null);

  const baseCanvas = useRef<HTMLCanvasElement | null>(null);
  const [screenState, setScreenState] = useState<RevisScreen>({
    width: 0,
    height: 0,
    ratio: 1,
    boundingRect: null,
  });

  const screen = (): RevisScreen => ({
    width: baseCanvas.current?.clientWidth,
    height: baseCanvas.current?.clientHeight,
    ratio: window.devicePixelRatio || 1,
    boundingRect: baseCanvas.current?.getBoundingClientRect(),
  });

  const bounds = useMemo(
    () => getBounds(Array.from(nodes.current.values()), shapes),
    [nodes, edges, shapes, getBounds]
  );

  const getCamera = useCallback(() => ({ ...psState }), [psState]);

  const clearHover = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    if (hoverState.item) {
      setHoverState({
        item: null,
        itemType: null,
      });
    }
  };

  const setShowHover = (item: RevisNodeDefinition | RevisEdgeDefinition, itemType: string, pos: { x: number; y: number }) => {
    const delay = optionState?.hover?.delay || 750;
    const popupPosition = getHoverPos(pos, screen(), psState, optionState);
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => {
      setHoverState({
        ...hoverState,
        item,
        itemType,
        popupPosition,
      });
    }, delay);
  };

  const processShapeEdit = (type: string, payload: MousePayload) => {
    const om = onMouse;
    const { pos, ctrlClick, e } = payload;
    const iSt = interactionState;
    switch (type === "dblclick" ? "dblclick" : type.substr(5)) {
      case "down": {
        if (iSt.shape) {
          const handle = getHandleAtPos(iSt.shape, pos, psState.scale);
          if (handle) {
            interactionDispatch({ type: "handleDown", payload: handle });
            break;
          }
        }

        const shape = getShapeAtPos(shapes, pos);
        if (shape) {
          om && om("shapeClick", shape, e);
          if (shapes) {
            const idx = shapes.indexOf(shape);
            if (idx !== -1) {
              shapes.splice(idx, 1);
              shapes.push(shape);
            }
          }
          interactionDispatch({ type: "shapeDown", payload: shape });
        } else {
          om && om("backgroundClick");
          interactionDispatch({ type: "pan" });
        }
        break;
      }
      case "up": {
        if (iSt.shape && iSt.mouseMoved) {
          om && om("shapeUpdate", shapes ? [...shapes] : [], e);
        }
        interactionDispatch({ type: "shapeUp" });
        panScaleDispatch({
          type: "framePan",
          payload: null,
        });
        break;
      }

      case "move": {
        if (iSt.action === "pan") {
          const newPan = { ...psState.pan };
          newPan.x = Number(newPan.x) + e.movementX;
          newPan.y = Number(newPan.y) + e.movementY;
          panScaleDispatch({
            type: "pan",
            payload: newPan,
          });
          break;
        }

        if (iSt.action === "shapeDrag" && iSt.shape && iSt.shape.noEdit !== true) {
          iSt.shape.x = Number(iSt.shape.x) + e.movementX / psState.scale;
          iSt.shape.y = Number(iSt.shape.y) + e.movementY / psState.scale;
          interactionDispatch({ type: "shapeMove" });
        }

        if (iSt.action === "handleDrag" && iSt.shape && iSt.shape.noEdit !== true && iSt.shapeHandle) {
          const changes = setShapeByHandleDrag(
            iSt.shape,
            iSt.shapeHandle,
            {
              x: e.movementX / psState.scale,
              y: e.movementY / psState.scale,
            },
            ctrlClick
          );
          iSt.shape.x = changes.x;
          iSt.shape.y = changes.y;
          iSt.shape.width = changes.width;
          iSt.shape.height = changes.height;
          interactionDispatch({ type: "handleMove" });
        }
        break;
      }

      case "dblclick": {
        const shape = getShapeAtPos(shapes, pos);
        if (shape) {
          om && om("shapeDblClick", shape, e);
        }
        break;
      }

      case "leave": {
        break;
      }
      default:
        break;
    }
  };

  const processMouseAction = (type: string, payload: MousePayload) => {
    const iOps = optionState.interaction;
    const om = props.onMouse;
    if (iOps?.allowGraphInteraction) {
      const iSt = interactionState;
      switch (type === "dblclick" ? "dblclick" : type.substr(5)) {
        case "down": {
          const { pos, ctrlClick, e } = payload;
          const draggedNodes = new Set<RevisNodeDefinition>(ctrlClick ? iSt.draggedNodes : []);
          const n = getNodeAtPosition(nodes.current, pos);
          const ed = getEdgeAtPosition(
            edges.current,
            payload.pos,
            optionState.edges
          );
          if (n) {
            om && om("nodeClick", n.definition, e);
            draggedNodes.add(n.definition);
            interactionDispatch({
              type: "addToDrag",
              payload: Array.from(draggedNodes),
            });
          } else if (ed) {
            om && om("edgeClick", ed.definition, e);
            interactionDispatch({
              type: "edgeDown",
            });
          } else {
            interactionDispatch({ type: "pan" });
          }
          clearHover();
          break;
        }
        case "up": {
          const { e } = payload;
          if (
            !iSt.draggedNodes.length &&
            !iSt.mouseMoved &&
            iSt.action !== "edgeDown"
          ) {
            om && om("backgroundClick", null, e);
          }

          if (iSt.draggedNodes.length && iSt.mouseMoved && props.onMouse) {
            om && om("nodesDragged", iSt.draggedNodes, e);
          }
          interactionDispatch({ type: "releaseDrag" });
          panScaleDispatch({
            type: "framePan",
            payload: null,
          });
          break;
        }

        case "move": {
          const { pos, e } = payload;
          if (iSt.action === "drag" && iSt.draggedNodes.length > 0) {
            const lastNodeAdded = iSt.draggedNodes[iSt.draggedNodes.length - 1];
            const delta = {
              x: pos.x - Number(lastNodeAdded.x),
              y: pos.y - Number(lastNodeAdded.y),
            };
            iSt.draggedNodes.forEach((n: RevisNodeDefinition) => {
              n.x = (n.x || 0) + delta.x;
              n.y = (n.y || 0) + delta.y;
              n.fixed = true;
            });

            const sp = getScreenEdgePan(screen(), e);
            interactionDispatch({
              type: "mouseMoved",
            });
            panScaleDispatch({
              type: "framePan",
              payload: sp,
            });
          } else if (iSt.action === "pan") {
            const newPan = { ...psState.pan };
            newPan.x = Number(newPan.x) + e.movementX;
            newPan.y = Number(newPan.y) + e.movementY;
            panScaleDispatch({
              type: "pan",
              payload: newPan,
            });
          } else {
            const hn = getNodeAtPosition(nodes.current, pos);
            setRolloverState(hn);
            if (hn) {
              if (hn.definition !== hoverState.item) {
                const nPos = getNodeScreenPos(hn, psState);
                setShowHover(hn.definition, "node", nPos);
              }
            } else {
              const he = getEdgeAtPosition(
                edges.current,
                pos,
                optionState.edges
              );
              if (he) {
                setRolloverState(he);
                if (he && he.definition !== hoverState.item) {
                  const ePos = { x: e.clientX, y: e.clientY };
                  setShowHover(he.definition, "edge", ePos);
                }
              } else {
                if (hoverTimer.current) clearTimeout(hoverTimer.current);
                setRolloverState(null);
              }
            }
          }
          break;
        }
        case "leave": {
          panScaleDispatch({
            type: "framePan",
            payload: null,
          });
          interactionDispatch({
            type: "releaseDrag",
          });
          break;
        }
        case "dblclick": {
          const n = getNodeAtPosition(nodes.current, payload.pos);
          if (n) {
            om && om("nodeDblClick", n.definition, payload.e);
            break;
          }

          const edge = getEdgeAtPosition(
            edges.current,
            payload.pos,
            optionState.edges
          );
          if (edge) {
            om && om("edgeDblClick", edge.definition, payload.e);
            break;
          }

          const syntheticWheelEvent = Object.create(payload.e, {
            deltaY: { value: -150 },
          }) as WheelEvent;
          const { pan, scale } = getPanScaleFromMouseWheel(
            syntheticWheelEvent,
            psState,
            screen(),
            bounds,
            optionState
          );
          panScaleDispatch({
            type: "destination",
            payload: {
              pan,
              scale,
            },
          });

          break;
        }

        default:
          break;
      }
      return true;
    }
    if (iOps?.allowShapeInteraction) {
      processShapeEdit(type, payload);
    }
    return true;
  };

  const handleMouseWheel = (e: WheelEvent) => {
    const st = getPanScaleFromMouseWheel(
      e,
      psState,
      screen(),
      getBounds(Array.from(nodes.current.values()), shapes),
      optionState
    );
    panScaleDispatch({ type: "set", payload: st });
    if (e) e.stopPropagation();
  };

  const resize = (t: HTMLCanvasElement | null) => {
    if (!t) {
      return false;
    }
    baseCanvas.current = t;
    queueMicrotask(() => setScreenState(screen()));
    return true;
  };

  const handleMouse = (e: MouseEvent) => {
    if (!screen().boundingRect) {
      return false;
    }
    e.preventDefault();
    (e.target as HTMLElement)?.focus();
    const pos = getMousePos(e, screen(), psState);
    const ctrlClick = e.ctrlKey || e.metaKey || e.shiftKey;
    processMouseAction(e.type, { pos, ctrlClick, e });
    return true;
  };

  const handleZoomClick = (e: { preventDefault: () => void }, level: string) => {
    e && e.preventDefault();
    (baseCanvas.current as HTMLElement)?.focus();
    zoomHandler(level);
  };

  const handleKey = (event: KeyboardEvent) => {
    if (event.defaultPrevented) return false;
    event.stopPropagation();
    const key = event.key || event.keyCode;
    setKeyActionState(event.type === "keydown" ? getKeyAction(key) : null);
    return true;
  };

  // KEY ACTIONS ----------------------------------------
  const handleKeyAction = (a: string) => {
    panScaleDispatch({ type: "keyAction", payload: a });
  };

  const zoomToFit = useCallback(() => {
    setTimeout(() => interactionDispatch({ type: "endLayout" }), 300);
    const b = getBounds(Array.from(nodes.current.values()), shapes);
    const padding = optionState?.cameraOptions?.fitAllPadding || 10;
    const v = getFitToScreen(b, screen(), padding, optionState);
    if (v) {
      panScaleDispatch({ type: "destination", payload: v });
    }
    return true;
  }, [nodes.current.values(), shapes]);

  const zoomHandler = (level: string) => {
    const scr = screen();
    const bds = getBounds(Array.from(nodes.current.values()), shapes);
    const newScale = getBoundsScale(scr.height, scr.width, bds, optionState);
    let dn: RevisNodeDefinition | null = null;
    switch (level) {
      case "in":
        panScaleDispatch({
          type: "zoomIn",
          payload: { screen: scr, bounds: bds },
        });
        break;
      case "out":
        panScaleDispatch({
          type: "zoomOut",
          payload: { screen: scr, newScale, bounds: bds },
        });
        break;
      case "all":
        zoomToFit();
        break;
      case "selection":
        dn = interactionState.draggedNodes[0] || null;
        if (dn) {
          panScaleDispatch({
            type: "zoomSelection",
            payload: { screen: scr, dn: { x: dn.x || 0, y: dn.y || 0 } },
          });
        }
        break;

      default:
        break;
    }
    return true;
  };

  const edgePan = () => {
    const { scale, panPerFrame, pan } = psState;
    if (!panPerFrame) return;
    const pn = { ...pan };
    pn.x += panPerFrame.x * scale;
    pn.y += panPerFrame.y * scale;

    interactionState.draggedNodes.forEach((n: RevisNodeDefinition) => {
      n.x = (n.x || 0) - panPerFrame.x;
      n.y = (n.y || 0) - panPerFrame.y;
    });

    panScaleDispatch({
      type: "pan",
      payload: pn,
    });
  };

  // do what has to be done each frame
  const tickHandler = () => {
    if (keyActionState) {
      handleKeyAction(keyActionState);
    }

    if (psState.destinationScale) {
      zoomPanimate();
    }

    if (psState.panPerFrame) {
      edgePan();
    }
  };

  const zoomPanimate = () => {
    panScaleDispatch({ type: "zoomPanimate" });
  };

  const handlers = (type: string, payload?: HTMLCanvasElement | null) => {
    switch (type) {
      case "resize":
        resize(payload || null);
        break;

      case "tick":
        tickHandler();
        break;

      default:
        return true;
    }
    return true;
  };

  const runLayout = useCallback(() => {
    interactionDispatch({ type: "runLayout" });
    if (!nodes.current) return false;
    if (lastLayouterResult?.current?.stop) {
      lastLayouterResult.current.stop();
    }
    lastLayouterResult.current = layouter(
      {
        nodeMap: nodes.current,
        edgeMap: edges.current,
        shapes: shapesRef.current,
      },
      optionState?.layoutOptions || {},
      screen(),
      zoomToFit
    );
    return true;
  }, [
    interactionDispatch,
    layouter,
    optionState?.layoutOptions,
    screen,
    zoomToFit,
    nodes,
    edges,
    shapesRef,
  ]);

  const checkGraph = useCallback(
    (nextGraph: RevisGraph, nextShapes?: RevisShapeDefinition[]) => {
      type VisualClassType = typeof RevisNode | typeof RevisEdge;

      const setGraphType = (
        gType: RevisNodeDefinition[] | RevisEdgeDefinition[],
        mType: Map<string, RevisNode> | Map<string, RevisEdge>,
        VisualClass: VisualClassType
      ) => {
        let dirty = false;
        const dupMap: Record<string, number> = {};
        gType.forEach((n: RevisNodeDefinition | RevisEdgeDefinition) => {
          const has = mType.has(n.id);
          const existing = mType.get(n.id) as (RevisNode | RevisEdge) | undefined;
          const diff = has && existing && existing.definition !== n;
          if (!has || diff) {
            if (VisualClass === RevisEdge) {
              const edgeDef = n as RevisEdgeDefinition;
              const to = edgeDef.to.toString();
              const from = edgeDef.from.toString();
              const toFrom = [to, from].sort().join("-");
              let dupNumber = 0;
              if (dupMap[toFrom] !== undefined) {
                dupNumber = dupMap[toFrom] + 1;
                dupMap[toFrom] = dupNumber;
              } else {
                dupMap[toFrom] = 0;
              }
              (mType as Map<string, RevisEdge>).set(
                n.id,
                new RevisEdge(
                  n.id,
                  edgeDef,
                  nodes.current.get(to)!,
                  nodes.current.get(from)!,
                  dupNumber
                )
              );
            } else if (has && existing) {
              (existing as RevisNode).update(n as RevisNodeDefinition);
            } else {
              (mType as Map<string, RevisNode>).set(
                n.id,
                new RevisNode(n.id, n as RevisNodeDefinition, optionState)
              );
            }
            dirty = dirty || !has;
          }
        });

        mType.forEach((value, key) => {
          const definitions = gType.map((g) => g);
          if (!definitions.some((d) => d === value.definition)) {
            mType.delete(key);
            dirty = true;
          }
        });
        return dirty;
      };

      const shouldRunLayouterResult = shouldRunLayouter
        ? shouldRunLayouter(
            {
              graph: {
                nodes: [...nodes.current.values()].map((n) => n.definition),
                edges: [...edges.current.values()].map((e) => e.definition),
              },
              shapes: shapesRef.current,
            },
            {
              graph: nextGraph,
              shapes,
            }
          )
        : false;

      const nodesDirty = setGraphType(nextGraph.nodes, nodes.current, RevisNode);
      const edgesDirty = setGraphType(nextGraph.edges, edges.current, RevisEdge);
      shapesRef.current = nextShapes;

      const dirty = nodesDirty || edgesDirty;
      if (dirty || shouldRunLayouterResult) {
        runLayout();
      }
    },
    [shouldRunLayouter, runLayout, nodes, edges, shapesRef]
  );

  useEffect(() => {
    callbackFn &&
      callbackFn({
        nodes,
        getNodePositions,
        getPositions: () => getNodePositions(nodes.current),
        getCamera: () => getCamera(),
        fit: () => zoomToFit(),
      });
  }, [psState]);

  useEffect(() => {
    checkGraph(graph, shapes);
  }, [checkGraph, graph, shapes]);

  useEffect(() => {
    setOptionState(deepMerge({}, optionState, options));
  }, [options]);

  const lastLayoutOptions = useRef({});
  useEffect(() => {
    if (!deepEqual(options?.layoutOptions, lastLayoutOptions.current)) {
      lastLayoutOptions.current = options?.layoutOptions || {};
      runLayout();
    }
  }, [options?.layoutOptions]);

  useEffect(() => {
    runLayout();
  }, [layouter]);

  if (nodes.current && edges.current) {
    return (
      <Renderer
        clearHover={clearHover}
        customControls={customControls}
        edges={edges.current}
        handleKey={handleKey}
        handleMouse={handleMouse}
        handleMouseWheel={handleMouseWheel}
        handlers={handlers}
        handleZoom={handleZoomClick}
        hoverState={hoverState}
        images={images || {}}
        interactionState={interactionState}
        nodes={nodes.current}
        nodeDrawingFunction={nodeDrawingFunction}
        options={optionState}
        panScaleState={psState}
        rolloverState={rolloverState}
        screen={screenState}
        shapes={shapes || []}
        shapeDrawingFunction={shapeDrawingFunction}
        uid={uid}
        bounds={getBounds(Array.from(nodes.current.values()), shapes)}
      />
    );
  }

  return null;
};

const RevisNetwork = memo(RevisNetworkBase);

export { RevisNetwork };
