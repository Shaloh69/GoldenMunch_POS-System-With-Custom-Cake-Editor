/**
 * Database Seeder for Admin and Cashier
 *
 * This script creates default admin and cashier accounts with Node.js bcrypt hashes
 * Run: npm run seed:admin
 */

import bcrypt from 'bcrypt';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const SALT_ROUNDS = 10;

interface AdminUser {
  username: string;
  password: string;
  email: string;
  full_name: string;
}

interface CashierUser {
  cashier_code: string;
  pin: string;
  name: string;
  email: string;
}

async function createDatabaseConnection() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'GoldenMunchPOS',
    port: parseInt(process.env.DB_PORT || '3306'),
  });

  console.log('✅ Connected to database');
  return connection;
}

async function seedAdmin(connection: mysql.Connection) {
  console.log('\n🔐 Seeding Admin Account...');

  const admin: AdminUser = {
    username: 'admin',
    password: 'password',
    email: 'admin@goldenmunch.com',
    full_name: 'System Administrator',
  };

  try {
    // Generate bcrypt hash
    const passwordHash = await bcrypt.hash(admin.password, SALT_ROUNDS);

    // Check if admin already exists
    const [existingAdmin] = await connection.execute(
      'SELECT admin_id FROM admin WHERE username = ?',
      [admin.username]
    );

    if ((existingAdmin as any[]).length > 0) {
      // Update existing admin
      await connection.execute(
        `UPDATE admin
         SET password_hash = ?, email = ?, full_name = ?, updated_at = NOW()
         WHERE username = ?`,
        [passwordHash, admin.email, admin.full_name, admin.username]
      );
      console.log('✨ Admin account updated');
    } else {
      // Insert new admin
      await connection.execute(
        `INSERT INTO admin (username, password_hash, email, full_name, role, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'super_admin', NOW(), NOW())`,
        [admin.username, passwordHash, admin.email, admin.full_name]
      );
      console.log('✨ Admin account created');
    }

    console.log(`
📋 Admin Credentials:
   Username: ${admin.username}
   Password: ${admin.password}
   Email: ${admin.email}
    `);

  } catch (error) {
    console.error('❌ Error seeding admin:', error);
    throw error;
  }
}

async function seedCashier(connection: mysql.Connection) {
  console.log('\n💰 Seeding Cashier Account...');

  const cashier: CashierUser = {
    cashier_code: 'CASH001',
    pin: '1234',
    name: 'John Doe',
    email: 'cashier@goldenmunch.com',
  };

  try {
    // Generate bcrypt hash for PIN
    const pinHash = await bcrypt.hash(cashier.pin, SALT_ROUNDS);

    // Check if cashier already exists
    const [existingCashier] = await connection.execute(
      'SELECT cashier_id FROM cashier WHERE cashier_code = ?',
      [cashier.cashier_code]
    );

    if ((existingCashier as any[]).length > 0) {
      // Update existing cashier
      await connection.execute(
        `UPDATE cashier
         SET pin_hash = ?, name = ?, email = ?, updated_at = NOW()
         WHERE cashier_code = ?`,
        [pinHash, cashier.name, cashier.email, cashier.cashier_code]
      );
      console.log('✨ Cashier account updated');
    } else {
      // Insert new cashier
      await connection.execute(
        `INSERT INTO cashier (cashier_code, pin_hash, name, email, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, TRUE, NOW(), NOW())`,
        [cashier.cashier_code, pinHash, cashier.name, cashier.email]
      );
      console.log('✨ Cashier account created');
    }

    console.log(`
📋 Cashier Credentials:
   Cashier Code: ${cashier.cashier_code}
   PIN: ${cashier.pin}
   Name: ${cashier.name}
   Email: ${cashier.email}
    `);

  } catch (error) {
    console.error('❌ Error seeding cashier:', error);
    throw error;
  }
}

async function verifyCredentials(connection: mysql.Connection) {
  console.log('\n🔍 Verifying Credentials...');

  try {
    // Verify admin
    const [adminRows] = await connection.execute(
      'SELECT username, password_hash FROM admin WHERE username = ?',
      ['admin']
    );

    const admin = (adminRows as any[])[0];
    if (admin) {
      const isAdminValid = await bcrypt.compare('password', admin.password_hash);
      console.log(`Admin verification: ${isAdminValid ? '✅ PASS' : '❌ FAIL'}`);
    }

    // Verify cashier
    const [cashierRows] = await connection.execute(
      'SELECT cashier_code, pin_hash FROM cashier WHERE cashier_code = ?',
      ['CASH001']
    );

    const cashier = (cashierRows as any[])[0];
    if (cashier) {
      const isCashierValid = await bcrypt.compare('1234', cashier.pin_hash);
      console.log(`Cashier verification: ${isCashierValid ? '✅ PASS' : '❌ FAIL'}`);
    }

  } catch (error) {
    console.error('❌ Error verifying credentials:', error);
  }
}

async function main() {
  console.log('🌟 Golden Munch POS - Database Seeder');
  console.log('=====================================\n');

  let connection: mysql.Connection | null = null;

  try {
    connection = await createDatabaseConnection();

    await seedAdmin(connection);
    await seedCashier(connection);
    await verifyCredentials(connection);

    console.log('\n🎉 Seeding completed successfully!');
    console.log('\n⚠️  IMPORTANT: Change these default credentials after first login!\n');

  } catch (error) {
    console.error('\n💥 Seeding failed:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('👋 Database connection closed');
    }
  }
}

// Run the seeder
if (require.main === module) {
  main();
}

export { seedAdmin, seedCashier, createDatabaseConnection };
