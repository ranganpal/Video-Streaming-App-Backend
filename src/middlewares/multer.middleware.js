import path from "path"
import multer from "multer"

/**
 * Multer configuration for handling file uploads (videos, images, etc.).
 *
 * @type {import('multer').Options}
 */
const multerConfig = {
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, "./public/temp"),
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
      cb(null, uniqueSuffix + path.extname(file.originalname))
    }
  })
}

/**
 * Multer middleware instance for handling multipart/form-data.
 *
 * @type {import('multer').Multer}
 */
export const upload = multer(multerConfig);