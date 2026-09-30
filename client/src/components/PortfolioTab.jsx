import { useState, useEffect } from "react";
import { transactionService, priceService } from "../services/api";

export function PortfolioTab({ user, onRequireAuth, onSelectTicker }) {
  const [transactions, setTransactions] = useState([]);
  const [pricesMap, setPricesMap] = useState({});
  const [loading, setLoading] = useState(true);

  // New Transaction Form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [tickerInput, setTickerInput] = useState("RELIANCE");
  const [txType, setTxType] = useState("BUY");
  const [sharesInput, setSharesInput] = useState(10);
  const [priceInput, setPriceInput] = useState(2500);

  useEffect(() => {
    if (user) {
      fetchPortfolioData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchPortfolioData = async () => {
    setLoading(true);
    try {
      const txs = await transactionService.getTransactions();
      setTransactions(txs);

      // Unique tickers
      const tickers = Array.from(new Set(txs.map((t) => t.ticker.toUpperCase())));
      if (tickers.length > 0) {
        // Fetch batch prices
        const priceData = await priceService.getPricesBatch(tickers);
        setPricesMap(priceData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransactionSubmit = async (e) => {
    e.preventDefault();
    try {
      await transactionService.addTransaction({
        ticker: tickerInput.trim().toUpperCase(),
        type: txType,
        quantity: parseFloat(sharesInput),
        shares: parseFloat(sharesInput),
        price: parseFloat(priceInput),
      });
      setShowAddModal(false);
      fetchPortfolioData();
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.detail || "Failed to add transaction.";
      alert(`Failed to add transaction: ${typeof detail === 'object' ? JSON.stringify(detail) : detail}`);
    }
  };

  const handleDeleteTransaction = async (id) => {
    if (window.confirm("Are you sure you want to delete this transaction record?")) {
      try {
        await transactionService.deleteTransaction(id);
        fetchPortfolioData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  if (!user) {
    return (
      <div className="glass-card" style={{ padding: "4rem 2rem", textAlign: "center", maxWidth: "600px", margin: "2rem auto" }}>
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>💼</div>
        <h2 style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: "0.5rem" }}>
          Authentication Required
        </h2>
        <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>
          Please sign in to view your live portfolio holdings, total investment metrics, and transaction history.
        </p>
        <button onClick={onRequireAuth} className="btn-primary" style={{ padding: "0.75rem 1.8rem", fontSize: "1rem" }}>
          ⚡ Sign In to View Portfolio
        </button>
      </div>
    );
  }

  // Calculate aggregated holdings per ticker
  const holdingsMap = {};
  transactions.forEach((tx) => {
    const sym = tx.ticker.toUpperCase();
    const q = tx.quantity !== undefined ? tx.quantity : (tx.shares || 0);
    if (!holdingsMap[sym]) {
      holdingsMap[sym] = { totalShares: 0, totalCost: 0 };
    }
    if (tx.type.toUpperCase() === "BUY") {
      holdingsMap[sym].totalShares += q;
      holdingsMap[sym].totalCost += q * tx.price;
    } else if (tx.type.toUpperCase() === "SELL") {
      holdingsMap[sym].totalShares -= q;
      holdingsMap[sym].totalCost -= q * tx.price;
    }
  });

  const holdingsList = Object.keys(holdingsMap)
    .filter((sym) => holdingsMap[sym].totalShares > 0)
    .map((sym) => {
      const h = holdingsMap[sym];
      const avgPrice = h.totalShares > 0 ? h.totalCost / h.totalShares : 0;
      const currentPrice = pricesMap[sym]?.price || avgPrice;
      const currentValue = h.totalShares * currentPrice;
      const pnl = currentValue - h.totalCost;
      const pnlPct = h.totalCost > 0 ? (pnl / h.totalCost) * 100 : 0;
      return {
        ticker: sym,
        shares: h.totalShares,
        totalCost: h.totalCost,
        avgPrice: avgPrice,
        currentPrice: currentPrice,
        currentValue: currentValue,
        pnl: pnl,
        pnlPct: pnlPct,
      };
    });

  const totalInvested = holdingsList.reduce((acc, item) => acc + item.totalCost, 0);
  const totalCurrentValue = holdingsList.reduce((acc, item) => acc + item.currentValue, 0);
  const totalPnl = totalCurrentValue - totalInvested;
  const totalPnlPct = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Portfolio Header & Stats Cards */}
      <div className="glass-card" style={{ padding: "1.75rem 2rem" }}>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", gap: "1rem" }}>
          <div>
            <h2 style={{ fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
              💼 Investment Portfolio Summary
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
              Real-time portfolio valuation calculated dynamically via yfinance prices.
            </p>
          </div>
          <button onClick={() => setShowAddModal(true)} className="btn-primary">
            ➕ Add Transaction
          </button>
        </div>

        {/* Stats Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem" }}>
          <div style={{ background: "rgba(15, 23, 42, 0.6)", padding: "1.2rem", borderRadius: "var(--radius-md)", border: "1px solid var(--bg-card-border)" }}>
            <div style={{ fontSize: "0.82rem", color: "var(--text-dim)", marginBottom: "0.3rem" }}>Total Invested</div>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, fontFamily: "var(--font-mono)" }}>
              ₹{totalInvested.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          <div style={{ background: "rgba(15, 23, 42, 0.6)", padding: "1.2rem", borderRadius: "var(--radius-md)", border: "1px solid var(--bg-card-border)" }}>
            <div style={{ fontSize: "0.82rem", color: "var(--text-dim)", marginBottom: "0.3rem" }}>Current Market Value</div>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, fontFamily: "var(--font-mono)" }}>
              ₹{totalCurrentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          <div style={{ background: "rgba(15, 23, 42, 0.6)", padding: "1.2rem", borderRadius: "var(--radius-md)", border: "1px solid var(--bg-card-border)" }}>
            <div style={{ fontSize: "0.82rem", color: "var(--text-dim)", marginBottom: "0.3rem" }}>Total Profit / Loss</div>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, fontFamily: "var(--font-mono)", color: totalPnl >= 0 ? "var(--gain)" : "var(--loss)" }}>
              {totalPnl >= 0 ? "▲ +" : "▼ "}₹{Math.abs(totalPnl).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span style={{ fontSize: "0.9rem", marginLeft: "0.5rem" }}>({totalPnlPct.toFixed(2)}%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Holdings Table */}
      <div className="glass-card" style={{ padding: "1.5rem" }}>
        <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "1rem" }}>
          📊 Active Holdings ({holdingsList.length})
        </h3>

        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center" }}><div className="spinner" style={{ margin: "0 auto" }} /></div>
        ) : holdingsList.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
            No active portfolio holdings found. Click "Add Transaction" to log your first trade!
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.93rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--bg-card-border)", color: "var(--text-dim)", fontSize: "0.8rem", textTransform: "uppercase" }}>
                  <th style={{ padding: "0.85rem" }}>Ticker</th>
                  <th style={{ padding: "0.85rem" }}>Shares</th>
                  <th style={{ padding: "0.85rem" }}>Avg Price</th>
                  <th style={{ padding: "0.85rem" }}>Live Price</th>
                  <th style={{ padding: "0.85rem" }}>Current Value</th>
                  <th style={{ padding: "0.85rem" }}>Profit / Loss</th>
                  <th style={{ padding: "0.85rem", textAlign: "right" }}>Analyze</th>
                </tr>
              </thead>
              <tbody>
                {holdingsList.map((item) => (
                  <tr key={item.ticker} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.04)" }}>
                    <td style={{ padding: "0.85rem", fontWeight: 700, color: "#fff" }}>
                      {item.ticker}
                    </td>
                    <td style={{ padding: "0.85rem", fontFamily: "var(--font-mono)" }}>
                      {item.shares}
                    </td>
                    <td style={{ padding: "0.85rem", fontFamily: "var(--font-mono)" }}>
                      ₹{item.avgPrice.toFixed(2)}
                    </td>
                    <td style={{ padding: "0.85rem", fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                      ₹{item.currentPrice.toFixed(2)}
                    </td>
                    <td style={{ padding: "0.85rem", fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                      ₹{item.currentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: "0.85rem" }}>
                      <span className={item.pnl >= 0 ? "badge-gain" : "badge-loss"}>
                        {item.pnl >= 0 ? "▲ +" : "▼ "}₹{Math.abs(item.pnl).toFixed(2)} ({item.pnlPct.toFixed(2)}%)
                      </span>
                    </td>
                    <td style={{ padding: "0.85rem", textAlign: "right" }}>
                      <button onClick={() => onSelectTicker(item.ticker)} className="btn-secondary" style={{ padding: "0.35rem 0.75rem", fontSize: "0.8rem" }}>
                        📈 View Chart
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Transaction History Logs */}
      <div className="glass-card" style={{ padding: "1.5rem" }}>
        <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "1rem" }}>
          📜 Transaction History ({transactions.length})
        </h3>
        {transactions.length === 0 ? (
          <p style={{ color: "var(--text-dim)", fontSize: "0.9rem" }}>No recorded transactions.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.88rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--bg-card-border)", color: "var(--text-dim)", fontSize: "0.78rem" }}>
                  <th style={{ padding: "0.75rem" }}>Date</th>
                  <th style={{ padding: "0.75rem" }}>Type</th>
                  <th style={{ padding: "0.75rem" }}>Ticker</th>
                  <th style={{ padding: "0.75rem" }}>Shares</th>
                  <th style={{ padding: "0.75rem" }}>Price</th>
                  <th style={{ padding: "0.75rem" }}>Total</th>
                  <th style={{ padding: "0.75rem", textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.03)" }}>
                    <td style={{ padding: "0.75rem", color: "var(--text-dim)" }}>
                      {tx.date ? new Date(tx.date).toLocaleDateString() : "Today"}
                    </td>
                    <td style={{ padding: "0.75rem", fontWeight: 700, color: tx.type === "BUY" ? "var(--gain)" : "var(--loss)" }}>
                      {tx.type}
                    </td>
                    <td style={{ padding: "0.75rem", fontWeight: 700 }}>{tx.ticker}</td>
                    <td style={{ padding: "0.75rem" }}>{tx.quantity ?? tx.shares}</td>
                    <td style={{ padding: "0.75rem" }}>₹{tx.price}</td>
                    <td style={{ padding: "0.75rem", fontWeight: 600 }}>₹{((tx.quantity ?? tx.shares ?? 0) * tx.price).toFixed(2)}</td>
                    <td style={{ padding: "0.75rem", textAlign: "right" }}>
                      <button onClick={() => handleDeleteTransaction(tx.id)} className="btn-danger">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Transaction Dialog */}
      {showAddModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)",
          zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem"
        }}>
          <div className="glass-card" style={{ width: "100%", maxWidth: "440px", padding: "2rem" }}>
            <h3 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "1.2rem" }}>
              💼 Add Portfolio Transaction
            </h3>
            <form onSubmit={handleAddTransactionSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.3rem" }}>Stock Symbol / Ticker</label>
                <input
                  type="text"
                  required
                  className="glass-input"
                  style={{ width: "100%" }}
                  placeholder="e.g. RELIANCE, TCS, AAPL"
                  value={tickerInput}
                  onChange={(e) => setTickerInput(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.3rem" }}>Transaction Type</label>
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
                <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.3rem" }}>Number of Shares</label>
                <input
                  type="number"
                  step="any"
                  required
                  min="0.01"
                  className="glass-input"
                  style={{ width: "100%" }}
                  value={sharesInput}
                  onChange={(e) => setSharesInput(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.3rem" }}>Purchase Price per Share (₹)</label>
                <input
                  type="number"
                  step="any"
                  required
                  className="glass-input"
                  style={{ width: "100%" }}
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem" }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary">
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
