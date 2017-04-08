const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../bin/www');
const should = chai.should();
const User = require('../models').User;
const Group = require('../models').Group;

chai.use(chaiHttp);

describe('User', function() {
  after(function(done) {
    Group.destroy({ where: {} }).then(function() {
      done();
    });
  });

  afterEach(function(done) {
    User.destroy({ where: {} }).then(function() {
      done();
    });
  });

  describe('GET /users/:id', function() {
    it('should get an user with a given id', function(done) {
      User.create({ name: 'User' }).then(function(user) {
        chai.request(server)
          .get(`/users/${user.id}`)
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
            res.body.user.id.should.equal(user.id);
            res.body.user.name.should.equal(user.name);
            done();
          });
      });
    });
  });

  describe('POST /users', function() {
    it('should add an user', function(done) {
      const user = { name: 'User' };
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
      User.create({ name: 'User' }).then(function(user) {
        chai.request(server)
          .patch(`/users/${user.id}`)
          .send({ name: 'Updated' })
          .end((err, res) => {
            res.should.have.status(200);
            res.should.be.json;
            res.body.should.be.a('object');
            res.body.should.have.property('id');
            res.body.should.have.property('name');
            res.body.should.have.property('createdAt');
            res.body.should.have.property('updatedAt');
            res.body.id.should.equal(user.id);
            res.body.name.should.equal('Updated');
            done();
          });
      });
    });
  });

  describe('DELETE /users/:id', function() {
    it('should delete user with a given id', function(done) {
      User.create({ name: 'User' }).then(function(user) {
        chai.request(server)
          .delete(`/users/${user.id}`)
          .end((err, res) => {
            res.should.have.status(200);
            done();
          });
      });
    });
  });

  describe('GET /users/:id/groups', function() {
    it('should get the groups of an user with a given id', function(done) {
      let userId;
      let groupId;
      Promise.all([User.create({ name: 'User' }), Group.create({ name: 'Group' })])
        .then((values) => {
          const user = values[0];
          const group = values[1];
          userId = user.id;
          groupId = group.id;
          return group.addUser(userId);
        })
        .then(() => {
          chai.request(server)
            .get(`/users/${userId}/groups`)
            .end((err, res) => {
              res.should.have.status(200);
              res.should.be.json;
              res.body.should.be.a('array');
              res.body[0].should.be.a('object');
              res.body[0].should.have.property('id');
              res.body[0].id.should.equal(groupId);
              res.body[0].should.have.property('name');
              res.body[0].should.have.property('createdAt');
              res.body[0].should.have.property('updatedAt');
              res.body[0].should.have.property('UserGroup');
              res.body[0].UserGroup.should.be.a('object');
              res.body[0].UserGroup.should.have.property('UserId');
              res.body[0].UserGroup.UserId.should.equal(userId);
              done();
            });
        });
    });
  });
});
