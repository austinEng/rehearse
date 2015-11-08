"use strict";
var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');
var bcrypt = require("bcryptjs");


var UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    index: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  salt: {
    type: String
  },
  sessions: []
});

UserSchema.plugin(uniqueValidator);

UserSchema.pre('save', function (next) {
  var user = this;
  if (this.isModified('password') || this.isNew) {
    bcrypt.genSalt(10, function (err, salt) {
      if (err) {
        return next(err);
      }
      bcrypt.hash(user.password, salt, function (err, hash) {
        if (err) {
          return next(err);
        }
        user.password = hash;
        user.salt = salt;
        next();
      });
    });
  } else {
    return next();
  }
});

UserSchema.plugin(uniqueValidator);

UserSchema.methods.comparePassword = function (passw, cb) {
  var that = this;
  bcrypt.hash(passw, this.salt, function (err, hash) {
    if (err) {
      return cb(err);
    }
    cb(null, hash == that.password);
  });
};

UserSchema.methods.saveSession = function (session, callback) {
  this.sessions.push(session);
  this.save(callback);
};

module.exports = mongoose.model('User', UserSchema);