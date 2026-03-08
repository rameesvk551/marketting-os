// hooks/useBroadcast.ts
// All state, queries, mutations and handlers for the Broadcast tab.

import { useState } from 'react';
import { Form, message } from 'antd';
import { useQuery, useMutation } from '@tanstack/react-query';
import { templateService } from '../services/templateService';
import { broadcastService } from '../services/broadcastService';

export function useBroadcast() {
    const [currentStep, setCurrentStep] = useState(0);
    const [form] = Form.useForm();
    const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
    const [recipientCount, setRecipientCount] = useState(0);
    const [recipientsText, setRecipientsText] = useState('');
    const [segmentRecipients, setSegmentRecipients] = useState<any[]>([]);

    const tenantId = localStorage.getItem('tenantId') || 'tenant-123'; // Using basic mock tenant id for now

    /* queries */
    const { data: templatesData } = useQuery({
        queryKey: ['whatsapp-templates', 'approved'],
        queryFn: () => templateService.getTemplates({ status: 'APPROVED' }),
    });
    const templates: any[] = templatesData?.data || [];

    /* mutations */
    const broadcastMutation = useMutation({
        mutationFn: broadcastService.broadcast,
        onSuccess: () => {
            message.success('Broadcast scheduled successfully!');
            setCurrentStep(0);
            form.resetFields();
            setSelectedTemplate(null);
            setRecipientCount(0);
            setRecipientsText('');
        },
        onError: (error: any) => {
            const msg = error?.response?.data?.error || error?.message || 'Failed to schedule broadcast';
            message.error(msg);
        },
    });

    /* handlers */
    const handleTemplateChange = (templateId: string) => {
        const template = templates.find((t: any) => t.id === templateId);
        setSelectedTemplate(template);
    };

    const onRecipientsChange = async () => {
        const source = form.getFieldValue('recipientSource');
        if (source === 'manual') {
            const text = form.getFieldValue('recipients') || '';
            setRecipientsText(text);
            const count = text.split('\n').filter((line: string) => line.trim().length > 0).length;
            setRecipientCount(count);
        } else if (source === 'contacts') {
            const tags = form.getFieldValue('audienceTags') || [];
            try {
                const recipients = await broadcastService.getSegments(tenantId, tags);
                setSegmentRecipients(recipients);
                setRecipientCount(recipients.length);
            } catch (err) {
                console.error("Failed to fetch segments:", err);
                message.error("Failed to evaluate audience size.");
            }
        }
    };

    const next = async () => {
        try {
            await form.validateFields();
            if (currentStep === 1) {
                // Manually trigger audience calculation if coming from contacts to be safe
                if (form.getFieldValue('recipientSource') === 'contacts') {
                    await onRecipientsChange();
                }
            }
            setCurrentStep(s => s + 1);
        } catch (error) {
            console.error('Validation failed:', error);
        }
    };

    const prev = () => setCurrentStep(s => s - 1);

    const handleSend = () => {
        const source = form.getFieldValue('recipientSource');
        const scheduleType = form.getFieldValue('schedule');
        const scheduledTime = form.getFieldValue('scheduledTime');

        let recipients: any[] = [];

        if (source === 'manual') {
            if (!recipientsText.trim()) {
                message.error('No recipients found. Please go back and add recipients.');
                return;
            }
            recipients = recipientsText
                .split('\n')
                .filter((line: string) => line.trim().length > 0)
                .map((phone: string) => ({ phone: phone.trim() }));
        } else if (source === 'contacts') {
            if (segmentRecipients.length === 0) {
                message.error('Selected audience contains no contacts.');
                return;
            }
            recipients = segmentRecipients;
        }

        let scheduledAt: string | null = null;
        if (scheduleType === 'later' && scheduledTime) {
            scheduledAt = scheduledTime.toISOString();
        }

        broadcastMutation.mutate({
            templateName: selectedTemplate.template_name || selectedTemplate.name,
            language: selectedTemplate.language,
            recipients,
            ...(scheduledAt && { scheduledAt }),
        });
    };

    return {
        // state
        form,
        currentStep,
        selectedTemplate,
        recipientCount,
        templates,

        // mutation state
        isSending: broadcastMutation.isPending,

        // handlers
        handleTemplateChange,
        onRecipientsChange,
        next,
        prev,
        handleSend,
    };
}
