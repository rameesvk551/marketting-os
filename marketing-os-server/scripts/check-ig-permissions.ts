// Quick script to check Instagram API permissions
// Run: npx ts-node scripts/check-ig-permissions.ts

const ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN || 'YOUR_ACCESS_TOKEN_HERE';
const IG_USER_ID = process.env.INSTAGRAM_USER_ID || 'YOUR_IG_USER_ID_HERE';

async function checkPermissions() {
    console.log('🔍 Checking Instagram API Permissions...\n');

    // 1. Check token debug info
    try {
        const debugRes = await fetch(
            `https://graph.facebook.com/v21.0/debug_token?input_token=${ACCESS_TOKEN}&access_token=${ACCESS_TOKEN}`
        );
        const debugData = await debugRes.json();
        
        if (debugData.data) {
            console.log('✅ Token is valid');
            console.log('   App ID:', debugData.data.app_id);
            console.log('   Scopes:', debugData.data.scopes?.join(', ') || 'None');
            console.log('   Expires:', debugData.data.expires_at ? new Date(debugData.data.expires_at * 1000).toISOString() : 'Never');
            console.log('');
            
            const scopes = debugData.data.scopes || [];
            
            // Check for required permissions
            const hasMessages = scopes.includes('instagram_manage_messages');
            const hasComments = scopes.includes('instagram_manage_comments');
            const hasBasic = scopes.includes('instagram_basic');
            
            console.log('📋 Required Permissions:');
            console.log(`   instagram_manage_messages: ${hasMessages ? '✅ Granted' : '❌ Missing'}`);
            console.log(`   instagram_manage_comments: ${hasComments ? '✅ Granted' : '❌ Missing'}`);
            console.log(`   instagram_basic: ${hasBasic ? '✅ Granted' : '❌ Missing'}`);
            console.log('');
        } else {
            console.log('❌ Token debug failed:', debugData.error?.message);
        }
    } catch (err: any) {
        console.log('❌ Token debug error:', err.message);
    }

    // 2. Test messaging capability (Generic Template)
    console.log('🧪 Testing API Capabilities...\n');
    
    // Test: Can we access conversations?
    try {
        const convRes = await fetch(
            `https://graph.facebook.com/v21.0/${IG_USER_ID}/conversations?access_token=${ACCESS_TOKEN}`
        );
        const convData = await convRes.json();
        
        if (convData.data) {
            console.log(`✅ Conversations API: Working (${convData.data.length} conversations found)`);
        } else if (convData.error) {
            console.log(`❌ Conversations API: ${convData.error.message}`);
            if (convData.error.code === 10 || convData.error.code === 200) {
                console.log('   → You need "instagram_manage_messages" with Advanced Access');
            }
        }
    } catch (err: any) {
        console.log('❌ Conversations API error:', err.message);
    }

    // Test: Can we access comments?
    try {
        const mediaRes = await fetch(
            `https://graph.facebook.com/v21.0/${IG_USER_ID}/media?access_token=${ACCESS_TOKEN}&limit=1`
        );
        const mediaData = await mediaRes.json();
        
        if (mediaData.data && mediaData.data.length > 0) {
            const mediaId = mediaData.data[0].id;
            const commentsRes = await fetch(
                `https://graph.facebook.com/v21.0/${mediaId}/comments?access_token=${ACCESS_TOKEN}`
            );
            const commentsData = await commentsRes.json();
            
            if (commentsData.data !== undefined) {
                console.log(`✅ Comments API: Working`);
            } else if (commentsData.error) {
                console.log(`❌ Comments API: ${commentsData.error.message}`);
            }
        } else {
            console.log('⚠️  Comments API: No media posts to test with');
        }
    } catch (err: any) {
        console.log('❌ Comments API error:', err.message);
    }

    console.log('\n' + '='.repeat(50));
    console.log('📝 Summary:');
    console.log('   If you see ❌ for messaging, you need to:');
    console.log('   1. Go to developers.facebook.com');
    console.log('   2. Select your App → App Review → Permissions');
    console.log('   3. Request "Advanced Access" for instagram_manage_messages');
    console.log('   4. Submit for App Review (may take 1-5 business days)');
    console.log('='.repeat(50));
}

checkPermissions().catch(console.error);
