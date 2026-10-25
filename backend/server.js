require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

const app = express();
app.use(cors());
app.use(express.json());

// 1. Connect to MySQL
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

db.connect((err) => {
    if (err) console.error('❌ MySQL Connection Failed:', err.message);
    else console.log('✅ Connected to MySQL Database');
});

// 2. Hardware Connection (Robust Mode)
let port;
let arduinoConnected = false;

try {
    port = new SerialPort({ path: process.env.ARDUINO_PORT, baudRate: 9600 });
    const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));
    arduinoConnected = true;
    console.log(`🔌 Arduino connected on ${process.env.ARDUINO_PORT}`);

    parser.on('data', (data) => {
        console.log('🔌 Arduino:', data.trim());
        if (data.includes('TRASH_DETECTED')) {
            processTrash();
        }
    });
    
    port.on('error', (err) => {
        console.log('⚠️ Arduino Disconnected. Switching to Simulation Mode.');
        arduinoConnected = false;
    });
} catch (error) {
    console.log('⚠️ Arduino not found. Running in Simulation Mode.');
}

// 3. Core Logic
function processTrash() {
    const types = ['Plastic Bottle', 'Tin Can', 'Paper', 'Junk Food Wrapper'];
    const detected = types[Math.floor(Math.random() * types.length)];

    db.query('INSERT INTO trash_logs (trash_type) VALUES (?)', [detected], (err, res) => {
        if (err) return console.log('DB Error:', err);
        console.log(`🗑️ Saved: ${detected}`);
        
        if (arduinoConnected && port.isOpen) {
            port.write('DISPENSE_RICE\n'); 
            console.log('👉 Hardware: Dispensing Rice');
        } else {
            console.log('👉 Simulation: Dispensed Rice');
        }
    });
}

// 4. API Routes
// Login Route (Mock)
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    db.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (results.length > 0) {
            res.json({ success: true, token: 'mock-jwt-token-123' });
        } else {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    });
});

// Get Logs
app.get('/api/logs', (req, res) => {
    db.query('SELECT * FROM trash_logs ORDER BY timestamp DESC LIMIT 8', (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

// Get Chart Data (For Frontend Analytics)
app.get('/api/stats', (req, res) => {
    db.query('SELECT trash_type, COUNT(*) as count FROM trash_logs GROUP BY trash_type', (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

// Hardware Simulation Trigger
app.post('/api/simulate', (req, res) => {
    processTrash();
    res.json({ message: 'Simulated successfully' });
});

// Manual Dispense
app.post('/api/dispense', (req, res) => {
    if (arduinoConnected && port.isOpen) {
        port.write('DISPENSE_RICE\n');
        res.json({ success: true, mode: 'Hardware' });
    } else {
        res.json({ success: true, mode: 'Simulation' });
    }
});

app.listen(5000, () => console.log('🚀 Backend running on port 5000'));