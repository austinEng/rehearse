"use strict";
var logger = require('morgan');
var lessMiddleware = require('less-middleware');
var express = require('express');
var watson = require('watson-developer-cloud');
var path = require('path');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');

var config = require('./config.js');

var authService = watson.authorization(config.watson);

var app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, '/public')));
app.use(lessMiddleware(path.join(__dirname, 'source', 'less'), {
    dest: path.join(__dirname, 'public'),
    preprocess: {
        path: function(pathname, req) {
            return pathname.replace(path.sep + 'stylesheets' + path.sep, path.sep);
        }
    }
}));


mongoose.connect(process.env.MONGOLAB_URI || 'mongodb://localhost:27017/speechanalyzer', function(err) {
    if(!err) {
        console.log('Connected to database');
    } else {
        return;
    }

    app.get('/', function(req, res, next) {
        res.render('index', { ct: req._csrfToken });
    });

    app.get('/login', function(req, res, next) {
        res.render('login');
    });

    app.post('/api/token', function(req, res, next) {
        authService.getToken({url: config.watson.url}, function(err, token) {
            if (err)
                next(err);
            else
                res.send(token);
        });
    });

    app.use('/receivedata', require('./middlewares/processMetadata'));

    var port = process.env.PORT || 3000;
    app.listen(port);
});

