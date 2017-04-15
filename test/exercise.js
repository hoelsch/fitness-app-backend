const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../bin/www');
const should = chai.should();
const Exercise = require('../models').Exercise;
const ExerciseType = require('../models').ExerciseType;
const Set = require('../models').Set;
const User = require('../models').User;
const Comment = require('../models').Comment;
const MockData = require('./mock-data');

chai.use(chaiHttp);

/**
 * Creates and stores a new exercise in the test db.
 */
function createExercise() {
  return new Promise((resolve) => {
    let exercise;
    let exerciseType;
    let set;
    let user;
    let comment;

    Promise.all([
      Exercise.create(MockData.exercise),
      ExerciseType.create(MockData.exerciseType),
      Set.create(MockData.set),
      User.create(MockData.user),
      Comment.create(MockData.comment),
    ])
      .then((values) => {
        exercise = values[0];
        exerciseType = values[1];
        set = values[2];
        user = values[3];
        comment = values[4];

        return exercise.setExerciseType(exerciseType);
      })
      .then(() => set.setExercise(exercise))
      .then(() => exercise.setUser(user))
      .then(() => comment.setUser(user))
      .then(() => comment.setExercise(exercise))
      .then(() => {
        resolve({ exercise, exerciseType, set, user, comment });
      });
  });
}

describe('Exercise', () => {
  after(function (done) {
    ExerciseType.destroy({ where: {} })
      .then(() => Set.destroy({ where: {} }))
      .then(() => User.destroy({ where: {} }))
      .then(() => Comment.destroy({ where: {} }))
      .then(() => done());
  });

  afterEach(function (done) {
    Exercise.destroy({ where: {} }).then(() => done());
  });

  describe('GET /exercises', () => {
    it('should list exercises', function (done) {
      createExercise().then((result) => {
        chai.request(server)
          .get('/exercises')
          .end((err, res) => {
            res.should.have.status(200);
            res.should.be.json;
            res.body.should.be.a('array');

            res.body[0].should.have.property('id');
            res.body[0].id.should.equal(result.exercise.id);
            res.body[0].should.have.property('note');
            res.body[0].note.should.equal(result.exercise.note);
            res.body[0].should.have.property('createdAt');

            res.body[0].should.have.property('sets');
            res.body[0].sets.should.be.a('array');
            res.body[0].sets[0].should.have.property('id');
            res.body[0].sets[0].id.should.equal(result.set.id);

            res.body[0].should.have.property('user');
            res.body[0].user.should.have.property('id');
            res.body[0].user.id.should.equal(result.user.id);

            res.body[0].should.have.property('exerciseType');
            res.body[0].exerciseType.should.have.property('id');
            res.body[0].exerciseType.id.should.equal(result.exerciseType.id);

            done();
          });
      });
    });
    it('should return empty array for non-existing exercises', function (done) {
      chai.request(server)
        .get('/exercises')
        .end((err, res) => {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('array');
          res.body.should.be.empty;

          done();
        });
    });
  });

  describe('GET /exercises/:id', () => {
    it('should get a single exercise', function (done) {
      createExercise().then((result) => {
        chai.request(server)
          .get(`/exercises/${result.exercise.id}`)
          .end((err, res) => {
            res.should.have.status(200);
            res.should.be.json;
            res.body.should.be.a('object');

            res.body.should.have.property('id');
            res.body.id.should.equal(result.exercise.id);
            res.body.should.have.property('note');
            res.body.note.should.equal(result.exercise.note);
            res.body.should.have.property('createdAt');

            res.body.should.have.property('sets');
            res.body.sets.should.be.a('array');
            res.body.sets[0].should.have.property('id');
            res.body.sets[0].id.should.equal(result.set.id);

            res.body.should.have.property('user');
            res.body.user.should.have.property('id');
            res.body.user.id.should.equal(result.user.id);

            res.body.should.have.property('exerciseType');
            res.body.exerciseType.should.have.property('id');
            res.body.exerciseType.id.should.equal(result.exerciseType.id);

            done();
          });
      });
    });
    it('should return status code 404 for non-existing exercise', function (done) {
      chai.request(server)
        .get('/exercises/-1')
        .end((err, res) => {
          res.should.have.status(404);

          done();
        });
    });
  });

  describe('POST /exercises', () => {
    it('should create an exercise', function (done) {
      User.create(MockData.user).then((user) => {
        chai.request(server)
          .post('/exercises')
          .send({
            note: MockData.exercise.note,
            exerciseTypeName: MockData.exerciseType.name,
            sets: [MockData.set],
            userId: user.id,
          })
          .end((err, res) => {
            res.should.have.status(200);
            res.should.be.json;
            res.body.should.be.a('object');

            res.body.should.have.property('id');
            res.body.should.have.property('note');
            res.body.note.should.equal(MockData.exercise.note);
            res.body.should.have.property('createdAt');
            res.body.should.have.property('updatedAt');

            res.body.should.have.property('sets');
            res.body.sets.should.be.a('array');
            res.body.sets[0].should.have.property('id');

            res.body.should.have.property('user');
            res.body.user.should.have.property('id');
            res.body.user.id.should.equal(user.id);

            res.body.should.have.property('exerciseType');
            res.body.exerciseType.should.have.property('id');

            done();
          });
      });
    });
    it('should return status code 400 for invalid input data', function (done) {
      User.create(MockData.user).then(() => {
        chai.request(server)
          .post('/exercises')
          .send({})
          .end((err, res) => {
            res.should.have.status(400);

            done();
          });
      });
    });
  });

  describe('PATCH /exercises/:id', () => {
    it('should edit an exercise', function (done) {
      createExercise().then((result) => {
        chai.request(server)
          .patch(`/exercises/${result.exercise.id}`)
          .send({ note: 'Updated' })
          .end((err, res) => {
            res.should.have.status(204);

            done();
          });
      });
    });
    it('should return status code 404 for non-existing exercise', function (done) {
      chai.request(server)
        .patch('/exercises/-1')
        .send({ note: 'Updated' })
        .end((err, res) => {
          res.should.have.status(404);

          done();
        });
    });
    it('should return status code 400 for invalid input data', function (done) {
      createExercise().then((result) => {
        chai.request(server)
          .patch(`/exercises/${result.exercise.id}`)
          .send({ invalidAttribute: 'value' })
          .end((err, res) => {
            res.should.have.status(400);

            done();
          });
      });
    });
  });

  describe('DELETE /exercises/:id', () => {
    it('should delete an exercise', function (done) {
      createExercise().then((result) => {
        chai.request(server)
          .delete(`/exercises/${result.exercise.id}`)
          .end((err, res) => {
            res.should.have.status(204);

            done();
          });
      });
    });
    it('should return status code 404 for non-existing exercise', function (done) {
      createExercise().then((result) => {
        chai.request(server)
          .delete('/exercises/-1')
          .end((err, res) => {
            res.should.have.status(404);

            done();
          });
      });
    });
  });

  describe('GET /exercises/:id/sets', () => {
    it('should list sets of an exercise', function (done) {
      createExercise().then((result) => {
        chai.request(server)
          .get(`/exercises/${result.exercise.id}/sets`)
          .end((err, res) => {
            res.should.have.status(200);
            res.should.be.json;
            res.body.should.be.a('array');

            res.body[0].should.have.property('numReps');
            res.body[0].numReps.should.equal(result.set.numReps);

            res.body[0].should.have.property('weight');
            res.body[0].weight.should.equal(result.set.weight);

            done();
          });
      });
    });
    it('should return an empty array when an exercise has no sets', function (done) {
      Exercise.create(MockData.exercise).then((exercise) => {
        chai.request(server)
          .get(`/exercises/${exercise.id}/sets`)
          .end((err, res) => {
            res.should.have.status(200);
            res.should.be.json;
            res.body.should.be.a('array');
            res.body.should.be.empty;

            done();
          });
      });
    });
    it('should return status code 404 for non-existing exercise', function (done) {
      createExercise().then((result) => {
        chai.request(server)
          .get('/exercises/-1/sets')
          .end((err, res) => {
            res.should.have.status(404);

            done();
          });
      });
    });
  });

  describe('POST /exercises/:id/sets', () => {
    it('should create a set for an exercise', function (done) {
      createExercise().then((result) => {
        chai.request(server)
          .post(`/exercises/${result.exercise.id}/sets`)
          .send({ numReps: 1, weight: 1 })
          .end((err, res) => {
            res.should.have.status(204);

            done();
          });
      });
    });
    it('should return status code 404 for non-existing exercise', function (done) {
      chai.request(server)
        .post('/exercises/-1/sets')
        .send({ numReps: 1, weight: 1 })
        .end((err, res) => {
          res.should.have.status(404);

          done();
        });
    });
    it('should return status code 400 for invalid input data', function (done) {
      createExercise().then((result) => {
        chai.request(server)
          .post(`/exercises/${result.exercise.id}/sets`)
          .send({})
          .end((err, res) => {
            res.should.have.status(400);

            done();
          });
      });
    });
  });

  describe('DELETE /exercises/:exercise-id/sets/:set-id', () => {
    it('should delete a set of an exercise', function (done) {
      createExercise().then((result) => {
        chai.request(server)
          .delete(`/exercises/${result.exercise.id}/sets/${result.set.id}`)
          .end((err, res) => {
            res.should.have.status(204);

            done();
          });
      });
    });
    it('should return status code 404 for non-existing set', function (done) {
      chai.request(server)
        .delete('/exercises/-1/sets/-1')
        .end((err, res) => {
          res.should.have.status(404);

          done();
        });
    });
  });

  describe('PATCH /exercises/:exercise-id/sets/:set-id', () => {
    it('should edit a set of an exercise', function (done) {
      createExercise().then((result) => {
        chai.request(server)
          .patch(`/exercises/${result.exercise.id}/sets/${result.set.id}`)
          .send({ numReps: 1, weight: 1 })
          .end((err, res) => {
            res.should.have.status(204);

            done();
          });
      });
    });
    it('should return status code 404 for non-existing set', function (done) {
      chai.request(server)
        .patch('/exercises/-1/sets/-1')
        .send({ numReps: 1, weight: 1 })
        .end((err, res) => {
          res.should.have.status(404);

          done();
        });
    });
    it('should return status code 400 for invalid input data', function (done) {
      createExercise().then((result) => {
        chai.request(server)
          .patch(`/exercises/${result.exercise.id}/sets/${result.set.id}`)
          .send({ invalidAttribute: 'value' })
          .end((err, res) => {
            res.should.have.status(400);

            done();
          });
      });
    });
  });

  describe('GET /exercises/:id/comments', () => {
    it('should list comments of an exercise', function (done) {
      createExercise().then((result) => {
        chai.request(server)
          .get(`/exercises/${result.exercise.id}/comments`)
          .end((err, res) => {
            res.should.have.status(200);
            res.should.be.json;
            res.body.should.be.a('array');

            res.body[0].should.have.property('id');
            res.body[0].id.should.equal(result.comment.id);

            res.body[0].should.have.property('text');
            res.body[0].text.should.equal(result.comment.text);

            res.body[0].should.have.property('user');
            res.body[0].user.should.have.property('id');
            res.body[0].user.id.should.equal(result.user.id);
            res.body[0].user.should.have.property('name');
            res.body[0].user.name.should.equal(result.user.name);

            res.body[0].should.have.property('createdAt');
            res.body[0].should.have.property('updatedAt');

            done();
          });
      });
    });
    it('should return empty array when an exercise has no comments', function (done) {
      Exercise.create(MockData.exercise).then((exercise) => {
        chai.request(server)
          .get(`/exercises/${exercise.id}/comments`)
          .end((err, res) => {
            res.should.have.status(200);
            res.should.be.json;
            res.body.should.be.a('array');
            res.body.should.be.empty;

            done();
          });
      });
    });
    it('should return status code 404 for non-existing exercise', function (done) {
      chai.request(server)
        .get('/exercises/-1/comments')
        .end((err, res) => {
          res.should.have.status(404);

          done();
        });
    });
  });

  describe('POST /exercises/:id/comments', () => {
    it('should create a comment for an exercise', function (done) {
      createExercise().then((result) => {
        chai.request(server)
          .post(`/exercises/${result.exercise.id}/comments`)
          .send({ text: result.comment.text, userId: result.user.id })
          .end((err, res) => {
            res.should.have.status(204);

            done();
          });
      });
    });
    it('should return status code 404 for non-existing exercise', function (done) {
      createExercise().then((result) => {
        chai.request(server)
          .post('/exercises/-1/comments')
          .send({ text: result.comment.text, userId: result.user.id })
          .end((err, res) => {
            res.should.have.status(404);

            done();
          });
      });
    });
    it('should return status code 404 for non-existing user', function (done) {
      createExercise().then((result) => {
        chai.request(server)
          .post(`/exercises/${result.exercise.id}/comments`)
          .send({ text: result.comment.text, userId: -1 })
          .end((err, res) => {
            res.should.have.status(404);

            done();
          });
      });
    });
    it('should return status code 400 for invalid input data', function (done) {
      createExercise().then((result) => {
        chai.request(server)
          .post(`/exercises/${result.exercise.id}/comments`)
          .send({})
          .end((err, res) => {
            res.should.have.status(400);

            done();
          });
      });
    });
  });

  describe('PATCH /exercises/:exercise-id/comments/:comment-id', () => {
    it('should edit a comment of an exercise', function (done) {
      createExercise().then((result) => {
        chai.request(server)
          .patch(`/exercises/${result.exercise.id}/comments/${result.comment.id}`)
          .send({ text: result.comment.text })
          .end((err, res) => {
            res.should.have.status(204);

            done();
          });
      });
    });
    it('should return status code 404 for non-existing comment', function (done) {
      chai.request(server)
        .patch('/exercises/-1/comments/-1')
        .send({ text: 'Text' })
        .end((err, res) => {
          res.should.have.status(404);

          done();
        });
    });
    it('should return status code 400 for invalid input data', function (done) {
      createExercise().then((result) => {
        chai.request(server)
          .patch(`/exercises/${result.exercise.id}/comments/${result.comment.id}`)
          .send({})
          .end((err, res) => {
            res.should.have.status(400);

            done();
          });
      });
    });
  });

  describe('DELETE /exercises/:exercise-id/comments/:comment-id', () => {
    it('should delete a comment of an exercise', function (done) {
      createExercise().then((result) => {
        chai.request(server)
          .delete(`/exercises/${result.exercise.id}/comments/${result.comment.id}`)
          .end((err, res) => {
            res.should.have.status(204);

            done();
          });
      });
    });
    it('should return status code 404 for non-existing comment', function (done) {
      chai.request(server)
        .delete('/exercises/-1/comments/-1')
        .end((err, res) => {
          res.should.have.status(404);

          done();
        });
    });
  });
});
