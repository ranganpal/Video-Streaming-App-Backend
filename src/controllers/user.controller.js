import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js"
import { View } from "../models/view.model.js"
import { ApiError } from "../utils/apiError.js"
import { ApiResponse } from "../utils/apiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js"

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId)
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()

    user.refreshToken = refreshToken
    await user.save({ validateBeforeSave: false })

    return { accessToken, refreshToken }
  }
  catch (error) {
    throw new ApiError(500, "Something went wrong while generating referesh and access token")
  }
}

/**
 * @swagger
 * /users/register:
 *   post:
 *     summary: Register a new user
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - fullname
 *               - email
 *               - password
 *               - avatar
 *             properties:
 *               username:
 *                 type: string
 *               fullname:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               avatar:
 *                 type: string
 *                 format: binary
 *               coverImage:
 *                 type: string
 *                 format: binary
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - fullname
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               fullname:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               avatar:
 *                 type: string
 *               coverImage:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 */
const registerUser = asyncHandler(async (req, res) => {
  const { username, fullname, email, password } = req.body

  const emptyField = [username, fullname, email, password].some(
    field => field?.trim() === ""
  )

  if (emptyField) {
    throw new ApiError(400, "All fields are required")
  }

  const existingUser = await User.findOne({
    $or: [{ username }, { email }]
  })

  if (existingUser) {
    throw new ApiError(409, "User with email or username already exists")
  }  

  const avatarLocalPath = (req.files &&
    Array.isArray(req.files.avatar) &&
    req.files.avatar.length > 0
  ) ? req.files.avatar[0].path : null

  const coverImageLocalPath = (req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) ? req.files.coverImage[0].path : null

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required")
  }  

  const avatar = await uploadOnCloudinary(avatarLocalPath)
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if (!avatar) {
    throw new ApiError(500, "Something went wrong while uplaoding avatar file in cloudinary")
  }

  const user = await User.create({
    email,
    fullname,
    password,
    username: username.toLowerCase(),
    avatar: {
      url: avatar.url,
      publicId: avatar.public_id
    },
    coverImage: {
      url: coverImage?.url || "",
      publicId: coverImage?.public_id || ""
    }
  })

  const registeredUser = user.removeFields(["password", "refreshToken"])

  if (!registeredUser) {
    throw new ApiError(500, "Something went wrong while registering the user")
  }

  return res
    .status(201)
    .json(
      new ApiResponse(
        200,
        { registeredUser },
        "User registered successfully"
      )
    )
})

/**
 * @swagger
 * /users/login:
 *   post:
 *     summary: Login user
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User logged in successfully
 */
const loginUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body  

  if (!username && !email) {
    throw new ApiError(400, "username or email is required")
  }

  const user = await User.findOne({
    $or: [{ username }, { email }]
  })

  if (!user) {
    throw new ApiError(404, "User does not exist with given email")
  }

  const isPasswordValid = await user.isPasswordCorrect(password)

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid password")
  }

  const loggedinUser = user.removeFields(["password", "refreshToken"])

  if (!loggedinUser) {
    throw new ApiError(500, "Something went wrong while logging in the user")
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)
  const options = { httpOnly: true, secure: true }

  return res
    .status(201)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { loggedinUser, accessToken, refreshToken },
        "User logged In Successfully"
      )
    )
})

/**
 * @swagger
 * /users/logout:
 *   get:
 *     summary: Logout user
 *     tags: [User]
 *     responses:
 *       200:
 *         description: User logged out successfully
 */
const logoutUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    { $unset: { refreshToken: 1 } },
    { new: true }
  )

  if (!user) {
    throw new ApiError(500, "Something went wrong while logging out the user")
  }

  const options = { httpOnly: true, secure: true }

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out Successfully"))
})

/**
 * @swagger
 * /users/current-user:
 *   get:
 *     summary: Get current user profile
 *     tags: [User]
 *     responses:
 *       200:
 *         description: User fetched successfully
 */
const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { user: req.user },
        "User fetched successfully"
      )
    )
})

/**
 * @swagger
 * /users/channel-profile/{username}:
 *   get:
 *     summary: Get user channel profile by username
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User channel fetched successfully
 */
const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params

  if (!username?.trim()) {
    throw new ApiError(400, "Username is missing")
  }

  const pipeline = [
    {
      $match: { username: username.trim().toLowerCase() }
    },
    {
      $lookup: {
        from: "subscriptions",
        let: { userId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$subscriber", "$$userId"] }
            }
          },
          {
            $count: "count"
          }
        ],
        as: "subscribesCount"
      }
    },
    {
      $lookup: {
        from: "subscriptions",
        let: { userId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$channel", "$$userId"] }
            }
          },
          {
            $count: "count"
          }
        ],
        as: "subscribersCount"
      }
    },
    {
      $lookup: {
        from: "subscriptions",
        let: { userId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$channel", "$$userId"] },
                  { $eq: ["$subscriber", req.user?._id] }
                ]
              }
            }
          }
        ],
        as: "userSubscriptions"
      }
    },
    {
      $project: {
        email: 1,
        username: 1,
        fullName: 1,
        avatar: 1,
        coverImage: 1,
        subscribesCount: {
          $ifNull: [{ $first: "$subscribesCount.count" }, 0]
        },
        subscribersCount: {
          $ifNull: [{ $first: "$subscribersCount.count" }, 0]
        },
        isSubscribed: {
          $cond: {
            if: { $gt: [{ $size: "$userSubscriptions" }, 0] },
            then: true,
            else: false
          }
        }
      }
    }
  ]

  const channelProfiles = await User.aggregate(pipeline)
  const channelProfile = channelProfiles[0]

  if (!channelProfile) {
    throw new ApiError(404, "Channel does not exists")
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { channelProfile },
        "User channel fetched successfully"
      )
    )
})

/**
 * @swagger
 * /users/regenerate-tokens:
 *   get:
 *     summary: Regenerate access and refresh tokens
 *     tags: [User]
 *     responses:
 *       201:
 *         description: Tokens regenerated successfully
 */
const regenerateTokens = asyncHandler(async (req, res) => {
  const oldRefreshToken = req.cookies?.refreshToken || req.header("Authorization")?.replace("Bearer ", "")

  if (!oldRefreshToken) {
    throw new ApiError(401, "Unauthorized request")
  }

  const decodedToken = jwt.verify(oldRefreshToken, process.env.REFRESH_TOKEN_SECRET)
  const user = await User.findById(decodedToken._id)

  if (!user) {
    throw new ApiError(401, "Invalid refresh token")
  }

  if (oldRefreshToken !== user.refreshToken) {
    throw new ApiError(401, "Refresh token is expired or used")
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)
  const options = { httpOnly: true, secure: true }

  return res
    .status(201)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { accessToken, refreshToken },
        "Tokens Regenerated Successfully"
      )
    )
})

/**
 * @swagger
 * /users/update-email:
 *   patch:
 *     summary: Update user email
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email updated successfully
 */
const updateEmail = asyncHandler(async (req, res) => {
  const { email } = req.body

  if (!email) {
    throw new ApiError(400, "Email is missing")
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user?._id,
    { $set: { email } },
    { new: true }
  ).select("-password")

  if (!updatedUser) {
    throw new ApiError(500, "Something went wrong while updating the email")
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { updatedUser },
        "Email updated successfully"
      )
    )
})

/**
 * @swagger
 * /users/update-fullname:
 *   patch:
 *     summary: Update user full name
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - fullname
 *             properties:
 *               fullname:
 *                 type: string
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullname
 *             properties:
 *               fullname:
 *                 type: string
 *     responses:
 *       200:
 *         description: Fullname updated successfully
 */
const updateFullname = asyncHandler(async (req, res) => {
  const { fullname } = req.body

  if (!fullname) {
    throw new ApiError(400, "Fullname is missing")
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user?._id,
    { $set: { fullname } },
    { new: true }
  ).select("-password")

  if (!updatedUser) {
    throw new ApiError(500, "Something went wrong while updating the email")
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { updatedUser },
        "Fullname updated successfully"
      )
    )

})

/**
 * @swagger
 * /users/update-password:
 *   patch:
 *     summary: update user password
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - newPassword
 *             properties:
 *               oldPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - newPassword
 *             properties:
 *               oldPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password updated successfully
 */
const updatePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body

  if (!oldPassword && !newPassword) {
    throw new ApiError(400, "Empty fields")
  }

  const user = await User.findById(req.user?._id)
  const isPasswordValid = await user.isPasswordCorrect(oldPassword)

  if (!isPasswordValid) {
    throw new ApiError(400, "Invalid old password")
  }

  user.password = newPassword
  await user.save({ validateBeforeSave: false })

  return res
    .status(200)
    .json(
      new ApiResponse(200, {}, "Password updated successfully")
    )
})

/**
 * @swagger
 * /users/update-avatar:
 *   patch:
 *     summary: update user avatar
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - avatar
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - avatar
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Avatar image updated successfully
 */
const updateAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing")
  }
  
  const oldAvatar = await deleteFromCloudinary(req.user?.avatar.publicId, "image")

  if (!oldAvatar) {
    throw new ApiError(500, "Something went wrong while deleting the old avatar from cloudinary")
  }

  const newAvatar = await uploadOnCloudinary(avatarLocalPath)

  if (!newAvatar) {
    throw new ApiError(500, "Something went wrong while uploading the new avatar in cloudinary")
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: {
          url: newAvatar.url,
          publicId: newAvatar.public_id
        }
      }
    },
    { new: true }
  ).select("-password")

  if (!updatedUser) {
    throw new ApiError(500, "Something went wrong while updating the avatar")
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { updatedUser },
        "Avatar image updated successfully")
    )
})

/**
 * @swagger
 * /users/update-cover-image:
 *   patch:
 *     summary: update user cover image
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - coverImage
 *             properties:
 *               coverImage:
 *                 type: string
 *                 format: binary
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - coverImage
 *             properties:
 *               coverImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Cover image updated successfully
 */
const updateCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path

  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover image file is missing")
  }

  const oldCoverImage = await deleteFromCloudinary(req.user?.coverImage.publicId, "image")

  if (!oldCoverImage) {
    throw new ApiError(500, "Something went wrong while deleting the old cover image from cloudinary")
  }

  const newCoverImage = await uploadOnCloudinary(coverImageLocalPath)

  if (!newCoverImage) {
    throw new ApiError(500, "Something went wrong while uploading the new cover image in cloudinary")
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: {
          url: newCoverImage.url,
          publicId: newCoverImage.public_id
        }
      }
    }
  ).select("-password")

  if (!updatedUser) {
    throw new ApiError(500, "Something went wrong while updating the cover image")
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { updatedUser },
        "Cover image updated successfully"
      )
    )
})

/**
 * @swagger
 * /users/delete:
 *   delete:
 *     summary: Delete user account
 *     tags: [User]
 *     responses:
 *       200:
 *         description: User deleted successfully
 */
const deleteUser = asyncHandler(async (req, res) => {
  await deleteFromCloudinary(req.user?.avatar?.publicId, "image")
  await deleteFromCloudinary(req.user?.coverImage?.publicId, "image")

  const deletedUser = await User.findByIdAndDelete(req.user?._id)

  if (!deletedUser) {
    throw new ApiError(500, "Something went wrong while deleting the user")
  }

  const viewsOfTheDeletedUser = await View.deleteMany({ owner: req.user?._id })

  if (!viewsOfTheDeletedUser) {
    throw new ApiError(500, "Something went wrong while deleteing views of the video")
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {},
        "User deleted successfully"
      )
    )
})

export {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  getUserChannelProfile,
  regenerateTokens,
  updateEmail,
  updateFullname,
  updatePassword,
  updateAvatar,
  updateCoverImage,
  deleteUser
}