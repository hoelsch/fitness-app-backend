const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../bin/www');
const should = chai.should();
const User = require('../models').User;

chai.use(chaiHttp);

describe('User', function() {
  afterEach(function(done) {
    User.destroy({ where: {} }).then(function() {
      done();
    });
  });

  describe('GET /users/:id', function() {
    it('should get an user with a given id', function(done) {
      User.create({ name: 'Test' }).then(function(newUser) {
        chai.request(server)
          .get(`/users/${newUser.id}`)
          .end((err, res) => {
            res.should.have.status(200);
            res.should.be.json;
            res.body.should.be.a('object');
            res.body.should.have.property('user');
            res.body.user.should.be.a('object');
            res.body.user.should.have.property('id');
            res.body.user.should.have.property('name');
            res.body.user.should.have.property('createdAt');
            res.body.user.should.have.property('updatedAt');
            res.body.user.id.should.equal(newUser.id);
            res.body.user.name.should.equal(newUser.name);
            done();
          });
      });
    });
  });

  describe('POST /users', function() {
    it('should add an user', function(done) {
      const user = { name: 'Test' };
      chai.request(server)
        .post('/users')
        .send(user)
        .end((err, res) => {
          res.should.have.status(200);
          res.should.be.json;
          res.body.user.should.be.a('object');
          res.body.user.should.have.property('id');
          res.body.user.should.have.property('name');
          res.body.user.should.have.property('createdAt');
          res.body.user.should.have.property('updatedAt');
          res.body.user.name.should.equal(user.name);
          done();
        });
    });
  });

  describe('PATCH /users/:id', function() {
    it('should update user with a given id', function(done) {
      User.create({ name: 'Test' }).then(function(newUser) {
        chai.request(server)
          .patch(`/users/${newUser.id}`)
          .send({ name: 'Updated' })
          .end((err, res) => {
            res.should.have.status(200);
            res.should.be.json;
            res.body.should.be.a('object');
            res.body.should.have.property('id');
            res.body.should.have.property('name');
            res.body.should.have.property('createdAt');
            res.body.should.have.property('updatedAt');
            res.body.id.should.equal(newUser.id);
            res.body.name.should.equal('Updated');
            done();
          });
      });
    });
  });

  describe('DELETE /users/:id', function() {
    it('should delete user with a given id', function(done) {
      User.create({ name: 'Test' }).then(function(newUser) {
        chai.request(server)
          .delete(`/users/${newUser.id}`)
          .end((err, res) => {
            res.should.have.status(200);
            done();
          });
      });
    });
  });
});
