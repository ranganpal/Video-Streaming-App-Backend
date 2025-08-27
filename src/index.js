import dotenv from "dotenv"
import app from "./app.js"
import connectDB from "./database/index.js"

dotenv.config({
  path: "./.env"
})

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, (req, res) => {
      console.log(`Server is running at port: ${process.env.PORT}`)
    })
  })
  .catch((error) => {
    console.log("Server Error ", error)
    process.exit(1)
  })


/*
import express from "express";

const app = express()

; (async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)

    app.on("error", (error) => {
      console.log("ERROR: ", error)
      throw error
    })

    app.listen(process.env.PORT, (req, res) => {
      console.log(`App is listening on port${process.env.PORT}`)
    })
  } 
  catch(error) {
    console.log("ERROR: ", error)
    throw error
  }
})()
*/