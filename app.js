const express = require('express');
const bodyParser = require('body-parser');

const users = require('./routes/users');
const groups = require('./routes/groups');
const exercises = require('./routes/exercises');
const exerciseTypes = require('./routes/exercise-types');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/users', users);
app.use('/groups', groups);
app.use('/exercises', exercises);
app.use('/exercise-types', exerciseTypes);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.json(err);
});

module.exports = app;
