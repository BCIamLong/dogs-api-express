const fs = require("fs");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const Dog = require("../models/dogModel");

dotenv.config({ path: "./config.env" });

const dogs = JSON.parse(fs.readFileSync(`${__dirname}/dogs.json`));

(async () => {
  try {
    await mongoose.connect(process.env.DATABASE_LOCAL);
    console.log("Connect DB success");
  } catch (err) {
    console.log(err);
  }
})();

const importData = async (model, data) => {
  try {
    await model.insertMany(data);
    console.log("Import data success");
  } catch (err) {
    console.log(err);
  }
  mongoose.connection.close();
};

const deleteData = async (model) => {
  try {
    await model.deleteMany();
    console.log("Delete all data success");
  } catch (err) {
    console.log(err);
  }
  mongoose.connection.close();
};

if (process.argv[2] === "--import-dogs") importData(Dog, dogs);
if (process.argv[2] === "--delete-dogs") deleteData(Dog);
