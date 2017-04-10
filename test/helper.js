const models = require('../models');
const server = require('../bin/www');

before(function(done) {
  models.sequelize.sync().then(() => {
    server.listen(3000);
    server.on('listening', done);
  });
});
