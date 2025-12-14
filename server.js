import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3010;

app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', function (req, res) {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// IMPORTANT: Bind to '0.0.0.0' to listen on all network interfaces
// This allows access from other devices on the LAN (Mobiles/Tablets)
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 SuperTareas Server running on port ${PORT}`);
  console.log(`👉 Access via LAN IP: http://<your-server-ip>:${PORT}`);
  console.log(`👉 Access via Localhost: http://localhost:${PORT}`);
});