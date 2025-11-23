import { pool } from '../src/config/database';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Run Custom Cake Database Migration
 * This script executes the custom cake request migration SQL
 */
async function runMigration() {
  try {
    console.log('🚀 Starting custom cake database migration...\n');

    // Read the SQL file
    const sqlFilePath = path.join(__dirname, '../databaseSchema/custom_cake_request_migration.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    // Split SQL statements (handle DELIMITER changes for triggers/procedures)
    const statements = sqlContent
      .split(/;(?=\s*(?:--|\n|$))/) // Split on ; followed by whitespace/comment/newline
      .map(stmt => stmt.trim())
      .filter(stmt => {
        // Filter out empty statements and comments
        return stmt.length > 0 &&
               !stmt.startsWith('--') &&
               !stmt.startsWith('/*') &&
               stmt !== 'DELIMITER //';
      });

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    let successCount = 0;
    let skipCount = 0;

    // Execute each statement
    for (const statement of statements) {
      // Handle DELIMITER statements
      if (statement.includes('DELIMITER')) {
        console.log('⏭️  Skipping DELIMITER statement');
        skipCount++;
        continue;
      }

      // Clean up the statement
      let cleanStatement = statement;

      // Remove DELIMITER markers from stored procedure/trigger definitions
      cleanStatement = cleanStatement.replace(/\/\/\s*$/, '');
      cleanStatement = cleanStatement.replace(/DELIMITER\s*;/gi, '');

      if (cleanStatement.trim().length === 0) {
        skipCount++;
        continue;
      }

      try {
        // Check if it's a CREATE statement to show progress
        if (cleanStatement.toUpperCase().includes('CREATE TABLE')) {
          const match = cleanStatement.match(/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?(\w+)/i);
          const tableName = match ? match[1] : 'unknown';
          console.log(`✅ Creating table: ${tableName}`);
        } else if (cleanStatement.toUpperCase().includes('CREATE TRIGGER')) {
          const match = cleanStatement.match(/CREATE TRIGGER\s+(\w+)/i);
          const triggerName = match ? match[1] : 'unknown';
          console.log(`✅ Creating trigger: ${triggerName}`);
        } else if (cleanStatement.toUpperCase().includes('CREATE PROCEDURE')) {
          const match = cleanStatement.match(/CREATE PROCEDURE\s+(\w+)/i);
          const procName = match ? match[1] : 'unknown';
          console.log(`✅ Creating procedure: ${procName}`);
        } else if (cleanStatement.toUpperCase().includes('CREATE OR REPLACE VIEW')) {
          const match = cleanStatement.match(/CREATE OR REPLACE VIEW\s+(\w+)/i);
          const viewName = match ? match[1] : 'unknown';
          console.log(`✅ Creating view: ${viewName}`);
        } else if (cleanStatement.toUpperCase().includes('INSERT INTO')) {
          console.log(`✅ Inserting sample data`);
        } else if (cleanStatement.toUpperCase().includes('SELECT')) {
          // Skip SELECT statements used for status messages
          skipCount++;
          continue;
        }

        await pool.query(cleanStatement);
        successCount++;
      } catch (error: any) {
        // Ignore "already exists" errors
        if (error.code === 'ER_TABLE_EXISTS_ERROR' ||
            error.code === 'ER_DUP_ENTRY' ||
            error.message.includes('already exists')) {
          console.log(`⚠️  Skipping (already exists)`);
          skipCount++;
        } else {
          console.error(`❌ Error executing statement:`, error.message);
          console.error(`Statement preview: ${cleanStatement.substring(0, 100)}...`);
          // Continue with other statements instead of failing completely
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`✨ Migration completed!`);
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ⏭️  Skipped: ${skipCount}`);
    console.log('='.repeat(60) + '\n');

    // Verify tables were created
    const [tables] = await pool.query<any[]>(
      `SELECT COUNT(*) as count FROM information_schema.tables
       WHERE table_schema = DATABASE()
       AND table_name IN ('custom_cake_request', 'custom_cake_request_images', 'qr_code_sessions', 'custom_cake_notifications')`
    );

    console.log(`📊 Custom cake tables found: ${tables[0].count}/4`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
    console.log('\n👋 Database connection closed');
  }
}

// Run migration
runMigration()
  .then(() => {
    console.log('✅ Migration script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration script failed:', error);
    process.exit(1);
  });
