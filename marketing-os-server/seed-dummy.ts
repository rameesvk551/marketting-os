import fetch from 'node-fetch';

const CATALOG_ID = '2147022806114894';
const ACCESS_TOKEN = 'EAAhBw75WTTkBQ7br98z4rmXGL3p8nCi91QjmZBgQxsAN1nOKfzTMkpOT9MXdZCB69x0MjVIyhXmrP5Ld9ZCJpp70kMqM9xtZCZAFvmYKLdiszhOILDJqbcuaO2qCtZAJmqybmZCgugp3opvaJD03SrNVnKXmIvHvZB0wGMRjgiCp61ZAKZCS4NjNy7tqu7BEka1axZC1lpi6AMAypdMh3qrDKIYspIaFTSS2rZCBlU29';

async function seedDummies() {
    try {
        console.log('Generating 10 dummy products...');

        const dummyProducts = Array.from({ length: 10 }).map((_, i) => {
            const id = `dummy_product_${i + 1}`;
            return {
                id,
                title: `Demo Product ${i + 1}`,
                description: `This is an amazing demo product #${i + 1} to test the WhatsApp Catalog feature.`,
                availability: 'in stock',
                condition: 'new',
                price: `${(i + 1) * 500}00 INR`, // price in cents basically, e.g., 500.00 INR
                link: `https://example.com/products/${id}`,
                image_link: `https://picsum.photos/seed/${id}/500`, // random placeholder image
                brand: 'Demo Store'
            };
        });

        const requests = dummyProducts.map(p => ({
            method: 'CREATE',
            data: p
        }));

        const body = {
            item_type: 'PRODUCT_ITEM',
            requests
        };

        console.log('Pushing 10 dummy products to Meta Catalog...');
        const res = await fetch(`https://graph.facebook.com/v21.0/${CATALOG_ID}/items_batch?access_token=${ACCESS_TOKEN}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const data = await res.json();
        console.log('Meta API Response:', JSON.stringify(data, null, 2));

    } catch (e) {
        console.error('Error:', e);
    }
}

seedDummies();
