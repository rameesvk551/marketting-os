// presentation/controllers/whatsapp/AutomationController.ts

export function createAutomationController(automationEngine: any, aiEcommerceAssistant?: any) {
    const getRules = async (req: any, res: any, next: any) => {
        try { const tenantId = req.context?.tenantId || 'default'; const rules = await automationEngine.getRules(tenantId); res.json({ data: rules }); } catch (error) { next(error); }
    };
    const createRule = async (req: any, res: any, next: any) => {
        try { const tenantId = req.context?.tenantId || 'default'; const rule = await automationEngine.createRule(tenantId, req.body); res.status(201).json({ data: rule }); } catch (error) { next(error); }
    };
    const updateRule = async (req: any, res: any, next: any) => {
        try { const tenantId = req.context?.tenantId || 'default'; const { id } = req.params; const rule = await automationEngine.updateRule(tenantId, id, req.body); if (!rule) { res.status(404).json({ error: 'Rule not found' }); return; } res.json({ data: rule }); } catch (error) { next(error); }
    };
    const deleteRule = async (req: any, res: any, next: any) => {
        try { const tenantId = req.context?.tenantId || 'default'; const { id } = req.params; const success = await automationEngine.deleteRule(tenantId, id); if (!success) { res.status(404).json({ error: 'Rule not found' }); return; } res.json({ success: true }); } catch (error) { next(error); }
    };
    const simulate = async (req: any, res: any, next: any) => {
        try {
            const tenantId = req.context?.tenantId || 'default';
            const { text, buttonId, senderPhone } = req.body;
            if (!senderPhone) {
                return res.status(400).json({ error: 'senderPhone is required for simulation' });
            }
            if (!aiEcommerceAssistant) {
                return res.status(500).json({ error: 'AI Assistant not configured' });
            }
            const responses = await aiEcommerceAssistant.simulateMessage(tenantId, senderPhone, text, buttonId);
            res.json({ data: responses });
        } catch (error) {
            next(error);
        }
    };

    return { getRules, createRule, updateRule, deleteRule, simulate };
}
