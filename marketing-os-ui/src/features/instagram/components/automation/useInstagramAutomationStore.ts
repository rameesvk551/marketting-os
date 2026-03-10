import { create } from 'zustand';
import type { Edge, Node } from '@xyflow/react';
import type { PreviewTab } from './types';

interface InstagramAutomationState {
  activePreviewTab: PreviewTab;
  selectedNav: string;
  simulationStep: number;
  isCatalogPickerOpen: boolean;
  flowNodes: Node[];
  flowEdges: Edge[];
  setActivePreviewTab: (tab: PreviewTab) => void;
  setSelectedNav: (value: string) => void;
  setSimulationStep: (value: number) => void;
  cycleSimulationStep: () => void;
  setCatalogPickerOpen: (value: boolean) => void;
  setFlowNodes: (nodes: Node[]) => void;
  setFlowEdges: (edges: Edge[]) => void;
}

const initialFlowNodes: Node[] = [
  {
    id: 'trigger',
    position: { x: 16, y: 42 },
    data: { label: 'Comment Trigger' },
    style: {
      background: '#13213b',
      color: '#dbeafe',
      border: '1px solid #253c63',
      borderRadius: 12,
      padding: 8,
      fontSize: 12,
      fontWeight: 600,
    },
  },
  {
    id: 'keyword',
    position: { x: 205, y: 42 },
    data: { label: 'Keyword Filter' },
    style: {
      background: '#0f2a2a',
      color: '#ccfbf1',
      border: '1px solid #1e4a4a',
      borderRadius: 12,
      padding: 8,
      fontSize: 12,
      fontWeight: 600,
    },
  },
  {
    id: 'dm',
    position: { x: 393, y: 42 },
    data: { label: 'Send DM' },
    style: {
      background: '#2a1d10',
      color: '#ffedd5',
      border: '1px solid #5a3a1e',
      borderRadius: 12,
      padding: 8,
      fontSize: 12,
      fontWeight: 600,
    },
  },
  {
    id: 'catalog',
    position: { x: 546, y: 42 },
    data: { label: 'Catalog CTA' },
    style: {
      background: '#1f1b2f',
      color: '#e9d5ff',
      border: '1px solid #483a78',
      borderRadius: 12,
      padding: 8,
      fontSize: 12,
      fontWeight: 600,
    },
  },
];

const initialFlowEdges: Edge[] = [
  { id: 'trigger-keyword', source: 'trigger', target: 'keyword', animated: true, style: { stroke: '#4f8cff' } },
  { id: 'keyword-dm', source: 'keyword', target: 'dm', animated: true, style: { stroke: '#30b8a6' } },
  { id: 'dm-catalog', source: 'dm', target: 'catalog', animated: true, style: { stroke: '#8b5cf6' } },
];

export const useInstagramAutomationStore = create<InstagramAutomationState>((set) => ({
  activePreviewTab: 'dm',
  selectedNav: 'automations',
  simulationStep: 1,
  isCatalogPickerOpen: false,
  flowNodes: initialFlowNodes,
  flowEdges: initialFlowEdges,
  setActivePreviewTab: (tab) => set({ activePreviewTab: tab }),
  setSelectedNav: (value) => set({ selectedNav: value }),
  setSimulationStep: (value) => set({ simulationStep: value }),
  cycleSimulationStep: () =>
    set((state) => ({
      simulationStep: state.simulationStep >= 4 ? 1 : state.simulationStep + 1,
    })),
  setCatalogPickerOpen: (value) => set({ isCatalogPickerOpen: value }),
  setFlowNodes: (nodes) => set({ flowNodes: nodes }),
  setFlowEdges: (edges) => set({ flowEdges: edges }),
}));
