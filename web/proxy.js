const express = require('express');
const fs = require('fs');
const https = require('https');
const path = require('path');

const router = express.Router();

const CALENDAR_SOURCES_PATH = path.join(__dirname, '/data/calendar_sources.json');
const CALENDAR_DEFAULT_SOURCES_PATH = path.join(__dirname, '/static/calendar_sources_default.json');

router.get('/calendar/sources', (req, res) => {
  if (!fs.existsSync(CALENDAR_SOURCES_PATH)) {
    // The file doesn't exist - copy over the defaults file:
    if (fs.existsSync(CALENDAR_DEFAULT_SOURCES_PATH)) {
      fs.copyFileSync(CALENDAR_DEFAULT_SOURCES_PATH, CALENDAR_SOURCES_PATH);
    } else {
      return res.status(500).send('Default calendar sources file not found');
    }
  }
  const data = fs.readFileSync(CALENDAR_SOURCES_PATH, 'utf8');
  res.json(JSON.parse(data));
});

router.get('/calendar/data', (req, res) => {
  const url = req.query.url;
  if (!url) {
    return res.status(400).send('Missing url parameter');
  }
  https.get(url, (icalRes) => {
    res.setHeader('Content-Type', 'text/calendar');
    icalRes.pipe(res);
  }).on('error', () => res.status(500).send('Failed'));
});

module.exports = router;
