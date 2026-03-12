import { connect, disconnect } from 'mongoose';
import Product from './src/db/nosqlmodels/Product.js';
import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve('.env.production') });
dotenv.config({ path: resolve('.env') });

async function main() {
    try {
        console.log('Connecting to MongoDB...');
        await connect(process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/marketing_os');
        
        const dummyImageUrl = 'https://images.unsplash.com/photo-1594034182928-85474fed90cd?q=80&w=600&auto=format&fit=crop';
        
        const result = await Product.updateMany(
            { sku: '60' }, // The SKU for 'white oodhu'
            { $set: { images: [dummyImageUrl] } }
        );
        
        console.log('Update Result:', result);
        console.log(`Updated images for product SKU 60 to a valid URL.`);
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await disconnect();
    }
}

main();
