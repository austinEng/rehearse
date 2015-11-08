var handleError = function handleError (err, req, res, next) {
  res.render('error', {
    statusCode: res.statusCode,
    message: err.message,
    stackTrace: err.stack
  });
};

module.exports = handleError;
