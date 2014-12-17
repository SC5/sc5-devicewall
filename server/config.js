if (process.env.NODE_ENV === 'test') {
  module.exports = require('../config.test.json');
} else {
  module.exports = require('../config.json');
}