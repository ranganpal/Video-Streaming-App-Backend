import mongoose from "mongoose"
import { View } from "../models/view.model.js"
import { Video } from "../models/video.model.js"
import { ApiError } from "../utils/apiError.js"
import { ApiResponse } from "../utils/apiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js"

/**
 * @swagger
 * /videos/upload:
 *   post:
 *     summary: Upload a new video
 *     tags: [Video]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - videoFile
 *               - thumbnail
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               videoFile:
 *                 type: string
 *                 format: binary
 *               thumbnail:
 *                 type: string
 *                 format: binary
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - videoFile
 *               - thumbnail
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               videoFile:
 *                 type: string
 *                 format: binary
 *               thumbnail:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Video uploaded successfully
 */
const uploadVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body

  if (!title || !description) {
    throw new ApiError(400, "Title and Description both are required")
  }

  const videoFileLocalPath = (req.files &&
    Array.isArray(req.files.videoFile) &&
    req.files.videoFile.length > 0
  ) ? req.files.videoFile[0].path : null

  const thumbnailLocalPath = (req.files &&
    Array.isArray(req.files.thumbnail) &&
    req.files.thumbnail.length > 0
  ) ? req.files.thumbnail[0].path : null

  if (!videoFileLocalPath || !thumbnailLocalPath) {
    throw new ApiError(400, "Video and Thumbnail both are required")
  }

  const videoFile = await uploadOnCloudinary(videoFileLocalPath)
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

  if (!videoFile || !thumbnail) {
    throw new ApiError(500, "Something went wrong while uploading video and thumbnail in cloudinary")
  }

  const video = await Video.create({
    videoFile: {
      url: videoFile.url,
      publicId: videoFile.public_id
    },
    thumbnail: {
      url: thumbnail.url,
      publicId: thumbnail.public_id
    },
    duration: videoFile.duration,
    publisher: req.user?._id,
    title,
    description
  })

  if (!video) {
    throw new ApiError(500, "Something went wrong while uploading the video")
  }

  return res
    .status(201)
    .json(
      new ApiResponse(
        200,
        { video },
        "Video uploaded successfully"
      )
    )
})

/**
 * @swagger
 * /videos:
 *   get:
 *     summary: Get all videos
 *     tags: [Video]
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
 *         name: channelId
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
 *         description: List of videos
 */
const getAllVideos = asyncHandler(async (req, res) => {
  const { page, limit, search, channelId, sortBy, sortType } = req.query

  const pipeline = []

  const options = {
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 10,
    customLabels: {
      docs: "videoList",
      totalDocs: "totalVideos"
    }
  }

  if (search) {
    pipeline.push({
      $match: {
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ]
      }
    })
  }

  if (channelId) {
    pipeline.push({
      $match: {
        publisher: new mongoose.Types.ObjectId(String(channelId))
      }
    })
  }

  pipeline.push(...[
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
        viewsCount: { $ifNull: [{ $first: "$viewsCount.count" }, 0] }
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "publisher",
        foreignField: "_id",
        as: "publisherDetails"
      }
    },
    {
      $unwind: "$publisherDetails"
    },
    {
      $project: {
        title: 1,
        duration: 1,
        thumbnail: 1,
        viewsCount: 1,
        publisherAvatar: "$publisherDetails.avatar",
        publisherUsername: "$publisherDetails.username",
        publisherFullname: "$publisherDetails.fullname",
        createdAt: 1,
        updatedAt: 1
      }
    },
    {
      $sort: {
        [sortBy || "createdAt"]: sortType === "inc" ? 1 : -1
      }
    }
  ])

  const videos = await Video.aggregatePaginate(
    Video.aggregate(pipeline),
    options
  )

  if (!videos || !videos.videoList) {
    throw new ApiError(500, "Something went wrong while fetching all videos")
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        videos,
        "Videos fetched successfully"
      )
    )
})

/**
 * @swagger
 * /videos/{videoId}:
 *   get:
 *     summary: Get video details by ID
 *     tags: [Video]
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Video details fetched successfully
 */
const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params

  if (!videoId) {
    throw new ApiError(400, "Video ID is required")
  }

  const pipeline = [
    {
      $match: { _id: new mongoose.Types.ObjectId(String(videoId)) }
    },
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
        viewsCount: { $ifNull: [{ $first: "$viewsCount.count" }, 0] }
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "publisher",
        foreignField: "_id",
        pipeline: [
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
            $addFields: {
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
        ],
        as: "publisherDetails"
      }
    },
    {
      $unwind: "$publisherDetails"
    },
    {
      $project: {
        title: 1,
        description: 1,
        duration: 1,
        videoFile: 1,
        thumbnail: 1,
        viewsCount: 1,
        publisherId: "$publisherDetails._id",
        publisherAvatar: "$publisherDetails.avatar",
        publisherUsername: "$publisherDetails.username",
        publisherFullname: "$publisherDetails.fullname",
        subscribesCount: "$publisherDetails.subscribesCount",
        subscribersCount: "$publisherDetails.subscribersCount",
        isSubscribed: "$publisherDetails.isSubscribed",
        createdAt: 1,
        updatedAt: 1
      }
    }
  ]

  const videos = await Video.aggregate(pipeline)
  const video = videos[0]

  if (!video) {
    throw new ApiError(500, "Something went wrong while fetching the video")
  }

  await View.findOneAndDelete({
    video: video._id,
    owner: video.publisherId,
    viewer: req.user?._id
  })

  const newView = await View.create({
    video: video._id,
    owner: video.publisherId,
    viewer: req.user?._id
  })

  if (!newView) {
    throw new ApiError(500, "Something went wrong while creating new view of the video")
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { video },
        "User fetched successfully"
      )
    )

})

/**
 * @swagger
 * /videos/update-title/{videoId}:
 *   patch:
 *     summary: Update video title
 *     tags: [Video]
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *     responses:
 *       200:
 *         description: Title updated successfully
 */
const updateTitle = asyncHandler(async (req, res) => {
  const { videoId } = req.params
  const { title } = req.body

  if (!videoId) {
    throw new ApiError(400, "Video ID is required")
  }

  if (!title) {
    throw new ApiError(400, "Title is missing")
  }

  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    { $set: { title } },
    { new: true }
  )

  if (!updatedVideo) {
    throw new ApiError(500, "Something went wrong while updating the video title")
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { updatedVideo },
        "Video title updated successfully"
      )
    )
})

/**
 * @swagger
 * /videos/update-description/{videoId}:
 *   patch:
 *     summary: Update video description
 *     tags: [Video]
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - description
 *             properties:
 *               description:
 *                 type: string
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - description
 *             properties:
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Description updated successfully
 */
const updateDescription = asyncHandler(async (req, res) => {
  const { videoId } = req.params
  const { description } = req.body

  console.log("test");


  if (!videoId) {
    throw new ApiError(400, "Video ID is required")
  }

  if (!description) {
    throw new ApiError(400, "description is missing")
  }

  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    { $set: { description } },
    { new: true }
  )

  if (!updatedVideo) {
    throw new ApiError(500, "Something went wrong while updating the video description")
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { updatedVideo },
        "Video description updated successfully"
      )
    )
})

/**
 * @swagger
 * /videos/update-video-file/{videoId}:
 *   patch:
 *     summary: Update video file
 *     tags: [Video]
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - videoFile
 *             properties:
 *               videoFile:
 *                 type: string
 *                 format: binary
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - video
 *             properties:
 *               video:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Video file updated successfully
 */
const updateVideoFile = asyncHandler(async (req, res) => {
  const { videoId } = req.params
  const videoFileLocalPath = req.file?.path

  if (!videoId) {
    throw new ApiError(400, "Video ID is required")
  }

  if (!videoFileLocalPath) {
    throw new ApiError(400, "Video file is missing")
  }

  const oldVideo = await Video.findById(videoId)

  if (!oldVideo) {
    throw new ApiError(500, "Something went wrong while fetching the old video")
  }

  const oldVideoFile = await deleteFromCloudinary(oldVideo.videoFile.publicId, "video")

  if (!oldVideoFile) {
    throw new ApiError(500, "Something went wrong while deleting the old video file from cloudinary")
  }

  const newVideoFile = await uploadOnCloudinary(videoFileLocalPath)

  if (!newVideoFile) {
    throw new ApiError(500, "Something went wrong while uploading the new video file in cloudinary")
  }

  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        videoFile: {
          url: newVideoFile.url,
          publicId: newVideoFile.public_id
        }
      }
    },
    { new: true }
  )

  if (!updatedVideo) {
    throw new ApiError(500, "Something went wrong while updating the video file")
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { updatedVideo },
        "Video file updated successfully"
      )
    )

})

/**
 * @swagger
 * /videos/update-thumbnail/{videoId}:
 *   patch:
 *     summary: Update video thumbnail
 *     tags: [Video]
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - thumbnail
 *             properties:
 *               thumbnail:
 *                 type: string
 *                 format: binary
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - thumbnail
 *             properties:
 *               thumbnail:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Thumbnail updated successfully
 */
const updateThumbnail = asyncHandler(async (req, res) => {
  const { videoId } = req.params
  const thumbnailLocalPath = req.file?.path

  if (!videoId) {
    throw new ApiError(400, "Video ID is required")
  }

  if (!thumbnailLocalPath) {
    throw new ApiError(400, "Thumbnail is missing")
  }

  const oldVideo = await Video.findById(videoId)

  if (!oldVideo) {
    throw new ApiError(500, "Something went wrong while fetching the old video")
  }

  const oldThumbnail = await deleteFromCloudinary(oldVideo.thumbnail.publicId, "image")

  if (!oldThumbnail) {
    throw new ApiError(500, "Something went wrong while deleting the old thumbnail from cloudinary")
  }

  const newThumbnail = await uploadOnCloudinary(thumbnailLocalPath)

  if (!newThumbnail) {
    throw new ApiError(500, "Something went wrong while uploading the new thumbnail in cloudinary")
  }

  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        thumbnail: {
          url: newThumbnail.url,
          publicId: newThumbnail.public_id
        }
      }
    },
    { new: true }
  )

  if (!updatedVideo) {
    throw new ApiError(500, "Something went wrong while updating the thumbnail")
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { updatedVideo },
        "Thumbnail updated successfully"
      )
    )
})

/**
 * @swagger
 * /videos/toggle-publish-status/{videoId}:
 *   patch:
 *     summary: Toggle video publish status
 *     tags: [Video]
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Publish status toggled successfully
 */
const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params

  if (!videoId) {
    throw new ApiError(400, "Video ID is required")
  }

  const video = await Video.findById(videoId)

  if (!video) {
    throw new ApiError(500, "Something went wrong while fetching the video")
  }

  video.published = !video.published
  const updatedVideo = await video.save({ validateBeforeSave: false })

  if (!updatedVideo) {
    throw new ApiError(500, "Something went wrong while updating the video publish status");
  }

  if (!updatedVideo) {
    throw new ApiError(500, "Something went wrong while updating the video publish status")
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { updatedVideo },
        "Publish status toggled successfully"
      )
    )
})

/**
 * @swagger
 * /videos/delete/{videoId}:
 *   delete:
 *     summary: Delete a video by ID
 *     tags: [Video]
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Video deleted successfully
 */
const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params

  if (!videoId) {
    throw new ApiError(400, "Video ID is required")
  }

  const oldVideo = await Video.findById(videoId)

  if (!oldVideo) {
    throw new ApiError(500, "Something went wrong while fetching the video")
  }

  await deleteFromCloudinary(oldVideo.videoFile.publicId, "video")
  await deleteFromCloudinary(oldVideo.thumbnail.publicId, "image")
  
  const deletedVideo = await Video.findByIdAndDelete(videoId)

  if (!deletedVideo) {
    throw new ApiError(500, "Something went wrong while deleting the video")
  }

  const viewsOfTheOldVideo = await View.deleteMany({ video: deletedVideo._id })

  if (!viewsOfTheOldVideo) {
    throw new ApiError(500, "Something went wrong while deleteing views of the video")
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {},
        "Video deleted successfully"
      )
    )
})

export {
  uploadVideo,
  getAllVideos,
  getVideoById,
  updateTitle,
  updateDescription,
  updateVideoFile,
  updateThumbnail,
  togglePublishStatus,
  deleteVideo
}