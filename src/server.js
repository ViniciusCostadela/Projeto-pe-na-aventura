const express = require("express");

const path = require("path");
const app = express();
const projectRoot = path.join(__dirname, "..");

app.use(express.static(projectRoot));

app.listen(3000, () => {
  console.log("Site rodando em http://localhost:3000");
});
