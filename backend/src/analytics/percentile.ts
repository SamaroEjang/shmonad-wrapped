import { db } from '../db/client';

export async function computeAndStorePercentiles() {
  console.log('Computing percentile ranks...');
  await db.query(`
    UPDATE wallet_aggregates wa
    SET percentile_rank = sub.percentile
    FROM (
      SELECT wallet,
        ROUND(PERCENT_RANK() OVER (ORDER BY conviction_score ASC) * 100, 2) AS percentile
      FROM wallet_aggregates
      WHERE conviction_score > 0
    ) sub
    WHERE wa.wallet = sub.wallet
  `);
  console.log('Percentile ranks updated.');
}