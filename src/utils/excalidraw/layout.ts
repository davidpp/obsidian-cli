import dagre from '@dagrejs/dagre';
import type {
  DiagramInput,
  DSLNode,
  DSLEdge,
  LayoutDirection,
  LayoutResult,
  LayoutNode,
  LayoutEdge,
} from './types';

const DEFAULT_NODE_WIDTH = 150;
const DEFAULT_NODE_HEIGHT = 60;
const NODE_SEPARATION = 50;
const RANK_SEPARATION = 80;

function estimateTextWidth(text: string, fontSize: number = 16): number {
  // Rough estimate: average character width is ~0.6 of font size
  return Math.max(text.length * fontSize * 0.6 + 40, DEFAULT_NODE_WIDTH);
}

function estimateTextHeight(text: string, fontSize: number = 16): number {
  const lines = text.split('\n').length;
  return Math.max(lines * fontSize * 1.4 + 30, DEFAULT_NODE_HEIGHT);
}

export function calculateLayout(input: DiagramInput): LayoutResult {
  const g = new dagre.graphlib.Graph();

  // Set graph options
  const rankdir = input.layout || 'LR';
  g.setGraph({
    rankdir,
    nodesep: NODE_SEPARATION,
    ranksep: RANK_SEPARATION,
    marginx: 20,
    marginy: 20,
  });

  g.setDefaultEdgeLabel(() => ({}));

  // Add nodes with estimated dimensions
  for (const node of input.nodes) {
    const width = estimateTextWidth(node.label);
    const height = estimateTextHeight(node.label);
    g.setNode(node.id, { width, height, label: node.label });
  }

  // Add edges
  for (const edge of input.edges) {
    g.setEdge(edge.from, edge.to);
  }

  // Run layout
  dagre.layout(g);

  // Extract results
  const nodes = new Map<string, LayoutNode>();
  for (const nodeId of g.nodes()) {
    const nodeData = g.node(nodeId);
    if (nodeData) {
      nodes.set(nodeId, {
        id: nodeId,
        x: nodeData.x - nodeData.width / 2, // dagre gives center, we want top-left
        y: nodeData.y - nodeData.height / 2,
        width: nodeData.width,
        height: nodeData.height,
      });
    }
  }

  // Extract edge points
  const edges: LayoutEdge[] = [];
  for (const e of g.edges()) {
    const edgeData = g.edge(e);
    if (edgeData && edgeData.points) {
      edges.push({
        from: e.v,
        to: e.w,
        points: edgeData.points.map((p: { x: number; y: number }) => [p.x, p.y] as [number, number]),
      });
    }
  }

  return { nodes, edges };
}

export function getEdgeLabelForDSL(edges: DSLEdge[], from: string, to: string): string | undefined {
  const edge = edges.find((e) => e.from === from && e.to === to);
  return edge?.label;
}
