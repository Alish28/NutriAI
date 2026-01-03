const express = require("express");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

app.get("/home", (req, res) => {
  res.json({ message: "API is running... Hello world" });
});

module.exports = app;
