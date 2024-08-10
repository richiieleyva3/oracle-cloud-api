var express = require('express');
var router = express.Router();

// Home
router.get('/', (req, res) => {
  res.render('index', { title: 'API - Ricardo Leyva' });
});

module.exports = router;
