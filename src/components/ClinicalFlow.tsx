import { memo, useEffect, useMemo, useState } from 'react';
import {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  type Edge,
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

  const edges: Edge[] = definition.edges.map((edge, index) => ({
    id: `edge-${edge.source}-${edge.target}-${index}`,
    source: edge.source,
    target: edge.target,
    label: edge.label,
    type: 'step',
    markerEnd: { type: MarkerType.ArrowClosed, color: '#fb923c' },
    style: { stroke: '#fb923c', strokeWidth: 2 },
    labelStyle: { fill: '#fdba74', fontSize: 12, fontWeight: 700 },
    labelBgStyle: { fill: '#171717', fillOpacity: 0.96 },
    labelBgPadding: [6, 4],
    labelBgBorderRadius: 5,
    selectable: false,
  }));

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
