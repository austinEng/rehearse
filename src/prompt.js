var getRandomInt = function (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

exports.generatePrompt = function () {
  var prompts = ['Tell me about yourself.', 'How do you react to pressure?',
  'Do you prefer to work in a team or alone? Why?', 'Describe a recent programming challenge and how you dealt with it.',
  'What is your biggest weakness?', 'Are you detailed-oriented or more concerned about the big picture?',
  'Give an example of when you went above and beyond what you were expected to do.',
  'Tell me about a time you had to confront a peer, customer, or colleague.',
  'Describe the work environment that makes you thrive.', 'Describe the most challenging project you\'ve ever worked on.',
  'What are your career goals?', 'Describe a passion you have outside of tech.',
  'Tell me about a time when you had to lead a project. How did you handle it?',
  'What is your greatest strength?'];
  return prompts[getRandomInt(0, prompts.length - 1)];
};
