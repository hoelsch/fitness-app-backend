module.exports = (sequelize, DataTypes) => {
  const Group = sequelize.define('Group', {
    name: DataTypes.STRING,
  }, {
    classMethods: {
      associate: models => (
        // a group can have multiple users as members
        Group.belongsToMany(models.User, { through: 'UserGroup' })
      ),
    },
  });

  return Group;
};
