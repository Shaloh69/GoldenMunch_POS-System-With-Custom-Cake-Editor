/**
 * Diagnostic script to check admin credentials in database
 * Run with: node check-admin-credentials.js
 */

const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function checkAdminCredentials() {
  let connection;

  try {
    // Connect to database
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'GoldenMunchPOS'
    });

    console.log('✅ Connected to database\n');

    // Check admin table
    const [admins] = await connection.query(
      'SELECT admin_id, username, password_hash, name, email, is_active FROM admin'
    );

    console.log('=== ADMIN USERS IN DATABASE ===');
    console.log(`Found ${admins.length} admin user(s)\n`);

    for (const admin of admins) {
      console.log(`Admin ID: ${admin.admin_id}`);
      console.log(`Username: ${admin.username}`);
      console.log(`Name: ${admin.name}`);
      console.log(`Email: ${admin.email}`);
      console.log(`Active: ${admin.is_active}`);
      console.log(`Hash: ${admin.password_hash.substring(0, 29)}...`);

      // Test password "admin123"
      const testPassword = 'admin123';
      try {
        const isValid = await bcrypt.compare(testPassword, admin.password_hash);
        console.log(`Password "admin123" works: ${isValid ? '✅ YES' : '❌ NO'}`);
      } catch (error) {
        console.log(`Password test failed: ${error.message}`);
      }
      console.log('---\n');
    }

    // Check cashiers too
    const [cashiers] = await connection.query(
      'SELECT cashier_id, name, cashier_code, pin_hash, is_active FROM cashier'
    );

    console.log('=== CASHIER USERS IN DATABASE ===');
    console.log(`Found ${cashiers.length} cashier(s)\n`);

    for (const cashier of cashiers) {
      console.log(`Cashier ID: ${cashier.cashier_id}`);
      console.log(`Name: ${cashier.name}`);
      console.log(`Code: ${cashier.cashier_code}`);
      console.log(`Active: ${cashier.is_active}`);
      console.log(`Hash: ${cashier.pin_hash.substring(0, 29)}...`);

      // Test PIN "1234"
      const testPin = '1234';
      try {
        const isValid = await bcrypt.compare(testPin, cashier.pin_hash);
        console.log(`PIN "1234" works: ${isValid ? '✅ YES' : '❌ NO'}`);
      } catch (error) {
        console.log(`PIN test failed: ${error.message}`);
      }
      console.log('---\n');
    }

    // Generate correct hashes
    console.log('=== CORRECT BCRYPT HASHES ===');
    const adminHash = await bcrypt.hash('admin123', 10);
    const pinHash = await bcrypt.hash('1234', 10);
    console.log(`Password "admin123" should hash to something like:\n${adminHash}`);
    console.log(`\nPIN "1234" should hash to something like:\n${pinHash}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nMake sure:');
    console.error('1. MySQL is running');
    console.error('2. Database "GoldenMunchPOS" exists');
    console.error('3. Check your .env file for correct DB credentials');
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkAdminCredentials();
