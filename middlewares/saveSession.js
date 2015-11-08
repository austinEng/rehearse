var User = require('../db/user');

var saveSession = function (req, res, next) {
  User.findOne({ username: req.user.username }, function (error, user) {
    if (error) {
      next(error);
    } else {
      user.saveSession(res.speech_data, function () {
        console.log('Saved session');
      });
    }
  });
};

module.exports = saveSession;
