const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: 3306,
    ssl: { rejectUnauthorized: true },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Initialize database connection and auto-create the table if missing
async function initDatabase() {
    try {
        const connection = await pool.getConnection();
        console.log('Successfully connected to Azure MySQL Database!');

        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS leads (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255),
                phone VARCHAR(50) NOT NULL,
                message TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `;
        await connection.execute(createTableQuery);
        console.log('Leads table verified/created successfully!');

        connection.release();
    } catch (err) {
        console.error('Database initialization failed:', err.message);
    }
}
initDatabase();

app.get('/', (req, res) => {
    res.json({ status: 'EduFile Backend API is running successfully!' });
});

app.post('/api/leads', async (req, res) => {
    try {
        const name = req.body.name || req.body.full_name;
        const phone = req.body.phone || req.body.phone_number;
        const email = req.body.email || null;
        const message = req.body.message || null;

        if (!name || !phone) {
            return res.status(400).json({ error: 'Name and phone number are required fields.' });
        }

        const query = 'INSERT INTO leads (name, email, phone, message, created_at) VALUES (?, ?, ?, ?, NOW())';
        const [result] = await pool.execute(query, [name, email, phone, message]);

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

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});