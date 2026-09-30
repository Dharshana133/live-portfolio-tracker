import { useState, useEffect } from "react";
import { watchlistService, priceService } from "../services/api";

export function WatchlistTab({ user, onRequireAuth, onSelectTicker }) {
  const [watchlist, setWatchlist] = useState([]);
  const [pricesMap, setPricesMap] = useState({});
  const [newTicker, setNewTicker] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    if (user) {
      fetchWatchlist();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchWatchlist = async () => {
    setLoading(true);
    try {
      const items = await watchlistService.getWatchlist();
      setWatchlist(items);

      const tickers = items.map((i) => i.ticker.toUpperCase());
      if (tickers.length > 0) {
        const prices = await priceService.getPricesBatch(tickers);
        setPricesMap(prices);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTicker = async (e) => {
    e.preventDefault();
    if (!newTicker.trim()) return;
    setAdding(true);
    try {
      await watchlistService.addWatchlist(newTicker.trim().toUpperCase());
      setNewTicker("");
      setMsg(`Added ${newTicker.toUpperCase()} to Watchlist! ⭐`);
      fetchWatchlist();
      setTimeout(() => setMsg(null), 3000);
    } catch (err) {
      const detail = err.response?.data?.detail || "Failed to add to watchlist";
      setMsg(`⚠️ ${detail}`);
      setTimeout(() => setMsg(null), 3000);
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (id, ticker) => {
    try {
      await watchlistService.removeWatchlist(id);
      setMsg(`Removed ${ticker} from Watchlist`);
      fetchWatchlist();
      setTimeout(() => setMsg(null), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  if (!user) {
    return (
      <div className="glass-card" style={{ padding: "4rem 2rem", textAlign: "center", maxWidth: "600px", margin: "2rem auto" }}>
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⭐</div>
        <h2 style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: "0.5rem" }}>
          Authentication Required
        </h2>
        <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>
          Sign in to save and monitor your favorite NSE & Global stocks with real-time price updates.
        </p>
        <button onClick={onRequireAuth} className="btn-primary" style={{ padding: "0.75rem 1.8rem", fontSize: "1rem" }}>
          ⚡ Sign In to View Watchlist
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Add Watchlist Header */}
      <div className="glass-card" style={{ padding: "1.5rem 2rem" }}>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
          <div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
              ⭐ My Watchlist ({watchlist.length})
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
              Monitor live quotes and price changes across your saved stocks.
            </p>
          </div>

          <form onSubmit={handleAddTicker} style={{ display: "flex", gap: "0.75rem" }}>
            <input
              type="text"
              required
              className="glass-input"
              style={{ width: "200px" }}
              placeholder="Ticker (e.g. TCS, INFY)..."
              value={newTicker}
              onChange={(e) => setNewTicker(e.target.value)}
            />
            <button type="submit" disabled={adding} className="btn-primary">
              {adding ? "Adding..." : "➕ Add Stock"}
            </button>
          </form>
        </div>
      </div>

      {msg && (
        <div className="animate-fade-in" style={{
          background: msg.includes("⚠️") ? "rgba(244, 63, 94, 0.15)" : "var(--gain-bg)",
          border: `1px solid ${msg.includes("⚠️") ? "var(--loss-border)" : "var(--gain-border)"}`,
          color: msg.includes("⚠️") ? "#fca5a5" : "var(--gain)",
          padding: "0.75rem 1.2rem",
          borderRadius: "var(--radius-md)",
          fontWeight: 600
        }}>
          {msg}
        </div>
      )}

      {/* Watchlist Stock Cards Grid */}
      {loading ? (
        <div className="glass-card" style={{ padding: "4rem", textAlign: "center" }}>
          <div className="spinner" style={{ margin: "0 auto 1rem auto" }} />
          <p style={{ color: "var(--text-muted)" }}>Loading watchlist prices...</p>
        </div>
      ) : watchlist.length === 0 ? (
        <div className="glass-card" style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
          Your watchlist is empty! Add stock tickers above or click "⭐ Add Watchlist" on any stock details page.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.25rem" }}>
          {watchlist.map((item) => {
            const priceData = pricesMap[item.ticker.toUpperCase()];
            const isGain = (priceData?.change || 0) >= 0;

            return (
              <div
                key={item.id}
                className="glass-card animate-fade-in"
                style={{ padding: "1.5rem", display: "flex", flexDirection: "column", justifyContent: "space-between" }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                    <div>
                      <h3 style={{ fontSize: "1.3rem", fontWeight: 800, fontFamily: "var(--font-mono)", color: "#fff" }}>
                        {item.ticker.toUpperCase()}
                      </h3>
                      <span className="badge-tag" style={{ fontSize: "0.75rem" }}>yfinance</span>
                    </div>

                    <button
                      onClick={() => handleRemove(item.id, item.ticker)}
                      style={{ background: "none", border: "none", color: "var(--text-dim)", cursor: "pointer", fontSize: "1.2rem" }}
                      title="Remove from watchlist"
                    >
                      &times;
                    </button>
                  </div>

                  <div style={{ marginBottom: "1.2rem" }}>
                    <div style={{ fontSize: "1.8rem", fontWeight: 800, fontFamily: "var(--font-mono)" }}>
                      {priceData?.price ? `₹${priceData.price.toFixed(2)}` : "Loading..."}
                    </div>
                    {priceData && (
                      <div className={isGain ? "badge-gain" : "badge-loss"} style={{ marginTop: "0.4rem" }}>
                        {isGain ? "▲ +" : "▼ "}
                        {priceData.change?.toFixed(2)} ({priceData.change_pct?.toFixed(2)}%)
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => onSelectTicker(item.ticker.toUpperCase())}
                  className="btn-secondary"
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  📈 View Chart & Analysis
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
