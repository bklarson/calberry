const express = require('express');
const https = require('https');

const router = express.Router();

const ICAL_URL = 'https://calendar.google.com/calendar/ical/en.usa%23holiday%40group.v.calendar.google.com/public/basic.ics';

router.get('/caldata', (req, res) => {
  https.get(ICAL_URL, (icalRes) => {
    res.setHeader('Content-Type', 'text/calendar');
    icalRes.pipe(res);
  }).on('error', () => res.status(500).send('Failed'));
});

module.exports = router;
