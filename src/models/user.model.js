import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { Schema, model } from "mongoose"

const imageSchema = new Schema(
  {
    url: { type: String },
    publicId: { type: String },
  },
  {
    _id: false
  }
);

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique identifier for the user
 *         username:
 *           type: string
 *           description: Unique username
 *         fullname:
 *           type: string
 *           description: User's full name
 *         email:
 *           type: string
 *           description: User's email address
 *         password:
 *           type: string
 *           description: Hashed password
 *         avatar:
 *           type: string
 *           description: URL to the user's avatar image
 *         coverImage:
 *           type: string
 *           description: URL to the user's cover image
 *         refreshToken:
 *           type: string
 *           description: User's refresh token
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: User creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: User update timestamp
 */
const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    fullname: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: [true, "Password is required"]
    },
    avatar: {
      type: imageSchema,
      required: true,
    },
    coverImage: {
      type: imageSchema,
    },
    refreshToken: {
      type: String
    }
  },
  {
    timestamps: true
  }
)

/*
  Note: in the pre method arrow function is not used because it doesn't 
  have context (access of this) but we need the user context that's why
  conventional function is used as callback
*/
userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10)
  }
  next()
})

userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password)
}

userSchema.methods.removeFields = function (fields = []) {
  const userObject = this.toObject()
  fields.map(field => delete userObject[`${field}`])
  return userObject
}

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      fullname: this.fullname
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    }
  )
}

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    }
  )
}

export const User = model("User", userSchema)