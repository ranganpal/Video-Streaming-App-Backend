import { Router } from 'express';
import {
  uploadVideo,
  getAllVideos,
  getVideoById,
  updateTitle,
  updateDescription,
  updateVideoFile,
  updateThumbnail,
  togglePublishStatus,
  deleteVideo
} from "../controllers/video.controller.js"
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT, verifyVideoOwnership } from "../middlewares/auth.middleware.js"

const router = Router()
router.use(verifyJWT)

// post
router.route("/upload").post(
  upload.fields([
    {
      name: "videoFile",
      maxCount: 1,
    },
    {
      name: "thumbnail",
      maxCount: 1,
    }
  ]),
  uploadVideo
)

// get
router.route("/").get(getAllVideos)  
router.route("/:videoId").get(getVideoById)

// patch
router.route("/update-title/:videoId").patch(
  verifyVideoOwnership,
  upload.none(),
  updateTitle
)
router.route("/update-description/:videoId").patch(
  verifyVideoOwnership, 
  upload.none(),
  updateDescription
)
router.route("/update-video-file/:videoId").patch(
  verifyVideoOwnership,
  upload.single("videoFile"),
  updateVideoFile
)
router.route("/update-thumbnail/:videoId").patch(
  verifyVideoOwnership,
  upload.single("thumbnail"),
  updateThumbnail
)
router.route("/toggle-publish-status/:videoId").patch(
  verifyVideoOwnership, 
  upload.none(),
  togglePublishStatus
)

// delete
router.route("/delete/:videoId").delete(
  verifyVideoOwnership, 
  deleteVideo
)

export default router