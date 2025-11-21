/**
 * Complete Database Seeder for Golden Munch POS
 *
 * Seeds all demo data including:
 * - Admin and Cashier credentials
 * - Categories
 * - Menu Items
 * - Cake Flavors, Sizes, and Themes
 *
 * Run: node seedDatabase.js
 */

const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
require('dotenv').config();

const SALT_ROUNDS = 10;

// ============================================================================
// Demo Data
// ============================================================================

const CATEGORIES = [
  { name: 'Cakes', description: 'Delicious cakes for any occasion', display_order: 1 },
  { name: 'Pastries', description: 'Fresh baked pastries', display_order: 2 },
  { name: 'Breads', description: 'Artisan breads baked daily', display_order: 3 },
  { name: 'Beverages', description: 'Hot and cold drinks', display_order: 4 },
  { name: 'Custom Cakes', description: 'Design your own custom cake', display_order: 5 },
];

const MENU_ITEMS = [
  // Cakes
  {
    category: 'Cakes',
    name: 'Chocolate Fudge Cake',
    description: 'Rich chocolate cake with creamy fudge frosting',
    current_price: 45.99,
    item_type: 'cake',
    is_featured: true,
    is_infinite_stock: false,
    stock_quantity: 10,
  },
  {
    category: 'Cakes',
    name: 'Red Velvet Cake',
    description: 'Classic red velvet with cream cheese frosting',
    current_price: 42.99,
    item_type: 'cake',
    is_featured: true,
    is_infinite_stock: false,
    stock_quantity: 8,
  },
  {
    category: 'Cakes',
    name: 'Vanilla Birthday Cake',
    description: 'Light and fluffy vanilla cake perfect for celebrations',
    current_price: 38.99,
    item_type: 'cake',
    is_featured: false,
    is_infinite_stock: false,
    stock_quantity: 12,
  },
  {
    category: 'Cakes',
    name: 'Strawberry Shortcake',
    description: 'Fresh strawberries with whipped cream',
    current_price: 40.99,
    item_type: 'cake',
    is_featured: true,
    is_infinite_stock: false,
    stock_quantity: 6,
  },

  // Pastries
  {
    category: 'Pastries',
    name: 'Croissant',
    description: 'Buttery, flaky French croissant',
    current_price: 3.99,
    item_type: 'pastry',
    is_featured: false,
    is_infinite_stock: true,
    stock_quantity: 0,
  },
  {
    category: 'Pastries',
    name: 'Chocolate Danish',
    description: 'Sweet pastry with chocolate filling',
    current_price: 4.50,
    item_type: 'pastry',
    is_featured: false,
    is_infinite_stock: true,
    stock_quantity: 0,
  },
  {
    category: 'Pastries',
    name: 'Apple Turnover',
    description: 'Flaky pastry filled with cinnamon apples',
    current_price: 4.25,
    item_type: 'pastry',
    is_featured: false,
    is_infinite_stock: true,
    stock_quantity: 0,
  },
  {
    category: 'Pastries',
    name: 'Almond Bear Claw',
    description: 'Almond paste filled pastry',
    current_price: 4.75,
    item_type: 'pastry',
    is_featured: false,
    is_infinite_stock: true,
    stock_quantity: 0,
  },

  // Breads
  {
    category: 'Breads',
    name: 'Sourdough Loaf',
    description: 'Traditional sourdough bread',
    current_price: 6.99,
    item_type: 'bread',
    is_featured: false,
    is_infinite_stock: true,
    stock_quantity: 0,
  },
  {
    category: 'Breads',
    name: 'Baguette',
    description: 'Classic French baguette',
    current_price: 4.50,
    item_type: 'bread',
    is_featured: false,
    is_infinite_stock: true,
    stock_quantity: 0,
  },
  {
    category: 'Breads',
    name: 'Cinnamon Raisin Bread',
    description: 'Sweet bread with cinnamon and raisins',
    current_price: 7.50,
    item_type: 'bread',
    is_featured: false,
    is_infinite_stock: true,
    stock_quantity: 0,
  },

  // Beverages
  {
    category: 'Beverages',
    name: 'Cappuccino',
    description: 'Espresso with steamed milk and foam',
    current_price: 4.50,
    item_type: 'beverage',
    is_featured: false,
    is_infinite_stock: true,
    stock_quantity: 0,
  },
  {
    category: 'Beverages',
    name: 'Latte',
    description: 'Espresso with steamed milk',
    current_price: 4.75,
    item_type: 'beverage',
    is_featured: false,
    is_infinite_stock: true,
    stock_quantity: 0,
  },
  {
    category: 'Beverages',
    name: 'Hot Chocolate',
    description: 'Rich hot chocolate with whipped cream',
    current_price: 3.99,
    item_type: 'beverage',
    is_featured: false,
    is_infinite_stock: true,
    stock_quantity: 0,
  },
  {
    category: 'Beverages',
    name: 'Iced Coffee',
    description: 'Cold brew coffee over ice',
    current_price: 4.25,
    item_type: 'beverage',
    is_featured: false,
    is_infinite_stock: true,
    stock_quantity: 0,
  },

  // Custom Cakes
  {
    category: 'Custom Cakes',
    name: 'Custom Designed Cake',
    description: 'Design your own cake with our custom editor',
    current_price: 75.00,
    item_type: 'cake',
    is_featured: true,
    is_infinite_stock: true,
    stock_quantity: 0,
  },
];

const CAKE_FLAVORS = [
  { name: 'Chocolate', description: 'Rich chocolate cake' },
  { name: 'Vanilla', description: 'Classic vanilla flavor' },
  { name: 'Red Velvet', description: 'Smooth red velvet with cocoa' },
  { name: 'Strawberry', description: 'Fresh strawberry cake' },
  { name: 'Lemon', description: 'Zesty lemon cake' },
  { name: 'Carrot', description: 'Spiced carrot cake' },
  { name: 'Marble', description: 'Chocolate and vanilla swirl' },
  { name: 'Coconut', description: 'Tropical coconut flavor' },
];

const CAKE_SIZES = [
  { name: '6 inch', description: 'Serves 6-8 people', base_price: 35.00 },
  { name: '8 inch', description: 'Serves 10-12 people', base_price: 50.00 },
  { name: '10 inch', description: 'Serves 15-20 people', base_price: 75.00 },
  { name: '12 inch', description: 'Serves 25-30 people', base_price: 100.00 },
  { name: 'Quarter Sheet', description: 'Serves 30-40 people', base_price: 120.00 },
  { name: 'Half Sheet', description: 'Serves 50-60 people', base_price: 180.00 },
];

const CUSTOM_CAKE_THEMES = [
  { name: 'Birthday', description: 'Fun birthday celebration theme' },
  { name: 'Wedding', description: 'Elegant wedding cake theme' },
  { name: 'Anniversary', description: 'Romantic anniversary theme' },
  { name: 'Baby Shower', description: 'Cute baby shower theme' },
  { name: 'Graduation', description: 'Celebratory graduation theme' },
  { name: 'Sports', description: 'Athletic sports theme' },
  { name: 'Floral', description: 'Beautiful floral designs' },
  { name: 'Cartoon', description: 'Fun cartoon characters' },
  { name: 'Elegant', description: 'Sophisticated and classy' },
  { name: 'Rustic', description: 'Natural rustic style' },
];

// ============================================================================
// Seeding Functions
// ============================================================================

async function seedCredentials(connection) {
  console.log('\n🔐 Seeding Admin and Cashier Credentials...');

  // First, ensure roles exist
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

  // Admin
  const adminPasswordHash = await bcrypt.hash('password', SALT_ROUNDS);
  await connection.execute(
    `INSERT INTO admin (username, password_hash, name, email, role_id, is_active, created_at, updated_at)
     VALUES ('admin', ?, 'System Administrator', 'admin@goldenmunch.com', ?, TRUE, NOW(), NOW())
     ON DUPLICATE KEY UPDATE password_hash = ?, name = 'System Administrator', email = 'admin@goldenmunch.com', updated_at = NOW()`,
    [adminPasswordHash, superAdminRoleId, adminPasswordHash]
  );

  // Cashier
  const cashierPinHash = await bcrypt.hash('1234', SALT_ROUNDS);
  await connection.execute(
    `INSERT INTO cashier (cashier_code, pin_hash, name, email, is_active, created_at, updated_at)
     VALUES ('CASH001', ?, 'John Doe', 'cashier@goldenmunch.com', TRUE, NOW(), NOW())
     ON DUPLICATE KEY UPDATE pin_hash = ?, name = 'John Doe', email = 'cashier@goldenmunch.com', updated_at = NOW()`,
    [cashierPinHash, cashierPinHash]
  );

  console.log('✅ Credentials seeded');
}

async function seedCategories(connection) {
  console.log('\n📂 Seeding Categories...');

  // Get the admin_id to use for categories
  const [adminRows] = await connection.execute(
    'SELECT admin_id FROM admin WHERE username = ? LIMIT 1',
    ['admin']
  );

  if (adminRows.length === 0) {
    throw new Error('Admin user not found. Please run credential seeding first.');
  }

  const adminId = adminRows[0].admin_id;

  for (const category of CATEGORIES) {
    await connection.execute(
      `INSERT INTO category (name, description, display_order, admin_id, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, TRUE, NOW(), NOW())
       ON DUPLICATE KEY UPDATE description = ?, display_order = ?, updated_at = NOW()`,
      [category.name, category.description, category.display_order, adminId, category.description, category.display_order]
    );
  }

  console.log(`✅ ${CATEGORIES.length} categories seeded`);
}

async function seedMenuItems(connection) {
  console.log('\n🍰 Seeding Menu Items...');

  // Get admin_id for price creation
  const [adminRows] = await connection.execute(
    'SELECT admin_id FROM admin WHERE username = ? LIMIT 1',
    ['admin']
  );
  const adminId = adminRows[0].admin_id;

  // Get category IDs
  const [categories] = await connection.execute('SELECT category_id, name FROM category');
  const categoryMap = {};
  categories.forEach(cat => {
    categoryMap[cat.name] = cat.category_id;
  });

  let count = 0;
  for (const item of MENU_ITEMS) {
    const categoryId = categoryMap[item.category];
    if (!categoryId) continue;

    // Insert/Update menu item
    const [result] = await connection.execute(
      `INSERT INTO menu_item (name, description, item_type, is_featured, is_infinite_stock, stock_quantity, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'available', NOW(), NOW())
       ON DUPLICATE KEY UPDATE
         description = VALUES(description),
         is_featured = VALUES(is_featured),
         is_infinite_stock = VALUES(is_infinite_stock),
         stock_quantity = VALUES(stock_quantity),
         updated_at = NOW()`,
      [item.name, item.description, item.item_type, item.is_featured, item.is_infinite_stock, item.stock_quantity]
    );

    // Get the menu_item_id (either newly inserted or existing)
    const menuItemId = result.insertId || (await connection.execute(
      'SELECT menu_item_id FROM menu_item WHERE name = ?',
      [item.name]
    ))[0][0].menu_item_id;

    // Link to category via junction table
    await connection.execute(
      `INSERT INTO category_has_menu_item (category_id, menu_item_id, display_order)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE display_order = VALUES(display_order)`,
      [categoryId, menuItemId, count]
    );

    // Check if active price exists
    const [existingPrice] = await connection.execute(
      `SELECT price_id FROM menu_item_price
       WHERE menu_item_id = ? AND is_active = TRUE AND price_type = 'regular'
       LIMIT 1`,
      [menuItemId]
    );

    if (existingPrice.length > 0) {
      // Update existing price
      await connection.execute(
        `UPDATE menu_item_price
         SET price = ?, updated_at = NOW()
         WHERE price_id = ?`,
        [item.current_price, existingPrice[0].price_id]
      );
    } else {
      // Insert new price
      await connection.execute(
        `INSERT INTO menu_item_price (menu_item_id, price, start_date, end_date, price_type, is_active, created_by)
         VALUES (?, ?, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 10 YEAR), 'regular', TRUE, ?)`,
        [menuItemId, item.current_price, adminId]
      );
    }

    count++;
  }

  console.log(`✅ ${count} menu items seeded`);
}

async function seedCakeFlavors(connection) {
  console.log('\n🎨 Seeding Cake Flavors...');

  for (const flavor of CAKE_FLAVORS) {
    await connection.execute(
      `INSERT INTO cake_flavor (name, description, created_at, updated_at)
       VALUES (?, ?, NOW(), NOW())
       ON DUPLICATE KEY UPDATE description = ?, updated_at = NOW()`,
      [flavor.name, flavor.description, flavor.description]
    );
  }

  console.log(`✅ ${CAKE_FLAVORS.length} cake flavors seeded`);
}

async function seedCakeSizes(connection) {
  console.log('\n📏 Seeding Cake Sizes...');

  for (const size of CAKE_SIZES) {
    await connection.execute(
      `INSERT INTO cake_size (name, description, base_price, created_at, updated_at)
       VALUES (?, ?, ?, NOW(), NOW())
       ON DUPLICATE KEY UPDATE description = ?, base_price = ?, updated_at = NOW()`,
      [size.name, size.description, size.base_price, size.description, size.base_price]
    );
  }

  console.log(`✅ ${CAKE_SIZES.length} cake sizes seeded`);
}

async function seedCustomCakeThemes(connection) {
  console.log('\n🎭 Seeding Custom Cake Themes...');

  for (const theme of CUSTOM_CAKE_THEMES) {
    await connection.execute(
      `INSERT INTO custom_cake_theme (name, description, created_at, updated_at)
       VALUES (?, ?, NOW(), NOW())
       ON DUPLICATE KEY UPDATE description = ?, updated_at = NOW()`,
      [theme.name, theme.description, theme.description]
    );
  }

  console.log(`✅ ${CUSTOM_CAKE_THEMES.length} themes seeded`);
}

// ============================================================================
// Main Seeder
// ============================================================================

async function main() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║  Golden Munch POS - Database Seeder   ║');
  console.log('╚════════════════════════════════════════╝');

  let connection;

  try {
    // Connect
    console.log('\n📡 Connecting to database...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'GoldenMunchPOS',
      port: parseInt(process.env.DB_PORT || '3306'),
    });
    console.log('✅ Connected!');

    // Seed all data
    await seedCredentials(connection);
    await seedCategories(connection);
    await seedMenuItems(connection);
    await seedCakeFlavors(connection);
    await seedCakeSizes(connection);
    await seedCustomCakeThemes(connection);

    // Success summary
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║         SEEDING COMPLETE! 🎉           ║');
    console.log('╚════════════════════════════════════════╝');
    console.log('\n📋 Database now contains:');
    console.log(`   • ${CATEGORIES.length} Categories`);
    console.log(`   • ${MENU_ITEMS.length} Menu Items`);
    console.log(`   • ${CAKE_FLAVORS.length} Cake Flavors`);
    console.log(`   • ${CAKE_SIZES.length} Cake Sizes`);
    console.log(`   • ${CUSTOM_CAKE_THEMES.length} Custom Themes`);
    console.log('   • 1 Admin Account');
    console.log('   • 1 Cashier Account');

    console.log('\n╔════════════════════════════════════════╗');
    console.log('║          LOGIN CREDENTIALS             ║');
    console.log('╚════════════════════════════════════════╝');
    console.log('\n👤 ADMIN:');
    console.log('   Username: admin');
    console.log('   Password: password');
    console.log('\n💰 CASHIER:');
    console.log('   Code: CASH001');
    console.log('   PIN: 1234');
    console.log('\n⚠️  Change these after first login!\n');

  } catch (error) {
    console.error('\n💥 SEEDING FAILED:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Ensure MySQL is running');
    console.error('2. Check .env file for correct credentials');
    console.error('3. Create database: CREATE DATABASE GoldenMunchPOS;');
    console.error('4. Run schema SQL to create tables first\n');
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('👋 Connection closed\n');
    }
  }
}

// Run
main();
