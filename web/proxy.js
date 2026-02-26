const express = require('express');
const fs = require('fs');
const https = require('https');
const path = require('path');
const { updateSlideshowCache, getSlideshowImages } = require('./slideshow');

const router = express.Router();

const CALENDAR_SOURCES_PATH = path.join(__dirname, '/data/calendar_sources.json');
const CALENDAR_DEFAULT_SOURCES_PATH = path.join(__dirname, '/static/calendar_sources_default.json');

const SETTINGS_PATH = path.join(__dirname, '/data/settings.json');
const WEATHER_PATH = path.join(__dirname, '/data/weather.json');

// Helper functions
function readJsonFile(filePath, defaults = {}) {
  if (!fs.existsSync(filePath)) {
    return defaults;
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    return defaults;
  }
}

function writeJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (e) {
    return false;
  }
}

// Create a GET/POST handler pair for a simple string setting stored in SETTINGS_PATH
function createSettingHandler(fieldName, defaultValue = '', onUpdate = null) {
  return {
    get: (req, res) => {
      const settings = readJsonFile(SETTINGS_PATH);
      res.json({ [fieldName]: settings[fieldName] || defaultValue });
    },
    post: (req, res) => {
      const value = req.body[fieldName];
      if (typeof value !== 'string') {
        return res.status(400).json({ error: `${fieldName} must be a string` });
      }
      const settings = readJsonFile(SETTINGS_PATH);
      const oldValue = settings[fieldName] || defaultValue;
      
      // Bail early if value didn't change
      if (value === oldValue) {
        return res.json({ success: true });
      }
      
      settings[fieldName] = value;
      if (writeJsonFile(SETTINGS_PATH, settings)) {
        if (onUpdate) {
          onUpdate(value);
        }
        res.json({ success: true });
      } else {
        res.status(500).json({ error: 'Failed to write settings' });
      }
    }
  };
}

// Settings handlers using the helper
const navbarTitleHandler = createSettingHandler('navbarTitle', 'Calberry');
const slideshowUrlHandler = createSettingHandler('slideshowUrl', '', (newUrl) => {
  // Update slideshow cache when URL changes
  updateSlideshowCache(newUrl).catch(err => {
    console.error('Failed to update slideshow cache:', err);
  });
});

router.get('/settings/navbar-title', navbarTitleHandler.get);
router.post('/settings/navbar-title', express.json(), navbarTitleHandler.post);

router.get('/settings/slideshow-url', slideshowUrlHandler.get);
router.post('/settings/slideshow-url', express.json(), slideshowUrlHandler.post);

// GET weather settings
router.get('/settings/weather', (req, res) => {
  const weather = readJsonFile(WEATHER_PATH, { zipCode: '' });
  res.json(weather);
});

// POST weather settings
router.post('/settings/weather', express.json(), (req, res) => {
  if (writeJsonFile(WEATHER_PATH, req.body)) {
    res.json({ success: true });
  } else {
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
  const sources = readJsonFile(CALENDAR_SOURCES_PATH, []);
  res.json(sources);
});

router.post('/calendar/sources', express.json(), (req, res) => {
  if (!Array.isArray(req.body)) {
    return res.status(400).json({ error: 'Calendar sources must be an array' });
  }

  if (writeJsonFile(CALENDAR_SOURCES_PATH, req.body)) {
    res.json({ success: true });
  } else {
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

router.get('/slideshow/images', async (req, res) => {
  try {
    const settings = readJsonFile(SETTINGS_PATH, {});
    const albumUrl = settings.slideshowUrl || '';
    const images = await getSlideshowImages(albumUrl);
    res.json(images);
  } catch (e) {
    res.status(500).json({ error: 'Failed to get slideshow images' });
  }
});

module.exports = router;
