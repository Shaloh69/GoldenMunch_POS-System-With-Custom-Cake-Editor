/**
 * Database Connection Diagnostic Script
 * Run this to identify MySQL connection issues
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

console.log('\n🔍 Database Connection Diagnostics\n');
console.log('='.repeat(50));

// Step 1: Check environment variables
console.log('\n1️⃣  Environment Variables:');
console.log('   DB_HOST:', process.env.DB_HOST || 'undefined (will use: localhost)');
console.log('   DB_PORT:', process.env.DB_PORT || 'undefined (will use: 3306)');
console.log('   DB_USER:', process.env.DB_USER || 'undefined (will use: root)');
console.log('   DB_PASSWORD:', process.env.DB_PASSWORD === undefined ? 'undefined (will use: empty string)' : process.env.DB_PASSWORD === '' ? 'empty string' : '***hidden***');
console.log('   DB_NAME:', process.env.DB_NAME || 'undefined (will use: GoldenMunchPOS)');

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
};

console.log('\n2️⃣  Connection Configuration:');
console.log('   host:', config.host);
console.log('   port:', config.port);
console.log('   user:', config.user);
console.log('   password:', config.password === '' ? '(empty)' : '***');

// Step 2: Test connection WITHOUT database (to see if MySQL is accessible)
async function testBasicConnection() {
  console.log('\n3️⃣  Testing MySQL Server Connection (without database)...');
  try {
    const connection = await mysql.createConnection(config);
    console.log('   ✅ SUCCESS: Connected to MySQL server');
    await connection.end();
    return true;
  } catch (error) {
    console.log('   ❌ FAILED: Cannot connect to MySQL server');
    console.log('   Error:', error.message);
    console.log('   Code:', error.code);

    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n   🔧 DIAGNOSIS: Wrong username or password');
      console.log('   💡 TRY THIS:');
      console.log('      - Verify your MySQL root password');
      console.log('      - Try connecting manually: mysql -u root -p');
      console.log('      - If no password, ensure DB_PASSWORD= (empty) in .env');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('\n   🔧 DIAGNOSIS: MySQL service is not running');
      console.log('   💡 TRY THIS:');
      console.log('      - Start MySQL via XAMPP Control Panel');
      console.log('      - Or: sudo systemctl start mysql (Linux)');
      console.log('      - Or: brew services start mysql (Mac)');
    } else if (error.code === 'ENOTFOUND') {
      console.log('\n   🔧 DIAGNOSIS: Cannot resolve hostname');
      console.log('   💡 TRY THIS:');
      console.log('      - Check DB_HOST in .env (should be "localhost" or "127.0.0.1")');
    }

    return false;
  }
}

// Step 3: List available databases
async function listDatabases() {
  console.log('\n4️⃣  Checking Available Databases...');
  try {
    const connection = await mysql.createConnection(config);
    const [databases] = await connection.query('SHOW DATABASES');
    console.log('   Available databases:');
    databases.forEach(db => {
      const dbName = db.Database || db.database || db.SCHEMA_NAME;
      const marker = dbName === 'GoldenMunchPOS' ? ' ✅ (target)' : '';
      console.log(`   - ${dbName}${marker}`);
    });

    const hasGoldenMunch = databases.some(db =>
      (db.Database || db.database || db.SCHEMA_NAME) === 'GoldenMunchPOS'
    );

    if (!hasGoldenMunch) {
      console.log('\n   ⚠️  WARNING: GoldenMunchPOS database not found!');
      console.log('   💡 CREATE IT:');
      console.log('      mysql -u root -p');
      console.log('      CREATE DATABASE GoldenMunchPOS;');
      console.log('      Or use: mysql -u root < databaseSchema/GoldenMunchPOSV2.sql');
    }

    await connection.end();
    return hasGoldenMunch;
  } catch (error) {
    console.log('   ❌ FAILED:', error.message);
    return false;
  }
}

// Step 4: Test connection WITH database
async function testDatabaseConnection() {
  console.log('\n5️⃣  Testing Connection to GoldenMunchPOS Database...');
  const dbConfig = {
    ...config,
    database: process.env.DB_NAME || 'GoldenMunchPOS',
  };

  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log('   ✅ SUCCESS: Connected to GoldenMunchPOS database');

    // Check tables
    const [tables] = await connection.query('SHOW TABLES');
    console.log(`   Found ${tables.length} tables in database`);

    if (tables.length === 0) {
      console.log('\n   ⚠️  WARNING: Database is empty (no tables)');
      console.log('   💡 SEED IT:');
      console.log('      npm run seed');
    } else {
      console.log('   Sample tables:', tables.slice(0, 5).map(t => Object.values(t)[0]).join(', '));
    }

    await connection.end();
    return true;
  } catch (error) {
    console.log('   ❌ FAILED:', error.message);

    if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('\n   🔧 DIAGNOSIS: Database does not exist');
      console.log('   💡 CREATE IT:');
      console.log('      CREATE DATABASE GoldenMunchPOS;');
    }

    return false;
  }
}

// Run all diagnostics
async function runDiagnostics() {
  try {
    const basicOk = await testBasicConnection();

    if (basicOk) {
      const hasDB = await listDatabases();
      await testDatabaseConnection();
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ Diagnostics Complete\n');

  } catch (error) {
    console.error('\n❌ Diagnostic error:', error);
  }
}

runDiagnostics();
