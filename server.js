const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// Serve static files from the current directory
app.use(express.static(__dirname));

// Serve data.json with proper content type
app.get('/data.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.sendFile(path.join(__dirname, 'data.json'));
});

// Serve images with proper content type
app.get('/imgs/:filename', (req, res) => {
  const filename = req.params.filename;
  res.setHeader('Content-Type', 'image/jpeg');
  res.sendFile(path.join(__dirname, 'imgs', filename));
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
}); 