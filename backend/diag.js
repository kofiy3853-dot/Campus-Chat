const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

async function run() {
    console.log('Connecting to:', MONGODB_URI ? MONGODB_URI.substring(0, 20) + '...' : 'MISSING');
    if (!MONGODB_URI) return;

    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected!');
        
        const User = mongoose.model('User', new mongoose.Schema({
            email: String,
            password_hash: String
        }));

        const users = await User.find({}).limit(5);
        console.log('Users found:', users.length);
        users.forEach(u => {
            console.log(`Email: ${u.email}, Hash: ${u.password_hash ? 'Present' : 'MISSING'}`);
        });

        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err.message);
    }
}

run();
