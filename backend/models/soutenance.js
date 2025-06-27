const { DataTypes } = require("sequelize");
const sequelize = require("./sequelize");

const Soutenance = sequelize.define("soutenance", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  etudiantId: { type: DataTypes.INTEGER, allowNull: false },
  theme: { type: DataTypes.STRING, allowNull: false },
  statut: { type: DataTypes.STRING, defaultValue: "en attente" }, // en attente, valide, refuse
  rapport: { type: DataTypes.STRING }, // chemin du fichier
  accord_maitre: { type: DataTypes.STRING },
  accord_tuteur: { type: DataTypes.STRING },
  raison_refus: { type: DataTypes.STRING },
  rapporteur_nom: { type: DataTypes.STRING },
  rapporteur_mail: { type: DataTypes.STRING },
  rapporteur_numero: { type: DataTypes.STRING },
});

module.exports = Soutenance;
