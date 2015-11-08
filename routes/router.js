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
  var avg_wpm = 0;
  var avg_hesitation = 0;
  var avg_clarity = 0;
  var avg_spacing = 0;
  for(var i = 0; i < sessions.length; i++){
      console.log(avg_wpm);
      avg_wpm += sessions[i].wpm;
      avg_hesitation += sessions[i].hesitation;
      avg_clarity += sessions[i].clarity;
      avg_spacing += sessions[i].spacing;
  }
  avg_wpm = avg_wpm/sessions.length;
  avg_hesitation = avg_hesitation/sessions.length;
  avg_clarity = avg_clarity/sessions.length; 
  avg_spacing = avg_spacing/sessions.length;
  req.user.sessions_info = {'avg_wpm': 4.20, 'avg_hesitation': 4.20, 'avg_clarity': 4.20, 'avg_spacing': 4.20};
  var session1 = {'wpm': 10.5, 'hesitation': 10, 'spacing': 3, 'clarity': 0.4, 'time': new Date(2012, 9, 1)};
  var session2 = {'wpm': 40, 'hesitation': 2, 'spacing': 0.82, 'clarity': 3.2,'time': new Date(2013, 9, 1)};
  var session3 = {'wpm': 60, 'hesitation': 0.5, 'spacing': 0.5, 'clarity': 6, 'time': new Date()};
  req.user.sessions = [session1, session2, session3];
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
