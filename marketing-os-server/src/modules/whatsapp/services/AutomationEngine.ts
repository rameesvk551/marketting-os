// application/services/whatsapp/AutomationEngine.ts

import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

export function createAutomationEngine(messageService: any, conversationService: any, pool: Pool) {
    async function evaluateConditions(rule: any, data: any) {
        if (!rule.conditions || !Array.isArray(rule.conditions)) return true; // No conditions = trigger regardless

        return rule.conditions.every((condition: any) => {
            let actualValue = '';
            if (condition.field === 'message_body') actualValue = data.textBody || '';
            if (condition.field === 'sender_phone') actualValue = data.senderPhone || '';
            if (!actualValue) return false;

            const expectedValue = (condition.value || '').toLowerCase();
            const val = actualValue.toLowerCase();

            switch (condition.operator) {
                case 'contains': return val.includes(expectedValue);
                case 'equals': return val === expectedValue;
                case 'starts_with': return val.startsWith(expectedValue);
                default: return false;
            }
        });
    }

    async function executeActions(tenantId: string, rule: any, data: any) {
        if (!rule.actions || !Array.isArray(rule.actions)) return;

        for (const action of rule.actions) {
            try {
                switch (action.type) {
                    case 'SEND_TEXT':
                        await messageService.sendText({ tenantId, recipientPhone: data.senderPhone, text: action.config.text, senderUserId: 'AUTOMATION' });
                        break;
                    case 'SEND_TEMPLATE':
                        await messageService.sendTemplate({ tenantId, recipientPhone: data.senderPhone, templateName: action.config.templateName, language: action.config.language || 'en', variables: action.config.variables || {}, senderUserId: 'AUTOMATION' });
                        break;
                    case 'ADD_TAG':
                        // Fallback hook - Add Tag normally done via ConversationController 
                        console.log(`[Automation] Adding tag "${action.config.tag}" to ${data.senderPhone}`);
                        break;
                    case 'ASSIGN_AGENT':
                        // Real ASSIGN_AGENT logic!
                        console.log(`[Automation] Assigning agent "${action.config.agentId}" to conversation`);
                        // Set the conversation agent_id safely.
                        await pool.query(
                            `UPDATE whatsapp_conversations 
                             SET agent_id = $1, state = 'ESCALATED', is_escalated = true, requires_human_review = true, updated_at = NOW() 
                             WHERE tenant_id = $2 AND primary_actor_phone = $3`,
                            [action.config.agentId, tenantId, data.senderPhone]
                        );
                        break;
                }
            } catch (error) {
                console.error(`[Automation] Failed to execute action ${action.type} for rule ${rule.name}`, error);
            }
        }
    }

    async function processEvent(tenantId: string, eventType: string, data: any) {
        // Fetch active rules matching the trigger type
        const result = await pool.query(
            `SELECT * FROM whatsapp_automation_rules WHERE tenant_id = $1 AND is_active = true`,
            [tenantId]
        );
        const tenantRules = result.rows || [];

        let matched = false;
        // Apply
        const activeRules = tenantRules.filter(r => r.trigger?.type === eventType);
        for (const rule of activeRules) {
            if (await evaluateConditions(rule, data)) {
                console.log(`[Automation] Executing rule "${rule.name}" for tenant ${tenantId}`);
                await executeActions(tenantId, rule, data);
                matched = true;
            }
        }
        return matched;
    }

    async function getRules(tenantId: string) {
        const result = await pool.query(`SELECT * FROM whatsapp_automation_rules WHERE tenant_id = $1 ORDER BY created_at DESC`, [tenantId]);
        return result.rows.map(r => ({
            id: r.id,
            tenantId: r.tenant_id,
            name: r.name,
            isActive: r.is_active,
            trigger: r.trigger,
            conditions: r.conditions,
            actions: r.actions,
            createdAt: r.created_at,
            updatedAt: r.updated_at
        }));
    }

    async function createRule(tenantId: string, ruleData: any) {
        const id = uuidv4();
        const query = `
            INSERT INTO whatsapp_automation_rules (
                id, tenant_id, name, is_active, trigger, conditions, actions, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
            RETURNING *
        `;
        const result = await pool.query(query, [
            id, tenantId, ruleData.name,
            ruleData.isActive !== undefined ? ruleData.isActive : true,
            JSON.stringify(ruleData.trigger || {}),
            JSON.stringify(ruleData.conditions || []),
            JSON.stringify(ruleData.actions || [])
        ]);

        const r = result.rows[0];
        return {
            id: r.id, tenantId: r.tenant_id, name: r.name, isActive: r.is_active,
            trigger: r.trigger, conditions: r.conditions, actions: r.actions
        };
    }

    async function updateRule(tenantId: string, ruleId: string, updates: any) {
        const query = `
            UPDATE whatsapp_automation_rules 
            SET name = COALESCE($1, name), 
                is_active = COALESCE($2, is_active), 
                trigger = COALESCE($3, trigger), 
                conditions = COALESCE($4, conditions), 
                actions = COALESCE($5, actions), 
                updated_at = NOW()
            WHERE id = $6 AND tenant_id = $7
            RETURNING *
        `;
        const result = await pool.query(query, [
            updates.name,
            updates.isActive,
            updates.trigger ? JSON.stringify(updates.trigger) : null,
            updates.conditions ? JSON.stringify(updates.conditions) : null,
            updates.actions ? JSON.stringify(updates.actions) : null,
            ruleId, tenantId
        ]);

        if (result.rowCount === 0) return null;
        const r = result.rows[0];
        return {
            id: r.id, tenantId: r.tenant_id, name: r.name, isActive: r.is_active,
            trigger: r.trigger, conditions: r.conditions, actions: r.actions
        };
    }

    async function deleteRule(tenantId: string, ruleId: string) {
        const result = await pool.query(
            `DELETE FROM whatsapp_automation_rules WHERE id = $1 AND tenant_id = $2`,
            [ruleId, tenantId]
        );
        return result.rowCount !== null ? result.rowCount > 0 : false;
    }

    return { processEvent, getRules, createRule, updateRule, deleteRule };
}

