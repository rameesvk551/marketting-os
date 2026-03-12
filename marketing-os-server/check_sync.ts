import { Pool } from 'pg';
import dotenv from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
dotenv.config({ path: resolve(__dirname, '.env.production') });
dotenv.config({ path: resolve(__dirname, '.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
});

async function main() {
    try {
        console.log('Fetching latest catalog sync errors...');
        const res = await pool.query(
            `SELECT created_at, status, failed_count, errors 
             FROM catalog_sync_logs 
             ORDER BY created_at DESC 
             LIMIT 3`
        );
        
        res.rows.forEach(row => {
            console.log(`\nTime: ${row.created_at}`);
            console.log(`Status: ${row.status}`);
            console.log(`Failed Count: ${row.failed_count}`);
            console.log(`Errors:`, JSON.stringify(row.errors, null, 2));
        });
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await pool.end();
    }
}

main();
