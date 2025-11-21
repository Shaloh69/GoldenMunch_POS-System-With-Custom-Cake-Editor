/**
 * Check Admin User in Database
 *
 * This script checks if the admin user exists and tests password verification
 */

const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkAdmin() {
  console.log('🔍 Checking Admin User...\n');

  let connection;

  try {
    // Connect to database
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'GoldenMunchPOS',
      port: parseInt(process.env.DB_PORT || '3306'),
    });
    console.log('✅ Connected to database\n');

    // Check if roles table has super_admin
    console.log('📋 Checking roles table...');
    const [roles] = await connection.execute('SELECT * FROM roles WHERE role_name = ?', ['super_admin']);
    if (roles.length === 0) {
      console.log('❌ super_admin role not found!');
      return;
    }
    console.log('✅ super_admin role exists:', roles[0]);
    console.log('');

    // Check admin user
    console.log('👤 Checking admin user...');
    const [admins] = await connection.execute(
      'SELECT * FROM admin WHERE username = ?',
      ['admin']
    );

    if (admins.length === 0) {
      console.log('❌ Admin user not found in database!');
      console.log('Please run: npm run seed');
      return;
    }

    const admin = admins[0];
    console.log('✅ Admin user found:');
    console.log('   - admin_id:', admin.admin_id);
    console.log('   - username:', admin.username);
    console.log('   - name:', admin.name);
    console.log('   - email:', admin.email);
    console.log('   - role_id:', admin.role_id);
    console.log('   - is_active:', admin.is_active);
    console.log('   - password_hash:', admin.password_hash.substring(0, 20) + '...');
    console.log('');

    // Check the JOIN query that auth.controller uses
    console.log('🔗 Testing JOIN query (same as auth controller)...');
    const [joinResult] = await connection.execute(
      `SELECT a.*, r.role_name
       FROM admin a
       JOIN roles r ON a.role_id = r.role_id
       WHERE a.username = ? AND a.is_active = TRUE`,
      ['admin']
    );

    if (joinResult.length === 0) {
      console.log('❌ JOIN query returned no results!');
      console.log('This means either:');
      console.log('   1. role_id mismatch between admin and roles tables');
      console.log('   2. is_active is FALSE');
      console.log('   3. username doesn\'t match');
      return;
    }

    console.log('✅ JOIN query successful:');
    console.log('   - role_name:', joinResult[0].role_name);
    console.log('');

    // Test password verification
    console.log('🔐 Testing password verification...');
    const testPassword = 'password';
    const isValid = await bcrypt.compare(testPassword, admin.password_hash);

    if (isValid) {
      console.log(`✅ Password "${testPassword}" is VALID!`);
      console.log('');
      console.log('╔════════════════════════════════════════╗');
      console.log('║   LOGIN SHOULD WORK WITH:              ║');
      console.log('╚════════════════════════════════════════╝');
      console.log('   Username: admin');
      console.log('   Password: password');
      console.log('');
    } else {
      console.log(`❌ Password "${testPassword}" is INVALID!`);
      console.log('The password hash in the database doesn\'t match.');
      console.log('Please re-run: npm run seed');
      console.log('');
    }

  } catch (error) {
    console.error('💥 Error:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Ensure MySQL is running');
    console.error('2. Check .env file for correct credentials');
    console.error('3. Run: npm run seed');
  } finally {
    if (connection) {
      await connection.end();
      console.log('👋 Connection closed\n');
    }
  }
}

checkAdmin();
