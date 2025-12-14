// This server is used to serve the static build files for the React app
// It fulfills the requirement to run on a local server with Ubuntu and PM2
const express = require('express');
const path = require('path');
const app = express();

// Port configured to 3010 as requested
const PORT = 3010;

// Serve static files from the build directory (must run 'npm run build' first)
// In a dev environment without build, you might use 'vite preview' or similar, 
// but for production deployment via PM2, serving static files is standard.
app.use(express.static(path.join(__dirname, 'dist')));

// Handle React Routing, return all requests to React app
app.get('*', function (req, res) {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 SuperTareas Server running on port ${PORT}`);
  console.log(`👉 Local: http://localhost:${PORT}`);
});