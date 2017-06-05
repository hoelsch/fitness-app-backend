/* eslint no-undef: 0 */
/* eslint func-names: 0 */

const models = require('../models');
const server = require('../bin/www');

before(function (done) {
  this.timeout(15000);

  models.sequelize.sync()
    .then(() => {
      server.listen(3000);
      server.on('listening', done);
    })
    .catch(done);
});
