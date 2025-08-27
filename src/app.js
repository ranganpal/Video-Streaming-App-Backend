import cors from "cors"
import express from "express"
import cookieParser from "cookie-parser"
import { swaggerUi, swaggerSpec } from './swagger.js';

const app = express()

app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }))
app.use(express.urlencoded({ limit: "16kb", extended: true }))
app.use(express.json({ limit: "16kb" }))
app.use(express.static("public"))
app.use(cookieParser())


// Router
import userRouter from "./routes/user.router.js"
import videoRouter from "./routes/video.route.js"
import subscriptionRouter from "./routes/subscription.route.js"
import viewRouter from "./routes/view.route.js"

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api/v1/users", userRouter)
app.use("/api/v1/videos", videoRouter)
app.use("/api/v1/subscriptions", subscriptionRouter)
app.use("/api/v1/views", viewRouter)


export default app