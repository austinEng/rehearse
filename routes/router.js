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
  var sessions = req.user.sessions;
  console.log("hihihi");
  console.log(sessions);
  console.log(sessions.length);
  var avwpm = 0;
  var avhesitation = 0;
  var avclarity = 0;
  var avspacing = 0;
  for(var i = 0; i < sessions.length; i++){
    if(sessions[i].wpm != -1){
      console.log(sessions[i].wpm);
      avwpm += sessions[i].wpm;
      avhesitation += sessions[i].hesitations;
      avclarity += sessions[i].avgClarity;
      avspacing += sessions[i].avgSpacing;
    }
  }
  avwpm = Math.round(avwpm/sessions.length*1000)/1000;
  avhesitation = Math.round(avhesitation/sessions.length*1000)/1000;
  avclarity = Math.round(avclarity/sessions.length*1000)/1000; 
  avspacing = Math.round(avspacing/sessions.length*1000)/1000;
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
