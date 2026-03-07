/**
 * Connect Instagram Account via Terminal
 * Usage: npx tsx scripts/connect-instagram.ts <igUserId> <appId> <accessToken> <appSecret> [tenantId]
 */
import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import { createInstagramAuthService } from '../src/modules/instagram/services/InstagramAuthService.js';
import { createInstagramAccountRepo } from '../src/modules/instagram/repositories/InstagramAccountRepo.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

async function run() {
    const args = process.argv.slice(2);

    if (args.length < 4) {
        console.error('Usage: npx tsx scripts/connect-instagram.ts <igUserId> <appId> <accessToken> <appSecret> [tenantId]');
        console.error('Example: npx tsx scripts/connect-instagram.ts 123456789 987654321 IGAA... mySecret123');
        process.exit(1);
    }

    const [igUserId, appId, accessToken, appSecret, providedTenantId] = args;

    const DATABASE_URL = process.env.DATABASE_URL;
    if (!DATABASE_URL) {
        console.error('❌ DATABASE_URL not set in .env');
        process.exit(1);
    }

    const pool = new pg.Pool({ connectionString: DATABASE_URL });

    try {
        let tenantId = providedTenantId;
        if (!tenantId) {
            const res = await pool.query('SELECT id FROM tenants LIMIT 1');
            if (res.rows.length === 0) {
                throw new Error('No tenants found in database. Please create a tenant first or pass a tenantId.');
            }
            tenantId = res.rows[0].id;
            console.log(`ℹ️  No tenantId provided. Using default tenant: ${tenantId}`);
        }

        const authService = createInstagramAuthService(appId, appSecret, 'v21.0');
        const accountRepo = createInstagramAccountRepo(pool);

        console.log(`\n⏳ Connecting Instagram Account ${igUserId}...`);

        // Fetch profile using the provided access token
        // If it is an IG Basic Display token (starts with IGAA), do not pass igUserId so it uses the 'me' endpoint
        const isIgToken = accessToken.startsWith('IG');
        const profile = await authService.getProfile(accessToken, isIgToken ? undefined : igUserId);

        // Save to DB
        const account = await accountRepo.save({
            tenantId,
            igUserId: profile.id,
            username: profile.username,
            name: profile.name,
            profilePictureUrl: profile.profilePictureUrl,
            biography: profile.biography,
            followersCount: profile.followersCount,
            followsCount: profile.followsCount,
            mediaCount: profile.mediaCount,
            accountType: profile.accountType,
            accessToken: accessToken,
            tokenExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // ~60 days default
        });

        console.log('\n✅ Successfully connected Instagram account!');
        console.table({
            ID: account.id,
            'IG User ID': account.igUserId,
            Username: account.username,
            Name: account.name,
            'Followers Count': account.followersCount
        });

    } catch (err: any) {
        console.error('\n❌ Failed to connect:', err.message);
    } finally {
        await pool.end();
    }
}

run();
