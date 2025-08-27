import { Router } from "express"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import {
  toggleSubscription,
  getSubscribedChannels,
  getChannelSubscribers
} from "../controllers/subscription.controller.js"

const router = Router()
router.use(verifyJWT)

// post
router.route("/c/:channelId").post(toggleSubscription)

// get
router.route("/subscribed-channels").get(getSubscribedChannels)
router.route("/channel-subscribers").get(getChannelSubscribers)

export default router