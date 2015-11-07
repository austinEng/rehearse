"use strict"
var express = require('express');
var router = express.Router();

module.exports = router;

require('./account')(router);

router.isAuthenticated = function (req, res, next) {
  if (req.isAuthenticated())
    return next();
  res.redirect('/login');
}

router.get('/', router.isAuthenticated, function (req, res) {
  res.render('index', {

  });
});

router.get('/about', function (req, res) {
	res.render('about');
});

router.get('/profile', function (req, res) {
	res.render('profile');
});

router.use('/receivedata', require('./receivedata'));
