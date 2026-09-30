import { useState, useEffect } from "react";
import { priceService, watchlistService } from "../services/api";

export function NseCatalogTab({ onSelectTicker, user, onRequireAuth }) {
  const [catalog, setCatalog] = useState(null);
  const [query, setQuery] = useState("");
  const [selectedSector, setSelectedSector] = useState("All");
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);

  const limit = 40;

  useEffect(() => {
    fetchCatalog(query, selectedSector, page);
  }, [query, selectedSector, page]);

  const fetchCatalog = async (qStr, secStr, pageNum) => {
    setLoading(true);
    try {
      const data = await priceService.getNseCatalog(qStr, secStr === "All" ? "" : secStr, limit, pageNum * limit);
      setCatalog(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddWatchlist = async (e, ticker) => {
    e.stopPropagation();
    if (!user) {
      onRequireAuth();
      return;
    }
    try {
      await watchlistService.addWatchlist(ticker);
      setMsg(`Added ${ticker} to Watchlist! ⭐`);
      setTimeout(() => setMsg(null), 3000);
    } catch (err) {
      const detail = err.response?.data?.detail || "Already on watchlist";
      setMsg(`⚠️ ${detail}`);
      setTimeout(() => setMsg(null), 3000);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Search & Filter Header */}
      <div className="glass-card" style={{ padding: "1.5rem 2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem" }}>
          <div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
              🇮🇳 NSE Stock Directory (842 Stocks)
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
              Browse and filter all 840+ National Stock Exchange listed equities with yfinance integration.
            </p>
          </div>

          <span className="badge-tag" style={{ background: "rgba(99, 102, 241, 0.2)", color: "#a5b4fc", fontSize: "0.9rem", padding: "0.4rem 0.8rem" }}>
            Total Listed: {catalog?.total || 842}
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
          {/* Text Search */}
          <input
            type="text"
            className="glass-input"
            placeholder="Search symbol or company name (e.g. Reliance, Tata, HAL)..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(0); }}
          />

          {/* Sector Filter Dropdown */}
          <select
            className="glass-input"
            value={selectedSector}
            onChange={(e) => { setSelectedSector(e.target.value); setPage(0); }}
          >
            <option value="All" style={{ background: "#0f172a" }}>All Sectors ({catalog?.sectors?.length || 0})</option>
            {catalog?.sectors?.map((sec) => (
              <option key={sec} value={sec} style={{ background: "#0f172a" }}>
                {sec}
              </option>
            ))}
          </select>
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

      {/* Catalog Table */}
      <div className="glass-card" style={{ padding: "0.5rem", overflowX: "auto" }}>
        {loading ? (
          <div style={{ padding: "4rem", textAlign: "center" }}>
            <div className="spinner" style={{ margin: "0 auto 1rem auto" }} />
            <p style={{ color: "var(--text-muted)" }}>Loading NSE Stock Directory...</p>
          </div>
        ) : catalog?.items?.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
            No matching NSE stocks found for "{query}".
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.93rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--bg-card-border)", color: "var(--text-dim)", fontSize: "0.8rem", textTransform: "uppercase" }}>
                <th style={{ padding: "1rem" }}>Symbol</th>
                <th style={{ padding: "1rem" }}>Company Name</th>
                <th style={{ padding: "1rem" }}>Sector</th>
                <th style={{ padding: "1rem", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {catalog?.items?.map((item) => (
                <tr
                  key={item.ticker}
                  onClick={() => onSelectTicker(item.ticker)}
                  style={{
                    borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
                    cursor: "pointer",
                    transition: "background 0.15s ease"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  <td style={{ padding: "1rem", fontWeight: 700, fontFamily: "var(--font-mono)", color: "#ffffff" }}>
                    <span style={{ color: "var(--primary)" }}>{item.ticker}</span>
                    <span style={{ color: "var(--text-dim)", fontSize: "0.75rem", marginLeft: "0.3rem" }}>.NS</span>
                  </td>
                  <td style={{ padding: "1rem", fontWeight: 500, color: "var(--text-main)" }}>
                    {item.name}
                  </td>
                  <td style={{ padding: "1rem" }}>
                    <span className="badge-tag">
                      {item.sector}
                    </span>
                  </td>
                  <td style={{ padding: "1rem", textAlign: "right" }}>
                    <div style={{ display: "inline-flex", gap: "0.5rem" }}>
                      <button
                        onClick={(e) => handleAddWatchlist(e, item.ticker)}
                        className="btn-secondary"
                        style={{ padding: "0.35rem 0.75rem", fontSize: "0.8rem" }}
                      >
                        ⭐ Watchlist
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onSelectTicker(item.ticker); }}
                        className="btn-primary"
                        style={{ padding: "0.35rem 0.75rem", fontSize: "0.8rem" }}
                      >
                        📈 Details
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination Bar */}
        {catalog && catalog.total > limit && (
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "1rem 1.5rem",
            borderTop: "1px solid var(--bg-card-border)"
          }}>
            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              Showing {page * limit + 1} - {Math.min((page + 1) * limit, catalog.total)} of {catalog.total} stocks
            </div>

            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
                className="btn-secondary"
                style={{ padding: "0.4rem 0.8rem", opacity: page === 0 ? 0.5 : 1 }}
              >
                ◀ Previous
              </button>
              <span style={{ padding: "0.4rem 0.8rem", fontSize: "0.88rem", fontWeight: 600 }}>
                Page {page + 1} of {Math.ceil(catalog.total / limit)}
              </span>
              <button
                disabled={(page + 1) * limit >= catalog.total}
                onClick={() => setPage(page + 1)}
                className="btn-secondary"
                style={{ padding: "0.4rem 0.8rem", opacity: (page + 1) * limit >= catalog.total ? 0.5 : 1 }}
              >
                Next ▶
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
