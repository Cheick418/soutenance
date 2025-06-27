const { DataTypes } = require("sequelize");
const sequelize = require("./sequelize");

const Finalisation = sequelize.define("finalisation", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  etudiantId: { type: DataTypes.INTEGER, allowNull: false },
  theme: { type: DataTypes.STRING, allowNull: false },
  rapport_final: { type: DataTypes.STRING },
  accord_rapporteur: { type: DataTypes.STRING },
  statut: { type: DataTypes.STRING, defaultValue: "en attente" }, // en attente, valide, refuse
  raison_refus: { type: DataTypes.STRING },
});

module.exports = Finalisation;
