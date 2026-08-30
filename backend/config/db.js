const mysql = require("mysql2");
require("dotenv").config();

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT) || 3306,

    // Pool settings
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,

    // Keep connections alive
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
});

// Test database connection
db.getConnection((err, connection) => {
    if (err) {
        console.error("Database connection failed:", err.message);
        return;
    }

    console.log("Connected to MySQL");

    connection.release();
});

module.exports = db;