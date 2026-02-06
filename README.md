# Perpetual DEX Funding Rate Dashboard

Real-time funding rate aggregator for 11 perpetual DEX exchanges.

## Features

- Real-time funding rates from 11 exchanges
- Cross-exchange arbitrage opportunity detection
- Historical rate charts
- Filtering by exchange and token
- Dark theme trading dashboard UI

## Supported Exchanges

| Exchange | Auth Required | Status |
|----------|---------------|--------|
| Hyperliquid | No | Public |
| dYdX v4 | No | Public |
| GMX | No | Public |
| Paradex | No | Public |
| MYX Finance | No | Public |
| Jupiter Perps | No | Public |
| Lighter | Yes | Requires API key |
| Aster (SynFutures) | Yes | Requires API key |
| Variational | Yes | Requires API key |
| EdgeX | Yes | Requires API key |
| GRVT | Yes | Requires API key |

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 8+
- Docker (for PostgreSQL + Redis)

### Setup

1. Install dependencies:
```bash
pnpm install
```

2. Start the database and Redis:
```bash
docker-compose up -d
```

3. Build shared types:
```bash
pnpm --filter @funding-dashboard/shared build
```

4. Start the backend:
```bash
pnpm dev:backend
```

5. Start the frontend (in another terminal):
```bash
pnpm dev:frontend
```

6. Open http://localhost:3000

## Configuration

Copy `.env.example` to `.env` and configure:

```bash
# Required for authenticated exchanges (optional)
LIGHTER_API_KEY=your_key
ASTER_API_KEY=your_key
ASTER_API_SECRET=your_secret
# ... etc
```

The dashboard works with public exchanges only if no API keys are configured.

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/funding-rates/current` | Current funding rates (with filtering) |
| `GET /api/funding-rates/historical` | Historical rates for a symbol |
| `GET /api/funding-rates/summary` | Summary statistics |
| `GET /api/funding-rates/arbitrage` | Arbitrage opportunities |
| `GET /api/exchanges` | List of exchanges and status |
| `GET /health` | Health check |

### Query Parameters

`/api/funding-rates/current` supports:
- `exchanges` - Comma-separated exchange IDs
- `symbols` - Comma-separated symbols
- `search` - Search term
- `sortBy` - fundingRate, fundingRateAnnualized, symbol, exchange
- `sortOrder` - asc, desc
- `page`, `limit` - Pagination

## Architecture

```
packages/
├── shared/          # Shared types and utilities
├── backend/         # Fastify API server
│   ├── exchanges/   # Exchange adapters
│   ├── services/    # Business logic
│   ├── routes/      # API routes
│   └── jobs/        # Background jobs (BullMQ)
└── frontend/        # Next.js dashboard
    ├── components/  # React components
    ├── hooks/       # React Query hooks
    └── lib/         # Utilities
```

## Development

```bash
# Run all in development mode
pnpm dev

# Run specific package
pnpm dev:backend
pnpm dev:frontend

# Build all
pnpm build

# Check database
docker exec -it funding-rates-db psql -U postgres -d funding_rates
```

## Tech Stack

- **Backend**: Node.js, Fastify, TypeScript, BullMQ
- **Database**: PostgreSQL 16 + TimescaleDB
- **Cache**: Redis 7
- **Frontend**: Next.js 14, TanStack Query, Tailwind CSS, Recharts
