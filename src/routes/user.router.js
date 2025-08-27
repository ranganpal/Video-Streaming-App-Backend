import { Router } from "express"
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import {
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
} from "../controllers/user.controller.js"

const router = Router()

// post
router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1
    },
    {
      name: "coverImage",
      maxCount: 1
    }
  ]),
  registerUser
)
router.route("/login").post(upload.none(), loginUser)

// get
router.route("/regenerate-tokens").get(regenerateTokens)

// secured routes
router.use(verifyJWT)
router.route("/logout").get(logoutUser)
router.route("/current-user").get(getCurrentUser)
router.route("/channel-profile/:username").get(getUserChannelProfile)

// patch
router.route("/update-email").patch(upload.none(), updateEmail)
router.route("/update-fullname").patch(upload.none(), updateFullname)
router.route("/update-password").patch(upload.none(), updatePassword)
router.route("/update-avatar").patch(upload.single("avatar"), updateAvatar)
router.route("/update-cover-image").patch(upload.single("coverImage"), updateCoverImage)

// delete
router.route("/delete").delete(deleteUser)

export default router