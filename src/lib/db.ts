import mysql from "mysql2/promise";

let pool: mysql.Pool | null = null;

export async function getDbPool() {
  if (pool) return pool;

  const host = process.env.DB_HOST || "localhost";
  const port = parseInt(process.env.DB_PORT || "3306", 10);
  const user = process.env.DB_USER || "root";
  const password = process.env.DB_PASSWORD || "";
  const database = process.env.DB_DATABASE || "jecrc_broadcast";

  // Connect to MySQL server without database first to ensure the database exists
  try {
    const initConn = await mysql.createConnection({
      host,
      port,
      user,
      password,
    });

    await initConn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\``);
    await initConn.end();
  } catch (error) {
    console.error("Database connection/creation check failed:", error);
    // Proceed anyway, connection pool might succeed if database already exists
  }

  // Create the connection pool
  pool = mysql.createPool({
    host,
    port,
    user,
    password,
    database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  // Verify and create tables
  try {
    // 1. Create contacts table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        email VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_contact (email, role)
      )
    `);

    // 2. Create broadcast_logs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS broadcast_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        recipient_name VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        email VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        message_body TEXT NOT NULL,
        whatsapp_status VARCHAR(50) NOT NULL,
        whatsapp_error TEXT,
        email_status VARCHAR(50) NOT NULL,
        email_error TEXT,
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log("Database tables verified successfully.");
  } catch (error) {
    console.error("Database table initialization failed:", error);
  }

  return pool;
}
