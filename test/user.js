/* eslint no-undef: 0 */
/* eslint func-names: 0 */
/* eslint prefer-arrow-callback: 0 */
/* eslint no-unused-expressions: 0 */

const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../bin/www');
const User = require('../models').User;
const UserMock = require('./mock-data/mock-data').UserMock;

chai.use(chaiHttp);

describe('User', () => {
  afterEach(function (done) {
    UserMock.deletePersistentInstances()
      .then(() => done());
  });

  describe('GET /users/:id', () => {
    it('should get a single user', function (done) {
      UserMock.createPersistentInstance().then((result) => {
        chai.request(server)
          .get(`/users/${result.user.id}`)
          .end((err, res) => {
            res.should.have.status(200);
            res.should.be.json;
            res.body.should.be.a('object');

            res.body.should.have.property('id');
            res.body.id.should.equal(result.user.id);

            res.body.should.have.property('name');
            res.body.name.should.equal(result.user.name);

            res.body.should.have.property('createdAt');
            res.body.should.have.property('updatedAt');

            done();
          });
      });
    });
    it('should return status code 404 for non-existing user', function (done) {
      chai.request(server)
        .get('/users/-1')
        .end((err, res) => {
          res.should.have.status(404);

          done();
        });
    });
  });

  describe('POST /users', () => {
    it('should create an user', function (done) {
      const user = UserMock.getMockData();
      chai.request(server)
        .post('/users')
        .send(user)
        .end((err, res) => {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('object');

          res.body.should.have.property('id');

          res.body.should.have.property('name');
          res.body.name.should.equal(user.name);

          res.body.should.have.property('createdAt');
          res.body.should.have.property('updatedAt');

          done();
        });
    });
    it('should return status code 400 for invalid input', function (done) {
      chai.request(server)
        .post('/users')
        .send({})
        .end((err, res) => {
          res.should.have.status(400);

          done();
        });
    });
  });

  describe('PATCH /users/:id', () => {
    it('should edit an user', function (done) {
      UserMock.createPersistentInstance().then((result) => {
        chai.request(server)
          .patch(`/users/${result.user.id}`)
          .send({ name: 'Updated' })
          .end((err, res) => {
            res.should.have.status(200);
            res.should.be.json;
            res.body.should.be.a('object');

            res.body.should.have.property('id');
            res.body.id.should.equal(result.user.id);

            res.body.should.have.property('name');
            res.body.name.should.equal('Updated');

            res.body.should.have.property('createdAt');
            res.body.should.have.property('updatedAt');

            done();
          });
      });
    });
    it('should return status code 404 for non-existing user', function (done) {
      chai.request(server)
        .patch('/users/-1')
        .send({ name: 'Updated' })
        .end((err, res) => {
          res.should.have.status(404);

          done();
        });
    });
    it('should return status code 400 for invalid input', function (done) {
      UserMock.createPersistentInstance().then((result) => {
        chai.request(server)
          .patch(`/users/${result.user.id}`)
          .send({})
          .end((err, res) => {
            res.should.have.status(400);

            done();
          });
      });
    });
  });

  describe('DELETE /users/:id', () => {
    it('should delete an user', function (done) {
      UserMock.createPersistentInstance().then((result) => {
        chai.request(server)
          .delete(`/users/${result.user.id}`)
          .end((err, res) => {
            res.should.have.status(204);

            done();
          });
      });
    });
    it('should return status code 404 for non-existing user', function (done) {
      chai.request(server)
        .delete('/users/-1')
        .end((err, res) => {
          res.should.have.status(404);

          done();
        });
    });
  });

  describe('GET /users/:id/groups', () => {
    it('should list groups of an user', function (done) {
      UserMock.createPersistentInstance().then((result) => {
        chai.request(server)
          .get(`/users/${result.user.id}/groups`)
          .end((err, res) => {
            res.should.have.status(200);
            res.should.be.json;
            res.body.should.be.a('array');

            res.body[0].should.be.a('object');

            res.body[0].should.have.property('id');
            res.body[0].id.should.equal(result.group.id);

            res.body[0].should.have.property('name');
            res.body[0].should.have.property('createdAt');
            res.body[0].should.have.property('updatedAt');

            done();
          });
      });
    });
    it('should return empty array when an user has no groups', function (done) {
      User.create(UserMock.getMockData()).then((user) => {
        chai.request(server)
          .get(`/users/${user.id}/groups`)
          .end((err, res) => {
            res.should.have.status(200);
            res.should.be.json;
            res.body.should.be.a('array');
            res.body.should.be.empty;

            done();
          });
      });
    });
    it('should return status code 404 for non-existing user', function (done) {
      chai.request(server)
        .get('/users/-1/groups')
        .end((err, res) => {
          res.should.have.status(404);

          done();
        });
    });
  });

  describe('GET /users/:id/exercises', () => {
    it('should list exercises of an user', function (done) {
      UserMock.createPersistentInstance().then((result) => {
        chai.request(server)
          .get(`/users/${result.user.id}/exercises`)
          .end((err, res) => {
            res.should.have.status(200);
            res.should.be.json;
            res.body.should.be.a('array');

            res.body[0].should.be.a('object');

            res.body[0].should.have.property('id');
            res.body[0].id.should.equal(result.exercise.id);

            res.body[0].should.have.property('note');
            res.body[0].note.should.equal(result.exercise.note);

            res.body[0].should.have.property('sets');
            res.body[0].sets.should.be.a('array');

            res.body[0].should.have.property('createdAt');
            res.body[0].should.have.property('updatedAt');

            res.body[0].should.have.property('user');
            res.body[0].user.should.be.a('object');
            res.body[0].user.should.have.property('id');
            res.body[0].user.id.should.equal(result.user.id);
            res.body[0].user.should.have.property('name');
            res.body[0].user.name.should.equal(result.user.name);

            res.body[0].should.have.property('exerciseType');
            res.body[0].exerciseType.should.be.a('object');
            res.body[0].exerciseType.should.have.property('name');
            res.body[0].exerciseType.name.should.equal(result.exerciseType.name);

            done();
          });
      });
    });
    it('should return empty array when an user has no exercises', function (done) {
      User.create(UserMock.getMockData()).then((user) => {
        chai.request(server)
          .get(`/users/${user.id}/exercises`)
          .end((err, res) => {
            res.should.have.status(200);
            res.should.be.json;
            res.body.should.be.a('array');
            res.body.should.be.empty;

            done();
          });
      });
    });
    it('should return status code 404 for non-existing user', function (done) {
      chai.request(server)
        .get('/users/-1/exercises')
        .end((err, res) => {
          res.should.have.status(404);

          done();
        });
    });
  });

  describe('GET /users/:id/statistics', () => {
    it('should get statistics of an user', function (done) {
      UserMock.createPersistentInstance().then((result) => {
        chai.request(server)
          .get(`/users/${result.user.id}/statistics`)
          .end((err, res) => {
            res.should.have.status(200);
            res.should.be.json;
            res.body.should.be.a('object');

            res.body.should.have.property('totalWeightLifted');
            res.body.totalWeightLifted.should.equal(0);

            done();
          });
      });
    });
  });
});
