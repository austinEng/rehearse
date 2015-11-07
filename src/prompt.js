var getRandomInt = function (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

exports.generatePrompt = function () {
  var prompts = ['Tell me about yourself.', 'Tell me about a recent project you\'ve worked on.',
  'Do you prefer to work in a team or alone? Why?', 'Describe a recent programming challenge you encountered and how you dealt with it.',
  'What is your biggest weakness?'];
  return prompts[getRandomInt(0, prompts.length - 1)];
};
