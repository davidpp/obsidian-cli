// DSL Input Types - What AI agents provide

export type LayoutDirection = 'LR' | 'TB' | 'RL' | 'BT';
export type NodeType = 'rectangle' | 'ellipse' | 'diamond' | 'cylinder' | 'parallelogram';
export type EdgeStyle = 'solid' | 'dashed' | 'dotted';
export type Theme = 'light' | 'dark';

export interface DSLNode {
  id: string;
  label: string;
  type?: NodeType;
  color?: string; // Background color (hex)
  stroke?: string; // Border color (hex)
}

export interface DSLEdge {
  from: string;
  to: string;
  label?: string;
  style?: EdgeStyle;
}

export interface DiagramInput {
  nodes: DSLNode[];
  edges: DSLEdge[];
  layout?: LayoutDirection;
  theme?: Theme;
}

// Excalidraw Element Types

export type ExcalidrawElementType =
  | 'rectangle'
  | 'ellipse'
  | 'diamond'
  | 'text'
  | 'arrow'
  | 'line'
  | 'freedraw'
  | 'image'
  | 'frame';

export type FillStyle = 'hachure' | 'cross-hatch' | 'solid';
export type StrokeStyle = 'solid' | 'dashed' | 'dotted';
export type ArrowHead = 'arrow' | 'bar' | 'dot' | 'triangle' | null;
export type FontFamily = 1 | 2 | 3; // 1=Hand-drawn, 2=Normal, 3=Monospace
export type TextAlign = 'left' | 'center' | 'right';
export type VerticalAlign = 'top' | 'middle' | 'bottom';

export interface BoundElement {
  id: string;
  type: 'arrow' | 'text';
}

export interface Binding {
  elementId: string;
  focus: number; // -1 to 1, position along edge
  gap: number; // distance from shape
}

export interface Roundness {
  type: 1 | 2 | 3; // 1=legacy, 2=proportional, 3=adaptive
  value?: number;
}

// Base element properties shared by all elements
export interface ExcalidrawElementBase {
  id: string;
  type: ExcalidrawElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
  strokeColor: string;
  backgroundColor: string;
  fillStyle: FillStyle;
  strokeWidth: number;
  strokeStyle: StrokeStyle;
  roughness: number; // 0=Architect, 1=Artist, 2=Cartoonist
  opacity: number; // 0-100
  groupIds: string[];
  frameId: string | null;
  roundness: Roundness | null;
  seed: number;
  version: number;
  versionNonce: number;
  isDeleted: boolean;
  boundElements: BoundElement[] | null;
  updated: number;
  link: string | null;
  locked: boolean;
}

// Shape elements (rectangle, ellipse, diamond)
export interface ExcalidrawShapeElement extends ExcalidrawElementBase {
  type: 'rectangle' | 'ellipse' | 'diamond';
}

// Text element
export interface ExcalidrawTextElement extends ExcalidrawElementBase {
  type: 'text';
  text: string;
  fontSize: number;
  fontFamily: FontFamily;
  textAlign: TextAlign;
  verticalAlign: VerticalAlign;
  baseline: number;
  containerId: string | null;
  originalText: string;
  autoResize: boolean;
  lineHeight: number;
}

// Arrow/Line element
export interface ExcalidrawLinearElement extends ExcalidrawElementBase {
  type: 'arrow' | 'line';
  points: [number, number][];
  lastCommittedPoint: [number, number] | null;
  startBinding: Binding | null;
  endBinding: Binding | null;
  startArrowhead: ArrowHead;
  endArrowhead: ArrowHead;
}

export type ExcalidrawElement =
  | ExcalidrawShapeElement
  | ExcalidrawTextElement
  | ExcalidrawLinearElement;

// Scene structure
export interface ExcalidrawAppState {
  viewBackgroundColor: string;
  gridSize: number | null;
}

export interface ExcalidrawScene {
  type: 'excalidraw';
  version: number;
  source: string;
  elements: ExcalidrawElement[];
  appState: ExcalidrawAppState;
  files: Record<string, unknown>;
}

// Layout result from dagre
export interface LayoutNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LayoutEdge {
  from: string;
  to: string;
  points: [number, number][];
}

export interface LayoutResult {
  nodes: Map<string, LayoutNode>;
  edges: LayoutEdge[];
}
