// controllers/AutomationController.ts
// REST API endpoints for Instagram automation rules CRUD.

import { Request, Response } from 'express';
import { IInstagramAutomationEngine } from '../services/InstagramAutomationEngine.js';

export interface IAutomationController {
    getRules(req: Request, res: Response): Promise<void>;
    getRuleById(req: Request, res: Response): Promise<void>;
    createRule(req: Request, res: Response): Promise<void>;
    updateRule(req: Request, res: Response): Promise<void>;
    deleteRule(req: Request, res: Response): Promise<void>;
    toggleRuleStatus(req: Request, res: Response): Promise<void>;
}

export function createAutomationController(
    automationEngine: IInstagramAutomationEngine
): IAutomationController {
    return {
        async getRules(req: Request, res: Response): Promise<void> {
            try {
                const tenantId = req.context?.tenantId;
                if (!tenantId) {
                    res.status(400).json({ status: 'error', message: 'Tenant ID required' });
                    return;
                }

                const rules = await automationEngine.getRules(tenantId);
                res.json({
                    status: 'success',
                    data: rules,
                });
            } catch (error: any) {
                res.status(500).json({ status: 'error', message: error.message });
            }
        },

        async getRuleById(req: Request, res: Response): Promise<void> {
            try {
                const tenantId = req.context?.tenantId;
                const { ruleId } = req.params;

                if (!tenantId) {
                    res.status(400).json({ status: 'error', message: 'Tenant ID required' });
                    return;
                }

                const rule = await automationEngine.getRuleById(tenantId, ruleId);
                if (!rule) {
                    res.status(404).json({ status: 'error', message: 'Rule not found' });
                    return;
                }

                res.json({
                    status: 'success',
                    data: rule,
                });
            } catch (error: any) {
                res.status(500).json({ status: 'error', message: error.message });
            }
        },

        async createRule(req: Request, res: Response): Promise<void> {
            try {
                const tenantId = req.context?.tenantId;
                if (!tenantId) {
                    res.status(400).json({ status: 'error', message: 'Tenant ID required' });
                    return;
                }

                const ruleData = req.body;
                const rule = await automationEngine.createRule(tenantId, ruleData);

                res.status(201).json({
                    status: 'success',
                    data: rule,
                });
            } catch (error: any) {
                res.status(500).json({ status: 'error', message: error.message });
            }
        },

        async updateRule(req: Request, res: Response): Promise<void> {
            try {
                const tenantId = req.context?.tenantId;
                const { ruleId } = req.params;

                if (!tenantId) {
                    res.status(400).json({ status: 'error', message: 'Tenant ID required' });
                    return;
                }

                const ruleData = req.body;
                const rule = await automationEngine.updateRule(tenantId, ruleId, ruleData);

                res.json({
                    status: 'success',
                    data: rule,
                });
            } catch (error: any) {
                if (error.message === 'Rule not found') {
                    res.status(404).json({ status: 'error', message: error.message });
                } else {
                    res.status(500).json({ status: 'error', message: error.message });
                }
            }
        },

        async deleteRule(req: Request, res: Response): Promise<void> {
            try {
                const tenantId = req.context?.tenantId;
                const { ruleId } = req.params;

                if (!tenantId) {
                    res.status(400).json({ status: 'error', message: 'Tenant ID required' });
                    return;
                }

                await automationEngine.deleteRule(tenantId, ruleId);

                res.json({
                    status: 'success',
                    message: 'Rule deleted successfully',
                });
            } catch (error: any) {
                if (error.message === 'Rule not found') {
                    res.status(404).json({ status: 'error', message: error.message });
                } else {
                    res.status(500).json({ status: 'error', message: error.message });
                }
            }
        },

        async toggleRuleStatus(req: Request, res: Response): Promise<void> {
            try {
                const tenantId = req.context?.tenantId;
                const { ruleId } = req.params;
                const { status } = req.body;

                if (!tenantId) {
                    res.status(400).json({ status: 'error', message: 'Tenant ID required' });
                    return;
                }

                if (!['active', 'paused'].includes(status)) {
                    res.status(400).json({ status: 'error', message: 'Status must be "active" or "paused"' });
                    return;
                }

                const rule = await automationEngine.toggleRuleStatus(tenantId, ruleId, status);

                res.json({
                    status: 'success',
                    data: rule,
                });
            } catch (error: any) {
                if (error.message === 'Rule not found') {
                    res.status(404).json({ status: 'error', message: error.message });
                } else {
                    res.status(500).json({ status: 'error', message: error.message });
                }
            }
        },
    };
}
