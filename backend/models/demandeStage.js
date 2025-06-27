const { DataTypes } = require("sequelize");
const sequelize = require("./sequelize");

const DemandeStage = sequelize.define("demande_stage", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  etudiantId: { type: DataTypes.INTEGER, allowNull: false },
  theme: { type: DataTypes.STRING, allowNull: false },
  organisation: { type: DataTypes.STRING, allowNull: false },
  maitre_nom: { type: DataTypes.STRING, allowNull: false },
  maitre_mail: { type: DataTypes.STRING, allowNull: false },
  maitre_numero: { type: DataTypes.STRING, allowNull: false },
  maitre_esi: { type: DataTypes.BOOLEAN, allowNull: false },
  comaitre_nom: { type: DataTypes.STRING },
  comaitre_mail: { type: DataTypes.STRING },
  comaitre_numero: { type: DataTypes.STRING },
  statut: { type: DataTypes.STRING, defaultValue: "en attente" }, // en attente, valide, refuse
  tuteur_nom: { type: DataTypes.STRING },
  tuteur_mail: { type: DataTypes.STRING },
  tuteur_numero: { type: DataTypes.STRING },
  raison_refus: { type: DataTypes.STRING },
});

module.exports = DemandeStage;
