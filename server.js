// This server is used to serve the static build files for the React app
// It fulfills the requirement to run on a local server with Ubuntu and PM2
const express = require('express');
const path = require('path');
const app = express();

// Port configured to 3010 as requested
const PORT = 3010;

// Serve static files from the build directory (must run 'npm run build' first)
app.use(express.static(path.join(__dirname, 'dist')));

// Handle React Routing, return all requests to React app
app.get('*', function (req, res) {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Explicitly bind to '0.0.0.0' to listen on all network interfaces (LAN/WAN), not just localhost
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 SuperTareas Server running on port ${PORT}`);
  console.log(`👉 Access via LAN IP: http://<your-server-ip>:${PORT}`);
  console.log(`👉 Access via Localhost: http://localhost:${PORT}`);
});