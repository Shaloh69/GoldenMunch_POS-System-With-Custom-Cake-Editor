/**
 * Simple MySQL Connection Test
 * Tests connection with hardcoded values (no .env dependency)
 */

const mysql = require('mysql2/promise');

async function testConnection() {
  console.log('\n🔍 Testing MySQL Connection...\n');

  // Test with empty password (most common for localhost development)
  const config = {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '', // Empty password
  };

  console.log('Configuration:');
  console.log('  Host:', config.host);
  console.log('  Port:', config.port);
  console.log('  User:', config.user);
  console.log('  Password:', config.password === '' ? '(empty)' : '***');
  console.log('');

  try {
    console.log('Attempting to connect...');
    const connection = await mysql.createConnection(config);
    console.log('✅ SUCCESS: Connected to MySQL!\n');

    // List databases
    const [databases] = await connection.query('SHOW DATABASES');
    console.log('Available databases:');
    databases.forEach(db => {
      const dbName = db.Database || db.database;
      console.log(`  - ${dbName}`);
    });

    // Check for GoldenMunchPOS
    const hasGoldenMunch = databases.some(db =>
      (db.Database || db.database) === 'GoldenMunchPOS'
    );

    console.log('');
    if (hasGoldenMunch) {
      console.log('✅ GoldenMunchPOS database found!');

      // Connect to the database and check tables
      await connection.changeUser({ database: 'GoldenMunchPOS' });
      const [tables] = await connection.query('SHOW TABLES');

      console.log(`✅ Found ${tables.length} tables in GoldenMunchPOS`);

      if (tables.length === 0) {
        console.log('⚠️  Database is empty. Run: npm run seed');
      }
    } else {
      console.log('❌ GoldenMunchPOS database NOT found!');
      console.log('');
      console.log('Create it by running:');
      console.log('  mysql -u root -e "CREATE DATABASE GoldenMunchPOS;"');
      console.log('  Or use: mysql -u root < databaseSchema/GoldenMunchPOSV2.sql');
    }

    await connection.end();
    console.log('\n✅ Test completed successfully!\n');

  } catch (error) {
    console.log('❌ FAILED to connect to MySQL\n');
    console.log('Error:', error.message);
    console.log('Error Code:', error.code);
    console.log('');

    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('🔧 FIX: Wrong password!');
      console.log('  Your MySQL root user has a password set.');
      console.log('  Edit server/.env and set: DB_PASSWORD=your_password');
      console.log('');
      console.log('  Or reset MySQL password:');
      console.log('    1. Stop MySQL');
      console.log('    2. ALTER USER \'root\'@\'localhost\' IDENTIFIED BY \'\';');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('🔧 FIX: MySQL is not running!');
      console.log('  - If using XAMPP: Start MySQL in XAMPP Control Panel');
      console.log('  - Check if MySQL is running on port 3306');
    } else if (error.code === 'ENOTFOUND') {
      console.log('🔧 FIX: Cannot find host "localhost"');
      console.log('  Try using "127.0.0.1" instead in .env:');
      console.log('  DB_HOST=127.0.0.1');
    }

    console.log('');
    process.exit(1);
  }
}

testConnection();
