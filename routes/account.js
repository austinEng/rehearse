"use strict"
var config = require('../config');
var flash = require('connect-flash');
var User = require('../db/user')
var passport = require('passport');
var auth = require('../auth');

module.exports = function(router) {
  router.get('/register', function (req, res) {
    if (req.user) res.redirect('/');
    res.render('register', {
      isRegistration: true,
      error: req.flash('error'),
      user: req.user
    });
  });

  router.post('/register', auth.authenticate('register', {
    successRedirect: '/',
    failureRedirect: '/register',
    failureFlash: true
  }));

  router.get('/login', function (req, res) {
    if (req.user) res.redirect('/');
    res.render('login', {
      isRegistration: false,
      error: req.flash('error'),
      user: req.user
    });
  });

  router.post('/login', auth.authenticate('login', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
  }));

  router.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
  });
}