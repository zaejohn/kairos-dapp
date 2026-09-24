"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { IChartApi } from "lightweight-charts";
import type { ToastKind } from "@/components/toast-viewport";
import {
  candleIntervals,
  fetchNightSpotCandles,
  type CandleInterval,
  type SpotCandle,
} from "@/lib/market/night-spot-data";

type FeedStatus = "loading" | "live" | "delayed" | "unavailable";
const intervalDurationMs: Record<CandleInterval, number> = {
  "1m": 60_000,
  "5m": 300_000,
  "15m": 900_000,
  "1h": 3_600_000,
  "4h": 14_400_000,
  "1d": 86_400_000,
};

function volumeBar(candle: SpotCandle) {
  return {
    time: candle.time,
    value: candle.volume,
    color: candle.close >= candle.open ? "#73be9a80" : "#e48b7280",
  };
}

export function NightMarketChart({ onNotify }: { onNotify: (kind: ToastKind, message: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [interval, setIntervalValue] = useState<CandleInterval>("15m");
  const [status, setStatus] = useState<FeedStatus>("loading");
  const [latestPrice, setLatestPrice] = useState<number | null>(null);
  const [refreshedAt, setRefreshedAt] = useState<number | null>(null);
  const reportedStatus = useRef<FeedStatus>("loading");

  const updateStatus = useCallback((next: FeedStatus) => {
    const previous = reportedStatus.current;
    reportedStatus.current = next;
    setStatus(next);
    if (next === previous) return;
    if (next === "unavailable") onNotify("error", "Binance Spot chart data is unavailable. Retrying automatically.");
    if (next === "delayed") onNotify("warning", "Binance Spot chart data is delayed. The displayed candles may be stale.");
    if (next === "live" && (previous === "delayed" || previous === "unavailable")) onNotify("success", "Binance Spot chart data is updating again.");
  }, [onNotify]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const controller = new AbortController();
    let stopped = false;
    let chart: IChartApi | null = null;
    let poller: ReturnType<typeof setInterval> | null = null;
    let inFlight = false;
    let initialized = false;
    let forceReload = false;
    let latestOpenTime = 0;
    let refreshWhenVisible: (() => void) | null = null;

    async function start() {
      const { CandlestickSeries, HistogramSeries, createChart } = await import("lightweight-charts");
      if (stopped || !container) return;

      chart = createChart(container, {
        autoSize: true,
        height: 370,
        layout: { background: { color: "#21170f" }, textColor: "#e4d0ad" },
        grid: { vertLines: { color: "#4e3824" }, horzLines: { color: "#4e3824" } },
        crosshair: { vertLine: { color: "#d6aa6a" }, horzLine: { color: "#d6aa6a" } },
        rightPriceScale: { borderColor: "#745334" },
        timeScale: { borderColor: "#745334", timeVisible: true, secondsVisible: false },
        localization: { priceFormatter: (price: number) => price.toFixed(6) },
      });
      chartRef.current = chart;
      const candles = chart.addSeries(CandlestickSeries, {
        upColor: "#73be9a",
        downColor: "#e48b72",
        borderVisible: false,
        wickUpColor: "#73be9a",
        wickDownColor: "#e48b72",
        priceFormat: { type: "price", precision: 6, minMove: 0.000001 },
      });
      candles.priceScale().applyOptions({ scaleMargins: { top: 0.08, bottom: 0.25 } });
      const volumes = chart.addSeries(HistogramSeries, {
        priceScaleId: "",
        priceFormat: { type: "volume" },
        lastValueVisible: false,
        priceLineVisible: false,
      });
      volumes.priceScale().applyOptions({ scaleMargins: { top: 0.78, bottom: 0 } });

      async function refresh() {
        if (stopped || inFlight || document.visibilityState === "hidden") return;
        inFlight = true;
        try {
          const firstLoad = !initialized;
          const history = !initialized || forceReload;
          const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(8_000)]);
          const values = await fetchNightSpotCandles(interval, history ? 240 : 2, signal);
          if (stopped) return;
          if (history) {
            candles.setData(values);
            volumes.setData(values.map(volumeBar));
            if (firstLoad) chart?.timeScale().fitContent();
            initialized = true;
            forceReload = false;
            latestOpenTime = values[values.length - 1]?.time ?? 0;
          } else {
            for (const candle of values) {
              if (candle.time < latestOpenTime) continue;
              candles.update(candle);
              volumes.update(volumeBar(candle));
              latestOpenTime = candle.time;
            }
          }
          const latest = values[values.length - 1];
          if (!latest) throw new Error("The market feed returned no candles.");
          setLatestPrice(latest.close);
          setRefreshedAt(Date.now());
          updateStatus(Date.now() - latest.time * 1000 <= intervalDurationMs[interval] + 30_000 ? "live" : "delayed");
        } catch {
          if (!stopped && !controller.signal.aborted) {
            updateStatus(initialized ? "delayed" : "unavailable");
          }
        } finally {
          inFlight = false;
        }
      }

      refreshWhenVisible = () => {
        if (document.visibilityState !== "visible") return;
        forceReload = true;
        void refresh();
      };

      document.addEventListener("visibilitychange", refreshWhenVisible);
      await refresh();
      if (stopped) return;
      poller = setInterval(() => void refresh(), 5_000);
    }

    void start().catch(() => {
      if (!stopped) updateStatus("unavailable");
    });
    return () => {
      stopped = true;
      controller.abort();
      if (poller) clearInterval(poller);
      if (refreshWhenVisible) document.removeEventListener("visibilitychange", refreshWhenVisible);
      chartRef.current = null;
      chart?.remove();
    };
  }, [interval, updateStatus]);

  function chooseInterval(value: CandleInterval) {
    if (value === interval) return;
    setLatestPrice(null);
    setRefreshedAt(null);
    updateStatus("loading");
    setIntervalValue(value);
  }

  return (
    <figure className="spot-chart" aria-label="Live NIGHT/USDT spot candlestick chart">
      <div className="spot-chart-heading">
        <div>
          <span className="section-index">EXTERNAL SPOT MARKET</span>
          <h3>NIGHT / USDT</h3>
          <p>Binance Spot · reference price in USDT per NIGHT</p>
        </div>
        <div className="spot-chart-quote">
          <strong>{latestPrice === null ? "—" : latestPrice.toFixed(6)}</strong>
          <span>{status === "live" ? "LIVE · 5s REFRESH" : status === "delayed" ? "FEED DELAYED" : status === "loading" ? "LOADING" : "FEED UNAVAILABLE"}</span>
        </div>
      </div>
      <div className="spot-chart-controls" role="group" aria-label="Candlestick interval">
        {candleIntervals.map((value) => (
          <button key={value} type="button" aria-pressed={interval === value} onClick={() => chooseInterval(value)}>
            {value}
          </button>
        ))}
        <button type="button" disabled={latestPrice === null} onClick={() => chartRef.current?.timeScale().scrollToRealTime()}>
          Latest
        </button>
      </div>
      <div className="spot-chart-surface">
        <div ref={containerRef} className="spot-chart-canvas" aria-label="Interactive Binance Spot candles and volume" />
        {status === "loading" && <div className="spot-chart-overlay" aria-hidden="true"><span className="spot-chart-loader" /></div>}
      </div>
      <figcaption>
        {refreshedAt !== null && <span>Last refreshed {new Date(refreshedAt).toLocaleTimeString()} · </span>}
        External NIGHT spot prices do not set Kairos Quote A/B rates, which are fixed at 1:1 NIGHT before fees. Market data: <a href="https://www.binance.com/en/trade/NIGHT_USDT?type=spot" target="_blank" rel="noopener noreferrer">Binance Spot</a>. Charting: <a href="https://www.tradingview.com/" target="_blank" rel="noopener noreferrer">TradingView Lightweight Charts™</a> © 2025 TradingView, Inc.
      </figcaption>
    </figure>
  );
}
