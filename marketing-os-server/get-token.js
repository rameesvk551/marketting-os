import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

pool.query('SELECT "metaAccessToken" FROM users LIMIT 1').then(res => {
    if (res.rows.length > 0) {
        console.log('TOKEN=' + res.rows[0].metaAccessToken);
    } else {
        console.log('No user found');
    }
    pool.end();
}).catch(err => {
    console.error(err);
    pool.end();
});
