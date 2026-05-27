CREATE TABLE IF NOT EXISTS transfer_events (
  id              BIGSERIAL PRIMARY KEY,
  block_number    BIGINT NOT NULL,
  block_timestamp TIMESTAMPTZ NOT NULL,
  tx_hash         TEXT NOT NULL,
  log_index       INT NOT NULL,
  from_address    TEXT NOT NULL,
  to_address      TEXT NOT NULL,
  amount          NUMERIC(78, 0) NOT NULL,
  UNIQUE (tx_hash, log_index)
);

CREATE INDEX IF NOT EXISTS idx_transfer_from
  ON transfer_events(from_address);
CREATE INDEX IF NOT EXISTS idx_transfer_to
  ON transfer_events(to_address);

CREATE TABLE IF NOT EXISTS balance_snapshots (
  id              BIGSERIAL PRIMARY KEY,
  wallet          TEXT NOT NULL,
  block_number    BIGINT NOT NULL,
  block_timestamp TIMESTAMPTZ NOT NULL,
  balance         NUMERIC(78, 0) NOT NULL,
  UNIQUE (wallet, block_number, id)
);

CREATE INDEX IF NOT EXISTS idx_snapshot_wallet
  ON balance_snapshots(wallet, block_timestamp);

CREATE TABLE IF NOT EXISTS wallet_aggregates (
  wallet                TEXT PRIMARY KEY,
  first_deposit_at      TIMESTAMPTZ,
  last_updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_balance       NUMERIC(78,0) NOT NULL DEFAULT 0,
  peak_balance          NUMERIC(78,0) NOT NULL DEFAULT 0,
  total_days_holding    NUMERIC(12,4) NOT NULL DEFAULT 0,
  time_weighted_balance NUMERIC(30,4) NOT NULL DEFAULT 0,
  longest_streak_days   NUMERIC(12,4) NOT NULL DEFAULT 0,
  exit_count            INT NOT NULL DEFAULT 0,
  conviction_score      NUMERIC(8,4) NOT NULL DEFAULT 0,
  percentile_rank       NUMERIC(5,2),
  traits                JSONB NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS indexer_state (
  id         INT PRIMARY KEY DEFAULT 1,
  last_block BIGINT NOT NULL DEFAULT 0
);

INSERT INTO indexer_state VALUES (1, 0)
  ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS claims (
  wallet         TEXT PRIMARY KEY,
  amount         NUMERIC(78, 0) NOT NULL,
  tx_hash        TEXT,
  status         TEXT NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  broadcast_at   TIMESTAMPTZ,
  confirmed_at   TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status);