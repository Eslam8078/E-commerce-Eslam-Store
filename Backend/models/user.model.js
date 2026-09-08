const bcrypt = require("bcrypt");
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },

    role: {
      type: String,
      enum: ["customer", "admin"],
      default: "customer",
    },

    gender: {
      type: String,
      enum: ["male", "female"],
      required: [true, "Gender is required"],
    },

    mobilePhone: {
      type: String,
      trim: true,
      default: null,
    },

    nationalId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },

    DOB: {
      type: Date,
      required: [true, "Date of birth is required"],
    },

    isBlocked: {
      type: Boolean,
      default: false,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    addresses: [
      {
        label: {
          type: String,
          trim: true,
          default: "Home",
        },
        governorate: {
          type: String,
          trim: true,
        },
        city: {
          type: String,
          trim: true,
        },
        street: {
          type: String,
          trim: true,
        },
        isDefault: {
          type: Boolean,
          default: false,
        },
        isDeleted: {
          type: Boolean,
          default: false,
        },
      },
    ],
  },

  {
    timestamps: true,
  },
);

userSchema.index({ isDeleted: 1, createdAt: -1 });
userSchema.index({ role: 1, isDeleted: 1, createdAt: -1 });

userSchema.pre("save", async function () {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
});

userSchema.methods.isCorrectPassword = async function (inputPassword) {
  return await bcrypt.compare(inputPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
