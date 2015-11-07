var express = require('express');
var router = express.Router();

router.route('/about')
  .get(function (req, res) {
    res.render('about');
  });

module.exports = router;
