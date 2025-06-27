const { DataTypes } = require("sequelize");
const sequelize = require("./sequelize");

const Etudiant = sequelize.define("etudiant", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  ine: { type: DataTypes.STRING, unique: true },
  nom: DataTypes.STRING,
  prenom: DataTypes.STRING,
  email: DataTypes.STRING,
  specialite: DataTypes.STRING,
  niveau: DataTypes.STRING,
  telephone: DataTypes.STRING,
  password: DataTypes.STRING,
  status: { type: DataTypes.STRING, defaultValue: "pending" },
});

module.exports = Etudiant;
