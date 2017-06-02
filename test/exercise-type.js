/* eslint no-undef: 0 */
/* eslint func-names: 0 */
/* eslint prefer-arrow-callback: 0 */
/* eslint no-unused-expressions: 0 */

const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../bin/www');
const ExerciseTypeMock = require('./mock-data/mock-data').ExerciseTypeMock;

const should = chai.should();

chai.use(chaiHttp);

describe('ExerciseType', () => {
  afterEach(function (done) {
    ExerciseTypeMock.deletePersistentInstances()
      .then(() => done())
      .catch(done);
  });

  describe('GET /exercise-types', () => {
    it('should list exercise types', function (done) {
      ExerciseTypeMock.createPersistentInstance()
        .then((exerciseType) => {
          chai.request(server)
            .get('/exercise-types')
            .end((err, res) => {
              if (err) done(err);

              res.should.have.status(200);
              res.should.be.json;
              res.body.should.be.a('array');

              res.body[0].should.have.property('name');
              res.body[0].name.should.equal(exerciseType.name);

              res.body[0].should.have.property('createdAt');
              res.body[0].should.have.property('updatedAt');

              done();
            });
        })
        .catch(done);
    });
    it('should return empty array for non-existing exercise types', function (done) {
      chai.request(server)
        .get('/exercise-types')
        .end((err, res) => {
          if (err) done(err);

          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('array');
          res.body.should.be.empty;

          done();
        });
    });
  });

  describe('GET /exercise-types/:name', () => {
    it('should get a single exercise type', function (done) {
      ExerciseTypeMock.createPersistentInstance()
        .then((exerciseType) => {
          chai.request(server)
            .get(`/exercise-types/${exerciseType.name}`)
            .end((err, res) => {
              if (err) done(err);

              res.should.have.status(200);
              res.should.be.json;
              res.body.should.be.a('object');

              res.body.should.have.property('name');
              res.body.name.should.equal(exerciseType.name);

              res.body.should.have.property('createdAt');
              res.body.should.have.property('updatedAt');

              done();
            });
        })
        .catch(done);
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
      const exerciseTypeMock = ExerciseTypeMock.getMockData();
      chai.request(server)
        .post('/exercise-types')
        .send(exerciseTypeMock)
        .end((err, res) => {
          if (err) done(err);

          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('object');

          res.body.should.have.property('name');
          res.body.name.should.equal(exerciseTypeMock.name);

          res.body.should.have.property('createdAt');
          res.body.should.have.property('updatedAt');

          ExerciseTypeMock.findPersistentInstanceById(res.body.name)
            .then((exerciseType) => {
              should.exist(exerciseType);
              exerciseType.name.should.equal(res.body.name);

              done();
            });
        });
    });
    it('should return existing exercise type if new exercise type already exisits', function (done) {
      ExerciseTypeMock.createPersistentInstance()
        .then((exerciseType) => {
          chai.request(server)
            .post('/exercise-types')
            .send({ name: exerciseType.name })
            .end((err, res) => {
              if (err) done(err);

              res.should.have.status(200);
              res.should.be.json;
              res.body.should.be.a('object');

              res.body.should.have.property('name');
              res.body.name.should.equal(exerciseType.name);

              res.body.should.have.property('createdAt');
              res.body.should.have.property('updatedAt');

              done();
            });
        })
        .catch(done);
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

  describe('DELETE /exercise-types/:name', () => {
    it('should delete an exercise type', function (done) {
      ExerciseTypeMock.createPersistentInstance()
        .then((exerciseType) => {
          chai.request(server)
            .delete(`/exercise-types/${exerciseType.name}`)
            .end((err, res) => {
              if (err) done(err);

              res.should.have.status(204);

              ExerciseTypeMock.findPersistentInstanceById(exerciseType.name)
                .then((exerciseTypeStoredInDb) => {
                  should.not.exist(exerciseTypeStoredInDb);

                  done();
                });
            });
        })
        .catch(done);
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
