import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const DB_PATH = path.join(__dirname, 'data', 'db.json');

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// Initialize PostgreSQL database connection pool if DATABASE_URL is provided
const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    })
  : null;

// Local DB helper: Read
function readLocalDB() {
  try {
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading database file, returning empty schema:', err);
    return {};
  }
}

// Local DB helper: Write
function writeLocalDB(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing database file:', err);
    return false;
  }
}

// Ensure the data directory exists
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
}

// Initialize database (create table in Postgres if needed)
async function initDatabase() {
  if (pool) {
    try {
      const client = await pool.connect();
      await client.query(`
        CREATE TABLE IF NOT EXISTS bakery_state (
          id VARCHAR(50) PRIMARY KEY,
          state JSONB NOT NULL
        );
      `);
      
      const res = await client.query("SELECT * FROM bakery_state WHERE id = 'default'");
      if (res.rows.length === 0) {
        console.log('Seeding cloud database with default local db.json data...');
        const localData = readLocalDB();
        await client.query(
          "INSERT INTO bakery_state (id, state) VALUES ('default', $1)",
          [JSON.stringify(localData)]
        );
      }
      client.release();
      console.log('Cloud PostgreSQL database connection active & initialized.');
    } catch (err) {
      console.error('Failed to initialize cloud database, using local fallback:', err);
    }
  } else {
    console.log('No cloud database configured. Running in local file storage mode.');
  }
}

// Unified Async Read Database
async function readDB() {
  if (pool) {
    try {
      const res = await pool.query("SELECT state FROM bakery_state WHERE id = 'default'");
      if (res.rows.length > 0) {
        return res.rows[0].state;
      }
    } catch (err) {
      console.error('Error reading from cloud database, using local fallback:', err);
    }
  }
  return readLocalDB();
}

// Unified Async Write Database
async function writeDB(data) {
  if (pool) {
    try {
      await pool.query(
        "UPDATE bakery_state SET state = $1 WHERE id = 'default'",
        [JSON.stringify(data)]
      );
      return true;
    } catch (err) {
      console.error('Error writing to cloud database, using local fallback:', err);
    }
  }
  return writeLocalDB(data);
}

// Trigger DB Initialization
initDatabase();

// ----------------------------------------------------
// Authentication API (/api/session)
// ----------------------------------------------------

// POST /api/session - Log in with PIN
app.post('/api/session', async (req, res) => {
  const { pin, role } = req.body;
  
  if (!pin) {
    return res.status(400).json({ error: 'PIN is required.' });
  }

  const db = await readDB();
  const staffList = db.staff || [];
  
  // Find staff by PIN and role, or just by PIN if role not provided
  let staffMember = null;
  if (role) {
    staffMember = staffList.find(s => s.pin === pin && s.role === role);
  }
  if (!staffMember) {
    staffMember = staffList.find(s => s.pin === pin);
  }

  if (!staffMember) {
    return res.status(401).json({ error: 'Wrong password or PIN. Please try again.' });
  }

  // Create session info
  const sessionUser = {
    id: staffMember.id,
    name: staffMember.name,
    role: staffMember.role,
    shopId: staffMember.shopId,
    shop_id: staffMember.shop_id,
    shop_code: staffMember.shop_code
  };

  // Set HTTP-only cookie for session persistence (expires in 1 day)
  res.cookie('bakery_session_token', JSON.stringify(sessionUser), {
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax',
    secure: false // Set to true if HTTPS is used
  });

  return res.json({ success: true, user: sessionUser });
});

// GET /api/session - Get current logged-in user session
app.get('/api/session', (req, res) => {
  const token = req.cookies.bakery_session_token;
  if (!token) {
    return res.status(401).json({ authenticated: false, error: 'No active session.' });
  }

  try {
    const user = JSON.parse(token);
    return res.json({ authenticated: true, user });
  } catch (err) {
    res.clearCookie('bakery_session_token');
    return res.status(401).json({ authenticated: false, error: 'Invalid session.' });
  }
});

// DELETE /api/session - Log out
app.delete('/api/session', (req, res) => {
  res.clearCookie('bakery_session_token');
  return res.json({ success: true, message: 'Logged out successfully.' });
});

// ----------------------------------------------------
// Operational Store API (/api/store)
// ----------------------------------------------------

// GET /api/store - Retrieve live database state
app.get('/api/store', async (req, res) => {
  // Read database directly
  const db = await readDB();
  
  // Make sure sensitive fields (PINs) are removed from the client return payload for safety
  const clientDB = { ...db };
  if (clientDB.staff) {
    clientDB.staff = clientDB.staff.map(s => {
      const { pin, ...profile } = s;
      return profile;
    });
  }

  return res.json(clientDB);
});

// PUT /api/store - Update live database state
app.put('/api/store', async (req, res) => {
  const { data } = req.body;

  if (!data) {
    return res.status(400).json({ error: 'Data payload is required.' });
  }

  const currentDB = await readDB();

  // Merge the updated lists from the client into our server database.
  const mergedDB = {
    ...currentDB,
    ...data,
    staff: currentDB.staff // Retain official staff list (including PINs!)
  };

  const success = await writeDB(mergedDB);
  if (!success) {
    return res.status(500).json({ error: 'Failed to write data to server storage.' });
  }

  // Return the cleaned client database state
  const clientDB = { ...mergedDB };
  if (clientDB.staff) {
    clientDB.staff = clientDB.staff.map(s => {
      const { pin, ...profile } = s;
      return profile;
    });
  }

  return res.json({ success: true, data: clientDB });
});

// Serve static frontend files from Vite build in 'dist' directory
app.use(express.static(path.join(__dirname, 'dist')));

// Fallback all non-API GET requests to index.html for React Router
app.get('/*splat', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`========================================`);
  console.log(`Live Bakery Operations Backend listening`);
  console.log(`Port: ${PORT}`);
  console.log(`========================================`);
});
