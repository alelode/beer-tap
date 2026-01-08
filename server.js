import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const STATE_FILE = path.join(__dirname, 'state.json');

app.use(cors());
app.use(express.json());

// Serve static files from dist (for production)
app.use(express.static(path.join(__dirname, 'dist')));

// API endpoint to get state
app.get('/api/state', async (req, res) => {
  try {
    const data = await fs.readFile(STATE_FILE, 'utf-8');
    res.json(JSON.parse(data));
  } catch (error) {
    console.error('Feil ved lesing av tilstand:', error);
    res.status(500).json({ error: 'Kunne ikke lese tilstand' });
  }
});

// API endpoint to update state
app.put('/api/state', async (req, res) => {
  try {
    await fs.writeFile(STATE_FILE, JSON.stringify(req.body, null, 4), 'utf-8');
    res.json({ success: true });
  } catch (error) {
    console.error('Feil ved skriving av tilstand:', error);
    res.status(500).json({ error: 'Kunne ikke skrive tilstand' });
  }
});

// For production: serve React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

