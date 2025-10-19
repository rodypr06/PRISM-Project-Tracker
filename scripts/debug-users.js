const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');
const path = require('path');

const dbPath = path.join(__dirname, '../server/database.sqlite');
const db = new Database(dbPath);

console.log('\n=== Database Users ===\n');

const users = db.prepare('SELECT id, username, password, role, client_name, company_name FROM users').all();

users.forEach(user => {
  console.log(`ID: ${user.id}`);
  console.log(`Username: ${user.username}`);
  console.log(`Role: ${user.role}`);
  console.log(`Client Name: ${user.client_name || 'N/A'}`);
  console.log(`Company Name: ${user.company_name || 'N/A'}`);
  console.log(`Password Hash: ${user.password.substring(0, 20)}...`);
  console.log(`Hash Length: ${user.password.length}`);

  // Test password verification
  const testPasswords = ['admin123', 'password', 'Password123', user.client_name?.toLowerCase()];
  console.log('Testing common passwords:');
  testPasswords.forEach(pwd => {
    if (pwd) {
      const matches = bcrypt.compareSync(pwd, user.password);
      if (matches) {
        console.log(`  ✓ Password "${pwd}" matches!`);
      }
    }
  });

  console.log('---\n');
});

db.close();
