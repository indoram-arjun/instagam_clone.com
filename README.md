# Instagram Clone

A full-stack Instagram clone built with HTML, CSS, JavaScript, Node.js, Express, and MySQL.

## Features

- User registration and login
- JWT authentication
- Create posts with image upload
- Like and comment on posts
- Follow and unfollow users
- Home feed with followed users' posts
- User profile pages
- Search users by username

## Tech Stack

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js, Express.js
- Database: MySQL
- Auth: JWT and bcrypt
- Image Upload: Multer

## Project Structure

```text
instagram-clone/
├── backend/
│   ├── server.js
│   ├── db.js
│   ├── routes/
│   ├── controllers/
│   ├── middleware/
│   └── uploads/
├── frontend/
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   ├── profile.html
│   ├── upload.html
│   ├── search.html
│   ├── css/
│   └── js/
├── database.sql
├── package.json
└── README.md
```

## How to Run Locally

1. Clone the repository.
2. Install backend dependencies:

   ```bash
   npm install
   ```

3. Create the MySQL database and tables:

   ```bash
   mysql -u root -p < database.sql
   ```

4. Create a `.env` file in the project root. You can copy `.env.example`:

   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=yourpassword
   DB_NAME=instagram_clone
   JWT_SECRET=your_secret_key
   PORT=5000
   ```

5. Start the backend server:

   ```bash
   npm start
   ```

6. Open `frontend/login.html` in your browser.

The API runs at `http://localhost:5000`.

## API Routes

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`

### Posts

- `POST /api/posts/upload`
- `GET /api/posts/feed`
- `GET /api/posts/:id`
- `DELETE /api/posts/:id`

### Users

- `GET /api/users/search?q=username`
- `GET /api/users/:username`
- `GET /api/users/:username/posts`
- `POST /api/users/follow/:id`
- `POST /api/users/unfollow/:id`

### Interactions

- `POST /api/interactions/like/:postId`
- `POST /api/interactions/comment/:postId`
- `GET /api/interactions/comments/:postId`

Protected routes require this header:

```text
Authorization: Bearer your_jwt_token
```

## Screenshots

Add screenshots here after running the project locally.
