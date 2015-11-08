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
  for (var i = 0; i < sessions.length; i++) {
    if(sessions[i].wpm != -1){
      console.log(avg_wpm);
      avg_wpm += sessions[i].wpm;
      avg_hesitation += sessions[i].hesitations;
      avg_clarity += sessions[i].avgClarity;
      avg_spacing += sessions[i].avgSpacing;
    }
  }
  avg_wpm = Math.round(avg_wpm / sessions.length * 1000)/1000;
  avg_hesitation = Math.round(avg_hesitation / sessions.length * 1000)/1000;
  avg_clarity = Math.round(avg_clarity / sessions.length * 1000)/1000; 
  avg_spacing = Math.round(avg_spacing / sessions.length * 1000)/1000;
  req.user.sessions_info = {'avg_wpm': avg_wpm, 'avg_hesitation': avg_hesitation, 'avg_clarity': avg_clarity, 'avg_spacing': avg_spacing};

  // var session1 = {'wpm': 10.5, 'hesitation': 10, 'spacing': 3, 'clarity': 0.4, 'time': new Date(2012, 9, 1)};
  // var session2 = {'wpm': 40, 'hesitation': 2, 'spacing': 0.82, 'clarity': 3.2,'time': new Date(2013, 9, 1)};
  // var session3 = {'wpm': 60, 'hesitation': 0.5, 'spacing': 0.5, 'clarity': 6, 'time': new Date()};
  // req.user.sessions = [session1, session2, session3];
  console.log(req.user.sessions);
  console.log(JSON.stringify(req.user.sessions));
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
