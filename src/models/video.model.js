import { Schema, model } from "mongoose"
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2"

const fileSchema = new Schema(
  {
    url: { type: String },
    publicId: { type: String },
  },
  {
    _id: false
  }
);

/**
 * @swagger
 * components:
 *   schemas:
 *     Video:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique identifier for the video
 *         videoFile:
 *           type: string
 *           description: URL to the video file
 *         thumbnail:
 *           type: string
 *           description: URL to the video thumbnail
 *         duration:
 *           type: number
 *           description: Duration of the video
 *         title:
 *           type: string
 *           description: Title of the video
 *         description:
 *           type: string
 *           description: Description of the video
 *         publisher:
 *           $ref: '#/components/schemas/User'
 *           description: Publisher of the video
 *         published:
 *           type: boolean
 *           description: Whether the video is published
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Video creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Video update timestamp
 */
const videoSchema = new Schema(
  {
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    }, 
    videoFile: {
      type: fileSchema,
      required: true
    },
    thumbnail: {
      type: fileSchema,
      required: true
    },
    duration: {
      type: Number,
      required: true
    },
    published: {
      type: Boolean,
      default: true
    },
    publisher: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  {
    timestamps: true
  }
)

videoSchema.plugin(mongooseAggregatePaginate)

export const Video = model("Video", videoSchema)