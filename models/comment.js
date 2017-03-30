module.exports = (sequelize, DataTypes) => {
  const Comment = sequelize.define('Comment', {
    text: DataTypes.STRING,
  }, {
    classMethods: {
      associate: (models) => {
        // a comment belongs to exactly one exercise
        Comment.belongsTo(models.Exercise);

        // a comment belongs to exactly one user
        Comment.belongsTo(models.User);
      },
    },
  });

  return Comment;
};
