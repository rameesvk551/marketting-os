// hooks/useAutomation.ts
// All state, queries, mutations and handlers for the Automation tab.

import { useState } from 'react';
import { Form, Modal, message } from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { automationRuleService } from '../services/automationService';

export function useAutomation() {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingRule, setEditingRule] = useState<any>(null);
    const [form] = Form.useForm();
    const queryClient = useQueryClient();

    /* ── Rules ── */
    const { data: rulesData, isLoading: isRulesLoading } = useQuery({
        queryKey: ['automation-rules'],
        queryFn: automationRuleService.getRules,
    });
    const rules: any[] = rulesData?.data || [];

    const createRuleMutation = useMutation({
        mutationFn: automationRuleService.createRule,
        onSuccess: () => {
            message.success('Rule created successfully');
            setIsModalVisible(false);
            form.resetFields();
            queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
        },
        onError: () => message.error('Failed to create rule'),
    });

    const updateRuleMutation = useMutation({
        mutationFn: (variables: { id: string; data: any }) =>
            automationRuleService.updateRule(variables.id, variables.data),
        onSuccess: () => {
            message.success('Rule updated successfully');
            setIsModalVisible(false);
            setEditingRule(null);
            form.resetFields();
            queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
        },
        onError: () => message.error('Failed to update rule'),
    });

    const deleteRuleMutation = useMutation({
        mutationFn: automationRuleService.deleteRule,
        onSuccess: () => {
            message.success('Rule deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
        },
        onError: () => message.error('Failed to delete rule'),
    });

    const handleEditRule = (record: any) => {
        setEditingRule(record);
        form.setFieldsValue({
            ...record,
            triggerType: record.trigger.type,
            conditionField: record.conditions[0]?.field,
            conditionOperator: record.conditions[0]?.operator,
            conditionValue: record.conditions[0]?.value,
            actionType: record.actions[0]?.type,
            actionConfig: record.actions[0]?.config,
        });
        setIsModalVisible(true);
    };

    const handleDeleteRule = (id: string) => {
        Modal.confirm({
            title: 'Are you sure you want to delete this rule?',
            onOk: () => deleteRuleMutation.mutate(id),
        });
    };

    const handleSaveRule = async () => {
        try {
            const values = await form.validateFields();
            const ruleData = {
                name: values.name,
                isActive: values.isActive !== undefined ? values.isActive : true,
                trigger: { type: values.triggerType },
                conditions: [{
                    field: values.conditionField,
                    operator: values.conditionOperator,
                    value: values.conditionValue,
                }],
                actions: [{
                    type: values.actionType,
                    config: values.actionConfig || {},
                }],
            };

            if (editingRule) {
                updateRuleMutation.mutate({ id: editingRule.id, data: ruleData });
            } else {
                createRuleMutation.mutate(ruleData);
            }
        } catch (error) {
            console.error('Validation failed:', error);
        }
    };

    /* ── Flows ── */
    // Left empty for now, or you can completely remove flow logic if purely unused.
    // We remove the query out of useAutomation for flows since the UI is gone.

    return {
        // state
        form,
        isModalVisible,
        setIsModalVisible,
        editingRule,

        // data
        rules,
        isRulesLoading,

        // mutation states
        isRuleSaving: createRuleMutation.isPending || updateRuleMutation.isPending,

        // rule handlers
        handleEditRule,
        handleDeleteRule,
        handleSaveRule,
    };
}
