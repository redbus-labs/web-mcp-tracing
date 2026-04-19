# Local End-to-End Testing Guide

This guide explains how to spin up the WebMCP Telemetry project locally, generate test data using the demo application, and visualize the telemetry data on the dashboard.

## Prerequisites

Ensure you have the following installed on your local machine:
- **Node.js** (v18 or higher)
- **npm** (v8 or higher)
- **Docker** & **Docker Compose** (Ensure the Docker daemon is running)

## 1. Start the Database Infrastructure

The telemetry backend requires a PostgreSQL database. We use Docker to spin one up instantly.

1. Open your terminal in the root directory of the project.
2. Run the following command to start the PostgreSQL container in the background:
   ```bash
   docker-compose up -d
   ```
3. This spins up a PostgreSQL 15 database on `localhost:5432` with the database `webmcp_telemetry`.

## 2. Configure Environment Variables

The Node.js backend (`packages/server`) needs to know how to connect to the database.

1. Navigate to the `packages/server` directory.
2. Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```
   *(The default credentials match the Docker Compose setup exactly).*

## 3. Install Dependencies & Build

Install the dependencies for the entire workspace and build the shared packages (specifically the `browser-sdk`).

1. From the **root** of the project, run:
   ```bash
   npm install
   ```
2. Build the workspace (this compiles the SDK so the demo app can use it):
   ```bash
   npm run build
   ```

## 4. Initialize the Database Schema

Before sending data, we need to create the tables in the PostgreSQL database using Prisma.

1. From the **root** directory, run:
   ```bash
   cd packages/server
   npx prisma db push
   ```
   *(This applies the schema to the running Docker database).*

## 5. Start the Development Servers

Now, start all the applications (the backend collector, the UI dashboard, and the demo app).

1. Open a new terminal at the **root** of the project.
2. Run the development script:
   ```bash
   npm run dev
   ```
   
This command boots up three things simultaneously:
- **Node.js Backend**: `http://localhost:3001` (API Collector)
- **React Dashboard UI**: `http://localhost:5173`
- **Demo Web Application**: `http://localhost:8080`

## 6. Run the End-to-End Test

1. Open your browser and navigate to the **Demo App**: [http://localhost:8080](http://localhost:8080)
2. You will see a UI with buttons simulating LLM tool executions. Click the buttons to trigger the simulated WebMCP tools:
   - **Trigger get_weather**: Tests standard HTTP tracking and success states.
   - **Trigger calculate_shipping**: Tests execution duration tracking.
   - **Trigger book_flight**: Tests error handling and 404 network traces.
3. Keep an eye on the UI logs; you should see the execution feedback. Behind the scenes, the SDK is batching and sending telemetry to the backend.

## 7. View the Telemetry Dashboard

1. Open a new tab and navigate to the **Dashboard UI**: [http://localhost:5173](http://localhost:5173)
2. You should see real-time data populated from your actions in the demo app!
   - Check the **Top Tools Used**.
   - Review the **Recent Executions** to see the exact `user_query`, duration, and downstream API traces.
   - If you clicked the `book_flight` tool, you should see a flagged error with the exact failure message.

## Troubleshooting

- **Database Connection Error**: Double-check that Docker Desktop is running and `docker-compose ps` shows the `postgres` container as `Up`.
- **SDK Not Found Error in Demo**: Ensure you ran `npm run build` at the root so the `packages/browser-sdk/dist/webmcp-telemetry.min.js` file is generated.
- **Tools not showing up immediately**: The SDK batches events and sends them periodically. Wait ~5 seconds or refresh the demo page to force a flush before checking the dashboard.