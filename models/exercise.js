module.exports = (sequelize, DataTypes) => {
  const Exercise = sequelize.define('Exercise', {
    note: DataTypes.STRING,
  }, {
    classMethods: {
      associate: (models) => {
        // an exercise has exactly one user
        Exercise.belongsTo(models.User);

        // an exercise has exactly one exercise type
        Exercise.belongsTo(models.ExerciseType);

        // an exercise can have multiple stets
        Exercise.hasMany(models.Set);

        // an exercise can have multiple comments
        Exercise.hasMany(models.Comment);
      },
    },
  });

  return Exercise;
};
