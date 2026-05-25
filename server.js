import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

// Helper function to read the database
function readDB() {
  try {
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading database file, returning empty schema:', err);
    return {};
  }
}

// Helper function to write the database
function writeDB(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing database file:', err);
    return false;
  }
}

// Ensure the db.json file exists and is readable on startup
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
}

// ----------------------------------------------------
// Authentication API (/api/session)
// ----------------------------------------------------

// POST /api/session - Log in with PIN
app.post('/api/session', (req, res) => {
  const { pin, role } = req.body;
  
  if (!pin) {
    return res.status(400).json({ error: 'PIN is required.' });
  }

  const db = readDB();
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
app.get('/api/store', (req, res) => {
  // Read database directly
  const db = readDB();
  
  // Make sure sensitive fields (PINs) are removed from the client return payload for safety
  // (But keep them in the server db.json for auth verification)
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
app.put('/api/store', (req, res) => {
  const { data } = req.body;

  if (!data) {
    return res.status(400).json({ error: 'Data payload is required.' });
  }

  const currentDB = readDB();

  // Merge the updated lists from the client into our server database.
  // We keep the official staff list (including PINs) on the server, ensuring clients don't overwrite them or drop PINs.
  const mergedDB = {
    ...currentDB,
    ...data,
    staff: currentDB.staff // Retain official staff list (including PINs!)
  };

  const success = writeDB(mergedDB);
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
app.get('*', (req, res, next) => {
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
  console.log(`Database Path: ${DB_PATH}`);
  console.log(`========================================`);
});
