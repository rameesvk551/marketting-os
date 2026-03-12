import fetch from 'node-fetch';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Product from './src/db/nosqlmodels/Product.js';

dotenv.config();

const CATALOG_ID = '2147022806114894';
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

async function seed() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27018/marketing-os?directConnection=true');

        console.log('Fetching active products...');
        const products = await Product.find({ status: 'active' }).limit(20);

        console.log(`Found ${products.length} products to seed.`);

        if (products.length === 0) {
            console.log('No products to seed.');
            process.exit(0);
        }

        const requests = products.map(p => ({
            method: 'CREATE',
            data: {
                id: p._id.toString(),
                title: p.productName || 'Product',
                description: p.description ? p.description.substring(0, 100) : 'Product description',
                availability: 'in stock',
                condition: 'new',
                price: `${p.price * 100} INR`,
                link: p.thumbnailImage || 'https://google.com',
                image_link: p.thumbnailImage || 'https://via.placeholder.com/500',
                brand: 'Your Brand'
            }
        }));

        const body = {
            item_type: 'PRODUCT_ITEM',
            requests
        };

        console.log('Pushing to Meta Catalog...');
        const res = await fetch(`https://graph.facebook.com/v21.0/${CATALOG_ID}/items_batch?access_token=${ACCESS_TOKEN}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const data = await res.json();
        console.log('Meta API Response:', JSON.stringify(data, null, 2));

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
}

seed();
