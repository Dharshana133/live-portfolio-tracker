import { useState } from "react";
import { aiService, watchlistService } from "../services/api";

export function AiAdvisorTab({ onSelectTicker, user, onRequireAuth }) {
  const [tickerInput, setTickerInput] = useState("RELIANCE");
  const [queryInput, setQueryInput] = useState("Shall I buy this stock?");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [savedWatchlist, setSavedWatchlist] = useState(false);

  const samplePrompts = [
    { ticker: "RELIANCE", query: "Shall I buy RELIANCE share?" },
    { ticker: "TATAMOTORS", query: "Is TATAMOTORS a good buy for growth?" },
    { ticker: "TCS", query: "Should I buy TCS at current price?" },
    { ticker: "AAPL", query: "Analyze Apple stock valuation" },
    { ticker: "NVDA", query: "Is NVIDIA overvalued right now?" },
    { ticker: "INFY", query: "Evaluate Infosys dividend & risk profile" },
  ];

  const handleRunAnalysis = async (t = tickerInput, q = queryInput) => {
    if (!t.trim()) return;
    setLoading(true);
    setError(null);
    setSavedWatchlist(false);

    try {
      const res = await aiService.analyzeStock(t.trim(), q.trim());
      setAnalysis(res);
    } catch (err) {
      console.error("AI Analysis error:", err);
      setError(err.response?.data?.detail || "Failed to analyze stock. Please verify the ticker symbol.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPrompt = (item) => {
    setTickerInput(item.ticker);
    setQueryInput(item.query);
    handleRunAnalysis(item.ticker, item.query);
  };

  const handleAddWatchlist = async () => {
    if (!user) {
      onRequireAuth();
      return;
    }
    if (!analysis?.ticker) return;
    try {
      await watchlistService.addWatchlist(analysis.ticker);
      setSavedWatchlist(true);
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to add to watchlist");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header Banner */}
      <div className="glass-card" style={{ padding: "1.75rem", borderRadius: "var(--radius-lg)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
          <div style={{
            fontSize: "2.5rem",
            width: "60px",
            height: "60px",
            borderRadius: "var(--radius-md)",
            background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 20px rgba(99, 102, 241, 0.4)"
          }}>
            🤖
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: "1.6rem", fontWeight: 800, margin: 0, color: "#fff" }}>
              AI Stock Analyst & Buy Assistant
            </h2>
            <p style={{ margin: "0.25rem 0 0 0", color: "var(--text-muted)", fontSize: "0.95rem" }}>
              Ask questions like <em>"Shall I buy RELIANCE?"</em> — AI analyzes live 52W metrics, P/E ratio, market cap & price momentum to provide intelligent buy/hold/sell recommendations.
            </p>
          </div>
        </div>

        {/* Quick Suggestion Chips */}
        <div style={{ marginTop: "1.25rem" }}>
          <div style={{ fontSize: "0.8rem", color: "var(--accent-cyan)", fontWeight: 600, marginBottom: "0.5rem" }}>
            💡 QUICK AI ANALYSIS PROMPTS
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {samplePrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickPrompt(p)}
                style={{
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "999px",
                  padding: "0.4rem 0.85rem",
                  color: "var(--text-muted)",
                  fontSize: "0.82rem",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem"
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = "var(--primary)";
                  e.currentTarget.style.color = "#fff";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                  e.currentTarget.style.color = "var(--text-muted)";
                }}
              >
                <span>⚡</span>
                <span>{p.query}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Query Form Box */}
      <div className="glass-card" style={{ padding: "1.5rem", borderRadius: "var(--radius-lg)" }}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleRunAnalysis();
          }}
          style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
        >
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <div style={{ flex: "0 0 180px" }}>
              <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.4rem" }}>
                Stock Ticker (NSE / US)
              </label>
              <input
                type="text"
                className="glass-input"
                style={{ textTransform: "uppercase" }}
                placeholder="e.g. RELIANCE, AAPL"
                value={tickerInput}
                onChange={(e) => setTickerInput(e.target.value.toUpperCase())}
                required
              />
            </div>

            <div style={{ flex: 1, minWidth: "240px" }}>
              <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.4rem" }}>
                Your Analysis Query
              </label>
              <input
                type="text"
                className="glass-input"
                placeholder="e.g. Shall I buy this share? Is it a good long term investment?"
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                required
              />
            </div>

            <div style={{ alignSelf: "flex-end" }}>
              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
                style={{
                  padding: "0.7rem 1.5rem",
                  fontSize: "0.95rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  minWidth: "150px",
                  justifyContent: "center"
                }}
              >
                {loading ? (
                  <>
                    <div className="spinner" style={{ width: "18px", height: "18px" }} />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <span>🤖</span>
                    <span>Analyze Stock</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          padding: "1rem 1.25rem",
          borderRadius: "var(--radius-md)",
          background: "rgba(239, 68, 68, 0.1)",
          border: "1px solid rgba(239, 68, 68, 0.3)",
          color: "#f87171",
          fontSize: "0.9rem"
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* AI Recommendation Output Card */}
      {analysis && (
        <div className="glass-card" style={{ padding: "2rem", borderRadius: "var(--radius-lg)", border: `1px solid ${analysis.verdict_color}` }}>
          {/* Top Banner Row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <h3 style={{ fontSize: "1.75rem", fontWeight: 800, margin: 0, color: "#fff" }}>
                  {analysis.company_name}
                </h3>
                <span style={{
                  background: "rgba(255, 255, 255, 0.1)",
                  padding: "0.2rem 0.6rem",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  color: "var(--accent-cyan)"
                }}>
                  {analysis.ticker}
                </span>
                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                  ({analysis.sector})
                </span>
              </div>
              <div style={{ marginTop: "0.4rem", fontSize: "1.3rem", fontWeight: 700, color: "#fff" }}>
                {analysis.currency} {analysis.price.toLocaleString()}
                <span style={{
                  marginLeft: "0.75rem",
                  fontSize: "0.95rem",
                  color: analysis.change_pct >= 0 ? "var(--gain)" : "var(--loss)"
                }}>
                  {analysis.change_pct >= 0 ? "▲ +" : "▼ "}{analysis.change_pct}%
                </span>
              </div>
            </div>

            {/* Verdict Badge */}
            <div style={{ textAlign: "right" }}>
              <div style={{
                background: analysis.verdict_color,
                color: "#000",
                fontWeight: 900,
                fontSize: "0.95rem",
                padding: "0.5rem 1.25rem",
                borderRadius: "999px",
                letterSpacing: "0.03em",
                boxShadow: `0 0 15px ${analysis.verdict_color}66`
              }}>
                {analysis.verdict}
              </div>
              <div style={{ marginTop: "0.4rem", fontSize: "0.82rem", color: "var(--text-muted)" }}>
                AI Confidence Score: <strong style={{ color: "#fff" }}>{analysis.confidence_score}%</strong>
              </div>
            </div>
          </div>

          {/* AI Recommendation Summary */}
          <div style={{
            background: "rgba(99, 102, 241, 0.08)",
            borderLeft: `4px solid ${analysis.verdict_color}`,
            padding: "1.25rem",
            borderRadius: "0 var(--radius-md) var(--radius-md) 0",
            marginBottom: "1.5rem"
          }}>
            <div style={{ fontWeight: 700, color: "#fff", marginBottom: "0.3rem", fontSize: "1rem" }}>
              💡 AI Verdict & Buy Recommendation
            </div>
            <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: 1.5 }}>
              {analysis.recommendation_summary}
            </p>
          </div>

          {/* Key Financial Indicators Grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
            gap: "1rem",
            marginBottom: "1.5rem"
          }}>
            {Object.entries(analysis.key_metrics).map(([key, val]) => (
              <div key={key} style={{
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid var(--bg-card-border)",
                padding: "0.85rem",
                borderRadius: "var(--radius-md)",
                textAlign: "center"
              }}>
                <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {key}
                </div>
                <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "#fff", marginTop: "0.25rem" }}>
                  {val}
                </div>
              </div>
            ))}
          </div>

          {/* Pros & Risks Side-by-Side */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem", marginBottom: "1.5rem" }}>
            {/* Pros */}
            <div style={{
              background: "rgba(16, 185, 129, 0.05)",
              border: "1px solid rgba(16, 185, 129, 0.2)",
              padding: "1.25rem",
              borderRadius: "var(--radius-md)"
            }}>
              <div style={{ fontWeight: 700, color: "var(--gain)", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span>✅</span> Bullish Drivers & Pros
              </div>
              <ul style={{ margin: 0, paddingLeft: "1.2rem", color: "var(--text-muted)", fontSize: "0.9rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {analysis.pros.map((p, idx) => (
                  <li key={idx}>{p}</li>
                ))}
              </ul>
            </div>

            {/* Risks / Cons */}
            <div style={{
              background: "rgba(239, 68, 68, 0.05)",
              border: "1px solid rgba(239, 68, 68, 0.2)",
              padding: "1.25rem",
              borderRadius: "var(--radius-md)"
            }}>
              <div style={{ fontWeight: 700, color: "#f87171", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span>⚠️</span> Risks & Considerations
              </div>
              <ul style={{ margin: 0, paddingLeft: "1.2rem", color: "var(--text-muted)", fontSize: "0.9rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {analysis.cons.map((c, idx) => (
                  <li key={idx}>{c}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Detailed Reasoning */}
          <div style={{
            background: "rgba(0, 0, 0, 0.2)",
            border: "1px solid var(--bg-card-border)",
            padding: "1.25rem",
            borderRadius: "var(--radius-md)",
            marginBottom: "1.5rem"
          }}>
            <div style={{ fontWeight: 700, color: "#fff", marginBottom: "0.4rem", fontSize: "0.95rem" }}>
              📝 AI Contextual Analysis
            </div>
            <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: 1.6, whiteSpace: "pre-line" }}>
              {analysis.detailed_reasoning}
            </p>
          </div>

          {/* Action Footer */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                onClick={() => onSelectTicker(analysis.ticker)}
                className="btn-primary"
                style={{ padding: "0.55rem 1.25rem", fontSize: "0.88rem" }}
              >
                📊 Open in Stock Explorer
              </button>
              <button
                onClick={handleAddWatchlist}
                className="btn-secondary"
                disabled={savedWatchlist}
                style={{ padding: "0.55rem 1.25rem", fontSize: "0.88rem" }}
              >
                {savedWatchlist ? "⭐ Added to Watchlist" : "⭐ Add to Watchlist"}
              </button>
            </div>

            <span style={{ fontSize: "0.75rem", color: "var(--text-dim)", maxWidth: "350px", textAlign: "right" }}>
              {analysis.disclaimer}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
