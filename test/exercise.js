const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../bin/www');
const should = chai.should();
const Exercise = require('../models').Exercise;
const ExerciseType = require('../models').ExerciseType;
const Set = require('../models').Set;
const User = require('../models').User;
const Comment = require('../models').Comment;

const testExercise = { note: 'Note' };
const testExerciseType = { name: 'ExerciseType' };
const testSet = { numReps: 0, weight: 0 };
const testUser = { name: 'User' };
const testComment = { text: 'Comment' };

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
      Exercise.create(testExercise),
      ExerciseType.create(testExerciseType),
      Set.create(testSet),
      User.create(testUser),
      Comment.create(testComment),
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
  after(function(done) {
    ExerciseType.destroy({ where: {} })
      .then(() => Set.destroy({ where: {} }))
      .then(() => User.destroy({ where: {} }))
      .then(() => Comment.destroy({ where: {} }))
      .then(() => done());
  });

  afterEach(function(done) {
    Exercise.destroy({ where: {} }).then(() => done());
  });

  describe('GET /exercises', () => {
    it('should get all exercises', function(done) {
      createExercise().then((result) => {
        chai.request(server)
          .get('/exercises')
          .end((err, res) => {
            res.should.have.status(200);
            res.should.be.json;

            res.body.should.be.a('object');
            res.body.should.have.property('exercises');
            res.body.exercises.should.be.a('array');

            res.body.exercises[0].should.have.property('id');
            res.body.exercises[0].id.should.equal(result.exercise.id);
            res.body.exercises[0].should.have.property('note');
            res.body.exercises[0].note.should.equal(result.exercise.note);
            res.body.exercises[0].should.have.property('createdAt');

            res.body.exercises[0].should.have.property('sets');
            res.body.exercises[0].sets.should.be.a('array');
            res.body.exercises[0].sets[0].should.have.property('id');
            res.body.exercises[0].sets[0].id.should.equal(result.set.id);

            res.body.exercises[0].should.have.property('user');
            res.body.exercises[0].user.should.have.property('id');
            res.body.exercises[0].user.id.should.equal(result.user.id);

            res.body.exercises[0].should.have.property('exerciseType');
            res.body.exercises[0].exerciseType.should.have.property('id');
            res.body.exercises[0].exerciseType.id.should.equal(result.exerciseType.id);

            done();
          });
      });
    });
  });

  describe('GET /exercises/:id', () => {
    it('should get an exercise with a given id', function(done) {
      createExercise().then((result) => {
        chai.request(server)
          .get(`/exercises/${result.exercise.id}`)
          .end((err, res) => {
            res.should.have.status(200);
            res.should.be.json;

            res.body.should.be.a('object');
            res.body.should.have.property('exercise');
            res.body.exercise.should.be.a('object');

            res.body.exercise.should.have.property('id');
            res.body.exercise.id.should.equal(result.exercise.id);
            res.body.exercise.should.have.property('note');
            res.body.exercise.note.should.equal(result.exercise.note);
            res.body.exercise.should.have.property('createdAt');

            res.body.exercise.should.have.property('sets');
            res.body.exercise.sets.should.be.a('array');
            res.body.exercise.sets[0].should.have.property('id');
            res.body.exercise.sets[0].id.should.equal(result.set.id);

            res.body.exercise.should.have.property('user');
            res.body.exercise.user.should.have.property('id');
            res.body.exercise.user.id.should.equal(result.user.id);

            res.body.exercise.should.have.property('exerciseType');
            res.body.exercise.exerciseType.should.have.property('id');
            res.body.exercise.exerciseType.id.should.equal(result.exerciseType.id);

            done();
          });
      });
    });
  });

  describe('POST /exercises', () => {
    it('should add an exercise', function(done) {
      User.create(testUser).then((user) => {
        chai.request(server)
          .post('/exercises')
          .send({
            note: testExercise.note,
            exerciseTypeName: testExerciseType.name,
            sets: [testSet],
            userId: user.id,
          })
          .end((err, res) => {
            res.should.have.status(200);
            res.should.be.json;

            res.body.should.be.a('object');
            res.body.should.have.property('exercise');
            res.body.exercise.should.be.a('object');

            res.body.exercise.should.have.property('id');
            res.body.exercise.should.have.property('note');
            res.body.exercise.note.should.equal(testExercise.note);
            res.body.exercise.should.have.property('createdAt');

            res.body.exercise.should.have.property('sets');
            res.body.exercise.sets.should.be.a('array');
            res.body.exercise.sets[0].should.have.property('id');

            res.body.exercise.should.have.property('user');
            res.body.exercise.user.should.have.property('id');
            res.body.exercise.user.id.should.equal(user.id);

            res.body.exercise.should.have.property('exerciseType');
            res.body.exercise.exerciseType.should.have.property('id');

            done();
          });
      });
    });
  });

  describe('PATCH /exercises/:id', () => {
    it('should update exercise with a given id', function(done) {
      createExercise().then((result) => {
        chai.request(server)
          .patch(`/exercises/${result.exercise.id}`)
          .send({ note: 'Updated' })
          .end((err, res) => {
            res.should.have.status(200);

            done();
          });
      });
    });
  });

  describe('DELETE /exercises/:id', () => {
    it('should delete exercise with a given id', function(done) {
      createExercise().then((result) => {
        chai.request(server)
          .delete(`/exercises/${result.exercise.id}`)
          .end((err, res) => {
            res.should.have.status(200);

            done();
          });
      });
    });
  });

  describe('GET /exercises/:id/sets', () => {
    it('should get sets of exercise with a given id', function(done) {
      createExercise().then((result) => {
        chai.request(server)
          .get(`/exercises/${result.exercise.id}/sets`)
          .end((err, res) => {
            res.should.have.status(200);
            res.should.be.json;

            res.body.should.be.a('object');
            res.body.should.have.property('sets');
            res.body.sets.should.be.a('array');

            res.body.sets[0].should.have.property('numReps');
            res.body.sets[0].numReps.should.equal(result.set.numReps);

            res.body.sets[0].should.have.property('weight');
            res.body.sets[0].weight.should.equal(result.set.weight);

            done();
          });
      });
    });
  });

  describe('POST /exercises/:id/sets', () => {
    it('should add a set to an exercise with a given id', function(done) {
      createExercise().then((result) => {
        chai.request(server)
          .post(`/exercises/${result.exercise.id}/sets`)
          .send({ numReps: 1, weight: 1 })
          .end((err, res) => {
            res.should.have.status(200);

            done();
          });
      });
    });
  });

  describe('DELETE /exercises/:exercise-id/sets/:set-id', () => {
    it('should delete a set of an exercise with a given id', function(done) {
      createExercise().then((result) => {
        chai.request(server)
          .delete(`/exercises/${result.exercise.id}/sets/${result.set.id}`)
          .end((err, res) => {
            res.should.have.status(200);

            done();
          });
      });
    });
  });

  describe('PATCH /exercises/:exercise-id/sets/:set-id', () => {
    it('should update a set of an exercise with a given id', function(done) {
      createExercise().then((result) => {
        chai.request(server)
          .patch(`/exercises/${result.exercise.id}/sets/${result.set.id}`)
          .send({ numReps: 1, weight: 1 })
          .end((err, res) => {
            res.should.have.status(200);

            done();
          });
      });
    });
  });

  describe('GET /exercises/:id/comments', () => {
    it('should get comments of an exercise with a given id', function(done) {
      createExercise().then((result) => {
        chai.request(server)
          .get(`/exercises/${result.exercise.id}/comments`)
          .end((err, res) => {
            res.should.have.status(200);
            res.should.be.json;

            res.body.should.be.a('object');
            res.body.should.have.property('comments');
            res.body.comments.should.be.a('array');

            res.body.comments[0].should.have.property('id');
            res.body.comments[0].id.should.equal(result.comment.id);

            res.body.comments[0].should.have.property('text');
            res.body.comments[0].text.should.equal(result.comment.text);

            res.body.comments[0].should.have.property('user');
            res.body.comments[0].user.should.have.property('id');
            res.body.comments[0].user.id.should.equal(result.user.id);
            res.body.comments[0].user.should.have.property('name');
            res.body.comments[0].user.name.should.equal(result.user.name);

            res.body.comments[0].should.have.property('createdAt');

            done();
          });
      });
    });
  });

  describe('POST /exercises/:id/comments', () => {
    it('should add a comment to an exercise with a given id', function(done) {
      createExercise().then((result) => {
        chai.request(server)
          .post(`/exercises/${result.exercise.id}/comments`)
          .send(result.comment.text)
          .end((err, res) => {
            res.should.have.status(200);

            done();
          });
      });
    });
  });

  describe('PATCH /exercises/:exercise-id/comments/:comment-id', () => {
    it('should update a comment of an exercise with a given id', function(done) {
      createExercise().then((result) => {
        chai.request(server)
          .patch(`/exercises/${result.exercise.id}/comments/${result.comment.id}`)
          .send(result.comment.text)
          .end((err, res) => {
            res.should.have.status(200);

            done();
          });
      });
    });
  });

  describe('DELETE /exercises/:exercise-id/comments/:comment-id', () => {
    it('should delete a comment of an exercise with a given id', function(done) {
      createExercise().then((result) => {
        chai.request(server)
          .delete(`/exercises/${result.exercise.id}/comments/${result.comment.id}`)
          .end((err, res) => {
            res.should.have.status(200);

            done();
          });
      });
    });
  });
});
