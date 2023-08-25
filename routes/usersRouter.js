const express = require("express");
const {
  getAllUsers,
  updateMe,
  deleteMe,
} = require("../controllers/usersController");
const {
  signup,
  login,
  forgotPassword,
  resetPassword,
  updatePassword,
  protect,
  verifyEmail,
  confirmEmail,
} = require("../controllers/authController");

const router = express.Router();

router.post("/verify-email", protect, verifyEmail);
router.patch("/confirm-email/:id", confirmEmail);

router.patch("/update-current-password", protect, updatePassword);
router.post("/forgot-password", forgotPassword);
router.patch("/reset-password/:token", resetPassword);

router.post("/signup", signup);
router.post("/login", login);
router.route("/").get(protect, getAllUsers);
router.patch("/update-me", protect, updateMe);
router.delete("/delete-me", protect, deleteMe);

module.exports = router;
