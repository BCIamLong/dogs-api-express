const crypto = require("crypto");
const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const AppError = require("../utils/AppError");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "User must have a name"],
  },
  email: {
    type: String,
    required: [true, "User must have an email"],
    validate: [validator.isEmail, "Please fill correct email"],
    unique: true,
  },
  role: {
    type: String,
    enum: ["user", "admin", "seller"],
    default: "user",
  },
  password: {
    type: String,
    required: [true, "User must have a password"],
    minLength: [8, "Password must have at least 8 characters"],
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, "Please confim your password"],
    minLength: [8, "Password must have at least 8 characters"],
    validate: {
      validator: function (val) {
        return val === this.password;
      },
      message: "Password not in the same please check and fill again",
    },
  },
  avatar: {
    type: String,
  },
  passwordChangedAt: {
    type: Date,
    default: Date.now(),
  },
  createdAt: {
    type: Date,
    select: false,
  },
  passwordResetToken: String,
  passwordResetTokenTimeout: Date,
  active: {
    type: Boolean,
    default: true,
  },
  reasonDeleteAccout: String,
  emailVerify: {
    type: Boolean,
    default: false,
  },
  emailVerifyOTP: String,
  emailVerifyOTPTimeout: Date,
});

//static method

userSchema.methods.createResetTokenPwd = function () {
  const resetToken = crypto.randomBytes(48).toString("hex");
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.passwordResetTokenTimeout = Date.now() + 12 * 60 * 1000;
  return resetToken;
};

userSchema.methods.checkPassword = async function (currentPwd, hashPwd) {
  return await bcrypt.compare(currentPwd, hashPwd);
};

userSchema.methods.checkPasswordChangeAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt)
    return Math.floor(Date.parse(this.passwordChangedAt / 1000)) > JWTTimestamp;
  return false;
};

userSchema.methods.createVerifyEmailOTP = async function () {
  const otp = Math.floor(1000 + Math.random() * 9000).toString();

  this.emailVerifyOTP = await bcrypt.hash(otp, 12);
  this.emailVerifyOTPTimeout = Date.now() + 3 * 60 * 1000;

  return otp;
};

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;

  if (this.isNew) return next();
  if (this.passwordResetTokenTimeout < Date.now())
    return next(new AppError("Your token is expired", 401));
  this.passwordChangedAt = Date.now() - 1000;

  next();
});

userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

const User = mongoose.model("User", userSchema);

module.exports = User;
