const sequelize = require("./models/sequelize");
const Admin = require("./models/admin");
const Etudiant = require("./models/etudiant");

async function seed() {
  // Synchroniser les modèles
  await sequelize.sync({ alter: true });

  // Admin test
  const admin = await Admin.findOne({ where: { email: "admin@gmail.com" } });
  if (!admin) {
    await Admin.create({
      nom: "Admin",
      prenom: "Test",
      email: "admin@gmail.com",
      password: "12345678",
    });
    console.log("Admin de test créé");
  }

  // Etudiant test
  const etudiant = await Etudiant.findOne({
    where: { email: "etudiant@gmail.com" },
  });
  if (!etudiant) {
    await Etudiant.create({
      ine: "N18131020230",
      nom: "Etudiant",
      prenom: "Test",
      email: "etudiant@gmail.com",
      specialite: "Sciences des Données, spécialité Sciences des Données",
      niveau: "Master",
      telephone: "0600000000",
      password: "12345678",
      status: "actif",
    });
    console.log("Etudiant de test créé");
  }
}

seed().then(() => process.exit());
