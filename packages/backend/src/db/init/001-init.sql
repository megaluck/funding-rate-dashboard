-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Exchanges reference table
CREATE TABLE IF NOT EXISTS exchanges (
    id SERIAL PRIMARY KEY,
    exchange_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    api_url VARCHAR(255),
    auth_required BOOLEAN DEFAULT false,
    funding_interval INTEGER NOT NULL, -- in hours
    enabled BOOLEAN DEFAULT true,
    chain VARCHAR(50),
    website VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default exchanges
INSERT INTO exchanges (exchange_id, name, api_url, auth_required, funding_interval, chain, website) VALUES
    ('hyperliquid', 'Hyperliquid', 'https://api.hyperliquid.xyz', false, 1, 'Hyperliquid L1', 'https://hyperliquid.xyz'),
    ('dydx', 'dYdX v4', 'https://indexer.v4mainnet.dydx.exchange', false, 8, 'dYdX Chain', 'https://dydx.exchange'),
    ('gmx', 'GMX', 'https://arbitrum-api.gmxinfra.io', false, 1, 'Arbitrum', 'https://gmx.io'),
    ('paradex', 'Paradex', 'wss://streaming.prod.paradex.trade', false, 8, 'Starknet', 'https://paradex.trade'),
    ('lighter', 'Lighter', 'https://mainnet.zklighter.elliot.ai', true, 1, 'zkSync', 'https://lighter.xyz'),
    ('aster', 'Aster (SynFutures)', 'https://fapi.asterdex.com', true, 8, 'Multiple', 'https://asterdex.com'),
    ('variational', 'Variational', 'https://api.variational.io', true, 1, 'Ethereum', 'https://variational.io'),
    ('edgex', 'EdgeX', 'https://api.edgex.exchange', true, 8, 'Multiple', 'https://edgex.exchange'),
    ('grvt', 'GRVT', 'https://api.grvt.io', true, 8, 'zkSync', 'https://grvt.io'),
    ('myx', 'MYX Finance', 'https://api.myx.finance', false, 8, 'Arbitrum', 'https://myx.finance'),
    ('jupiter', 'Jupiter Perps', 'https://api.mainnet-beta.solana.com', false, 1, 'Solana', 'https://jup.ag/perps')
ON CONFLICT (exchange_id) DO NOTHING;

-- Funding rates hypertable
CREATE TABLE IF NOT EXISTS funding_rates (
    time TIMESTAMPTZ NOT NULL,
    exchange_id VARCHAR(50) NOT NULL,
    symbol VARCHAR(50) NOT NULL,
    raw_symbol VARCHAR(100),
    funding_rate DECIMAL(20, 10) NOT NULL,
    funding_rate_annualized DECIMAL(20, 6),
    next_funding_time TIMESTAMPTZ,
    mark_price DECIMAL(30, 10),
    index_price DECIMAL(30, 10),
    open_interest DECIMAL(30, 10),
    volume_24h DECIMAL(30, 10),
    CONSTRAINT funding_rates_pkey PRIMARY KEY (time, exchange_id, symbol)
);

-- Convert to hypertable
SELECT create_hypertable('funding_rates', 'time', if_not_exists => TRUE);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_funding_rates_exchange ON funding_rates (exchange_id, time DESC);
CREATE INDEX IF NOT EXISTS idx_funding_rates_symbol ON funding_rates (symbol, time DESC);
CREATE INDEX IF NOT EXISTS idx_funding_rates_exchange_symbol ON funding_rates (exchange_id, symbol, time DESC);

-- Latest funding rates view (most recent rate per exchange/symbol)
CREATE OR REPLACE VIEW latest_funding_rates AS
SELECT DISTINCT ON (exchange_id, symbol)
    time,
    exchange_id,
    symbol,
    raw_symbol,
    funding_rate,
    funding_rate_annualized,
    next_funding_time,
    mark_price,
    index_price,
    open_interest,
    volume_24h
FROM funding_rates
ORDER BY exchange_id, symbol, time DESC;

-- Fetch status tracking
CREATE TABLE IF NOT EXISTS fetch_status (
    exchange_id VARCHAR(50) PRIMARY KEY,
    last_fetch_time TIMESTAMPTZ,
    last_success_time TIMESTAMPTZ,
    last_error TEXT,
    rate_count INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'unknown'
);

-- Insert initial fetch status
INSERT INTO fetch_status (exchange_id, status)
SELECT exchange_id, 'pending'
FROM exchanges
ON CONFLICT (exchange_id) DO NOTHING;

-- Compression policy (compress data older than 7 days)
-- This is optional for production to save storage
-- SELECT add_compression_policy('funding_rates', INTERVAL '7 days', if_not_exists => TRUE);

-- Retention policy (keep data for 30 days)
-- SELECT add_retention_policy('funding_rates', INTERVAL '30 days', if_not_exists => TRUE);
