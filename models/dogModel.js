const mongoose = require("mongoose");

const dogSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Dog must have a name"],
      unique: true,
    },
    owner: {
      type: String,
      default: "none",
    },
    breed: {
      type: String,
      required: [true, "Dog must have a breed"],
    },
    breedType: {
      type: String,
      enum: {
        values: ["Purebred", "Wild"],
        message: "Breed Type either Purebred and Wild",
      },
      default: "Purebred",
    },
    popularity: {
      type: Number,
      default: 0,
    },
    intelligence: {
      type: Number,
      default: 1,
    },
    photo: {
      type: String,
      required: [true, "Dog must have a photo"],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
  },
  {
    toJSON: { virtuals: true },
  }
);

dogSchema.virtual("description").get(function () {
  return `${this.name} is ${this.breed}, and ${this.breedType} you can watch dog imgage in here ${this.photo}`;
});

const Dog = mongoose.model("Dog", dogSchema);

module.exports = Dog;
