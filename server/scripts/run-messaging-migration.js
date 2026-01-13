const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  let connection;

  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'root',
      database: process.env.DB_NAME || 'GoldenMunchPOS',
      multipleStatements: true
    });

    console.log('✓ Connected to database');
    console.log(`  Database: ${process.env.DB_NAME || 'GoldenMunchPOS'}`);
    console.log(`  Host: ${process.env.DB_HOST || 'localhost'}\n`);

    // Read migration file
    const migrationPath = path.join(__dirname, '../migrations/add_messaging_support.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('✓ Read migration file: add_messaging_support.sql');
    console.log('📝 Running migration...\n');

    // Execute migration
    const [results] = await connection.query(migrationSQL);

    // Display results
    if (Array.isArray(results)) {
      results.forEach((result, index) => {
        if (Array.isArray(result) && result.length > 0) {
          console.table(result);
        }
      });
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📋 Changes applied:');
    console.log('   - Added sender_type column (customer/admin/system)');
    console.log('   - Added parent_notification_id for threaded conversations');
    console.log('   - Added is_read and read_at for read tracking');
    console.log('   - Added sender_name for display purposes');
    console.log('   - Created indexes for efficient querying');
    console.log('   - Created message_threads view');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\nError details:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✓ Database connection closed');
    }
  }
}

// Run migration
console.log('🚀 Starting messaging support migration...\n');
runMigration();
