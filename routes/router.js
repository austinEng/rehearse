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
  	user: req.user
  });
});

router.get('/about', function (req, res) {
	res.render('about', {
		user: req.user
	});
});   

router.get('/profile', router.isAuthenticated, function (req, res) {
  var sessions = req.user.sessions
  var avwpm = 0;
  var avhesitation = 0;
  var avclarity = 0;
  var avspacing = 0;
  for(var i = 0; i < sessions.length; i++){
      console.log(avwpm);
      avwpm += sessions[i].wpm;
      avhesitation += sessions[i].hesitation;
      avclarity += sessions[i].clarity;
      avspacing += sessions[i].spacing;
  }
  avwpm = avwpm/sessions.length;
  avhesitation = avhesitation/sessions.length;
  avclarity = avclarity/sessions.length; 
  avspacing = avspacing/sessions.length;
  req.user.sessions_info = {'avwpm': avwpm, 'avhesitation': avhesitation, 'avclarity': avclarity, 'avspacing': avspacing};
  res.render('profile', {
    user: req.user
  });
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
