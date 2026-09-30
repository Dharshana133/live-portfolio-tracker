import { useState, useEffect } from "react";
import { priceService, watchlistService, transactionService } from "../services/api";

export function StockExplorer({ initialTicker = "RELIANCE", user, onRequireAuth }) {
  const [ticker, setTicker] = useState(initialTicker);
  const [inputSymbol, setInputSymbol] = useState(initialTicker);
  const [details, setDetails] = useState(null);
  const [history, setHistory] = useState(null);
  const [period, setPeriod] = useState("1m");
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const [error, setError] = useState(null);
  const [msg, setMsg] = useState(null);

  // Quick transaction modal state inside explorer
  const [showAddTx, setShowAddTx] = useState(false);
  const [txType, setTxType] = useState("BUY");
  const [txShares, setTxShares] = useState(10);
  const [txPrice, setTxPrice] = useState(0);

  useEffect(() => {
    fetchStockData(ticker, period);
  }, [ticker]);

  useEffect(() => {
    if (ticker) {
      fetchChartHistory(ticker, period);
    }
  }, [period]);

  const fetchStockData = async (symbolToFetch, chartPeriod) => {
    setLoading(true);
    setError(null);
    try {
      const data = await priceService.getDetails(symbolToFetch);
      setDetails(data);
      setTxPrice(data.price || 0);
      await fetchChartHistory(symbolToFetch, chartPeriod);
    } catch (err) {
      console.error(err);
      setError(`Unable to fetch live stock data for "${symbolToFetch}". Please check symbol.`);
    } finally {
      setLoading(false);
    }
  };

  const fetchChartHistory = async (symbolToFetch, chartPeriod) => {
    setChartLoading(true);
    try {
      const histData = await priceService.getHistory(symbolToFetch, chartPeriod);
      setHistory(histData.history || []);
    } catch (err) {
      console.error(err);
    } finally {
      setChartLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (inputSymbol.trim()) {
      setTicker(inputSymbol.trim().toUpperCase());
    }
  };

  const handleAddToWatchlist = async () => {
    if (!user) {
      onRequireAuth();
      return;
    }
    try {
      await watchlistService.addWatchlist(ticker);
      setMsg(`Added ${ticker} to your watchlist! ⭐`);
      setTimeout(() => setMsg(null), 3000);
    } catch (err) {
      const detail = err.response?.data?.detail || "Failed to add to watchlist";
      setMsg(`⚠️ ${detail}`);
      setTimeout(() => setMsg(null), 3000);
    }
  };

  const handleCreateTransaction = async (e) => {
    e.preventDefault();
    if (!user) {
      onRequireAuth();
      return;
    }
    try {
      await transactionService.addTransaction({
        ticker: ticker,
        type: txType,
        quantity: parseFloat(txShares),
        shares: parseFloat(txShares),
        price: parseFloat(txPrice),
      });
      setMsg(`Recorded ${txType} transaction for ${txShares} shares of ${ticker}! 💼`);
      setShowAddTx(false);
      setTimeout(() => setMsg(null), 4000);
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.detail || "Failed to save transaction.";
      alert(`Failed to add transaction: ${typeof detail === 'object' ? JSON.stringify(detail) : detail}`);
    }
  };

  // Helper to format market cap
  const formatNum = (num) => {
    if (!num) return "N/A";
    if (num >= 1e12) return `₹${(num / 1e12).toFixed(2)} Trillion`;
    if (num >= 1e9) return `₹${(num / 1e9).toFixed(2)} Billion`;
    if (num >= 1e7) return `₹${(num / 1e7).toFixed(2)} Cr`;
    if (num >= 1e5) return `₹${(num / 1e5).toFixed(2)} Lakh`;
    return `₹${num.toLocaleString()}`;
  };

  // SVG Chart rendering calculations
  const renderSvgChart = () => {
    if (!history || history.length === 0) {
      return (
        <div style={{ height: "240px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-dim)" }}>
          No chart historical points available for this period.
        </div>
      );
    }

    const prices = history.map((h) => h.close);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const range = maxPrice - minPrice || 1;

    const width = 800;
    const height = 240;
    const padding = 20;

    const points = history.map((h, index) => {
      const x = padding + (index / (history.length - 1 || 1)) * (width - padding * 2);
      const y = height - padding - ((h.close - minPrice) / range) * (height - padding * 2);
      return `${x},${y}`;
    }).join(" ");

    const isPositive = prices[prices.length - 1] >= prices[0];
    const strokeColor = isPositive ? "var(--gain)" : "var(--loss)";
    const fillColor = isPositive ? "rgba(16, 185, 129, 0.15)" : "rgba(244, 63, 94, 0.15)";

    const areaPoints = `${padding},${height - padding} ${points} ${width - padding},${height - padding}`;

    return (
      <div style={{ width: "100%", overflowX: "auto" }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "240px", overflow: "visible" }}>
          {/* Gradient Fill */}
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.3" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Area Fill */}
          <polygon points={areaPoints} fill="url(#chartGradient)" />

          {/* Price Line */}
          <polyline
            fill="none"
            stroke={strokeColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />
        </svg>

        {/* X Axis Labels preview */}
        <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-dim)", fontSize: "0.75rem", marginTop: "0.5rem" }}>
          <span>{history[0]?.date}</span>
          <span>{history[Math.floor(history.length / 2)]?.date}</span>
          <span>{history[history.length - 1]?.date}</span>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Search Header Bar */}
      <div className="glass-card" style={{ padding: "1.25rem 1.75rem" }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
          <form onSubmit={handleSearchSubmit} style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1, minWidth: "280px" }}>
            <input
              type="text"
              className="glass-input"
              style={{ flex: 1, fontSize: "1.05rem", padding: "0.7rem 1.1rem" }}
              placeholder="Search symbol (e.g. RELIANCE, TCS, AAPL, TSLA)..."
              value={inputSymbol}
              onChange={(e) => setInputSymbol(e.target.value)}
            />
            <button type="submit" className="btn-primary" style={{ padding: "0.75rem 1.4rem" }}>
              🔍 Search Stock
            </button>
          </form>

          {/* Popular Tickers Quick Chips */}
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.4rem" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-dim)", fontWeight: 600 }}>Popular:</span>
            {["RELIANCE", "TCS", "INFY", "HDFCBANK", "TATAMOTORS", "AAPL", "NVDA"].map((sym) => (
              <button
                key={sym}
                onClick={() => { setTicker(sym); setInputSymbol(sym); }}
                style={{
                  background: ticker === sym ? "var(--primary-glow)" : "rgba(255, 255, 255, 0.05)",
                  border: ticker === sym ? "1px solid var(--primary)" : "1px solid var(--bg-card-border)",
                  color: ticker === sym ? "#fff" : "var(--text-muted)",
                  padding: "0.25rem 0.65rem",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                {sym}
              </button>
            ))}
          </div>
        </div>
      </div>

      {msg && (
        <div className="animate-fade-in" style={{
          background: msg.includes("⚠️") ? "rgba(244, 63, 94, 0.15)" : "var(--gain-bg)",
          border: `1px solid ${msg.includes("⚠️") ? "var(--loss-border)" : "var(--gain-border)"}`,
          color: msg.includes("⚠️") ? "#fca5a5" : "var(--gain)",
          padding: "0.85rem 1.25rem",
          borderRadius: "var(--radius-md)",
          fontWeight: 600,
          fontSize: "0.9rem"
        }}>
          {msg}
        </div>
      )}

      {loading ? (
        <div className="glass-card" style={{ padding: "4rem", textAlign: "center" }}>
          <div className="spinner" style={{ margin: "0 auto 1rem auto", width: "36px", height: "36px" }} />
          <p style={{ color: "var(--text-muted)" }}>Loading real-time yfinance stock details for {ticker}...</p>
        </div>
      ) : error ? (
        <div className="glass-card" style={{ padding: "3rem", textAlign: "center" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>⚠️</div>
          <h3 style={{ color: "#fca5a5", marginBottom: "0.5rem" }}>Stock Lookup Error</h3>
          <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>{error}</p>
          <button onClick={() => { setTicker("RELIANCE"); setInputSymbol("RELIANCE"); }} className="btn-secondary">
            Reset to RELIANCE
          </button>
        </div>
      ) : details && (
        <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Main Stock Card Header */}
          <div className="glass-card" style={{ padding: "1.75rem 2rem" }}>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: "1.5rem" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.4rem" }}>
                  <h1 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
                    {details.company_name}
                  </h1>
                  <span className="badge-tag" style={{ fontSize: "0.85rem", padding: "0.25rem 0.6rem" }}>
                    {details.ticker}
                  </span>
                  <span className="badge-tag" style={{ background: "rgba(99, 102, 241, 0.15)", color: "#a5b4fc" }}>
                    {details.sector}
                  </span>
                </div>
                <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                  {details.industry} • Exchange Currency: <strong style={{ color: "#fff" }}>{details.currency}</strong>
                </p>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button onClick={handleAddToWatchlist} className="btn-secondary">
                  ⭐ Add Watchlist
                </button>
                <button onClick={() => setShowAddTx(true)} className="btn-primary">
                  ➕ Record Trade
                </button>
              </div>
            </div>

            {/* Price & Day Change Grid */}
            <div style={{
              display: "flex",
              alignItems: "baseline",
              gap: "1.25rem",
              marginTop: "1.5rem",
              paddingTop: "1.5rem",
              borderTop: "1px solid var(--bg-card-border)"
            }}>
              <div style={{ fontSize: "2.8rem", fontWeight: 800, fontFamily: "var(--font-mono)", letterSpacing: "-0.03em" }}>
                {details.currency === "INR" ? "₹" : "$"}{details.price?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className={details.change >= 0 ? "badge-gain" : "badge-loss"} style={{ fontSize: "1.1rem", padding: "0.4rem 0.9rem" }}>
                {details.change >= 0 ? "▲ +" : "▼ "}
                {details.change?.toFixed(2)} ({details.change_pct?.toFixed(2)}%)
              </div>
              <div style={{ color: "var(--text-dim)", fontSize: "0.85rem" }}>
                Prev Close: {details.currency === "INR" ? "₹" : "$"}{details.previous_close || "N/A"}
              </div>
            </div>
          </div>

          {/* Interactive Chart Section */}
          <div className="glass-card" style={{ padding: "1.75rem 2rem" }}>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", gap: "1rem" }}>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span>📈</span> Price Chart & Trends
              </h3>

              {/* Timeframe Selector */}
              <div style={{
                display: "flex",
                background: "rgba(15, 23, 42, 0.6)",
                padding: "0.25rem",
                borderRadius: "var(--radius-md)",
                gap: "0.25rem"
              }}>
                {["1d", "5d", "1m", "6m", "1y"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setPeriod(t)}
                    style={{
                      padding: "0.35rem 0.75rem",
                      borderRadius: "var(--radius-sm)",
                      border: "none",
                      background: period === t ? "var(--primary)" : "transparent",
                      color: period === t ? "#fff" : "var(--text-muted)",
                      fontWeight: 600,
                      fontSize: "0.82rem",
                      cursor: "pointer",
                      textTransform: "uppercase"
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {chartLoading ? (
              <div style={{ height: "240px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div className="spinner" />
              </div>
            ) : (
              renderSvgChart()
            )}
          </div>

          {/* Key Statistics Grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "1.25rem"
          }}>
            <div className="glass-card" style={{ padding: "1.25rem" }}>
              <div style={{ fontSize: "0.82rem", color: "var(--text-dim)", marginBottom: "0.3rem" }}>Market Cap</div>
              <div style={{ fontSize: "1.25rem", fontWeight: 700 }}>{formatNum(details.market_cap)}</div>
            </div>

            <div className="glass-card" style={{ padding: "1.25rem" }}>
              <div style={{ fontSize: "0.82rem", color: "var(--text-dim)", marginBottom: "0.3rem" }}>Trailing P/E Ratio</div>
              <div style={{ fontSize: "1.25rem", fontWeight: 700 }}>{details.pe_ratio || "N/A"}</div>
            </div>

            <div className="glass-card" style={{ padding: "1.25rem" }}>
              <div style={{ fontSize: "0.82rem", color: "var(--text-dim)", marginBottom: "0.3rem" }}>52-Week High / Low</div>
              <div style={{ fontSize: "1.1rem", fontWeight: 700 }}>
                ₹{details.fifty_two_week_high || "N/A"} / ₹{details.fifty_two_week_low || "N/A"}
              </div>
            </div>

            <div className="glass-card" style={{ padding: "1.25rem" }}>
              <div style={{ fontSize: "0.82rem", color: "var(--text-dim)", marginBottom: "0.3rem" }}>Day High / Low</div>
              <div style={{ fontSize: "1.1rem", fontWeight: 700 }}>
                ₹{details.day_high || "N/A"} / ₹{details.day_low || "N/A"}
              </div>
            </div>

            <div className="glass-card" style={{ padding: "1.25rem" }}>
              <div style={{ fontSize: "0.82rem", color: "var(--text-dim)", marginBottom: "0.3rem" }}>Volume</div>
              <div style={{ fontSize: "1.25rem", fontWeight: 700 }}>
                {details.volume ? details.volume.toLocaleString() : "N/A"}
              </div>
            </div>

            <div className="glass-card" style={{ padding: "1.25rem" }}>
              <div style={{ fontSize: "0.82rem", color: "var(--text-dim)", marginBottom: "0.3rem" }}>Dividend Yield</div>
              <div style={{ fontSize: "1.25rem", fontWeight: 700 }}>
                {details.dividend_yield ? `${details.dividend_yield}%` : "N/A"}
              </div>
            </div>
          </div>

          {/* Business Summary */}
          <div className="glass-card" style={{ padding: "1.75rem 2rem" }}>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "0.8rem" }}>
              🏢 About {details.company_name}
            </h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.93rem", lineHeight: 1.7 }}>
              {details.summary}
            </p>
          </div>
        </div>
      )}

      {/* Record Trade Dialog */}
      {showAddTx && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)",
          zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem"
        }}>
          <div className="glass-card" style={{ width: "100%", maxWidth: "440px", padding: "2rem" }}>
            <h3 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "1.2rem" }}>
              💼 Record {ticker} Trade
            </h3>
            <form onSubmit={handleCreateTransaction} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.3rem" }}>Action</label>
                <select
                  value={txType}
                  onChange={(e) => setTxType(e.target.value)}
                  className="glass-input"
                  style={{ width: "100%" }}
                >
                  <option value="BUY" style={{ background: "#0f172a" }}>BUY</option>
                  <option value="SELL" style={{ background: "#0f172a" }}>SELL</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.3rem" }}>Quantity (Shares)</label>
                <input
                  type="number"
                  step="any"
                  required
                  min="0.01"
                  className="glass-input"
                  style={{ width: "100%" }}
                  value={txShares}
                  onChange={(e) => setTxShares(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.3rem" }}>Price per Share (₹)</label>
                <input
                  type="number"
                  step="any"
                  required
                  className="glass-input"
                  style={{ width: "100%" }}
                  value={txPrice}
                  onChange={(e) => setTxPrice(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem" }}>
                <button type="button" onClick={() => setShowAddTx(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
