import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js"
import { Video } from "../models/video.model.js"
import { ApiError } from "../utils/apiError.js"
import { asyncHandler } from "../utils/asyncHandler.js"

/**
 * Middleware to verify JWT access token and authenticate user.
 *
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next middleware function
 */
export const verifyJWT = asyncHandler(async (req, _, next) => {
  const accessToken = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")

  if (!accessToken) {
    throw new ApiError(401, "Unauthorized request")
  }

  const decodedToken = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET)
  const user = await User.findById(decodedToken._id).select("-password -refreshToken")

  if (!user) {
    throw new ApiError(401, "Invalid Access Token")
  }

  req.user = user
  next()
})

/**
 * Middleware to check if the authenticated user is the owner of a resource.
 *
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next middleware function
 */
export const verifyVideoOwnership = asyncHandler(async (req, _, next) => {
  const videoId = req.params.videoId || req.query.videoId
  const video = await Video.findById(videoId)

  if (!video) {
    throw new ApiError(404, "Video not found")
  }

  if (video.publisher.toString() !== req.user.id) {
    throw new ApiError(403, "Access denied: You are not the owner of this video")
  }

  next()
})