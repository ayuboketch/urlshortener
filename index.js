const express = require('express');
const bodyParser = require('body-parser');
const dns = require('dns');
const { URL } = require('url');
const mongoose = require('mongoose');

const app = express();

// ─── Middleware ─────────────────────────────────
app.use(bodyParser.urlencoded({ extended: false }));

// ─── Mongoose Model ─────────────────────────────
mongoose.connect(process.env.MONGO_URI);
const Url = mongoose.model('Url', new mongoose.Schema({
  original_url: String,
  short_url: Number
}));

// ─── POST /api/shorturl ──────────────────────────
app.post('/api/shorturl', (req, res) => {
  const input = req.body.url;
  let host;
  try {
    host = new URL(input).hostname;
  } catch {
    return res.json({ error: 'invalid url' });
  }

  dns.lookup(host, (err) => {
    if (err) return res.json({ error: 'invalid url' });

    Url.findOne({ original_url: input }, (e, existing) => {
      if (existing) {
        return res.json({
          original_url: existing.original_url,
          short_url: existing.short_url
        });
      }
      Url.countDocuments({}, (cErr, count) => {
        const record = new Url({
          original_url: input,
          short_url: count + 1
        });
        record.save(() => {
          res.json({
            original_url: record.original_url,
            short_url: record.short_url
          });
        });
      });
    });
  });
});

// ─── GET /api/shorturl/:short_url ───────────────
app.get('/api/shorturl/:short_url', (req, res) => {
  Url.findOne({ short_url: req.params.short_url }, (e, doc) => {
    if (!doc) {
      return res.json({ error: 'No short URL found for given input' });
    }
    res.redirect(doc.original_url);
  });
});

// ─── Start Server ───────────────────────────────
app.listen(process.env.PORT || 3000);
