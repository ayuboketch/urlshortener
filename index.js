require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dns = require('dns');
const mongoose = require('mongoose');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

// Connect to MongoDB (you'll need to set up your own MongoDB database and connection string)
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost/urlshortener');

// Create URL schema and model
const urlSchema = new mongoose.Schema({
  original_url: { type: String, required: true },
  short_url: { type: Number, required: true }
});

const Url = mongoose.model('Url', urlSchema);

// Set up middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use('/public', express.static(`${process.cwd()}/public`));

// Root route
app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// URL validation function
function isValidUrl(url) {
  try {
    const newUrl = new URL(url);
    return newUrl.protocol === 'http:' || newUrl.protocol === 'https:';
  } catch (err) {
    return false;
  }
}

// Create short URL route
app.post('/api/shorturl', function(req, res) {
  const originalUrl = req.body.url;
  
  // Check if the URL is valid
  if (!isValidUrl(originalUrl)) {
    return res.json({ error: 'invalid url' });
  }
  
  // Extract hostname for DNS lookup
  const urlObject = new URL(originalUrl);
  const hostname = urlObject.hostname;
  
  // Verify the URL exists using DNS lookup
  dns.lookup(hostname, async (err) => {
    if (err) {
      return res.json({ error: 'invalid url' });
    }
    
    try {
      // Check if URL already exists in database
      let urlDoc = await Url.findOne({ original_url: originalUrl });
      
      if (urlDoc) {
        // URL already exists, return it
        return res.json({
          original_url: urlDoc.original_url,
          short_url: urlDoc.short_url
        });
      } else {
        // Count existing documents to generate new short_url
        const count = await Url.countDocuments({});
        const shortUrl = count + 1;
        
        // Create new URL document
        urlDoc = new Url({
          original_url: originalUrl,
          short_url: shortUrl
        });
        
        await urlDoc.save();
        
        return res.json({
          original_url: urlDoc.original_url,
          short_url: urlDoc.short_url
        });
      }
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Server error' });
    }
  });
});

// Redirect to original URL route
app.get('/api/shorturl/:short_url', async function(req, res) {
  const shortUrl = parseInt(req.params.short_url);
  
  try {
    const urlDoc = await Url.findOne({ short_url: shortUrl });
    
    if (urlDoc) {
      return res.redirect(urlDoc.original_url);
    } else {
      return res.status(404).json({ error: 'No short URL found for the given input' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Server error' });
  }
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

module.exports = app; // for testing