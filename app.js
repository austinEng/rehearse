"use strict";
var logger = require('morgan');
var lessMiddleware = require('less-middleware');
var express = require('express');
var session = require('express-session');
var watson = require('watson-developer-cloud');
var path = require('path');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var passport = require('passport');
var flash = require('connect-flash');

var config = require('./config.js');
var app = express();
app.use(logger('dev'));
app.set('port', process.env.PORT || 3000);

var authService = watson.authorization(config.watson);


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({secret: config.cookie_secret, saveUninitialized: true, resave: true}));
app.use(express.static(path.join(__dirname, '/public')));
app.use(lessMiddleware(path.join(__dirname, 'source', 'less'), {
    dest: path.join(__dirname, 'public'),
    preprocess: {
        path: function(pathname, req) {
            return pathname.replace(path.sep + 'stylesheets' + path.sep, path.sep);
        }
    }
}));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// Routes
var login = require('./routes/login');
var about = require('./routes/about');
var receivedata = require('./routes/receivedata');

    app.use('/login', login);
    app.use('/about', about);
    app.use('/receivedata', receivedata);

app.use('/', require('./routes/router'));

app.post('/api/token', function(req, res, next) {
    authService.getToken({url: config.watson.url}, function(err, token) {
        if (err)
            next(err);
        else
            res.send(token);
    });
});

// Error handling
var handleError = require('./middlewares/handleError');

    app.use('/', handleError);

mongoose.connect('mongodb://localhost:27017/speechanalyzer', function (err) {
  if (err && err.message === 'connect ECONNREFUSED') {
    console.log('Error connecting to mongodb database: %s.\nIs "mongod" running?', err.message);
    process.exit(0);
  } else if (err) {
    throw err;
  } else {
    console.log('DB successfully connected.');
    var server = app.listen(app.get('port'), function() {
        console.log('Express server listening on port ' + server.address().port);
    });

  }
});
