#!/bin/bash

# Create directories
mkdir -p src/config
mkdir -p src/controllers
mkdir -p src/routes
mkdir -p src/services
mkdir -p src/models
mkdir -p src/middlewares
mkdir -p src/utils
mkdir -p src/validators
mkdir -p src/features/auth

# Create empty files
touch src/config/database.js
touch src/config/constants.js
touch src/controllers/authController.js
touch src/routes/authRoutes.js
touch src/services/authService.js
touch src/models/User.js
touch src/middlewares/authMiddleware.js
touch src/middlewares/errorMiddleware.js
touch src/utils/generateToken.js
touch src/utils/hashPassword.js
touch src/utils/sendEmail.js
touch src/validators/authValidator.js
touch src/features/auth/registerFeature.js
touch src/features/auth/loginFeature.js
touch src/features/auth/logoutFeature.js
touch src/features/auth/refreshTokenFeature.js
touch src/app.js
touch src/server.js
touch .env
touch package.json

echo "✅ Folder structure created successfully!"
