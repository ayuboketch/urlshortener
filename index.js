require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dns = require('dns');
const { URL } = require('url');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const app = express();

// ⬇️ Middleware to parse POST body (application/x‑www‑form‑urlencoded) :contentReference[oaicite:6]{index=6}
app.use(bodyParser.urlencoded({ extended: false }));

app.use(cors());
app.use(express.json()); // If you also accept JSON bodies :contentReference[oaicite:7]{index=7}

// ⬇️ MongoDB setup (or switch to any DB)
// Replace MONGO_URI with your connection string
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
const urlSchema = new mongoose.Schema({
  original_url: { type: String, required: true },
  short_url: { type: Number, unique: true }
});
const Url = mongoose.model('Url', urlSchema);

// ──────────────────────────────────────────────────────────────────────────────
// POST /api/shorturl → returns { original_url, short_url } or { error: 'invalid url' }
// ──────────────────────────────────────────────────────────────────────────────
app.post('/api/shorturl', (req, res) => {
  const original = req.body.url;
  
  // 1. Validate URL syntax :contentReference[oaicite:8]{index=8}
  let hostname;
  try {
    hostname = new URL(original).hostname;
  } catch (err) {
    return res.json({ error: 'invalid url' });
  }

  // 2. Verify DNS resolution :contentReference[oaicite:9]{index=9}
  dns.lookup(hostname, (dnsErr) => {
    if (dnsErr) return res.json({ error: 'invalid url' });
    
    // 3. Check if already stored
    Url.findOne({ original_url: original }, (findErr, doc) => {
      if (findErr) return res.status(500).json({ error: 'Server Error' });
      if (doc) {
        // Already exists → return existing mapping
        return res.json({ original_url: doc.original_url, short_url: doc.short_url });
      } 

      // 4. Create new mapping with incremented short_url
      Url.countDocuments({}, (countErr, count) => {
        if (countErr) return res.status(500).json({ error: 'Server Error' });
        const newUrl = new Url({ original_url: original, short_url: count + 1 });
        newUrl.save((saveErr, saved) => {
          if (saveErr) return res.status(500).json({ error: 'Server Error' });
          res.json({ original_url: saved.original_url, short_url: saved.short_url });
        });
      });
    });
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// GET /api/shorturl/:short_url → redirects or returns error
// ──────────────────────────────────────────────────────────────────────────────
app.get('/api/shorturl/:short_url', (req, res) => {
  const id = req.params.short_url;
  Url.findOne({ short_url: id }, (err, doc) => {
    if (err) return res.status(500).json({ error: 'Server Error' });
    if (!doc) {
      // Not found → correct error message
      return res.json({ error: 'No short URL found for given input' });
    }
    // Redirect to the original URL :contentReference[oaicite:10]{index=10}
    res.redirect(doc.original_url);
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server listening on port ${port}`));
