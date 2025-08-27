import mongoose from "mongoose"
import { View } from "../models/view.model.js"
import { ApiError } from "../utils/apiError.js"
import { ApiResponse } from "../utils/apiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

/**
 * @swagger
 * /views/watched-videos:
 *   get:
 *     summary: Get all videos watched by the current user
 *     tags: [View]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortType
 *         schema:
 *           type: string
 *           enum: [inc, dec]
 *     responses:
 *       200:
 *         description: List of watched videos
 */
const getWatchedVideos = asyncHandler(async (req, res) => {
  const { page, limit, search, sortBy, sortType } = req.query

  const pipeline = [
    {
      $match: {
        viewer: new mongoose.Types.ObjectId(String(req.user?._id)),
        watchHistory: true
      }
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        pipeline: [
          {
            $lookup: {
              from: "views",
              let: { videoId: "$_id" },
              pipeline: [
                {
                  $match: {
                    $expr: { $eq: ["$video", "$$videoId"] }
                  }
                },
                {
                  $count: "count"
                }
              ],
              as: "viewsCount"
            }
          },
          {
            $addFields: {
              viewsCount: { $first: "$viewsCount.count" }
            }
          }
        ],
        as: "videoDetails"
      }
    },
    {
      $unwind: "$videoDetails"
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerDetails"
      }
    },
    {
      $unwind: "$ownerDetails"
    },
    {
      $project: {
        createdAt: 1,
        updatedAt: 1,
        videoId: "$videoDetails._id",
        videoTitle: "$videoDetails.title",
        videoDuration: "$videoDetails.duration",
        videoThumbnail: "$videoDetails.thumbnail",
        videoViews: "$videoDetails.viewsCount",
        ownerId: "$ownerDetails._id",
        ownerAvatar: "$ownerDetails.avatar",
        ownerUsername: "$ownerDetails.username",
        ownerFullname: "$ownerDetails.fullname"
      }
    }
  ]

  if (search) {
    pipeline.push({
      $match: {
        $or: [
          { videoTitle: { $regex: search, $options: 'i' } },
          { ownerUsername: { $regex: search, $options: 'i' } },
          { ownerFullname: { $regex: search, $options: 'i' } }
        ]
      }
    })
  }

  pipeline.push({
    $sort: {
      [sortBy || "createdAt"]: sortType === "inc" ? 1 : -1
    }
  })

  const options = {
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 10,
    customLabels: {
      docs: "watchedVideos",
      totalDocs: "totalVideos"
    }
  }

  const views = await View.aggregatePaginate(
    View.aggregate(pipeline),
    options
  )

  if (!views || !views.watchedVideos) {
    throw new ApiError(500, "Failed to fetch watched videos")
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        views,
        "Successfully fetched watched videos"
      )
    )
})

/**
 * @swagger
 * /views/video-viewers/{videoId}:
 *   get:
 *     summary: Get all viewers of a specific video
 *     tags: [View]
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortType
 *         schema:
 *           type: string
 *           enum: [inc, dec]
 *     responses:
 *       200:
 *         description: List of viewers for the video
 */
const getVideoViewers = asyncHandler(async (req, res) => {
  const { videoId } = req.params
  const { page, limit, search, sortBy, sortType } = req.query

  const pipeline = [
    {
      $match: {
        video: new mongoose.Types.ObjectId(String(videoId))
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "viewer",
        foreignField: "_id",
        as: "viewerDetails"
      }
    },
    {
      $unwind: "$viewerDetails"
    },
    {
      $project: {
        createdAt: 1,
        updatedAt: 1,
        viewerId: "$viewerDetails._id",
        viewerAvatar: "$viewerDetails.avatar",
        viewerUsername: "$viewerDetails.username",
        viewerFullname: "$viewerDetails.fullname",
      }
    }
  ]

  if (search) {
    pipeline.push({
      $match: {
        $or: [
          { viewerUsername: { $regex: search, $options: 'i' } },
          { viewerFullname: { $regex: search, $options: 'i' } }
        ]
      }
    })
  }

  pipeline.push({
    $sort: {
      [sortBy || "createdAt"]: sortType === "inc" ? 1 : -1
    }
  })

  const options = {
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 10,
    customLabels: {
      docs: "videoViewers",
      totalDocs: "totalViewers"
    }
  }

  const views = await View.aggregatePaginate(
    View.aggregate(pipeline),
    options
  )

  if (!views || !views.videoViewers) {
    throw new ApiError(500, "Failed to fetch video viewers")
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        views,
        "Successfully fetched video viewers"
      )
    )
})

/**
 * @swagger
 * /views/remove-from-histroy/{videoId}:
 *   patch:
 *     summary: Remove a video from the user's watch history
 *     tags: [View]
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Video removed from history
 */
const removeFromHistory = asyncHandler(async (req, res) => {
  const videoId = req.params.videoId
  const userId = req.user._id

  if (!videoId || !userId) {
    throw new ApiError(404, "Video ID or User ID is missing")
  }

  const view = await View.findOneAndUpdate(
    {
      video: new mongoose.Types.ObjectId(String(videoId)),
      viewer: new mongoose.Types.ObjectId(String(userId))
    },
    { $set: { watchHistory: false } },
    { new: true }

  )

  if (!view) {
    throw new ApiError(500, "No view document was updated for the given video ID and User ID")
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {},
        "Successfully updated watch history"
      )
    )
})

export {
  getWatchedVideos,
  getVideoViewers,
  removeFromHistory
}