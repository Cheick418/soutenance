const { DataTypes } = require("sequelize");
const sequelize = require("./sequelize");

const DemandeSoutenance = sequelize.define("demande_soutenance", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  etudiantId: { type: DataTypes.INTEGER, allowNull: false },
  finalisationId: { type: DataTypes.INTEGER, allowNull: false },
  statut: { type: DataTypes.STRING, defaultValue: "en attente" }, // en attente, valide, ignore
  ordre: { type: DataTypes.INTEGER },
  date: { type: DataTypes.STRING },
  heure: { type: DataTypes.STRING },
  salle: { type: DataTypes.STRING },
  president_jury: { type: DataTypes.STRING },
  tuteur: { type: DataTypes.STRING },
  maitre_stage: { type: DataTypes.STRING },
  president_nom: { type: DataTypes.STRING },
  president_mail: { type: DataTypes.STRING },
  president_numero: { type: DataTypes.STRING },
  tuteur_nom: { type: DataTypes.STRING },
  tuteur_mail: { type: DataTypes.STRING },
  tuteur_numero: { type: DataTypes.STRING },
  maitre_nom: { type: DataTypes.STRING },
  maitre_mail: { type: DataTypes.STRING },
  maitre_numero: { type: DataTypes.STRING },
});

module.exports = DemandeSoutenance;
