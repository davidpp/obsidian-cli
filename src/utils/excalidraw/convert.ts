import type {
  DiagramInput,
  DSLNode,
  DSLEdge,
  ExcalidrawElement,
  ExcalidrawShapeElement,
  ExcalidrawTextElement,
  ExcalidrawLinearElement,
  ExcalidrawScene,
  LayoutResult,
  LayoutNode,
  BoundElement,
  NodeType,
} from './types';
import { calculateLayout, getEdgeLabelForDSL } from './layout';

// Default styling
const DEFAULT_STROKE_COLOR = '#1e1e1e';
const DEFAULT_BACKGROUND_LIGHT = '#a5d8ff';
const DEFAULT_BACKGROUND_DARK = '#1971c2';
const DEFAULT_FONT_SIZE = 16;
const DEFAULT_ROUGHNESS = 1; // Artist style

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

function generateSeed(): number {
  return Math.floor(Math.random() * 2000000000);
}

function mapNodeTypeToExcalidraw(type: NodeType | undefined): 'rectangle' | 'ellipse' | 'diamond' {
  switch (type) {
    case 'ellipse':
      return 'ellipse';
    case 'diamond':
      return 'diamond';
    case 'cylinder':
    case 'parallelogram':
    case 'rectangle':
    default:
      return 'rectangle';
  }
}

function createBaseElement(
  id: string,
  x: number,
  y: number,
  width: number,
  height: number
): Omit<ExcalidrawShapeElement, 'type'> {
  return {
    id,
    x,
    y,
    width,
    height,
    angle: 0,
    strokeColor: DEFAULT_STROKE_COLOR,
    backgroundColor: DEFAULT_BACKGROUND_LIGHT,
    fillStyle: 'solid',
    strokeWidth: 2,
    strokeStyle: 'solid',
    roughness: DEFAULT_ROUGHNESS,
    opacity: 100,
    groupIds: [],
    frameId: null,
    roundness: { type: 3 },
    seed: generateSeed(),
    version: 1,
    versionNonce: generateSeed(),
    isDeleted: false,
    boundElements: null,
    updated: Date.now(),
    link: null,
    locked: false,
  };
}

function createShapeElement(
  node: DSLNode,
  layout: LayoutNode,
  isDark: boolean
): ExcalidrawShapeElement {
  const base = createBaseElement(node.id, layout.x, layout.y, layout.width, layout.height);
  const excalidrawType = mapNodeTypeToExcalidraw(node.type);

  return {
    ...base,
    type: excalidrawType,
    backgroundColor: node.color || (isDark ? DEFAULT_BACKGROUND_DARK : DEFAULT_BACKGROUND_LIGHT),
    strokeColor: node.stroke || DEFAULT_STROKE_COLOR,
    boundElements: [], // Will be populated later
  } as ExcalidrawShapeElement;
}

function createTextElement(
  nodeId: string,
  text: string,
  x: number,
  y: number,
  width: number,
  height: number
): ExcalidrawTextElement {
  const textId = `${nodeId}-text`;
  return {
    id: textId,
    type: 'text',
    x: x + 10,
    y: y + height / 2 - DEFAULT_FONT_SIZE / 2,
    width: width - 20,
    height: DEFAULT_FONT_SIZE * 1.4,
    angle: 0,
    strokeColor: DEFAULT_STROKE_COLOR,
    backgroundColor: 'transparent',
    fillStyle: 'solid',
    strokeWidth: 1,
    strokeStyle: 'solid',
    roughness: DEFAULT_ROUGHNESS,
    opacity: 100,
    groupIds: [],
    frameId: null,
    roundness: null,
    seed: generateSeed(),
    version: 1,
    versionNonce: generateSeed(),
    isDeleted: false,
    boundElements: null,
    updated: Date.now(),
    link: null,
    locked: false,
    text,
    fontSize: DEFAULT_FONT_SIZE,
    fontFamily: 1,
    textAlign: 'center',
    verticalAlign: 'middle',
    baseline: DEFAULT_FONT_SIZE,
    containerId: nodeId,
    originalText: text,
    autoResize: true,
    lineHeight: 1.25,
  };
}

function createArrowElement(
  fromNode: LayoutNode,
  toNode: LayoutNode,
  edge: DSLEdge,
  edgePoints: [number, number][]
): ExcalidrawLinearElement {
  const arrowId = `arrow-${edge.from}-${edge.to}`;

  // Calculate start and end points relative to arrow origin
  const startPoint = edgePoints[0];
  const endPoint = edgePoints[edgePoints.length - 1];

  // Arrow origin is at the first point
  const arrowX = startPoint[0];
  const arrowY = startPoint[1];

  // Convert all points to be relative to the origin
  const relativePoints: [number, number][] = edgePoints.map((p) => [p[0] - arrowX, p[1] - arrowY]);

  return {
    id: arrowId,
    type: 'arrow',
    x: arrowX,
    y: arrowY,
    width: Math.abs(endPoint[0] - startPoint[0]),
    height: Math.abs(endPoint[1] - startPoint[1]),
    angle: 0,
    strokeColor: DEFAULT_STROKE_COLOR,
    backgroundColor: 'transparent',
    fillStyle: 'solid',
    strokeWidth: 2,
    strokeStyle: edge.style || 'solid',
    roughness: DEFAULT_ROUGHNESS,
    opacity: 100,
    groupIds: [],
    frameId: null,
    roundness: { type: 2 },
    seed: generateSeed(),
    version: 1,
    versionNonce: generateSeed(),
    isDeleted: false,
    boundElements: null,
    updated: Date.now(),
    link: null,
    locked: false,
    points: relativePoints,
    lastCommittedPoint: null,
    startBinding: {
      elementId: edge.from,
      focus: 0,
      gap: 5,
    },
    endBinding: {
      elementId: edge.to,
      focus: 0,
      gap: 5,
    },
    startArrowhead: null,
    endArrowhead: 'arrow',
  };
}

function createEdgeLabelElement(
  edge: DSLEdge,
  edgePoints: [number, number][]
): ExcalidrawTextElement | null {
  if (!edge.label) return null;

  // Place label at the middle of the edge
  const midIndex = Math.floor(edgePoints.length / 2);
  const midPoint = edgePoints[midIndex];

  const labelId = `label-${edge.from}-${edge.to}`;
  const labelWidth = edge.label.length * 8 + 20;
  const labelHeight = 20;

  return {
    id: labelId,
    type: 'text',
    x: midPoint[0] - labelWidth / 2,
    y: midPoint[1] - labelHeight / 2 - 10, // Offset above the line
    width: labelWidth,
    height: labelHeight,
    angle: 0,
    strokeColor: DEFAULT_STROKE_COLOR,
    backgroundColor: 'transparent',
    fillStyle: 'solid',
    strokeWidth: 1,
    strokeStyle: 'solid',
    roughness: DEFAULT_ROUGHNESS,
    opacity: 100,
    groupIds: [],
    frameId: null,
    roundness: null,
    seed: generateSeed(),
    version: 1,
    versionNonce: generateSeed(),
    isDeleted: false,
    boundElements: null,
    updated: Date.now(),
    link: null,
    locked: false,
    text: edge.label,
    fontSize: 14,
    fontFamily: 1,
    textAlign: 'center',
    verticalAlign: 'middle',
    baseline: 14,
    containerId: null,
    originalText: edge.label,
    autoResize: true,
    lineHeight: 1.25,
  };
}

export function convertDSLToExcalidraw(input: DiagramInput): ExcalidrawScene {
  const isDark = input.theme === 'dark';
  const layoutResult = calculateLayout(input);
  const elements: ExcalidrawElement[] = [];

  // Track which arrows connect to each shape
  const shapeArrows = new Map<string, BoundElement[]>();

  // Create arrows first to know bindings
  for (const edge of input.edges) {
    const fromNode = layoutResult.nodes.get(edge.from);
    const toNode = layoutResult.nodes.get(edge.to);

    if (!fromNode || !toNode) continue;

    const layoutEdge = layoutResult.edges.find((e) => e.from === edge.from && e.to === edge.to);
    if (!layoutEdge) continue;

    const arrow = createArrowElement(fromNode, toNode, edge, layoutEdge.points);
    elements.push(arrow);

    // Track arrow bindings for shapes
    const fromArrows = shapeArrows.get(edge.from) || [];
    fromArrows.push({ id: arrow.id, type: 'arrow' });
    shapeArrows.set(edge.from, fromArrows);

    const toArrows = shapeArrows.get(edge.to) || [];
    toArrows.push({ id: arrow.id, type: 'arrow' });
    shapeArrows.set(edge.to, toArrows);

    // Create edge label if present
    const label = createEdgeLabelElement(edge, layoutEdge.points);
    if (label) {
      elements.push(label);
    }
  }

  // Create shape and text elements
  for (const node of input.nodes) {
    const layout = layoutResult.nodes.get(node.id);
    if (!layout) continue;

    const shape = createShapeElement(node, layout, isDark);

    // Add text binding
    const textBinding: BoundElement = { id: `${node.id}-text`, type: 'text' };
    const arrows = shapeArrows.get(node.id) || [];
    shape.boundElements = [...arrows, textBinding];

    elements.push(shape);

    const text = createTextElement(node.id, node.label, layout.x, layout.y, layout.width, layout.height);
    elements.push(text);
  }

  return {
    type: 'excalidraw',
    version: 2,
    source: 'obsidian-cli',
    elements,
    appState: {
      viewBackgroundColor: isDark ? '#1e1e1e' : '#ffffff',
      gridSize: null,
    },
    files: {},
  };
}

export function mergeScenes(existing: ExcalidrawScene, additions: DiagramInput): ExcalidrawScene {
  const newScene = convertDSLToExcalidraw(additions);

  // Offset new elements to avoid overlap
  const existingBounds = calculateBounds(existing.elements);
  const offsetX = existingBounds.maxX + 100;

  for (const element of newScene.elements) {
    element.x += offsetX;
  }

  return {
    ...existing,
    elements: [...existing.elements, ...newScene.elements],
  };
}

function calculateBounds(elements: ExcalidrawElement[]): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} {
  if (elements.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const el of elements) {
    minX = Math.min(minX, el.x);
    minY = Math.min(minY, el.y);
    maxX = Math.max(maxX, el.x + el.width);
    maxY = Math.max(maxY, el.y + el.height);
  }

  return { minX, minY, maxX, maxY };
}
