const fetch = require("node-fetch");

async function testEndpoint() {
  try {
    // D'abord, connectons-nous pour obtenir un token
    const loginResponse = await fetch("http://localhost:5000/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "admin@test.com",
        password: "admin123",
      }),
    });

    const loginData = await loginResponse.json();
    //console.log("Login response:", loginData);

    if (loginData.token) {
      // Test de l'endpoint des finalisations après soutenance
      const finalisationsResponse = await fetch(
        "http://localhost:5000/api/finalisation-apres-soutenance",
        {
          headers: {
            Authorization: `Bearer ${loginData.token}`,
          },
        }
      );

      const finalisationsData = await finalisationsResponse.json();
      //console.log("Finalisations response:", finalisationsData);
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

testEndpoint();
