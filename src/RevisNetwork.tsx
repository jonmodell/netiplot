/* eslint-disable no-param-reassign, no-unused-expressions, no-undef */
import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  memo,
  useMemo,
} from "react";
import uniqid from 'uniqid';
import { isEqual, merge } from "lodash";
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

import { RevisNetworkBaseProps, RevisScreen, RevisShapeDefinition, RevisGraph } from "./types";

const RevisNetworkBase = (props: RevisNetworkBaseProps) => {
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

  const [keyActionState, setKeyActionState] = useState(null);
  const [hoverState, setHoverState] = useState<{item: any, itemType: string | null}>({
    item: null,
    itemType: null,
  });
  const [rolloverState, setRolloverState] = useState(null);
  const [optionState, setOptionState] = useState(
    merge({}, defaultOptions, options || {})
  );

  const hoverTimer: React.RefObject<any> = useRef(null);
  const uid = useRef(identifier || uniqid('revis-'));

  const nodes = useRef<Map<string, RevisNode>>(
    new Map()
  );
  const edges = useRef<Map<string, RevisEdge>>(new Map());
  const shapesRef = useRef<RevisShapeDefinition[]>();
  const lastLayouterResult = useRef(props.layouter);

  const baseCanvas: React.RefObject<HTMLCanvasElement> = useRef<HTMLCanvasElement | null>(
    null
  );
  const [screenState, setScreenState] = useState<RevisScreen>({
    width: 0,
    height: 0,
    ratio: 1,
    boundingRect: null,
  });

  /**
   *
   * @returns RevisScreen
   */
  const screen = () => ({
    width: baseCanvas.current?.clientWidth,
    height: baseCanvas.current?.clientHeight,
    ratio: window.devicePixelRatio || 1,
    boundingRect: baseCanvas.current?.getBoundingClientRect(),
  });

  const bounds = useMemo(
    // @ts-ignore
    () => getBounds(Array.from(nodes.current) || [], shapes),
    [nodes, edges, shapes, getBounds]
  );

  const getCamera = useCallback(() => ({ ...psState }), [psState]);

  const clearHover = () => {
    clearTimeout(hoverTimer.current);
    if (hoverState.item) {
      setHoverState({
        item: null,
        itemType: null,
      });
    }
  };

  const setShowHover = (item: any, itemType: string, pos: { x: any; y: any; }) => {
    const delay = optionState?.hover?.delay || 750;
    const popupPosition = getHoverPos(pos, screen(), psState, optionState);
    clearTimeout(hoverTimer.current);
    // @ts-ignore
    hoverTimer.current = setTimeout(() => {
      setHoverState({
        ...hoverState,
        item,
        itemType,
        // @ts-ignore
        popupPosition,
      });
    }, delay);
  };

  const processShapeEdit = (type: string, payload: { pos: any; ctrlClick: any; e: any; }) => {
    const om = onMouse;
    // ctrl click should constrain height and width
    // node should not be negatively sized
    // node should not be allowed to become too small
    const { pos, ctrlClick, e } = payload;
    const iSt = interactionState;
    switch (type === "dblclick" ? "dblclick" : type.substr(5)) {
      case "down": {
        // if a shape is already selected, check for handle clicks
        // @ts-ignore
        if (iSt.shape) {
          // @ts-ignore
          const handle = getHandleAtPos(iSt.shape, pos, psState.scale);
          if (handle) {
            interactionDispatch({ type: "handleDown", payload: handle });
            break;
          }
        }

        // check for shape click and set edit shape id
        const shape = getShapeAtPos(shapes, pos);
        if (shape) {
          om && om("shapeClick", shape, e);
          // @ts-ignore
          shapes.splice(shapes.indexOf(shape), 1);
          // @ts-ignore
          shapes.push(shape);
          interactionDispatch({ type: "shapeDown", payload: shape });
          // set interaction state to shape dragging
        } else {
          om && om("backgroundClick");
          interactionDispatch({ type: "pan" }); // pan
        }
        break;
      }
      case "up": {
        // @ts-ignore
        if (iSt.shape && iSt.mouseMoved) {
          // @ts-ignore
          om && om("shapeUpdate", [...shapes], e);
        }
        interactionDispatch({ type: "shapeUp" });
        // @ts-ignore
        panScaleDispatch({
          type: "framePan",
          payload: null,
        });
        break;
      }

      case "move": {
        if (iSt.action === "pan") {
          // PANNING
          const newPan = { ...psState.pan };
          newPan.x = Number(newPan.x) + e.movementX;
          newPan.y = Number(newPan.y) + e.movementY;
          // @ts-ignore
          panScaleDispatch({
            type: "pan",
            payload: newPan,
          });
          break;
        }

        // only allow shapes to drag or resize if they don't have the noEdit flag
        // @ts-ignore
        if (iSt.action === "shapeDrag" && iSt.shape.noEdit !== true) {
          // @ts-ignore
          iSt.shape.x = Number(iSt.shape.x) + e.movementX / psState.scale;
          // @ts-ignore
          iSt.shape.y = Number(iSt.shape.y) + e.movementY / psState.scale;
          interactionDispatch({ type: "shapeMove" });
        }

        // @ts-ignore
        if (iSt.action === "handleDrag" && iSt.shape.noEdit !== true) {
          const changes = setShapeByHandleDrag(
            // @ts-ignore
            iSt.shape,
            // @ts-ignore
            iSt.shapeHandle,
            {
              x: e.movementX / psState.scale,
              y: e.movementY / psState.scale,
            },
            ctrlClick
          );
          // @ts-ignore
          iSt.shape.x = changes.x;
          // @ts-ignore
          iSt.shape.y = changes.y;
          // @ts-ignore
          iSt.shape.width = changes.width;
          // @ts-ignore
          iSt.shape.height = changes.height;
          interactionDispatch({ type: "handleMove" });
        }
        break;
      }

      case "leave": {
        // console.log('leave');
        break;
      }
      default:
        break;
    }
  };

  /**
   * if graph interactions are enabled, process those first and stop (return true).
   * then, if shape interactions are enabled, process them
   */
  const processMouseAction = (type: string, payload: { pos?: any; ctrlClick?: any; e: any; }) => {
    const iOps = optionState.interaction;
    const om = props.onMouse;
    // @ts-ignore
    if (iOps.allowGraphInteraction) {
      const iSt = interactionState;
      switch (type === "dblclick" ? "dblclick" : type.substr(5)) {
        case "down": {
          const { pos, ctrlClick, e } = payload;
          // @ts-ignore
          const draggedNodes = new Set(ctrlClick ? iSt.draggedNodes : []);
          const n = getNodeAtPosition(nodes.current, pos);
          const ed = getEdgeAtPosition(
            edges.current,
            payload.pos,
            optionState.edges
          );
          if (n) {
            // drag if we clicked on a node
            om && om("nodeClick", n, e);
            draggedNodes.add(n);
            interactionDispatch({
              type: "addToDrag",
              payload: Array.from(draggedNodes),
            });
          } else if (ed) {
            om && om("edgeClick", ed, e);
            interactionDispatch({
              type: "edgeDown",
            });
          } else {
            interactionDispatch({ type: "pan" }); // pan
          }
          clearHover();
          break;
        }
        case "up": {
          const { e } = payload;
          // only registrer background  click if we were not dragging
          if (
            // @ts-ignore
            !iSt.draggedNodes.length &&
            // @ts-ignore
            !iSt.mouseMoved &&
            iSt.action !== "edgeDown"
          ) {
            om && om("backgroundClick", null, e);
          }

          // if there were nodes dragging and there is a handler, alert the handler one more time
          // @ts-ignore
          if (iSt.draggedNodes.length && iSt.mouseMoved && props.onMouse) {
            // @ts-ignore
            om && om("nodesDragged", iSt.draggedNodes, e);
          }
          interactionDispatch({ type: "releaseDrag" }); // release dragging
          // @ts-ignore
          panScaleDispatch({
            type: "framePan",
            payload: null,
          });
          break;
        }

        case "move": {
          const { pos, e } = payload;
          // @ts-ignore
          if (iSt.action === "drag" && iSt.draggedNodes.length > 0) {
            // DRAGGING
            // this.clearHover();
            // @ts-ignore
            const lastNodeAdded = iSt.draggedNodes[iSt.draggedNodes.length - 1];
            const delta = {
              x: pos.x - Number(lastNodeAdded.x),
              y: pos.y - Number(lastNodeAdded.y),
            };
            // @ts-ignore
            iSt.draggedNodes.forEach((n) => {
              n.x += delta.x;
              n.y += delta.y;
              n.fixed = true;
            });

            const sp = getScreenEdgePan(screen(), e);
            interactionDispatch({
              type: "mouseMoved",
            });
            // @ts-ignore
            panScaleDispatch({
              type: "framePan",
              payload: sp,
            });
          } else if (iSt.action === "pan") {
            // PANNING
            const newPan = { ...psState.pan };
            newPan.x = Number(newPan.x) + e.movementX;
            newPan.y = Number(newPan.y) + e.movementY;
            // @ts-ignore
            panScaleDispatch({
              type: "pan",
              payload: newPan,
            });
          } else {
            // HOVERING
            const hn = getNodeAtPosition(nodes.current, pos);
            setRolloverState(hn);
            if (hn) {
              if (hn !== hoverState.item) {
                const nPos = getNodeScreenPos(hn, psState);
                setShowHover(hn, "node", nPos);
              }
            } else {
              const he = getEdgeAtPosition(
                edges.current,
                pos,
                optionState.edges
              );
              if (he) {
                // HOVERING EDGES, since there were no nodes -------------------
                setRolloverState(he);
                if (he && he !== hoverState.item) {
                  const ePos = { x: e.clientX, y: e.clientY };
                  setShowHover(he, "edge", ePos);
                }
              } else {
                // WE ARE HOVING OVER BLANK SPACE ------------------------------
                clearTimeout(hoverTimer.current);
                setRolloverState(null);
              }
            }
          }
          break;
        }
        case "leave": {
          // @ts-ignore
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
          // check node collision
          const n = getNodeAtPosition(nodes.current, payload.pos);
          if (n) {
            om && om("nodeDblClick", n, payload.e);
            break;
          }

          // check edge collision
          const edge = getEdgeAtPosition(
            edges.current,
            payload.pos,
            optionState.edges
          );
          if (edge) {
            om && om("edgeDblClick", edge, payload.e);
            break;
          }

          // nothing found so zoom to double click point
          const newE = payload.e;
          newE.deltaY = -150;
          const { pan, scale } = getPanScaleFromMouseWheel(
            newE,
            psState,
            screen(),
            bounds,
            optionState
          );
          // @ts-ignore
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
    // @ts-ignore
    if (iOps.allowShapeInteraction) {
      // @ts-ignore
      processShapeEdit(type, payload);
    }
    return true;
  };

  const handleMouseWheel = (e: MouseEvent) => {
    const st = getPanScaleFromMouseWheel(
      e,
      psState,
      screen(),
      // @ts-ignore
      getBounds(nodes.current.values(), shapes, optionState),
      optionState
    );
    // @ts-ignore
    panScaleDispatch({ type: "set", payload: st });
    if (e) e.stopPropagation();
  };

  const resize = (t: any) => {
    if (!t) {
      return false;
    }
    // @ts-ignore
    baseCanvas.current = t;
    // Defer state update to avoid setting state on a parent during a child's render/layout phase
    queueMicrotask(() => setScreenState(screen()));
    return true;
  };

  const handleMouse = (e: MouseEvent) => {
    if (!screen().boundingRect) {
      return false;
    }
    e.preventDefault();
    // @ts-ignore
    e.target && e.target.focus();
    const pos = getMousePos(e, screen(), psState);
    const ctrlClick = e.ctrlKey || e.metaKey || e.shiftKey;
    processMouseAction(e.type, { pos, ctrlClick, e });
    return true;
  };

  const handleZoomClick = (e: { preventDefault: () => any; }, level: any) => {
    e && e.preventDefault();
    // @ts-ignore
    baseCanvas.current.focus();
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
  const handleKeyAction = (a: any) => {
    // @ts-ignore
    panScaleDispatch({ type: "keyAction", payload: a });
  };

  const zoomToFit = useCallback(() => {
    setTimeout(() => interactionDispatch({ type: "endLayout" }), 300);
    // @ts-ignore
    const b = getBounds(nodes.current.values(), shapes);
    const padding = optionState?.cameraOptions?.fitAllPadding || 10;
    const v = getFitToScreen(b, screen(), padding, optionState);
    // @ts-ignore
    panScaleDispatch({ type: "destination", payload: v });
    return true;
  }, [nodes.current.values(), shapes]);

  const zoomHandler = (level: any) => {
    const scr = screen();
    // @ts-ignore
    const bds = getBounds(nodes.current.values(), shapes);
    const newScale = getBoundsScale(scr.height, scr.width, bds, optionState);
    let dn = null;
    switch (level) {
      case "in":
        // @ts-ignore
        panScaleDispatch({
          type: "zoomIn",
          payload: { screen: scr, bounds: bds },
        });
        break;
      case "out":
        // @ts-ignore
        panScaleDispatch({
          type: "zoomOut",
          payload: { screen: scr, newScale, bounds: bds },
        });
        break;
      case "all":
        zoomToFit();
        break;
      case "selection":
        // @ts-ignore
        dn = interactionState.draggedNodes[0];
        if (dn) {
          // @ts-ignore
          panScaleDispatch({
            type: "zoomSelection",
            payload: { screen: scr, dn },
          });
        }
        break;

      default:
        break;
    }
    return true;
  };

  const edgePan = () => {
    // panning at the edges of the screen changes pan and dragged nodes cooridiates
    const { scale, panPerFrame, pan } = psState;
    const pn = { ...pan };
    pn.x += panPerFrame.x * scale;
    pn.y += panPerFrame.y * scale;

    // drag the nodes directly
    // @ts-ignore
    interactionState.draggedNodes.forEach((n) => {
      n.x -= panPerFrame.x;
      n.y -= panPerFrame.y;
    });

    // @ts-ignore
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
    // @ts-ignore
    panScaleDispatch({ type: "zoomPanimate" });
  };

  const handlers = (type: any, payload: any) => {
    switch (type) {
      case "resize":
        resize(payload);
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
    // @ts-ignore
    if (lastLayouterResult?.current?.stop);
    // @ts-ignore
    lastLayouterResult?.current?.stop && lastLayouterResult.current.stop();
    // @ts-ignore
    lastLayouterResult.current = layouter(
      {
        nodeMap: nodes.current,
        edgeMap: edges.current,
        shapes: shapesRef.current,
      },
      optionState?.layoutOptions || {},
      screen(),
      // @ts-ignore
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
      // gType is graph type, mType is the Map type that corresponds

      // @ts-ignore
      const setGraphType = (gType, mType, VisualClass) => {
        let dirty = false;
        const dupMap = {};
        gType.forEach((n: { id: any; to: { toString: () => any; }; from: { toString: () => any; }; }) => {
          const has = mType.has(n.id);
          const diff = has && mType.get(n.id).definition !== n;
          if (!has || diff) {
            // edges only
            if (VisualClass === RevisEdge) {
              // duplicate ends degection
              const to = n.to.toString();
              const from = n.from.toString();
              const toFrom = [to, from].sort().join("-");
              let dupNumber = 0;
              // @ts-ignore
              if (dupMap[toFrom] !== undefined) {
                // @ts-ignore
                dupNumber = dupMap[toFrom] + 1;
                // @ts-ignore
                dupMap[toFrom] = dupNumber;
              } else {
                // @ts-ignore
                dupMap[toFrom] = 0;
              }
              mType.set(
                n.id,
                new VisualClass(
                  n.id,
                  n,
                  nodes.current.get(to),
                  nodes.current.get(from),
                  dupNumber
                )
              );
            } else if (has) {
              mType.get(n.id).update(n);
            } else {
              mType.set(n.id, new VisualClass(n.id, n, optionState));
            }
            dirty = dirty || !has;
          }
        });

        // if this Map node is note included in the graph, delete it from the Map
        mType.forEach((value: { definition: any; }, key: any, map: any) => {
          if (!gType.includes(value.definition)) {
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
                // @ts-ignore
                nodes: [...nodes.current.values()],
                // @ts-ignore
                edges: [...edges.current.values()],
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

  // we need to detect changes to graph, options, nodeDrawing, edgeDrawing, shapeDrawing or layouter props
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

  // when options change, set the state
  useEffect(() => {
    setOptionState(merge(optionState, options));
  }, [options]);

  // when layout or layout options actually change, run the layout again
  const lastLayoutOptions = useRef({});
  useEffect(() => {
    if (!isEqual(options?.layoutOptions, lastLayoutOptions.current)) {
      lastLayoutOptions.current = options?.layoutOptions || {};
      runLayout();
    }
  }, [options?.layoutOptions]);

  // run the layouter whenever it changes
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
        // @ts-ignore
        images={images}
        // @ts-ignore
        interactionState={interactionState}
        nodes={nodes.current}
        // @ts-ignore
        nodeDrawingFunction={nodeDrawingFunction}
        // @ts-ignore
        options={optionState}
        panScaleState={psState}
        // @ts-ignore
        rolloverState={rolloverState}
        // @ts-ignore
        screen={screenState}
        // @ts-ignore
        shapes={shapes || []}
        // @ts-ignore
        shapeDrawingFunction={shapeDrawingFunction}
        uid={uid}
        // @ts-ignore
        bounds={getBounds(nodes.current.values(), shapes)}
      />
    );
  }

  return null;
};

const RevisNetwork = memo(RevisNetworkBase);

export { RevisNetwork };
