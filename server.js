const express = require('express');
const cors = require('cors');
const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'blessings.db');

let db;

// Initialize database
async function initDatabase() {
  const SQL = await initSqlJs();

  // Try to load existing database
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // Create table if not exists
  db.run(`
    CREATE TABLE IF NOT EXISTS blessings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  saveDatabase();
}

// Save database to file
function saveDatabase() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API Routes

// Get blessing count
app.get('/api/blessings/count', (req, res) => {
  try {
    const result = db.exec('SELECT COUNT(*) as count FROM blessings');
    const count = result.length > 0 ? result[0].values[0][0] : 0;
    res.json({ count });
  } catch (error) {
    console.error('Error getting count:', error);
    res.status(500).json({ error: 'Failed to get count' });
  }
});

// Get all blessings (with optional limit)
app.get('/api/blessings', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const result = db.exec(`SELECT * FROM blessings ORDER BY RANDOM() LIMIT ${limit}`);

    if (result.length === 0) {
      return res.json([]);
    }

    const columns = result[0].columns;
    const blessings = result[0].values.map(row => {
      const blessing = {};
      columns.forEach((col, i) => {
        blessing[col] = row[i];
      });
      return blessing;
    });

    res.json(blessings);
  } catch (error) {
    console.error('Error getting blessings:', error);
    res.status(500).json({ error: 'Failed to get blessings' });
  }
});

// Create a new blessing
app.post('/api/blessings', (req, res) => {
  try {
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Content is required' });
    }

    if (content.length > 200) {
      return res.status(400).json({ error: 'Content too long (max 200 characters)' });
    }

    // Insert blessing
    db.run('INSERT INTO blessings (content, created_at) VALUES (?, datetime("now"))', [content.trim()]);
    saveDatabase();

    // Get the new blessing
    const result = db.exec('SELECT * FROM blessings ORDER BY id DESC LIMIT 1');
    const columns = result[0].columns;
    const row = result[0].values[0];
    const newBlessing = {};
    columns.forEach((col, i) => {
      newBlessing[col] = row[i];
    });

    // Get updated count
    const countResult = db.exec('SELECT COUNT(*) as count FROM blessings');
    const totalCount = countResult[0].values[0][0];

    res.status(201).json({
      blessing: newBlessing,
      totalCount
    });
  } catch (error) {
    console.error('Error creating blessing:', error);
    res.status(500).json({ error: 'Failed to create blessing' });
  }
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
async function start() {
  await initDatabase();

  app.listen(PORT, () => {
    console.log(`🥟 冬至暖心祝福留言板已启动！`);
    console.log(`🌐 访问地址: http://localhost:${PORT}`);
  });
}

start().catch(console.error);
