import { memo, useEffect, useMemo, useState } from 'react';
import {
  Background,
  BackgroundVariant,
  BaseEdge,
  Controls,
  EdgeLabelRenderer,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  type Edge,
  type EdgeProps,
  type EdgeTypes,
  type Node,
  type NodeProps,
  type NodeTypes,
  type ReactFlowInstance,
} from '@xyflow/react';
import ELK from 'elkjs/lib/elk.bundled.js';
import '@xyflow/react/dist/style.css';

type ClinicalNodeType = 'start' | 'decision' | 'action' | 'urgent' | 'endpoint' | 'group';

type FlowNodeDefinition = {
  id: string;
  type: ClinicalNodeType;
  label: string;
  details?: string;
  items?: string[];
};

type FlowEdgeDefinition = {
  source: string;
  target: string;
  label?: string;
};

export type ClinicalFlowDefinition = {
  direction?: 'DOWN' | 'RIGHT';
  previewHeight?: number;
  nodes: FlowNodeDefinition[];
  edges: FlowEdgeDefinition[];
};

type ClinicalNodeData = {
  label: string;
  details?: string;
  items?: string[];
  variant: ClinicalNodeType;
};

type OrthogonalEdgeData = {
  path: string;
  labelX: number;
  labelY: number;
};

type ElkRoutedEdge = {
  id: string;
  sections?: Array<{
    startPoint: { x: number; y: number };
    bendPoints?: Array<{ x: number; y: number }>;
    endPoint: { x: number; y: number };
  }>;
};

const elk = new ELK();

const dimensions: Record<ClinicalNodeType, { width: number; height: number }> = {
  start: { width: 280, height: 74 },
  decision: { width: 340, height: 128 },
  action: { width: 330, height: 104 },
  urgent: { width: 330, height: 104 },
  endpoint: { width: 280, height: 74 },
  group: { width: 350, height: 300 },
};

const ClinicalNode = memo(({ data }: NodeProps<Node<ClinicalNodeData>>) => (
  <div className={`clinical-flow-node clinical-flow-node-${data.variant}`}>
    <Handle type="target" position={Position.Top} className="clinical-flow-handle" />
    <strong>{data.label}</strong>
    {data.details && <span>{data.details}</span>}
    {data.items && (
      <ul>
        {data.items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    )}
    <Handle type="source" position={Position.Bottom} className="clinical-flow-handle" />
  </div>
));

const nodeTypes: NodeTypes = { clinical: ClinicalNode };

const OrthogonalEdge = memo(({ id, data, label, markerEnd, style }: EdgeProps<Edge<OrthogonalEdgeData>>) => (
  <>
    <BaseEdge id={id} path={data?.path ?? ''} markerEnd={markerEnd} style={style} />
    {label && data && (
      <EdgeLabelRenderer>
        <div
          className="clinical-flow-edge-label nodrag nopan"
          style={{ transform: `translate(-50%, -50%) translate(${data.labelX}px, ${data.labelY}px)` }}
        >
          {label}
        </div>
      </EdgeLabelRenderer>
    )}
  </>
));

const edgeTypes: EdgeTypes = { orthogonal: OrthogonalEdge };

function orthogonalPath(points: Array<{ x: number; y: number }>) {
  return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
}

function pathMidpoint(points: Array<{ x: number; y: number }>) {
  const segments = points.slice(1).map((point, index) => {
    const previous = points[index];
    return { from: previous, to: point, length: Math.abs(point.x - previous.x) + Math.abs(point.y - previous.y) };
  });
  const half = segments.reduce((sum, segment) => sum + segment.length, 0) / 2;
  let covered = 0;

  for (const segment of segments) {
    if (covered + segment.length >= half) {
      const ratio = segment.length === 0 ? 0 : (half - covered) / segment.length;
      return {
        x: segment.from.x + (segment.to.x - segment.from.x) * ratio,
        y: segment.from.y + (segment.to.y - segment.from.y) * ratio,
      };
    }
    covered += segment.length;
  }
  return points[0] ?? { x: 0, y: 0 };
}

async function layoutFlow(definition: ClinicalFlowDefinition) {
  const graph = await elk.layout({
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': definition.direction ?? 'DOWN',
      'elk.edgeRouting': 'ORTHOGONAL',
      'elk.spacing.nodeNode': '48',
      'elk.layered.spacing.nodeNodeBetweenLayers': '72',
      'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
    },
    children: definition.nodes.map((node) => ({
      id: node.id,
      ...dimensions[node.type],
    })),
    edges: definition.edges.map((edge, index) => ({
      id: `layout-edge-${index}`,
      sources: [edge.source],
      targets: [edge.target],
    })),
  });

  const positions = new Map(graph.children?.map((node) => [node.id, { x: node.x ?? 0, y: node.y ?? 0 }]));
  const nodes: Node<ClinicalNodeData>[] = definition.nodes.map((node) => ({
    id: node.id,
    type: 'clinical',
    position: positions.get(node.id) ?? { x: 0, y: 0 },
    data: {
      label: node.label,
      details: node.details,
      items: node.items,
      variant: node.type,
    },
    draggable: false,
    selectable: false,
    style: dimensions[node.type],
  }));

  const routedEdges = (graph.edges ?? []) as unknown as ElkRoutedEdge[];
  const layoutEdges = new Map(routedEdges.map((edge) => [edge.id, edge]));
  const edges: Edge<OrthogonalEdgeData>[] = definition.edges.map((edge, index) => {
    const section = layoutEdges.get(`layout-edge-${index}`)?.sections?.[0];
    const sourceNode = graph.children?.find((node) => node.id === edge.source);
    const targetNode = graph.children?.find((node) => node.id === edge.target);
    const fallbackPoints = [
      { x: (sourceNode?.x ?? 0) + (sourceNode?.width ?? 0) / 2, y: (sourceNode?.y ?? 0) + (sourceNode?.height ?? 0) },
      { x: (targetNode?.x ?? 0) + (targetNode?.width ?? 0) / 2, y: targetNode?.y ?? 0 },
    ];
    const points = section
      ? [section.startPoint, ...(section.bendPoints ?? []), section.endPoint]
      : fallbackPoints;
    const midpoint = pathMidpoint(points);

    return {
      id: `edge-${edge.source}-${edge.target}-${index}`,
      source: edge.source,
      target: edge.target,
      label: edge.label,
      type: 'orthogonal',
      data: { path: orthogonalPath(points), labelX: midpoint.x, labelY: midpoint.y },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#fb923c', width: 18, height: 18 },
      style: { stroke: '#fb923c', strokeWidth: 2 },
      selectable: false,
    };
  });

  return { nodes, edges };
}

export default function ClinicalFlow({ definition, expanded }: { definition: ClinicalFlowDefinition; expanded: boolean }) {
  const [elements, setElements] = useState<{ nodes: Node<ClinicalNodeData>[]; edges: Edge[] }>({ nodes: [], edges: [] });
  const [instance, setInstance] = useState<ReactFlowInstance<Node<ClinicalNodeData>, Edge> | null>(null);

  useEffect(() => {
    let active = true;
    layoutFlow(definition).then((layouted) => active && setElements(layouted));
    return () => { active = false; };
  }, [definition]);

  useEffect(() => {
    if (!instance || elements.nodes.length === 0) return;
    const frame = requestAnimationFrame(() => {
      instance.fitView({ padding: expanded ? 0.12 : 0.2, maxZoom: expanded ? 1.5 : 0.9 });
    });
    return () => cancelAnimationFrame(frame);
  }, [elements.nodes, expanded, instance]);

  const height = useMemo(
    () => expanded ? 'min(78vh, 900px)' : `${definition.previewHeight ?? 520}px`,
    [definition.previewHeight, expanded],
  );

  return (
    <div className={`clinical-flow${expanded ? ' is-expanded' : ''}`} style={{ height }}>
      <ReactFlow
        nodes={elements.nodes}
        edges={elements.edges}
        onInit={setInstance}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: expanded ? 0.12 : 0.2, maxZoom: expanded ? 1.5 : 0.9 }}
        minZoom={0.1}
        maxZoom={2.5}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag={expanded}
        zoomOnScroll={expanded}
        zoomOnPinch={expanded}
        zoomOnDoubleClick={expanded}
        preventScrolling={expanded}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#3f2a1f" gap={24} size={1} variant={BackgroundVariant.Dots} />
        {expanded && <Controls showInteractive={false} />}
      </ReactFlow>
    </div>
  );
}
