const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Azure MySQL Connection Pool with SSL required by Azure
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: 3306,
    ssl: { rejectUnauthorized: true }, // Required for Azure MySQL
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test database connection on startup
async function testDbConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('Successfully connected to Azure MySQL Database!');
        connection.release();
    } catch (err) {
        console.error('Database connection failed:', err.message);
    }
}
testDbConnection();

// Health check route (Visiting your Render URL will show this)
app.get('/', (req, res) => {
    res.json({ status: 'EduFile Backend API is running successfully!' });
});

// Form submission endpoint (Connects from your Netlify frontend)
app.post('/api/leads', async (req, res) => {
    try {
        const { name, email, phone, message } = req.body;

        if (!name || !email) {
            return res.status(400).json({ error: 'Name and email are required fields.' });
        }

        const query = 'INSERT INTO leads (name, email, phone, message, created_at) VALUES (?, ?, ?, ?, NOW())';
        const [result] = await pool.execute(query, [name, email, phone || null, message || null]);

        res.status(201).json({
            success: true,
            message: 'Lead submitted and saved successfully!',
            leadId: result.insertId
        });
    } catch (err) {
        console.error('Error saving lead:', err);
        res.status(500).json({ error: 'Internal server error while saving data.' });
    }
});

// Start server on Render's dynamic port or default to 10000 locally
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});