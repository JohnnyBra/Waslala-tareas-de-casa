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

// Persistence Queue Logic
let isSaving = false;
const saveQueue = [];

async function withDb(operation) {
    return new Promise((resolve, reject) => {
        saveQueue.push({ operation, resolve, reject });
        processSaveQueue();
    });
}

async function processSaveQueue() {
    if (isSaving || saveQueue.length === 0) return;
    isSaving = true;
    const { operation, resolve, reject } = saveQueue.shift();

    try {
        let data = {};
        if (fs.existsSync(DB_FILE)) {
            const fileContent = await fsPromises.readFile(DB_FILE, 'utf-8');
            try {
                data = JSON.parse(fileContent);
            } catch (e) {
                console.error("Error parsing DB", e);
                data = {};
            }
        }
        // Initialize arrays if missing
        ['families', 'users', 'tasks', 'completions', 'extraPoints', 'messages', 'events', 'transactions', 'rewards'].forEach(key => {
            if (!data[key]) data[key] = [];
        });

        const result = await operation(data); // data is mutable here

        await fsPromises.writeFile(DB_FILE, JSON.stringify(data, null, 2));
        resolve(result);
    } catch (e) {
        console.error("DB Operation failed", e);
        reject(e);
    } finally {
        isSaving = false;
        processSaveQueue(); // Process next
    }
}

// Helper to handle actions
function handleAction(data, action) {
    switch (action.type) {
        case 'ADD_FAMILY':
            data.families.push(action.payload);
            break;
        case 'DELETE_FAMILY':
            data.families = data.families.filter(f => f.id !== action.payload);
            // Cleanup related data
            data.users = data.users.filter(u => u.familyId !== action.payload);
            data.tasks = data.tasks.filter(t => t.familyId !== action.payload);
            data.rewards = data.rewards.filter(r => r.familyId !== action.payload);
            break;
        case 'CREATE_USER':
            data.users.push(action.payload);
            break;
        case 'UPDATE_USER':
            const userIndex = data.users.findIndex(u => u.id === action.payload.id);
            if (userIndex >= 0) data.users[userIndex] = action.payload;
            break;
        case 'SAVE_TASK':
            const taskIndex = data.tasks.findIndex(t => t.id === action.payload.id);
            if (taskIndex >= 0) data.tasks[taskIndex] = action.payload;
            else data.tasks.push(action.payload);
            break;
        case 'DELETE_TASK':
            data.tasks = data.tasks.filter(t => t.id !== action.payload);
            break;
        case 'ADD_COMPLETION':
            // Check for duplicates just in case
            const exists = data.completions.some(c => c.taskId === action.payload.taskId && c.userId === action.payload.userId && c.date === action.payload.date);
            if (!exists) data.completions.push(action.payload);
            break;
        case 'REMOVE_COMPLETION':
            data.completions = data.completions.filter(c => !(c.taskId === action.payload.taskId && c.userId === action.payload.userId && c.date === action.payload.date));
            break;
        case 'ADD_EXTRA_POINTS':
            data.extraPoints.push(action.payload);
            break;
        case 'SEND_MESSAGE':
            data.messages.push(action.payload);
            break;
        case 'MARK_MESSAGE_READ':
            const msg = data.messages.find(m => m.id === action.payload);
            if (msg) msg.read = true;
            break;
        case 'SAVE_EVENT':
             const eventIndex = data.events.findIndex(e => e.id === action.payload.id);
             // Ensure fields exist
             if (!action.payload.completedBy) action.payload.completedBy = [];
             if (!action.payload.readBy) action.payload.readBy = [];

             if (eventIndex >= 0) data.events[eventIndex] = action.payload;
             else data.events.push(action.payload);
             break;
        case 'MARK_EVENT_READ':
            const eventRead = data.events.find(e => e.id === action.payload.eventId);
            if (eventRead) {
                if (!eventRead.readBy) eventRead.readBy = [];
                if (!eventRead.readBy.includes(action.payload.userId)) eventRead.readBy.push(action.payload.userId);
            }
            break;
        case 'MARK_EVENT_COMPLETED':
            const eventComp = data.events.find(e => e.id === action.payload.eventId);
            if (eventComp) {
                if (!eventComp.completedBy) eventComp.completedBy = [];
                if (!eventComp.completedBy.includes(action.payload.userId)) eventComp.completedBy.push(action.payload.userId);
            }
            break;
        case 'SAVE_REWARD':
            const rewardIndex = data.rewards.findIndex(r => r.id === action.payload.id);
            if (rewardIndex >= 0) data.rewards[rewardIndex] = action.payload;
            else data.rewards.push(action.payload);
            break;
        case 'DELETE_REWARD':
            data.rewards = data.rewards.filter(r => r.id !== action.payload);
            break;
        case 'ADD_TRANSACTION':
            data.transactions.push(action.payload);
            break;
        case 'PURCHASE_ITEM':
             data.transactions.push(action.payload.transaction);
             const user = data.users.find(u => u.id === action.payload.userId);
             if(user) {
                 if(!user.inventory) user.inventory = [];
                 if(!user.inventory.includes(action.payload.itemId)) user.inventory.push(action.payload.itemId);
             }
             break;
        default:
            console.warn("Unknown action type:", action.type);
    }
}

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

// Endpoint to handle actions
app.post('/api/action', async (req, res) => {
    const action = req.body;
    try {
        await withDb((data) => {
            handleAction(data, action);
        });
        res.json({ success: true });
    } catch (e) {
        console.error("Action error:", e);
        res.status(500).json({ error: e.message });
    }
});

// Endpoint to save all data (Deprecated but kept for init/emergency if needed, though client shouldn't use it anymore)
// Kept for backward compatibility if any old client connects? No, we control the client.
// But let's leave it restricted or remove it to enforce usage of actions.
// Actually, let's keep it but it will overwrite. Better remove it to prevent the bug from reoccurring.
// I will comment it out or make it use the queue just in case.
app.post('/api/data', async (req, res) => {
  try {
    await withDb((data) => {
        // Replace all data
        Object.assign(data, req.body);
    });
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
