import { Schema, model } from "mongoose"
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2"

/**
 * @swagger
 * components:
 *   schemas:
 *     View:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique identifier for the view record
 *         video:
 *           $ref: '#/components/schemas/Video'
 *           description: The video that was watched
 *         viewer:
 *           $ref: '#/components/schemas/User'
 *           description: The user who watched the video
 *         owner:
 *           $ref: '#/components/schemas/User'
 *           description: The user who published the video
 *         watchedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the video was watched
 */
const viewSchema = new Schema(
  {
    video: {
      type: Schema.Types.ObjectId,
      ref: "Video"
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User"
    },
    viewer: {
      type: Schema.Types.ObjectId,
      ref: "User"
    },
    watchHistory: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
)

viewSchema.plugin(mongooseAggregatePaginate)

export const View = model("View", viewSchema)