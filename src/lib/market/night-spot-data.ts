import type { CandlestickData, UTCTimestamp } from "lightweight-charts";

export const NIGHT_SPOT_SYMBOL = "NIGHTUSDT";
export const candleIntervals = ["1m", "5m", "15m", "1h", "4h", "1d"] as const;
export type CandleInterval = (typeof candleIntervals)[number];

export type SpotCandle = CandlestickData<UTCTimestamp> & { volume: number };

function positivePrice(value: unknown): number {
  if (typeof value !== "string" || !/^\d+(?:\.\d+)?$/.test(value)) {
    throw new Error("The market feed returned an invalid price.");
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error("The market feed returned an invalid price.");
  }
  return parsed;
}

export function parseSpotCandles(payload: unknown): SpotCandle[] {
  if (!Array.isArray(payload) || payload.length === 0) {
    throw new Error("The market feed returned no candles.");
  }
  let previousTime = 0;
  return payload.map((row: unknown) => {
    if (!Array.isArray(row) || row.length < 6 ||
      typeof row[0] !== "number" || !Number.isSafeInteger(row[0]) || row[0] <= 0) {
      throw new Error("The market feed returned an invalid candle.");
    }
    const time = Math.floor(row[0] / 1000) as UTCTimestamp;
    const open = positivePrice(row[1]);
    const high = positivePrice(row[2]);
    const low = positivePrice(row[3]);
    const close = positivePrice(row[4]);
    const volume = Number(row[5]);
    if (time <= previousTime || low > Math.min(open, close) ||
      high < Math.max(open, close) || high < low ||
      typeof row[5] !== "string" || !/^\d+(?:\.\d+)?$/.test(row[5]) ||
      !Number.isFinite(volume) || volume < 0) {
      throw new Error("The market feed returned an invalid candle.");
    }
    previousTime = time;
    return { time, open, high, low, close, volume };
  });
}

export async function fetchNightSpotCandles(
  interval: CandleInterval,
  limit: 2 | 240,
  signal: AbortSignal,
): Promise<SpotCandle[]> {
  const params = new URLSearchParams({
    symbol: NIGHT_SPOT_SYMBOL,
    interval,
    limit: String(limit),
  });
  const response = await fetch(
    `https://data-api.binance.vision/api/v3/klines?${params}`,
    { cache: "no-store", signal },
  );
  if (!response.ok) {
    throw new Error(`Binance Spot market data is unavailable (${response.status}).`);
  }
  return parseSpotCandles(await response.json() as unknown);
}
