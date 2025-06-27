const { DataTypes } = require("sequelize");
const sequelize = require("./sequelize");

const Admin = sequelize.define("admin", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  nom: DataTypes.STRING,
  prenom: DataTypes.STRING,
  email: DataTypes.STRING,
  password: DataTypes.STRING,
});

module.exports = Admin;
