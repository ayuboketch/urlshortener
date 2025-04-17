require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

// 1. You should provide your own project, not the example URL.
// 2. You can POST a URL to /api/shorturl and get a JSON response with original_url and short_url properties. Here's an example: { original_url : 'https://freeCodeCamp.org', short_url : 1}
// 3. When you visit /api/shorturl/<short_url>, you will be redirected to the original URL.
// 4. If you pass an invalid URL that doesn't follow the valid http://www.example.com format, the JSON response will contain { error: 'invalid url' }
// 5. If you pass a short URL that doesn't exist, the JSON response will contain { error: 'No short URL found for given input' }
// 6. The short URL should be a number and should be unique.
// 7. The original URL should be stored in a database.
app.get('/api/shorturl/:short_url', function(req, res) {
  const shortUrl = req.params.short_url;
  // Assuming you have a function to find the original URL by short URL
  findOriginalUrl(shortUrl, (err, originalUrl) => {
    if (err) {
      return res.json({ error: 'No short URL found for given input' });
    }
    res.redirect(originalUrl);
  });
}
);
app.post('/api/shorturl', function(req, res) {
  const originalUrl = req.body.url;
  // Assuming you have a function to create a short URL
  createShortUrl(originalUrl, (err, shortUrl) => {
    if (err) {
      return res.json({ error: 'invalid url' });
    }
    res.json({ original_url: originalUrl, short_url: shortUrl });
  });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
