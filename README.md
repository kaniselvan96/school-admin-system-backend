# School Administration System Backend

## Overview

This project is a REST API for a school administration system. It provides endpoints for health checks, uploading data, managing classes and students, and generating reports. The API stores its data in MySQL through Sequelize and is designed to support local development with Docker.

## Node.js Version

Node.js v24.14.1.

## Libraries Used

- Runtime: Express, Sequelize, mysql2, multer, csv-parser, dotenv, cors, compression, body-parser, winston, zod, axios, http-status-codes.

## Testing Stack

- Testing: Jest, ts-jest, Supertest, @types/jest, @types/supertest.

## Run Locally

1. `cd typescript`
2. `npm install`
3. `npm run start:services` to start MySQL and the helper service
4. `npm start` to launch the API at `http://localhost:3000`
5. `npm run start:dev` for automatic restarts

## Run Tests

From the `typescript` directory:

```bash
npm test
```

This runs the Jest test suite.

## Basic Behavior

The API is organized around a small set of school administration features:

- `/api/healthcheck` confirms the service is running
- Class API updates a class name by class code
- Student API returns paginated students for a class, merging internal and external records
- Report API generates teacher workload summaries
- Upload API imports CSV data into teachers, students, classes, subjects, and their links

Default local MySQL settings:

- host: `localhost`
- port: `33306`
- database: `school-administration-system`
- user: `root`
- password: `password`
