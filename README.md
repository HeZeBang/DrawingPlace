# DrawingPlace

A collaborative pixel drawing board inspired by r/place, built with Next.js and MongoDB. Users can place pixels on a shared canvas with rate limiting to ensure fair participation.

## Features

- **Collaborative Drawing**: Share a canvas with other users in real-time
- **Rate Limiting**: Configurable cooldown period between pixel placements (default: 5 seconds)
- **Authentication**: Casdoor integration for user management
- **Token System**: Each user gets a unique drawing token
- **Color Palette**: Predefined colors plus custom color picker
- **Persistent Storage**: All drawings are saved to MongoDB

## Rules

- Each user can place one pixel at a time
- After placing a pixel, you must wait for the cooldown period before placing another
- The cooldown duration is configurable via `DRAW_DELAY_MS` environment variable
- Authentication is required to draw on the canvas

## Environment Variables

Create a `.env` file that looks like `.env.example` in the root directory with the following variables:

```ini
# Server Configuration
NODE_ENV=production
PORT=3000

# MongoDB Configuration
MONGO_URI=mongodb://localhost:27017/place

# Casdoor Authentication
CASDOOR_SERVER_URL=https://your-casdoor-instance.com
CASDOOR_CLIENT_ID=your_client_id
CASDOOR_CLIENT_SECRET=your_client_secret
CASDOOR_APP_NAME=your_app_name
CASDOOR_ORGANIZATION_NAME=your_organization

# Drawing Configuration
META_TITLE=DrawPlace
META_DESCRIPTION=Welcome to DrawPlace! Collaborate with art enthusiasts to create a masterpiece together!
DRAW_DELAY_MS=5000
DRAW_MAX_POINTS=24
CANVAS_WIDTH=620
CANVAS_HEIGHT=300
```

## Getting Started

### Prerequisites

- Node.js 20+ (for npm/pnpm installation)
- Docker and Docker Compose (for Docker installation)
- MongoDB instance (or use the provided Docker Compose setup)
- Casdoor instance for authentication

### Installation with NPM/PNPM

1. **Clone the repository**

   ```bash
   git clone https://github.com/HeZeBang/DrawingPlace.git
   cd DrawingPlace
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   # or
   npm install
   ```

3. **Configure environment variables**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Build the application**

   ```bash
   pnpm build
   # or
   npm run build
   ```

5. **Start the application**

   ```bash
   pnpm start
   # or
   npm start
   ```

6. **Development mode**
   ```bash
   pnpm dev
   # or
   npm run dev
   ```

The application will be available at `http://localhost:3000`

### Installation with Docker

#### Using Docker Compose (Recommended)

1. **Clone the repository**

   ```bash
   git clone https://github.com/HeZeBang/DrawingPlace.git
   cd DrawingPlace
   ```

2. **Configure environment variables**

   Create a `.env` file with your configuration or set environment variables directly:

   ```bash
   export CASDOOR_SERVER_URL=https://your-casdoor-instance.com
   export CASDOOR_CLIENT_ID=your_client_id
   export CASDOOR_CLIENT_SECRET=your_client_secret
   export CASDOOR_APP_NAME=your_app_name
   export CASDOOR_ORGANIZATION_NAME=your_organization
   ```

3. **Start with Docker Compose**

   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

   This will start both the application and MongoDB instance.

4. **Stop the services**
   ```bash
   docker-compose -f docker-compose.prod.yml down
   ```

#### Using Docker Build Directly

1. **Build the Docker image or pull from ghcr.io**

   You can get prebuilt image from [here](https://github.com/users/HeZeBang/packages/container/package/drawingplace).

   ```bash
   docker build -t drawingplace .
   ```

2. **Run the container**
   ```bash
   docker run -d \
     -p 3000:3000 \
     -e MONGO_URI=mongodb://your-mongo-host:27017/place \
     -e CASDOOR_SERVER_URL=https://your-casdoor-instance.com \
     -e CASDOOR_CLIENT_ID=your_client_id \
     -e CASDOOR_CLIENT_SECRET=your_client_secret \
     -e CASDOOR_APP_NAME=your_app_name \
     -e CASDOOR_ORGANIZATION_NAME=your_organization \
     -e DRAW_DELAY_MS=5000 \
     --name drawingplace \
     drawingplace
   ```

The application will be available at `http://localhost:3000`

## Technology Stack

- **Framework**: Next.js 16 (App Router)
- **Runtime**: Node.js 20
- **Database**: MongoDB 7.0
- **Authentication**: Casdoor
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI, shadcn/ui
- **Package Manager**: pnpm

## License

This project is open source and available under the MIT License.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Acknowledge

This project is based from [4074/DrawingPlace](https://github.com/4074/DrawingPlace), forked initially from [ShanghaitechGeekPie](https://github.com/ShanghaitechGeekPie) repo.
