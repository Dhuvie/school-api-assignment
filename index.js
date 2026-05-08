const express = require('express');
const mysql = require('mysql2/promise');
const app = express();

app.use(express.json());

const pool = mysql.createPool({ 
    host: 'school-api-assignment-dhruvnarayanbajaj.k.aivencloud.com', 
    user: 'avnadmin', 
    password: 'AVNS_sgntKlQOBsr75vyfzTv',
    port: 23326, 
    database: 'defaultdb',
    ssl: {
        rejectUnauthorized: false
    }
});

pool.execute(`
    CREATE TABLE IF NOT EXISTS schools (
        id INT AUTO_INCREMENT PRIMARY KEY, 
        name VARCHAR(255), 
        address VARCHAR(255), 
        latitude FLOAT, 
        longitude FLOAT
    )
`).then(() => console.log("Database table is ready!"))
  .catch(err => console.error("Table error:", err));

const getDist = (lat1, lon1, lat2, lon2) => {
    const p = Math.PI / 180;
    const a = 0.5 - Math.cos((lat2 - lat1) * p) / 2 + Math.cos(lat1 * p) * Math.cos(lat2 * p) * (1 - Math.cos((lon2 - lon1) * p)) / 2;
    return 12742 * Math.asin(Math.sqrt(a));
};

app.post('/addSchool', async (req, res) => {
    try {
        const { name, address, latitude, longitude } = req.body;
        if (!name || !address || !latitude || !longitude) return res.status(400).send("Missing fields");
        
        await pool.execute('INSERT INTO schools (name, address, latitude, longitude) VALUES (?, ?, ?, ?)', [name, address, latitude, longitude]);
        res.status(201).send("School successfully added!");
    } catch (e) {
        console.error(e);
        res.status(500).send("Database error: " + e.message);
    }
});

app.get('/listSchools', async (req, res) => {
    try {
        const { latitude, longitude } = req.query;
        if (!latitude || !longitude) return res.status(400).send("Missing coordinates");
        
        const [schools] = await pool.execute('SELECT * FROM schools');
        schools.forEach(s => s.distance = getDist(latitude, longitude, s.latitude, s.longitude));
        
        res.json(schools.sort((a, b) => a.distance - b.distance));
    } catch (e) {
        console.error(e);
        res.status(500).send("Database error: " + e.message);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}!`);
});