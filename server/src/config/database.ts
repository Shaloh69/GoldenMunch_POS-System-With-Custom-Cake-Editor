import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Database connection pool configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'GoldenMunchPOS',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
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
