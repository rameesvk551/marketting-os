import React, { useCallback } from 'react';
import {
    ReactFlow,
    MiniMap,
    Controls,
    Background,
    BackgroundVariant,
    useNodesState,
    useEdgesState,
    addEdge,
} from '@xyflow/react';
import type { Connection, Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Card, Typography, Button, Space, message, Tag } from 'antd';
import { SaveOutlined } from '@ant-design/icons';

const { Text } = Typography;

const initialNodes = [
    { id: '1', position: { x: 250, y: 50 }, data: { label: 'Message Received' }, type: 'input' },
    { id: '2', position: { x: 100, y: 150 }, data: { label: 'If Contains "Help"' } },
    { id: '3', position: { x: 400, y: 150 }, data: { label: 'Else (Default)' } },
    { id: '4', position: { x: 100, y: 250 }, data: { label: 'Assign Agent' }, type: 'output' },
    { id: '5', position: { x: 400, y: 250 }, data: { label: 'Route to AI' }, type: 'output' },
];

const initialEdges = [
    { id: 'e1-2', source: '1', target: '2' },
    { id: 'e1-3', source: '1', target: '3' },
    { id: 'e2-4', source: '2', target: '4' },
    { id: 'e3-5', source: '3', target: '5' },
];

const AutomationFlowBuilder: React.FC = () => {
    const [nodes, , onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    const onConnect = useCallback(
        (params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)),
        [setEdges],
    );

    const handleSave = () => {
        // In a real implementation, this would save the nodes/edges JSON to the API
        console.log('Saved Flow JSON:', { nodes, edges });
        message.success('Flow saved successfully! (Simulated)');
    };

    return (
        <Card
            title={
                <Space>
                    <span style={{ fontWeight: 600 }}>Visual Automation Builder</span>
                    <Tag color="purple">BETA</Tag>
                </Space>
            }
            extra={
                <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>
                    Save Flow
                </Button>
            }
            style={{ minHeight: '600px', display: 'flex', flexDirection: 'column' }}
            bodyStyle={{ flex: 1, padding: 0 }}
        >
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #f0f0f0' }}>
                <Text type="secondary">
                    Drag and drop nodes to create advanced conversational workflows. Connect triggers to conditions and conditions to actions.
                </Text>
            </div>
            <div style={{ height: '500px', width: '100%' }}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    fitView
                >
                    <Controls />
                    <MiniMap />
                    <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
                </ReactFlow>
            </div>
        </Card>
    );
};

export default AutomationFlowBuilder;
