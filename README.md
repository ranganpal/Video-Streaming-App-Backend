# Video Streaming App Backend

A backend API for a video streaming platform, built with Node.js, Express, and MongoDB. Features include user authentication, video upload and management, subscriptions, view tracking, and more.

🔗 **Live Demo:** []()

---

## 🚀 Features

-   **User Management**: User registration, login, logout, and profile management.
-   **Video Handling**: Video upload (with Cloudinary integration), update, and deletion.
-   **View Tracking**: Tracks video views and maintains a user's watch history.
-   **Subscriptions**: Channel subscriptions and subscriber management.
-   **Security**: JWT-based authentication and authorization for secure access.
-   **Efficiency**: Pagination and search functionality for videos, subscriptions, and views.

---

## 💻 Tech Stack

-   **Backend**: Node.js, Express.js
-   **Database**: MongoDB & Mongoose
-   **Media Storage**: Cloudinary (for video and image uploads)
-   **Authentication**: JSON Web Tokens (JWT)
-   **File Uploads**: Multer

---

## 📂 Project Structure
```bash
Video-Streaming-App-Backend
├── .env                                # Environment variables
├── .gitignore                          # Git ignore rules
├── .prettierignore                     # Prettier ignore rules
├── .prettierrc                         # Prettier configuration
├── package.json                        # NPM dependencies and scripts
├── README.md                           # Project documentation
├── public/
│   └── temp/                           # Temporary file storage for uploads
├── src/
│   ├── app.js                          # Express app setup
│   ├── constants.js                    # Project constants
│   ├── index.js                        # Entry point
│   ├── controllers/
│   │   ├── subscription.controller.js  # Route handlers for subscriptions
│   │   ├── user.controller.js          # Route handlers for users
│   │   ├── video.controller.js         # Route handlers for videos
│   │   └── view.controller.js          # Route handlers for views
│   ├── database/
│   │   └── index.js                    # MongoDB connection
│   ├── middlewares/
│   │   ├── auth.middleware.js          # JWT and ownership checks
│   │   └── multer.middleware.js        # File upload config
│   ├── models/
│   │   ├── subscription.model.js       # Mongoose subscription schema
│   │   ├── user.model.js               # Mongoose user schema
│   │   ├── video.model.js              # Mongoose video schema
│   │   └── view.model.js               # Mongoose view schema
│   ├── routes/
│   │   ├── subscription.route.js       # Express router for subscriptions
│   │   ├── user.router.js              # Express router for users
│   │   ├── video.route.js              # Express router for videos
│   │   └── view.route.js               # Express router for views
│   └── utils/
│       ├── apiError.js                 # Utility class for custom API errors
│       ├── apiResponse.js              # Utility class for standard API responses
│       ├── asyncHandler.js             # Utility function for async/await handling
│       └── cloudinary.js               # Cloudinary integration utility
```
  
---

## 🚀 Getting Started

### Prerequisites

-   **Node.js**: `v16+` recommended
-   **MongoDB Atlas**: A free account is sufficient, or you can use a local MongoDB instance.
-   **Cloudinary**: A free account is needed for media storage.

### Installation

1.  **Clone the repository**
    ```sh
    git clone https://github.com/ranganpal/Video-Streaming-App-Backend.git
    cd Video-Streaming-App-Backend
    ```

2.  **Install dependencies**
    ```sh
    npm install
    ```

3.  **Set up environment variables**

    Create a `.env` file in the root directory and add the following content, replacing the placeholder values with your own:

    ```env
    PORT=8000
    MONGODB_URI=<your-mongodb-uri>
    CORS_ORIGIN=*
    ACCESS_TOKEN_SECRET=<your-access-token-secret>
    ACCESS_TOKEN_EXPIRY=1d
    REFRESH_TOKEN_SECRET=<your-refresh-token-secret>
    REFRESH_TOKEN_EXPIRY=10d
    CLOUDINARY_CLOUD_NAME=<your-cloudinary-cloud-name>
    CLOUDINARY_API_KEY=<your-cloudinary-api-key>
    CLOUDINARY_API_SECRET=<your-cloudinary-api-secret>
    ```

4.  **Run the development server**

    ```sh
    npm run dev
    ```
    The server will start on `http://localhost:8000` (or the port you configured).

---

## 📬 API Endpoints

### User Endpoints (`/api/v1/users`)

| Method | Endpoint                          | Description                     |
| :----- | :-------------------------------- | :------------------------------ |
| `POST` | `/register`                       | Register a new user             |
| `POST` | `/login`                          | Log in to the application       |
| `GET`  | `/logout`                         | Log out the current user        |
| `GET`  | `/current-user`                   | Get the current user's profile  |
| `PATCH`| `/update-email`                   | Update the user's email         |
| `PATCH`| `/update-fullname`                | Update the user's full name     |
| `PATCH`| `/update-password`                | Change the user's password      |
| `PATCH`| `/update-avatar`                  | Change the user's avatar image  |
| `PATCH`| `/update-cover-image`             | Change the user's cover image   |
| `DELETE`|`/delete`                         | Delete the user's account       |
| `GET`  | `/channel-profile/:username`      | Get a channel's public profile  |

### Video Endpoints (`/api/v1/videos`)

| Method | Endpoint                              | Description                           |
| :----- | :------------------------------------ | :------------------------------------ |
| `GET`  | `/`                                   | List all videos                       |
| `POST` | `/`                                   | Upload a new video                    |
| `GET`  | `/:videoId`                           | Get details of a specific video       |
| `PATCH`| `/update-video-file/:videoId`         | Update the video file                 |
| `PATCH`| `/update-thumbnail/:videoId`          | Update the video's thumbnail          |
| `PATCH`| `/update-title/:videoId`              | Update the video's title              |
| `PATCH`| `/update-description/:videoId`        | Update the video's description        |
| `PATCH`| `/toggle-publish-status/:videoId`     | Toggle video's publish status (public/private)|
| `DELETE`|`/:videoId`                           | Delete a video                        |

### Subscription Endpoints (`/api/v1/subscriptions`)

| Method | Endpoint                          | Description                               |
| :----- | :-------------------------------- | :---------------------------------------- |
| `POST` | `/c/:channelId`                   | Toggle a subscription to a channel        |
| `GET`  | `/subscribed-channels`            | Get a list of channels the current user is subscribed to |
| `GET`  | `/channel-subscribers`            | Get a list of subscribers for the current user's channel |

### View Endpoints (`/api/v1/views`)

| Method | Endpoint                          | Description                             |
| :----- | :-------------------------------- | :-------------------------------------- |
| `GET`  | `/watched-videos`                 | Get a list of videos watched by the current user |
| `GET`  | `/video-viewers`                  | Get a list of viewers for a specific video |
| `PATCH`| `/remove-from-history/:videoId`   | Remove a video from the watch history   |

---

## 🧑‍💻 Author

-   Rangan Pal