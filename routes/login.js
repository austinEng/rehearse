var express = require('express');
var router = express.Router();
var usersDb = require('../db/user');

router.route('/')
  .get(function (req, res) {
    res.render('login');
  })
  .post(function (req, res) {
    if (req.body.login) {
    var username = req.body.username;
    var password = req.body.password;
    usersDb.containsUser(username, password, function (error, user) {
      if (user) {
        req.user = user;
        res.send(user);
      } else {
        res.redirect('/login');
      }
    });
    } else {
      usersDb.destroy(function (error) {
        if (error) {
          next(error);
        } else {
          res.send('Cleared db');
        }
      });
    }
  });

router.route('/register')
  .get(function (req, res) {
    res.render('register');
  })
  .post(function (req, res) {
    var username = req.body.username;
    var password = req.body.password;
    usersDb.createUser(username, password, function(error, username) {
      if (error) {
        next(error);
      } else {
        console.log('Added %s to database!', username);
        res.redirect('/login');
      }
    });
  });

  router.get('/users', function (req, res) {
    usersDb.getAllUsers(function (error, users) {
      if (error) {
        next(error);
      } else {
        res.json(users);
      }
    });
  });

module.exports = router;
