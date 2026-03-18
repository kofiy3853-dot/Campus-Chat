const mongoose = require('mongoose');
const User = require('./dist/models/User.js');

mongoose.connect('mongodb+srv://kofiy3853_db_user:Nharnah12@cluster0.kckospz.mongodb.net/?appName=Cluster0')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Check if any admin users exist
    const adminUsers = await User.find({ role: 'admin' });
    console.log('Admin users found:', adminUsers.length);
    
    if (adminUsers.length > 0) {
      console.log('\n=== ADMIN LOGIN CREDENTIALS ===');
      adminUsers.forEach((admin, index) => {
        console.log(`\nAdmin ${index + 1}:`);
        console.log(`Email: ${admin.email}`);
        console.log(`Student ID: ${admin.student_id}`);
        console.log(`Name: ${admin.name}`);
        console.log(`Role: ${admin.role}`);
        console.log('Password: [Use forgot password or check initial setup]');
      });
    } else {
      console.log('\n=== NO ADMIN USERS FOUND ===');
      console.log('You need to create an admin user first.');
      console.log('\nTo create an admin user:');
      console.log('1. Register a normal user account');
      console.log('2. Manually update their role to "admin" in the database');
      console.log('3. Or use the promoteUser endpoint if you have admin access');
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Database connection error:', err);
    process.exit(1);
  });
