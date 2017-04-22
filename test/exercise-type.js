const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../bin/www');
const should = chai.should();
const ExerciseType = require('../models').ExerciseType;
const MockData = require('./mock-data');

chai.use(chaiHttp);

/**
 * Creates and stores a new exercise type in db.
 */
function createExerciseType() {
  return ExerciseType.create(MockData.exerciseType);
}

describe('ExerciseType', () => {
  afterEach(function (done) {
    ExerciseType.destroy({ where: {} }).then(() => done());
  });

  describe('GET /exercise-types', () => {
    it('should list exercise types', function (done) {
      createExerciseType().then((exerciseType) => {
        chai.request(server)
          .get('/exercise-types')
          .end((err, res) => {
            res.should.have.status(200);
            res.should.be.json;
            res.body.should.be.a('array');

            res.body[0].should.have.property('id');
            res.body[0].id.should.equal(exerciseType.id);

            res.body[0].should.have.property('name');
            res.body[0].name.should.equal(exerciseType.name);

            res.body[0].should.have.property('createdAt');
            res.body[0].should.have.property('updatedAt');

            done();
          });
      });
    });
    it('should return empty array for non-existing exercise types', function (done) {
      chai.request(server)
        .get('/exercise-types')
        .end((err, res) => {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('array');
          res.body.should.be.empty;

          done();
        });
    });
  });

  describe('GET /exercise-types/:id', () => {
    it('should get a single exercise type', function (done) {
      createExerciseType().then((exerciseType) => {
        chai.request(server)
          .get(`/exercise-types/${exerciseType.id}`)
          .end((err, res) => {
            res.should.have.status(200);
            res.should.be.json;
            res.body.should.be.a('object');

            res.body.should.have.property('id');
            res.body.id.should.equal(exerciseType.id);

            res.body.should.have.property('name');
            res.body.name.should.equal(exerciseType.name);

            res.body.should.have.property('createdAt');
            res.body.should.have.property('updatedAt');

            done();
          });
      });
    });
    it('should return status code 404 for non-existing exercise type', function (done) {
      chai.request(server)
        .get('/exercise-types/-1')
        .end((err, res) => {
          res.should.have.status(404);

          done();
        });
    });
  });

  describe('POST /exercise-types', () => {
    it('should create an exercise type', function (done) {
      chai.request(server)
        .post('/exercise-types')
        .send(MockData.exerciseType)
        .end((err, res) => {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('object');

          res.body.should.have.property('id');
          res.body.should.have.property('name');
          res.body.name.should.equal(MockData.exerciseType.name);
          res.body.should.have.property('createdAt');
          res.body.should.have.property('updatedAt');

          ExerciseType.findById(res.body.id)
            .then((exerciseType) => {
              should.exist(exerciseType);
              exerciseType.name.should.equal(MockData.exerciseType.name);

              done();
            });
        });
    });
    it('should return status code 400 if exercise type name is not included in request body', function (done) {
      chai.request(server)
        .post('/exercise-types')
        .send({})
        .end((err, res) => {
          res.should.have.status(400);

          done();
        });
    });
  });

  describe('PATCH /exercise-types/:id', () => {
    it('should edit an exercise type', function (done) {
      createExerciseType().then((exerciseType) => {
        chai.request(server)
          .patch(`/exercise-types/${exerciseType.id}`)
          .send({ name: 'Updated' })
          .end((err, res) => {
            res.should.have.status(200);
            res.should.be.json;

            res.body.should.be.a('object');
            res.body.should.have.property('id');
            res.body.id.should.equal(exerciseType.id);
            res.body.should.have.property('name');
            res.body.name.should.equal('Updated');
            res.body.should.have.property('createdAt');
            res.body.should.have.property('updatedAt');

            ExerciseType.findById(exerciseType.id)
              .then((exerciseTypeStoredInDb) => {
                should.exist(exerciseTypeStoredInDb);
                exerciseTypeStoredInDb.name.should.equal('Updated');

                done();
              });
          });
      });
    });
    it('should return status code 404 for non-existing exercise type', function (done) {
      chai.request(server)
        .patch('/exercise-types/-1')
        .send({ name: 'Updated' })
        .end((err, res) => {
          res.should.have.status(404);

          done();
        });
    });
    it('should return status code 400 if exercise type name is not included in request body', function (done) {
      createExerciseType().then((exerciseType) => {
        chai.request(server)
          .patch(`/exercise-types/${exerciseType.id}`)
          .send({})
          .end((err, res) => {
            res.should.have.status(400);

            done();
          });
      });
    });
  });

  describe('DELETE /exercise-types/:id', () => {
    it('should delete an exercise type', function (done) {
      createExerciseType().then((exerciseType) => {
        chai.request(server)
          .delete(`/exercise-types/${exerciseType.id}`)
          .end((err, res) => {
            res.should.have.status(204);

            ExerciseType.findById(exerciseType.id)
              .then((exerciseTypeStoredInDb) => {
                should.not.exist(exerciseTypeStoredInDb);

                done();
              });
          });
      });
    });
    it('should return status code 404 for non-existing exercise type', function (done) {
      chai.request(server)
        .delete('/exercise-types/-1')
        .end((err, res) => {
          res.should.have.status(404);

          done();
        });
    });
  });
});
