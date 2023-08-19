const express = require("express");
const { getAllUsers } = require("../controllers/usersController");
const { signup, login } = require("../controllers/authController");

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.route("/").get(getAllUsers);

module.exports = router;
