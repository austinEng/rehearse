var mongo = require ('./mongo');

module.exports = {
  createUser: function (username, password, callback) {
    var user = new mongo.User({username: username, password: password});
    console.log('Saving user');
    user.save(function (error, username) {
      callback(error, username);
    });
  },

  containsUser: function (username, password, callback) {
    console.log('Checking if database contains user: %s', username);
    mongo.User.find({username: username, password: password}, function (error, result) {
      if (error) {
        callback(error);
      } else {
        callback(null, result);
      }
    });
  },

  getAllUsers: function (callback) {
    mongo.User.find(callback);
  },

  destroy: function (callback) {
    mongo.User.remove({}, callback);
  }
};
