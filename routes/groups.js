const express = require('express');
const Group = require('../models').Group;

const router = express.Router();

// get groups
router.get('/', (req, res) => (
  Group.findAll().then(groups => res.json({ groups }))
));

// get group
router.get('/:id', (req, res) => (
  Group.find({ where: { id: req.params.id } }).then(group => res.json({ group }))
));

// create group
router.post('/', (req, res) => (
  Group.create({ name: req.body.name }).then(group => res.json({ group }))
));

// update Group
router.patch('/:id', (req, res) => (
  Group.find({ where: { id: req.params.id } }).then(group => (
    group.update(req.body).then(() => res.json(group))
  ))
));

// delete Group
router.delete('/:id', (req, res) => (
  Group.find({ where: { id: req.params.id } }).then(group => (
    group.destroy().then(() => res.sendStatus(200))
  ))
));

// get members of group
router.get('/:id/members', (req, res) => (
  Group.find({ where: { id: req.params.id } }).then(group => (
    group.getUsers().then(members => res.json(members))
  ))
));

// add member to group
router.post('/:id/members', (req, res) => (
  Group.find({ where: { id: req.params.id } }).then(group => (
    group.addUser(req.body.userId).then(() => res.sendStatus(200))
  ))
));

// delete member of group
router.delete('/:groupId/members/:userId', (req, res) => (
  Group.find({ where: { id: req.params.groupId } }).then(group => (
    group.removeUser(req.params.userId).then(() => res.sendStatus(200))
  ))
));

// get exercises of group
router.get('/:id/exercises', (req, res) => (
  Group.find({ where: { id: req.params.id } }).then(group => (
    group.getUsers().then((users) => {
      if (users.length === 0) {
        res.json({ error: 'Group has no users.' });
      }

      let numIteratedUser = 0;
      const exercisesOfGroupUsers = [];

      users.forEach((user) => {
        user.getExercises().then((exercises) => {
          exercises.forEach((exercise) => {
            const exerciseWithUserInfo = exercise;
            exerciseWithUserInfo.user = user;
            exercisesOfGroupUsers.push(exerciseWithUserInfo);
          });

          numIteratedUser += 1;

          if (numIteratedUser === users.length) {
            if (exercisesOfGroupUsers.length === 0) {
              res.json({ exercises: [] });
            } else {
              let numOfIteratedExercises = 0;
              const result = [];

              exercisesOfGroupUsers.forEach(userExercise => (
                userExercise.getSets().then(sets => (
                  userExercise.getExerciseType().then((exerciseType) => {
                    const extendedExercise = {
                      id: userExercise.id,
                      note: userExercise.note,
                      createdAt: userExercise.createdAt,
                      user: userExercise.user,
                      sets,
                      exerciseType,
                    };

                    result.push(extendedExercise);
                    numOfIteratedExercises += 1;

                    if (numOfIteratedExercises === exercisesOfGroupUsers.length) {
                      res.json(result);
                    }
                  })
                ))
              ));
            }
          }
        });
      });
    })
  ))
));

module.exports = router;
