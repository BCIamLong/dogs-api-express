const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config({ path: "./config.env" });

process.on("uncaughtException", (err) => {
  console.log(err.name, err.message);
  console.log("Aplication shutting down");
  process.exit(1);
});

const app = require("./app");

(async () => {
  try {
    await mongoose.connect(process.env.DATABASE_LOCAL);
    console.log("Connect DB success");
  } catch (err) {
    console.log(err);
  }
})();

const port = process.env.PORT || 8000;

const server = app.listen(port, () => {
  console.log(`Server listenning with port ${port}`);
});

process.on("unhandledRejection", (err) => {
  console.log(err.name, err.message);
  console.log("Aplication shutting down");
  server.close(() => {
    process.exit(1);
  });
});
