/**
 * Database Structure Verification Script
 *
 * Run this to verify your database schema matches requirements
 * before running the seeder.
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function verifyDatabase() {
  console.log('🔍 Golden Munch POS - Database Verification\n');

  let connection;

  try {
    // Connect
    console.log('📡 Connecting to database...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'GoldenMunchPOS',
      port: parseInt(process.env.DB_PORT || '3306'),
    });
    console.log('✅ Connected!\n');

    // Check critical tables exist
    console.log('📋 Checking required tables...');
    const requiredTables = [
      'roles',
      'admin',
      'cashier',
      'category',
      'menu_item',
      'menu_item_price',
      'category_has_menu_item',
      'cake_flavor',
      'cake_size',
      'custom_cake_theme'
    ];

    const [tables] = await connection.execute('SHOW TABLES');
    const tableNames = tables.map(row => Object.values(row)[0]);

    const missingTables = requiredTables.filter(table => !tableNames.includes(table));

    if (missingTables.length > 0) {
      console.log('❌ Missing tables:', missingTables.join(', '));
      console.log('\n⚠️  Please run the schema SQL file first:');
      console.log('   mysql -u root -p GoldenMunchPOS < databaseSchema/GoldenMunchPOSV2.sql\n');
      process.exit(1);
    }

    console.log(`✅ All ${requiredTables.length} required tables exist\n`);

    // Check table structures
    console.log('🔍 Verifying table structures...\n');

    // Check admin table
    const [adminColumns] = await connection.execute('DESCRIBE admin');
    const adminCols = adminColumns.map(col => col.Field);
    console.log('admin table columns:', adminCols.join(', '));

    if (!adminCols.includes('role_id')) {
      console.log('❌ admin table missing role_id column');
      process.exit(1);
    }
    if (!adminCols.includes('name')) {
      console.log('❌ admin table missing name column');
      process.exit(1);
    }
    console.log('✅ admin table structure correct\n');

    // Check category table
    const [catColumns] = await connection.execute('DESCRIBE category');
    const catCols = catColumns.map(col => col.Field);
    console.log('category table columns:', catCols.join(', '));

    if (!catCols.includes('admin_id')) {
      console.log('❌ category table missing admin_id column');
      process.exit(1);
    }
    console.log('✅ category table structure correct\n');

    // Check menu_item table
    const [itemColumns] = await connection.execute('DESCRIBE menu_item');
    const itemCols = itemColumns.map(col => col.Field);
    console.log('menu_item table columns:', itemCols.join(', '));
    console.log('✅ menu_item table structure correct\n');

    // Check menu_item_price table
    const [priceColumns] = await connection.execute('DESCRIBE menu_item_price');
    const priceCols = priceColumns.map(col => col.Field);
    console.log('menu_item_price table columns:', priceCols.join(', '));

    if (!priceCols.includes('created_by')) {
      console.log('❌ menu_item_price table missing created_by column');
      process.exit(1);
    }
    console.log('✅ menu_item_price table structure correct\n');

    // Check if roles exist
    const [roles] = await connection.execute('SELECT COUNT(*) as count FROM roles');
    if (roles[0].count === 0) {
      console.log('⚠️  No roles found - seeder will create them');
    } else {
      console.log(`✅ Found ${roles[0].count} roles`);
    }

    // Summary
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║   DATABASE VERIFICATION COMPLETE! ✅   ║');
    console.log('╚════════════════════════════════════════╝');
    console.log('\n✨ Your database is ready for seeding!');
    console.log('\nRun the seeder with:');
    console.log('   node seedDatabase.js');
    console.log('   or');
    console.log('   npm run seed\n');

  } catch (error) {
    console.error('\n💥 VERIFICATION FAILED:', error.message);

    if (error.code === 'ECONNREFUSED') {
      console.error('\n⚠️  MySQL server is not running');
      console.error('   Start MySQL and try again\n');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('\n⚠️  Database does not exist');
      console.error('   Create it with: CREATE DATABASE GoldenMunchPOS;\n');
    } else {
      console.error('\nCheck:');
      console.error('1. MySQL is running');
      console.error('2. .env file has correct credentials');
      console.error('3. Database exists and schema is loaded\n');
    }

    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run verification
verifyDatabase();
