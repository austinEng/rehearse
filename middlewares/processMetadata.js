var processMetadata = function (req, res, next) {
  console.log('Received data!');
  console.log(req.body);
};

module.exports = processMetadata;