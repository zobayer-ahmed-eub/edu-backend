app.post('/api/leads', async (req, res) => {
    try {
        // Automatically support different field names from various forms (index, admission, contact)
        const name = req.body.name || req.body.full_name;
        const phone = req.body.phone || req.body.phone_number;
        const email = req.body.email || null;
        const message = req.body.message || null;

        // Only Name and Phone are mandatory
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