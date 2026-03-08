import { Request, Response, NextFunction } from 'express';
import { parse } from 'csv-parse/sync';
import { getPool } from '../../../config/database.js';
import { v4 as uuidv4 } from 'uuid';

export function createContactController() {
    const list = async (req: any, res: Response, next: NextFunction) => {
        try {
            const tenantId = req.context?.tenantId;
            if (!tenantId) { res.status(401).json({ error: 'Tenant required' }); return; }

            const pool = getPool();
            const result = await pool.query(
                `SELECT * FROM whatsapp_opt_ins WHERE tenant_id = $1 ORDER BY created_at DESC`,
                [tenantId]
            );

            const contacts = result.rows.map((row: any) => ({
                id: row.id,
                name: row.metadata?.name || 'Unknown',
                phone: row.phone_number,
                status: row.status,
                source: row.source || 'CSV_IMPORT',
                tags: row.metadata?.tags || [],
                optInDate: row.consented_at || row.created_at,
                lastActive: row.updated_at,
            }));

            res.json({ data: contacts });
        } catch (error) { next(error); }
    };

    const importCsv = async (req: any, res: Response, next: NextFunction) => {
        try {
            const tenantId = req.context?.tenantId;
            const userId = req.context?.userId;
            if (!tenantId) { res.status(401).json({ error: 'Tenant required' }); return; }
            if (!req.file) { res.status(400).json({ error: 'No CSV file uploaded' }); return; }

            const fileContent = req.file.buffer.toString('utf-8');
            const records = parse(fileContent, {
                columns: true,
                skip_empty_lines: true,
                trim: true,
            });

            if (!records || records.length === 0) {
                res.status(400).json({ error: 'CSV file is empty or invalid' });
                return;
            }

            const pool = getPool();
            const client = await pool.connect();

            let successCount = 0;
            let errorCount = 0;

            try {
                await client.query('BEGIN');

                for (const record of records) {
                    const phone = (record as any).phone || (record as any).phoneNumber || (record as any).Phone || (record as any)['Phone Number'];
                    const name = (record as any).name || (record as any).Name || (record as any).fullName || (record as any)['Full Name'] || 'Unknown';
                    const tagsStr = (record as any).tags || (record as any).Tags || '';
                    const tags = tagsStr ? tagsStr.split(',').map((t: string) => t.trim()).filter(Boolean) : [];

                    if (!phone) {
                        errorCount++;
                        continue;
                    }

                    // Clean phone number
                    const cleanPhone = String(phone).replace(/[\s\-()+]/g, '');

                    await client.query(
                        `INSERT INTO whatsapp_opt_ins (
                            id, tenant_id, phone_number, status, source, channel,
                            permissions, consented_at, recorded_by, metadata, created_at, updated_at
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10::jsonb, NOW(), NOW())
                        ON CONFLICT (phone_number, tenant_id)
                        DO UPDATE SET
                            status = 'OPTED_IN',
                            metadata = COALESCE(whatsapp_opt_ins.metadata, '{}'::jsonb) || $10::jsonb,
                            updated_at = NOW()`,
                        [
                            uuidv4(),
                            tenantId,
                            cleanPhone,
                            'OPTED_IN',
                            'CSV_IMPORT',
                            'WHATSAPP',
                            JSON.stringify({ utility: true, marketing: true }),
                            new Date(),
                            userId || 'system',
                            JSON.stringify({ name, tags }),
                        ]
                    );
                    successCount++;
                }

                await client.query('COMMIT');
            } catch (err) {
                await client.query('ROLLBACK');
                throw err;
            } finally {
                client.release();
            }

            res.json({
                success: true,
                message: `Successfully imported ${successCount} contacts. Failed: ${errorCount}`,
                data: { successCount, errorCount }
            });
        } catch (error) { next(error); }
    };

    return { list, importCsv };
}
