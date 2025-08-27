import { Schema, model } from "mongoose"
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2"

/**
 * @swagger
 * components:
 *   schemas:
 *     Subscription:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique identifier for the subscription
 *         subscriber:
 *           $ref: '#/components/schemas/User'
 *           description: The user who is subscribing
 *         channel:
 *           $ref: '#/components/schemas/User'
 *           description: The channel (user) being subscribed to
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Subscription creation timestamp
 */
const subscriptionSchema = new Schema(
  {
    subscriber: {
      type: Schema.Types.ObjectId,
      ref: "User"
    },
    channel: {
      type: Schema.Types.ObjectId,
      ref: "User"
    }
  },
  {
    timestamps: true
  }
)

subscriptionSchema.plugin(mongooseAggregatePaginate)

export const Subscription = model("Subscription", subscriptionSchema)