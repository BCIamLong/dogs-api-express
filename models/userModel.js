const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");

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
  password: {
    type: String,
    required: [true, "User must have a password"],
    minLength: [8, "Password must have at least 8 characters"],
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
});

//static method
userSchema.methods.checkPassword = async function (currentPwd, hashPwd) {
  return await bcrypt.compare(currentPwd, hashPwd);
};

userSchema.methods.checkPasswordChangeAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt)
    return Math.floor(Date.parse(this.passwordChangedAt / 1000)) > JWTTimestamp;
  return false;
};

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;

  next();
});

const User = mongoose.model("User", userSchema);

module.exports = User;
