import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Database connection pool configuration
// Trim all environment variables to prevent DNS errors from trailing whitespace/newlines
const dbConfig: mysql.PoolOptions = {
  host: (process.env.DB_HOST || 'localhost').trim(),
  port: parseInt((process.env.DB_PORT || '3306').trim()),
  user: (process.env.DB_USER || 'root').trim(),
  password: (process.env.DB_PASSWORD || '').trim(),
  database: (process.env.DB_NAME || 'GoldenMunchPOS').trim(),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  // SSL Configuration for cloud databases (Aiven, AWS RDS, etc.)
  // Only enable SSL if DB_SSL environment variable is set to 'true'
  // Set DB_SSL_REJECT_UNAUTHORIZED=true to enforce strict certificate validation
  ssl: process.env.DB_SSL?.trim() === 'true' ? {
    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED?.trim() === 'true',
  } : undefined,
};

// Create connection pool
export const pool = mysql.createPool(dbConfig);

// Test database connection
export const testConnection = async (): Promise<void> => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully');
    connection.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
};

// Helper function to execute queries
export const query = async <T = any>(
  sql: string,
  params?: any[]
): Promise<T> => {
  try {
    // Use pool.query instead of pool.execute to avoid prepared statement
    // limitations with LIMIT/OFFSET parameters
    const [results] = await pool.query(sql, params);
    return results as T;
  } catch (error) {
    console.error('Query error:', error);
    throw error;
  }
};

// Helper function for transactions
export const transaction = async <T>(
  callback: (connection: mysql.PoolConnection) => Promise<T>
): Promise<T> => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// Call stored procedures
export const callProcedure = async <T = any>(
  procedureName: string,
  params: any[] = []
): Promise<T> => {
  try {
    const placeholders = params.map(() => '?').join(', ');
    const sql = `CALL ${procedureName}(${placeholders})`;
    // Use pool.query instead of pool.execute for compatibility
    const [results] = await pool.query(sql, params);
    return results as T;
  } catch (error) {
    console.error(`Procedure ${procedureName} error:`, error);
    throw error;
  }
};

export default pool;
