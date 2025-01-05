# Finowl: Your Autonomous AI Financial Advisor

## Overview

Finowl is a cutting-edge financial analysis tool designed to help investors manage their investments effectively and autonomously. By eliminating emotional biases and providing disciplined, data-driven strategies, Finowl empowers users to achieve their financial goals while adapting to market dynamics in real-time.

## Problem Statement

Investors worldwide face critical challenges in managing their investments, including:

- **Emotional Decision-Making**: Panic-selling during downturns or impulsive buying during bull runs often leads to losses.
- **Information Overload**: The constant influx of financial news and market noise makes it difficult to separate actionable insights from distractions.
- **Lack of Access**: Many retail investors lack access to professional financial advisors or the technical know-how to build effective strategies.

## Solution

Finowl addresses these issues by offering a fully autonomous AI financial advisor that provides:

- **Real-Time Strategy Assistance**: Monitors market trends and analyzes news to help users craft personalized investment strategies.
- **Emotion-Free Execution**: Executes agreed-upon strategies autonomously, preventing impulsive changes.
- **Continuous Optimization**: Retrains using the latest market data to ensure strategies remain effective.

## How It Works

Finowl’s workflow is intuitive and accessible to investors at all levels:

1. **User Input**: Users provide their financial goals, risk tolerance, and investment horizon.
2. **AI Analysis**: The AI scans millions of data points to identify opportunities and risks.
3. **Strategy Assistance**: Finowl suggests a detailed strategy based on the analysis.
4. **Autonomous Execution**: The AI executes the strategy using blockchain-integrated smart contracts.
5. **Continuous Monitoring**: The AI adapts to market shifts and notifies users of necessary adjustments.

## Project Structure

### Directories

- **LICENSE**: Licensing information for the project.
- **README.md**: This documentation file.
- **contract-ts**: TypeScript Smart contracts.
- **finowl-backend**: The backend service for data processing and API management.
- **frontend**: The user interface for data visualization and interaction.
- **package-lock.json**: Dependency management for the frontend application.

## Backend Setup

The backend is built using Go and utilizes PostgreSQL for data storage. The backend service is containerized using Docker for easy deployment.

### Docker Compose

To run the backend service, use the provided `docker-compose.yml` file

### Environment Variables

The backend service requires the following environment variables:

- `FINOWL_DB_HOST`: Hostname of the database service (default: `db`).
- `FINOWL_DB_PORT`: Port for the database connection (default: `5432`).
- `FINOWL_DB_USER`: Username for the database (default: `finowl_user`).
- `FINOWL_DB_PASSWORD`: Password for the database (default: `finowl_pass`).
- `FINOWL_DB_NAME`: Name of the database (default: `finowl_db`).

### Running the Backend

To start the backend service, navigate to the `finowl-backend` directory and run:
````docker-compose up --build```


### Running Unit Tests

Unit tests can be run to ensure the functionality of the backend. To execute the tests, use the following command:
````go test ./...```


## Conclusion

Finowl is designed to empower investors by providing a disciplined, data-driven approach to investment management. With its autonomous AI capabilities, users can navigate the complexities of the financial markets with confidence.

For more information, please refer to the documentation or contact the development team.