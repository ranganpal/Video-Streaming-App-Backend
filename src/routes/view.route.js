import { Router } from "express"
import { verifyJWT, verifyVideoOwnership } from "../middlewares/auth.middleware.js"
import {
  getWatchedVideos,
  getVideoViewers,
  removeFromHistory
} from "../controllers/view.controller.js"

const router = Router()
router.use(verifyJWT)

// get
router.route("/watched-videos").get(getWatchedVideos)
router.route("/video-viewers/:videoId").get(
  verifyVideoOwnership,
  getVideoViewers
)

// patch
router.route("/remove-from-histroy/:videoId").patch(removeFromHistory)

export default router