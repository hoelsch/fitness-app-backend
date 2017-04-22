const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../bin/www');
const should = chai.should();
const User = require('../models').User;
const Group = require('../models').Group;
const Exercise = require('../models').Exercise;
const ExerciseType = require('../models').ExerciseType;
const Set = require('../models').Set;
const MockData = require('./mock-data');

chai.use(chaiHttp);

/**
 * Creates and stores a new user in db.
 */
function createUser() {
  return new Promise((resolve) => {
    let user;
    let group;
    let exercise;
    let exerciseType;
    let set;

    Promise.all([
      User.create(MockData.user),
      Group.create(MockData.group),
      Exercise.create(MockData.exercise),
      ExerciseType.create(MockData.exerciseType),
      Set.create(MockData.set),
    ])
      .then((values) => {
        user = values[0];
        group = values[1];
        exercise = values[2];
        exerciseType = values[3];
        set = values[4];

        return exercise.setUser(user);
      })
      .then(() => group.addUser(user))
      .then(() => exercise.setExerciseType(exerciseType))
      .then(() => set.setExercise(exercise))
      .then(() => resolve({ user, group, exercise, exerciseType, sets: set }));
  });
}

describe('User', () => {
  after(function (done) {
    Group.destroy({ where: {} })
      .then(() => Exercise.destroy({ where: {} }))
      .then(() => ExerciseType.destroy({ where: {} }))
      .then(() => done());
  });

  afterEach(function (done) {
    User.destroy({ where: {} }).then(() => done());
  });

  describe('GET /users/:id', () => {
    it('should get a single user', function (done) {
      createUser().then((result) => {
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
      chai.request(server)
        .post('/users')
        .send(MockData.user)
        .end((err, res) => {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('object');

          res.body.should.have.property('id');

          res.body.should.have.property('name');
          res.body.name.should.equal(MockData.user.name);

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
      createUser().then((result) => {
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
      createUser().then((result) => {
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
      createUser().then((result) => {
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
      createUser().then((result) => {
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
      User.create(MockData.user).then((user) => {
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
      createUser().then((result) => {
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
            res.body[0].exerciseType.should.have.property('id');
            res.body[0].exerciseType.id.should.equal(result.exerciseType.id);
            res.body[0].exerciseType.should.have.property('name');
            res.body[0].exerciseType.name.should.equal(result.exerciseType.name);

            done();
          });
      });
    });
    it('should return empty array when an user has no exercises', function (done) {
      User.create(MockData.user).then((user) => {
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
      createUser().then((result) => {
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
