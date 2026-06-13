require("dotenv").config({path: "./frontend/.env"});
fetch("https://api.pinata.cloud/data/testAuthentication", {
  headers: {
    pinata_api_key: process.env.REACT_APP_PINATA_API_KEY,
    pinata_secret_api_key: process.env.REACT_APP_PINATA_SECRET_API_KEY
  }
}).then(r => r.json()).then(console.log).catch(console.error);
