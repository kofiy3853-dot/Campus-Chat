// Debug script to check user role and delete permissions
const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://kofiy3853_db_user:Nharnah12@cluster0.kckospz.mongodb.net/?appName=Cluster0')
  .then(async () => {
    console.log('=== USER ROLE DEBUG ===');
    
    // Get all users and their roles
    const users = await mongoose.connection.db.collection('users').find({}).toArray();
    console.log('Total users:', users.length);
    
    // Show users with their roles
    users.forEach((user, index) => {
      console.log(`\nUser ${index + 1}:`);
      console.log(`Name: ${user.name}`);
      console.log(`Email: ${user.email}`);
      console.log(`Student ID: ${user.student_id}`);
      console.log(`Role: ${user.role}`);
      console.log(`Is Banned: ${user.isBanned}`);
    });
    
    // Check if any users have admin role
    const adminCount = users.filter(u => u.role === 'admin').length;
    console.log(`\n=== ADMIN USERS: ${adminCount} ===`);
    
    if (adminCount === 0) {
      console.log('\n⚠️  NO ADMIN USERS FOUND!');
      console.log('To create an admin user, run:');
      console.log('db.users.updateOne({email: "your-email"}, {$set: {role: "admin"}})');
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Database connection error:', err);
    process.exit(1);
  });
