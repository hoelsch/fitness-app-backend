const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../bin/www');
const should = chai.should();
const Group = require('../models').Group;
const User = require('../models').User;
const Exercise = require('../models').Exercise;
const ExerciseType = require('../models').ExerciseType;
const Set = require('../models').Set;
const MockData = require('./mock-data');

chai.use(chaiHttp);

/**
 * Creates and stores a group in db.
 */
function createGroup() {
  return new Promise((resolve) => {
    let group;
    let user;
    let set;
    let exercise;
    let exerciseType;

    Promise.all([
      Group.create(MockData.group),
      User.create(MockData.user),
      Exercise.create(MockData.exercise),
      ExerciseType.create(MockData.exerciseType),
      Set.create(MockData.set),
    ])
      .then((values) => {
        group = values[0];
        user = values[1];
        exercise = values[2];
        exerciseType = values[3];
        set = values[4];

        return group.addUser(user);
      })
      .then(() => exercise.setUser(user))
      .then(() => exercise.setExerciseType(exerciseType))
      .then(() => set.setExercise(exercise))
      .then(() => resolve({ group, user, exercise, exerciseType, sets: [set] }));
  });
}

describe('Group', () => {
  after(function (done) {
    User.destroy({ where: {} })
      .then(() => Exercise.destroy({ where: {} }))
      .then(() => ExerciseType.destroy({ where: {} }))
      .then(() => Set.destroy({ where: {} }))
      .then(() => done());
  });

  afterEach(function (done) {
    Group.destroy({ where: {} }).then(() => done());
  });

  describe('GET /groups', () => {
    it('should list groups', function (done) {
      createGroup().then((result) => {
        chai.request(server)
          .get('/groups')
          .end((err, res) => {
            res.should.have.status(200);
            res.should.be.json;
            res.body.should.be.a('array');

            res.body[0].should.have.property('id');
            res.body[0].id.should.equal(result.group.id);

            res.body[0].should.have.property('name');
            res.body[0].name.should.equal(result.group.name);

            res.body[0].should.have.property('createdAt');
            res.body[0].should.have.property('updatedAt');

            done();
          });
      });
    });
  });

  describe('GET /groups/:id', () => {
    it('should get a single group', function (done) {
      createGroup().then((result) => {
        chai.request(server)
          .get(`/groups/${result.group.id}`)
          .end((err, res) => {
            res.should.have.status(200);
            res.should.be.json;
            res.body.should.be.a('object');

            res.body.should.have.property('id');
            res.body.id.should.equal(result.group.id);

            res.body.should.have.property('name');
            res.body.name.should.equal(result.group.name);

            res.body.should.have.property('createdAt');
            res.body.should.have.property('updatedAt');

            done();
          });
      });
    });
    it('should return status code 404 for non-existing group', function (done) {
      chai.request(server)
        .get('/groups/-1')
        .end((err, res) => {
          res.should.have.status(404);

          done();
        });
    });
  });

  describe('POST /groups', () => {
    it('should create a group', function (done) {
      chai.request(server)
        .post('/groups')
        .send(MockData.group)
        .end((err, res) => {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('object');

          res.body.should.have.property('id');

          res.body.should.have.property('name');
          res.body.name.should.equal(MockData.group.name);

          res.body.should.have.property('createdAt');
          res.body.should.have.property('updatedAt');

          done();
        });
    });
    it('should return status code 400 for invalid input data', function (done) {
      chai.request(server)
        .post('/groups')
        .send({})
        .end((err, res) => {
          res.should.have.status(400);

          done();
        });
    });
  });

  describe('PATCH /groups/:id', () => {
    it('should edit a group', function (done) {
      createGroup().then((result) => {
        chai.request(server)
          .patch(`/groups/${result.group.id}`)
          .send({ name: 'Updated' })
          .end((err, res) => {
            res.should.have.status(200);
            res.should.be.json;
            res.body.should.be.a('object');

            res.body.should.have.property('id');
            res.body.id.should.equal(result.group.id);

            res.body.should.have.property('name');
            res.body.name.should.equal('Updated');

            res.body.should.have.property('createdAt');
            res.body.should.have.property('updatedAt');

            done();
          });
      });
    });
    it('should return status code 404 for non-existing group', function (done) {
      createGroup().then((result) => {
        chai.request(server)
          .patch('/groups/-1')
          .send({ name: 'Updated' })
          .end((err, res) => {
            res.should.have.status(404);

            done();
          });
      });
    });
    it('should return status code 400 for invalid input data', function (done) {
      createGroup().then((result) => {
        chai.request(server)
          .patch(`/groups/${result.group.id}`)
          .send({})
          .end((err, res) => {
            res.should.have.status(400);

            done();
          });
      });
    });
  });

  describe('DELETE /groups/:id', () => {
    it('should delete a group', function (done) {
      createGroup().then((result) => {
        chai.request(server)
          .delete(`/groups/${result.group.id}`)
          .end((err, res) => {
            res.should.have.status(204);

            done();
          });
      });
    });
    it('should return status code 404 for non-existing group', function (done) {
      chai.request(server)
        .delete('/groups/-1')
        .end((err, res) => {
          res.should.have.status(404);

          done();
        });
    });
  });

  describe('GET /groups/:id/members', () => {
    it('should list members of a group', function (done) {
      createGroup().then((result) => {
        chai.request(server)
          .get(`/groups/${result.group.id}/members`)
          .end((err, res) => {
            res.should.have.status(200);
            res.should.be.json;
            res.body.should.be.a('array');

            res.body[0].should.be.a('object');

            res.body[0].should.have.property('id');
            res.body[0].id.should.equal(result.user.id);

            res.body[0].should.have.property('name');
            res.body[0].name.should.equal(result.user.name);

            res.body[0].should.have.property('createdAt');
            res.body[0].should.have.property('updatedAt');

            done();
          });
      });
    });
    it('should return status code 404 for non-existing group', function (done) {
      chai.request(server)
        .get('/groups/-1/members')
        .end((err, res) => {
          res.should.have.status(404);

          done();
        });
    });
  });

  describe('POST /groups/:id/members', () => {
    it('should add an user to a group', function (done) {
      createGroup().then((result) => {
        chai.request(server)
          .post(`/groups/${result.group.id}/members`)
          .send({ userId: result.user.id })
          .end((err, res) => {
            res.should.have.status(204);

            done();
          });
      });
    });
    it('should return status code 404 for non-existing group', function (done) {
      createGroup().then((result) => {
        chai.request(server)
          .post('/groups/-1/members')
          .send({ userId: result.user.id })
          .end((err, res) => {
            res.should.have.status(404);

            done();
          });
      });
    });
    it('should return status code 400 for invalid input data', function (done) {
      createGroup().then((result) => {
        chai.request(server)
          .post(`/groups/${result.group.id}/members`)
          .send({})
          .end((err, res) => {
            res.should.have.status(400);

            done();
          });
      });
    });
  });

  describe('DELETE /groups/:group-id/members/:user-id', () => {
    it('should delete an user of a group', function (done) {
      createGroup().then((result) => {
        chai.request(server)
          .delete(`/groups/${result.group.id}/members/${result.user.id}`)
          .end((err, res) => {
            res.should.have.status(204);

            done();
          });
      });
    });
    it('should return status code 404 for non-existing group', function (done) {
      createGroup().then((result) => {
        chai.request(server)
          .delete(`/groups/-1/members/${result.user.id}`)
          .end((err, res) => {
            res.should.have.status(404);

            done();
          });
      });
    });
    it('should return status code 404 for non-existing user', function (done) {
      createGroup().then((result) => {
        chai.request(server)
          .delete(`/groups/${result.group.id}/members/-1`)
          .end((err, res) => {
            res.should.have.status(404);

            done();
          });
      });
    });
  });

  describe('GET /groups/:id/exercises', () => {
    it('should list exercises of a group', function (done) {
      createGroup().then((result) => {
        chai.request(server)
          .get(`/groups/${result.group.id}/exercises`)
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
            res.body[0].sets[0].should.have.property('numReps');
            res.body[0].sets[0].numReps.should.equal(result.sets[0].numReps);
            res.body[0].sets[0].should.have.property('weight');
            res.body[0].sets[0].weight.should.equal(result.sets[0].weight);

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

            res.body[0].should.have.property('createdAt');
            res.body[0].should.have.property('updatedAt');

            done();
          });
      });
    });
    it('should return status code 404 for non-existing group', function (done) {
      chai.request(server)
        .get('/groups/-1/exercises')
        .end((err, res) => {
          res.should.have.status(404);

          done();
        });
    });
  });
});
