# Finowl AI Assistant

An AI assistant that provides cryptocurrency market analysis based on Finowl market summaries.

## Project Structure

The project is organized following Go best practices with a clear separation of concerns:

```
finowl-ai-assistant/
├── ai/                  # AI client and analyzer logic
├── cmd/                 # Application entry points
│   └── server/          # HTTP server
├── config/              # Configuration files (prompts, etc.)
│   └── prompts/         # AI prompt templates
├── feedstock/           # Finowl API client for retrieving market data
├── internal/            # Private application packages
│   ├── app/             # Application container and initialization
│   ├── config/          # Centralized configuration management
│   └── handlers/        # HTTP request handlers
├── .env.example         # Example environment variables
└── go.mod               # Go module definition
```

## Getting Started

### Prerequisites

- Go 1.18 or higher
- Access to Finowl API
- DeepSeek API key (optional - uses mock responses if not provided)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/finowl-ai-assistant.git
   cd finowl-ai-assistant
   ```

2. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

3. Edit the `.env` file to add your configuration values:
   - Set `FINOWL_API_BASE_URL` to your Finowl API endpoint
   - Set `FINOWL_AI_API_KEY` to your DeepSeek API key (if available)

4. Build the application:
   ```bash
   go build -o finowl-assistant ./cmd/server
   ```

### Running the Server

```bash
./finowl-assistant
```

Or use Go directly:

```bash
go run cmd/server/main.go
```

The server will start at http://localhost:8080 (or the port specified in your .env file).

## API Endpoints

- **GET /health** - Health check endpoint
- **POST /analyze** - Analyze crypto market based on a question
  - Body: `{ "question": "What is the current sentiment for Bitcoin?" }`
- **POST /register** - Register a user with the NEAR blockchain
- **POST /create-conversation** - Create a new conversation

## NEAR Wallet Integration

This project now includes a wallet adapter for frontend integrations with the NEAR blockchain. Instead of requiring user private keys to be sent to the backend (which is a security risk), your frontend can use the wallet integration to:

1. Authenticate users via their NEAR wallet
2. Sign transactions directly in the user's wallet
3. Manage user tokens securely

### Wallet Integration Endpoints

The following endpoints are available for wallet integration:

- `POST /api/wallet/check-user-request` - Generate a transaction request for checking/registering a user
- `POST /api/wallet/grant-free-tokens-request` - Generate a transaction request for claiming free tokens
- `POST /api/wallet/start-conversation-request` - Generate a transaction request for starting a conversation
- `POST /api/wallet/store-message-request` - Generate a transaction request for storing a message
- `POST /api/wallet/add-tokens-request` - Generate a transaction request for adding tokens to a conversation
- `POST /api/wallet/refund-tokens-request` - Generate a transaction request for refunding unused tokens
- `GET /api/wallet/callback` - Handle wallet redirects and transaction verification

### Example Frontend Integration

Check out the [`examples/frontend`](examples/frontend) directory for a complete React component example that demonstrates how to integrate your frontend with the wallet adapter.

## Features

- **AI Market Analysis:** The app automatically analyzes market-related questions and provides investment insights.
  - When a user sends a message containing crypto-related keywords (like "token", "buy", "market"), the system detects this and triggers AI analysis.
  - The analysis provides market sentiment, investment decisions, and top tokens to consider.
  - Results are stored in the conversation history for easy reference.

## Configuration

The application uses a dual configuration system:

1. **Network Configuration (via flags):**
   The network-specific configuration (NEAR contract, RPC URLs, etc.) is controlled through the `-network` flag:

   ```bash
   # For testnet (default)
   go run cmd/server/main.go

   # For mainnet
   go run cmd/server/main.go -network mainnet
   ```

2. **Application Configuration (via .env):**
   Non-network related settings (AI API keys, server port, etc.) are loaded from the `.env` file. Copy `.env.example` to `.env` and update the values:

   ```bash
   cp .env.example .env
   ```

   Example `.env` file:
   ```
   # Server
   PORT=8080

   # AI
   FINOWL_AI_API_KEY=your-deepseek-api-key
   FINOWL_AI_ENDPOINT=https://api.deepseek.com/v1/chat/completions
   FINOWL_AI_MODEL=deepseek-reasoner

   # Feedstock
   FINOWL_API_BASE_URL=https://finowl.finance/api/v0
   FINOWL_SUMMARY_PATH=/summary
   FINOWL_HTTP_TIMEOUT=120
   FINOWL_SUMMARY_COUNT=50
   ```

### Development Mode

If no AI API key is provided, the application will run in development mode using a mock AI client that returns predefined responses.

### Private Keys

To use NEAR blockchain functionality, you need to provide a private key for the appropriate network. There are two ways to do this:

1. **Using environment variables:**
   ```bash
   export NEAR_PRIVATE_KEY="your-private-key"
   go run cmd/server/main.go -network testnet
   ```

2. **Using key files:**
   Create files in the `config/keys` directory:
   - `testnet.key` - Contains the private key for testnet
   - `mainnet.key` - Contains the private key for mainnet

Key files should contain only the private key, with no additional formatting or newlines.

### Security Notes

- Never commit private keys to version control
- Keep your private keys secure and restrict access to them
- Consider using a key management service for production environments
- Regularly rotate your private keys
- Use different keys for testnet and mainnet

### Network Configuration Details

Based on the selected network, the following configuration is automatically set:

| Configuration     | Testnet                      | Mainnet                   |
|-------------------|------------------------------|---------------------------|
| Contract Name     | finowl.testnet               | finowl.near               |
| Owner Account ID  | finowl.testnet               | finowl.near               |
| RPC URL           | https://rpc.testnet.near.org | https://rpc.mainnet.near.org |
| Explorer URL      | https://explorer.testnet.near.org | https://explorer.near.org |
| Wallet URL        | https://wallet.testnet.near.org | https://wallet.near.org |

You only need to provide the private key corresponding to the owner account for the selected network.

## License

[MIT](LICENSE) 