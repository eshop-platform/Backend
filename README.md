# Backend

REST API for the eShop platform built with Node.js, Express, and MongoDB.

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express 5
- **Database:** MongoDB (Mongoose)
- **Auth:** JWT + bcryptjs
- **File Uploads:** Multer + Cloudinary
- **AI:** OpenAI Chat Completions API
- **Other:** Helmet, CORS, express-rate-limit, express-validator

## Project Structure

```
src/
├── config/         # Database connection
├── controllers/    # Route handlers
├── middlewares/    # Auth, error handler
├── models/         # Mongoose schemas
├── routes/         # Express routers
├── services/       # Business logic
├── utils/          # Cloudinary setup
├── validations/    # Input validation
├── app.js          # Express app setup
└── server.js       # Entry point
```

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- Cloudinary account
- OpenAI API key

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file in the root of the `backend/` folder:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o-mini
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### Running the Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Server runs on `http://localhost:5000` by default.

## API Endpoints

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server health check |

### Auth / Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/users/register` | Register a new user |
| POST | `/api/users/login` | Login and get JWT |
| GET | `/api/users/profile` | Get current user profile |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List all approved products |
| GET | `/api/products/:id` | Get a single product |
| POST | `/api/products` | Create a product (auth required) |
| PUT | `/api/products/:id` | Update a product (auth required) |
| DELETE | `/api/products/:id` | Delete a product (auth required) |

### Categories
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories` | List all categories |
| POST | `/api/categories` | Create a category (admin) |

### Purchases
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/purchases` | Create a purchase |
| GET | `/api/purchases/my` | Get current user's purchases |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | Admin dashboard stats |

### AI
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/chat` | Shopping assistant chat |
| POST | `/api/ai/product-draft` | Generate product listing draft |
| POST | `/api/ai/pricing` | Suggest dynamic pricing |

## Authentication

Protected routes require a Bearer token in the `Authorization` header:

```
Authorization: Bearer <your_jwt_token>
```
