import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import cors from 'cors';
import fs from 'fs';
import { promises as fsPromises } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3010;

app.use(cors());
app.use(express.json()); // For parsing application/json
app.use(express.static(path.join(__dirname, 'dist')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Data persistence file
const DB_FILE = path.join(__dirname, 'db.json');

// Multer setup for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// API Endpoints
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }
  // Return the URL to access the file
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ url: fileUrl });
});

// Endpoint to get all data
app.get('/api/data', async (req, res) => {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = await fsPromises.readFile(DB_FILE, 'utf-8');
      res.json(JSON.parse(data));
    } else {
      res.json({}); // Return empty object if no db file
    }
  } catch (err) {
    console.error('Error reading data:', err);
    res.status(500).send('Error reading data');
  }
});

// Endpoint to save all data
app.post('/api/data', async (req, res) => {
  try {
    await fsPromises.writeFile(DB_FILE, JSON.stringify(req.body, null, 2));
    res.json({ success: true });
  } catch (err) {
    console.error('Error saving data:', err);
    res.status(500).send('Error saving data');
  }
});

// Catch-all route to serve the SPA
app.get('*splat', function (req, res) {
  // If request is for API that doesn't exist, return 404
  if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
     return res.status(404).send('Not found');
  }
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// IMPORTANT: Bind to '0.0.0.0' to listen on all network interfaces
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 SuperTareas Server running on port ${PORT}`);
  console.log(`👉 Access via LAN IP: http://<your-server-ip>:${PORT}`);
  console.log(`👉 Access via Localhost: http://localhost:${PORT}`);
});
