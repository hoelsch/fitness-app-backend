const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../bin/www');
const should = chai.should();
const Group = require('../models').Group;
const User = require('../models').User;
const Exercise = require('../models').Exercise;
const ExerciseType = require('../models').ExerciseType;

chai.use(chaiHttp);

describe('Group', () => {
  const testGroup = { name: 'Group' };
  const testUser = { name: 'User' };
  const testExercise = { note: 'Note' };
  const testExerciseType = { name: 'ExerciseType' };

  after(function(done) {
    User.destroy({ where: {} })
      .then(() => Exercise.destroy({ where: {} }))
      .then(() => ExerciseType.destroy({ where: {} }))
      .then(() => done());
  });

  afterEach(function(done) {
    Group.destroy({ where: {} }).then(() => done());
  });

  describe('GET /groups', () => {
    it('should get all groups', function(done) {
      Group.create(testGroup).then((group) => {
        chai.request(server)
          .get('/groups')
          .end((err, res) => {
            res.should.have.status(200);
            res.should.be.json;

            res.body.should.be.a('object');
            res.body.should.have.property('groups');
            res.body.groups.should.be.a('array');

            res.body.groups[0].should.have.property('id');
            res.body.groups[0].id.should.equal(group.id);
            res.body.groups[0].should.have.property('name');
            res.body.groups[0].name.should.equal(group.name);
            res.body.groups[0].should.have.property('createdAt');
            res.body.groups[0].should.have.property('updatedAt');

            done();
          });
      });
    });
  });

  describe('GET /groups/:id', () => {
    it('should get a group with a given id', function(done) {
      Group.create(testGroup).then((group) => {
        chai.request(server)
          .get(`/groups/${group.id}`)
          .end((err, res) => {
            res.should.have.status(200);
            res.should.be.json;

            res.body.should.be.a('object');
            res.body.should.have.property('group');
            res.body.group.should.be.a('object');

            res.body.group.should.have.property('id');
            res.body.group.id.should.equal(group.id);
            res.body.group.should.have.property('name');
            res.body.group.name.should.equal(group.name);
            res.body.group.should.have.property('createdAt');
            res.body.group.should.have.property('updatedAt');

            done();
          });
      });
    });
  });

  describe('POST /groups', () => {
    it('should add a group', function(done) {
      chai.request(server)
        .post('/groups')
        .send(testGroup)
        .end((err, res) => {
          res.should.have.status(200);
          res.should.be.json;

          res.body.should.be.a('object');
          res.body.should.have.property('group');

          res.body.group.should.be.a('object');
          res.body.group.should.have.property('id');
          res.body.group.should.have.property('name');
          res.body.group.should.have.property('createdAt');
          res.body.group.should.have.property('updatedAt');
          res.body.group.name.should.equal(testGroup.name);

          done();
        });
    });
  });

  describe('PATCH /groups/:id', () => {
    it('should update group with a given id', function(done) {
      Group.create(testGroup).then((group) => {
        chai.request(server)
          .patch(`/groups/${group.id}`)
          .send({ name: 'Updated' })
          .end((err, res) => {
            res.should.have.status(200);
            res.should.be.json;

            res.body.should.be.a('object');
            res.body.should.have.property('id');
            res.body.id.should.equal(group.id);
            res.body.should.have.property('name');
            res.body.name.should.equal('Updated');
            res.body.should.have.property('createdAt');
            res.body.should.have.property('updatedAt');

            done();
          });
      });
    });
  });

  describe('DELETE /groups/:id', () => {
    it('should delete group with a given id', function(done) {
      Group.create(testGroup).then((group) => {
        chai.request(server)
          .delete(`/groups/${group.id}`)
          .end((err, res) => {
            res.should.have.status(200);

            done();
          });
      });
    });
  });

  describe('GET /groups/:id/members', () => {
    it('should get members of a group with a given id', function(done) {
      let group;
      let user;

      Promise.all([
        Group.create(testGroup),
        User.create(testUser),
      ])
        .then((values) => {
          group = values[0];
          user = values[1];

          return group.addUser(user);
        })
        .then(() => {
          chai.request(server)
            .get(`/groups/${group.id}/members`)
            .end((err, res) => {
              res.should.have.status(200);
              res.should.be.json;

              res.body.should.be.a('array');

              res.body[0].should.be.a('object');
              res.body[0].should.have.property('id');
              res.body[0].id.should.equal(user.id);
              res.body[0].should.have.property('name');
              res.body[0].name.should.equal(user.name);
              res.body[0].should.have.property('createdAt');
              res.body[0].should.have.property('updatedAt');
              res.body[0].should.have.property('UserGroup');

              res.body[0].UserGroup.should.be.a('object');
              res.body[0].UserGroup.should.have.property('GroupId');
              res.body[0].UserGroup.GroupId.should.equal(group.id);

              done();
            });
        });
    });
  });

  describe('POST /groups/:id/members', () => {
    it('should add an user to a group with a given id', function(done) {
      Group.create(testGroup).then((group) => {
        chai.request(server)
          .post(`/groups/${group.id}/members`)
          .send(testUser)
          .end((err, res) => {
            res.should.have.status(200);

            done();
          });
      });
    });
  });

  describe('DELETE /groups/:group-id/members/:user-id', () => {
    it('should delete an user of a group with a given id', function(done) {
      let group;
      let user;

      Promise.all([
        Group.create(testGroup),
        User.create(testUser),
      ])
        .then((values) => {
          group = values[0];
          user = values[1];

          return group.addUser(user);
        })
        .then(() => {
          chai.request(server)
            .delete(`/groups/${group.id}/members/${user.id}`)
            .end((err, res) => {
              res.should.have.status(200);

              done();
            });
        });
    });
  });

  describe('GET /groups/:id/exercises', () => {
    it('should get the exercises of a group with a given id', function(done) {
      let group;
      let user;
      let exercise;
      let exerciseType;

      Promise.all([
        Group.create(testGroup),
        User.create(testUser),
        Exercise.create(testExercise),
        ExerciseType.create(testExerciseType),
      ])
        .then((values) => {
          group = values[0];
          user = values[1];
          exercise = values[2];
          exerciseType = values[3];

          return group.addUser(user);
        })
        .then(() => exercise.setUser(user))
        .then(() => exercise.setExerciseType(exerciseType))
        .then(() => {
          chai.request(server)
            .get(`/groups/${group.id}/exercises`)
            .end((err, res) => {
              res.should.have.status(200);
              res.should.be.json;

              res.body.should.be.a('array');

              res.body[0].should.be.a('object');

              res.body[0].should.have.property('id');
              res.body[0].id.should.equal(exercise.id);

              res.body[0].should.have.property('note');
              res.body[0].note.should.equal(exercise.note);

              res.body[0].should.have.property('sets');
              res.body[0].sets.should.be.a('array');

              res.body[0].should.have.property('user');
              res.body[0].user.should.be.a('object');
              res.body[0].user.should.have.property('id');
              res.body[0].user.id.should.equal(user.id);
              res.body[0].user.should.have.property('name');
              res.body[0].user.name.should.equal(user.name);

              res.body[0].should.have.property('exerciseType');
              res.body[0].exerciseType.should.be.a('object');
              res.body[0].exerciseType.should.have.property('id');
              res.body[0].exerciseType.id.should.equal(exerciseType.id);
              res.body[0].exerciseType.should.have.property('name');
              res.body[0].exerciseType.name.should.equal(exerciseType.name);

              done();
            });
        });
    });
  });
});
