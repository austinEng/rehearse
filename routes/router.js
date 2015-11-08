"use strict"
var express = require('express');
var router = express.Router();
var receivedata = require('./receivedata');
var User = require('../db/user');

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

// Debugging and testing routes

router.get('/users', function (req, res) {
  User.find({}, function (error, users) {
    res.json(users);
  });
});

router.get('/cleardb', function (req, res) {
  User.remove({}, function (error) {
    res.send('Cleared db');
  })
});

router.use('/receivedata', receivedata);
