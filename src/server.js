const express = require("express");

const app = express();

app.get("/", (req, res) => {
  res.json({ message: "API funcionando" });
});

app.listen(3000, () => {
  console.log("Servidor rodando na porta 3000");
});