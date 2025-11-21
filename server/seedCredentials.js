/**
 * Quick Database Seeder for Admin and Cashier (JavaScript version)
 *
 * This script creates default admin and cashier accounts with Node.js bcrypt hashes
 * Run: node seedCredentials.js
 */

const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
require('dotenv').config();

const SALT_ROUNDS = 10;

async function seedCredentials() {
  console.log('🌟 Golden Munch POS - Quick Credential Seeder');
  console.log('==============================================\n');

  let connection;

  try {
    // Connect to database
    console.log('📡 Connecting to database...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'GoldenMunchPOS',
      port: parseInt(process.env.DB_PORT || '3306'),
    });
    console.log('✅ Connected!\n');

    // Generate hashes
    console.log('🔐 Generating secure password hashes...');
    const adminPasswordHash = await bcrypt.hash('password', SALT_ROUNDS);
    const cashierPinHash = await bcrypt.hash('1234', SALT_ROUNDS);
    console.log('✅ Hashes generated!\n');

    // Ensure roles exist
    console.log('📋 Ensuring roles exist...');
    await connection.execute(
      `INSERT INTO roles (role_name, description) VALUES ('super_admin', 'Full system access')
       ON DUPLICATE KEY UPDATE description = 'Full system access'`
    );

    // Get the super_admin role_id
    const [roles] = await connection.execute(
      'SELECT role_id FROM roles WHERE role_name = ?',
      ['super_admin']
    );
    const superAdminRoleId = roles[0].role_id;

    // Update Admin
    console.log('👤 Updating Admin credentials...');
    const [adminResult] = await connection.execute(
      `UPDATE admin
       SET password_hash = ?,
           email = 'admin@goldenmunch.com',
           name = 'System Administrator',
           updated_at = NOW()
       WHERE username = 'admin'`,
      [adminPasswordHash]
    );

    if (adminResult.affectedRows === 0) {
      // Admin doesn't exist, create it
      await connection.execute(
        `INSERT INTO admin (username, password_hash, name, email, role_id, is_active, created_at, updated_at)
         VALUES ('admin', ?, 'System Administrator', 'admin@goldenmunch.com', ?, TRUE, NOW(), NOW())`,
        [adminPasswordHash, superAdminRoleId]
      );
      console.log('✨ Admin account created');
    } else {
      console.log('✨ Admin account updated');
    }

    // Update Cashier
    console.log('💰 Updating Cashier credentials...');
    const [cashierResult] = await connection.execute(
      `UPDATE cashier
       SET pin_hash = ?,
           name = 'John Doe',
           email = 'cashier@goldenmunch.com',
           is_active = TRUE,
           updated_at = NOW()
       WHERE cashier_code = 'CASH001'`,
      [cashierPinHash]
    );

    if (cashierResult.affectedRows === 0) {
      // Cashier doesn't exist, create it
      await connection.execute(
        `INSERT INTO cashier (cashier_code, pin_hash, name, email, is_active, created_at, updated_at)
         VALUES ('CASH001', ?, 'John Doe', 'cashier@goldenmunch.com', TRUE, NOW(), NOW())`,
        [cashierPinHash]
      );
      console.log('✨ Cashier account created');
    } else {
      console.log('✨ Cashier account updated');
    }

    // Verify credentials
    console.log('\n🔍 Verifying credentials...');

    const [adminRows] = await connection.execute(
      'SELECT username, password_hash FROM admin WHERE username = ?',
      ['admin']
    );
    if (adminRows.length > 0) {
      const isAdminValid = await bcrypt.compare('password', adminRows[0].password_hash);
      console.log(`   Admin login: ${isAdminValid ? '✅ VERIFIED' : '❌ FAILED'}`);
    }

    const [cashierRows] = await connection.execute(
      'SELECT cashier_code, pin_hash FROM cashier WHERE cashier_code = ?',
      ['CASH001']
    );
    if (cashierRows.length > 0) {
      const isCashierValid = await bcrypt.compare('1234', cashierRows[0].pin_hash);
      console.log(`   Cashier login: ${isCashierValid ? '✅ VERIFIED' : '❌ FAILED'}`);
    }

    // Success!
    console.log('\n🎉 Credentials seeded successfully!\n');
    console.log('═══════════════════════════════════════');
    console.log('📋 LOGIN CREDENTIALS');
    console.log('═══════════════════════════════════════');
    console.log('\n👤 ADMIN LOGIN:');
    console.log('   URL: http://localhost:5000/admin');
    console.log('   Username: admin');
    console.log('   Password: password');
    console.log('\n💰 CASHIER LOGIN:');
    console.log('   URL: http://localhost:5000/pos');
    console.log('   Cashier Code: CASH001');
    console.log('   PIN: 1234');
    console.log('\n═══════════════════════════════════════');
    console.log('⚠️  IMPORTANT: Change these credentials');
    console.log('    after your first login!');
    console.log('═══════════════════════════════════════\n');

  } catch (error) {
    console.error('\n💥 ERROR:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Make sure MySQL is running');
    console.error('2. Check your .env file has correct DB credentials');
    console.error('3. Ensure the database exists: CREATE DATABASE GoldenMunchPOS;');
    console.error('4. Ensure the tables exist (run the schema SQL first)\n');
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('👋 Database connection closed\n');
    }
  }
}

// Run the seeder
seedCredentials();
