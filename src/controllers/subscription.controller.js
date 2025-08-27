import mongoose, { isValidObjectId } from "mongoose"
import { ApiError } from "../utils/apiError.js"
import { ApiResponse } from "../utils/apiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { Subscription } from "../models/subscription.model.js"


/**
 * @swagger
 * /subscriptions/c/{channelId}:
 *   post:
 *     summary: Toggle subscription to a channel
 *     tags: [Subscription]
 *     parameters:
 *       - in: path
 *         name: channelId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Subscription toggled successfully
 */
const toggleSubscription = asyncHandler(async (req, res) => {
  const channelId = req.params?.channelId
  const subscriberId = req.user?._id

  if (!channelId || !subscriberId) {
    throw new ApiError(400, "Channel ID or Subscriber ID is missing")
  }

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel ID");
  }

  const oldSubscription = await Subscription.findOneAndDelete(
    {
      subscriber: subscriberId,
      channel: channelId
    }
  )

  if (!oldSubscription) {
    const newSubscription = await Subscription.create(
      {
        subscriber: subscriberId,
        channel: channelId
      }
    )

    if (!newSubscription) {
      throw new ApiError(500, "Failed to create new subscription");
    }
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {},
        `${!oldSubscription ? "Subscribed" : "Unsubscribed"}`
      )
    )
})

/**
 * @swagger
 * /subscriptions/subscribed-channels:
 *   get:
 *     summary: Get all channels the user is subscribed to
 *     tags: [Subscription]
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
 *         description: List of subscribed channels
 */
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { page, limit, search, sortBy, sortType } = req.query  

  const pipeline = [
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(String(req.user?._id))
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "channelDetails"
      }
    },
    {
      $unwind: "$channelDetails"
    },
    {
      $project: {
        createdAt: 1,
        updatedAt: 1,
        channelId: "$channelDetails._id",
        channelAvatar: "$channelDetails.avatar.url",
        channelUsername: "$channelDetails.username",
        channelFullname: "$channelDetails.fullname"
      }
    }
  ]

  if (search) {
    pipeline.push({
      $match: {
        $or: [
          { channelUsername: { $regex: search, $options: 'i' } },
          { channelFullname: { $regex: search, $options: 'i' } }
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
      docs: "subscribedChannels",
      totalDocs: "totalChannels"
    }
  }

  const subscriptions = await Subscription.aggregatePaginate(
    Subscription.aggregate(pipeline),
    options
  )

  if (!subscriptions || !subscriptions.subscribedChannels) {
    throw new ApiError(404, "No subscribed channels found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        subscriptions,
        "Successfully fetched subscribed channels"
      )
    )
})

/**
 * @swagger
 * /subscriptions/channel-subscribers:
 *   get:
 *     summary: Get all subscribers of the user's channel
 *     tags: [Subscription]
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
 *         description: List of channel subscribers
 */
const getChannelSubscribers = asyncHandler(async (req, res) => {
  const { page, limit, search, sortBy, sortType } = req.query

  const pipeline = [
    {
      $match: {
        channel: new mongoose.Types.ObjectId(String(req.user?._id))
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscriberDetails"
      }
    },
    {
      $unwind: "$subscriberDetails"
    },
    {
      $project: {
        createdAt: 1,
        updatedAt: 1,
        subscriberId: "$subscriberDetails._id",
        subscriberAvatar: "$subscriberDetails.avatar.url",
        subscriberUsername: "$subscriberDetails.username",
        subscriberFullname: "$subscriberDetails.fullname"
      }
    }
  ]

  if (search) {
    pipeline.push({
      $match: {
        $or: [
          { subscriberUsername: { $regex: search, $options: 'i' } },
          { subscriberFullname: { $regex: search, $options: 'i' } }
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
      docs: "channelSubscribers",
      totalDocs: "totalSubscribers"
    }
  }

  const subscriptions = await Subscription.aggregatePaginate(
    Subscription.aggregate(pipeline),
    options
  )

  if (!subscriptions || !subscriptions.channelSubscribers) {
    throw new ApiError(404, "No channel subscribers found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        subscriptions,
        "Successfully fetched channel subscribers"
      )
    )
})

export {
  toggleSubscription,
  getSubscribedChannels,
  getChannelSubscribers
}