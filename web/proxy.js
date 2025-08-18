const express = require('express');
const fs = require('fs');
const https = require('https');
const path = require('path');

const router = express.Router();

const CALENDAR_SOURCES_PATH = path.join(__dirname, '/data/calendar_sources.json');
const CALENDAR_DEFAULT_SOURCES_PATH = path.join(__dirname, '/static/calendar_sources_default.json');

const SETTINGS_PATH = path.join(__dirname, '/data/settings.json');
// GET navbar title
router.get('/settings/navbar-title', (req, res) => {
  if (!fs.existsSync(SETTINGS_PATH)) {
    return res.json({ navbarTitle: 'Calberry' });
  }
  try {
    const data = fs.readFileSync(SETTINGS_PATH, 'utf8');
    const json = JSON.parse(data);
    res.json({ navbarTitle: json.navbarTitle || 'Calberry' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to read settings' });
  }
});

// POST navbar title
router.post('/settings/navbar-title', express.json(), (req, res) => {
  const { navbarTitle } = req.body;
  if (typeof navbarTitle !== 'string') {
    return res.status(400).json({ error: 'navbarTitle must be a string' });
  }
  let settings = {};
  if (fs.existsSync(SETTINGS_PATH)) {
    try {
      settings = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
    } catch (e) {
      // ignore, will overwrite
    }
  }
  settings.navbarTitle = navbarTitle;
  try {
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2), 'utf8');
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to write settings' });
  }
});

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
router.post('/calendar/sources', express.json(), (req, res) => {
  const newList = req.body;
  if (!Array.isArray(newList)) return res.status(400).json({ error: 'Invalid format' });

  // Optionally: validate each item here
  try {
    fs.writeFileSync(CALENDAR_SOURCES_PATH, JSON.stringify(newList, null, 2), 'utf8');
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to write settings' });
  }
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
