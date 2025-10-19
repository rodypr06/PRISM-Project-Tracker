const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');
const path = require('path');
const readline = require('readline');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log('\n╔═══════════════════════════════════════════╗');
  console.log('║   PRISM Credential Management Tool       ║');
  console.log('╚═══════════════════════════════════════════╝\n');

  console.log('What would you like to do?\n');
  console.log('1. List all users');
  console.log('2. Reset client password');
  console.log('3. Reset admin password');
  console.log('4. Test a password against a user');
  console.log('5. Exit\n');

  const choice = await question('Enter your choice (1-5): ');

  switch (choice.trim()) {
    case '1':
      await listUsers();
      break;
    case '2':
      await resetClientPassword();
      break;
    case '3':
      await resetAdminPassword();
      break;
    case '4':
      await testPassword();
      break;
    case '5':
      console.log('\nGoodbye!\n');
      db.close();
      rl.close();
      return;
    default:
      console.log('\n❌ Invalid choice!\n');
      db.close();
      rl.close();
      return;
  }

  db.close();
  rl.close();
}

async function listUsers() {
  console.log('\n═══ All Users ═══\n');

  const users = db.prepare('SELECT id, username, role, client_name, company_name, created_at FROM users ORDER BY role, created_at DESC').all();

  if (users.length === 0) {
    console.log('No users found!');
    return;
  }

  users.forEach(user => {
    console.log(`${user.role === 'admin' ? '👨‍💼' : '👤'} ${user.username} [${user.role.toUpperCase()}]`);
    if (user.client_name) {
      console.log(`   Name: ${user.client_name}`);
      console.log(`   Company: ${user.company_name}`);
    }
    console.log(`   Created: ${new Date(user.created_at).toLocaleDateString()}`);
    console.log('');
  });
}

async function resetClientPassword() {
  console.log('\n═══ Reset Client Password ═══\n');

  const clients = db.prepare('SELECT id, username, client_name, company_name FROM users WHERE role = ?').all('client');

  if (clients.length === 0) {
    console.log('❌ No client users found!');
    return;
  }

  console.log('Available clients:\n');
  clients.forEach((client, idx) => {
    console.log(`${idx + 1}. ${client.username}`);
    console.log(`   ${client.client_name} - ${client.company_name}\n`);
  });

  const username = await question('Enter username to reset: ');
  const newPassword = await question('Enter new password (min 8 chars): ');

  if (newPassword.length < 8) {
    console.log('\n❌ Password must be at least 8 characters!');
    return;
  }

  const hashedPassword = bcrypt.hashSync(newPassword, 10);

  try {
    const result = db.prepare('UPDATE users SET password = ? WHERE username = ? AND role = ?')
      .run(hashedPassword, username.trim(), 'client');

    if (result.changes === 0) {
      console.log(`\n❌ Client user "${username}" not found!`);
    } else {
      console.log(`\n✅ Password reset successful!`);
      console.log(`\n┌─────────────────────────────────────┐`);
      console.log(`│  Username: ${username.trim().padEnd(23)}│`);
      console.log(`│  Password: ${newPassword.padEnd(23)}│`);
      console.log(`└─────────────────────────────────────┘`);
      console.log(`\n⚠️  Please save these credentials securely!`);
    }
  } catch (error) {
    console.error('\n❌ Error resetting password:', error.message);
  }
}

async function resetAdminPassword() {
  console.log('\n═══ Reset Admin Password ═══\n');

  const newPassword = await question('Enter new admin password (min 8 chars): ');

  if (newPassword.length < 8) {
    console.log('\n❌ Password must be at least 8 characters!');
    return;
  }

  const hashedPassword = bcrypt.hashSync(newPassword, 10);

  try {
    const result = db.prepare('UPDATE users SET password = ?, must_change_password = 0 WHERE username = ? AND role = ?')
      .run(hashedPassword, 'admin', 'admin');

    if (result.changes === 0) {
      console.log(`\n❌ Admin user not found!`);
    } else {
      console.log(`\n✅ Admin password reset successful!`);
      console.log(`\n┌─────────────────────────────────────┐`);
      console.log(`│  Username: admin                    │`);
      console.log(`│  Password: ${newPassword.padEnd(23)}│`);
      console.log(`└─────────────────────────────────────┘`);
      console.log(`\n⚠️  Please save these credentials securely!`);
    }
  } catch (error) {
    console.error('\n❌ Error resetting password:', error.message);
  }
}

async function testPassword() {
  console.log('\n═══ Test Password ═══\n');

  const username = await question('Enter username: ');
  const password = await question('Enter password to test: ');

  try {
    const user = db.prepare('SELECT username, password, role FROM users WHERE username = ?').get(username.trim());

    if (!user) {
      console.log(`\n❌ User "${username}" not found!`);
      return;
    }

    const matches = bcrypt.compareSync(password, user.password);

    if (matches) {
      console.log(`\n✅ PASSWORD MATCHES! Login should work.`);
      console.log(`   Role: ${user.role}`);
    } else {
      console.log(`\n❌ Password does not match!`);
    }
  } catch (error) {
    console.error('\n❌ Error testing password:', error.message);
  }
}

main().catch(err => {
  console.error('Error:', err);
  db.close();
  rl.close();
});
