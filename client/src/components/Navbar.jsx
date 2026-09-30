import { useState } from "react";

export function Navbar({ activeTab, setActiveTab, user, onOpenAuth, onLogout, onSearchStock }) {
  const [navSearch, setNavSearch] = useState("");

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (navSearch.trim()) {
      onSearchStock(navSearch.trim());
      setNavSearch("");
    }
  };

  return (
    <header className="glass-card" style={{
      position: "sticky",
      top: "1rem",
      zIndex: 100,
      margin: "1rem auto 2rem auto",
      maxWidth: "1280px",
      width: "calc(100% - 2rem)",
      padding: "0.85rem 1.5rem",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "1.5rem",
      borderRadius: "var(--radius-lg)"
    }}>
      {/* Brand Logo */}
      <div 
        onClick={() => setActiveTab("explorer")}
        style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "0.6rem" }}
      >
        <div style={{
          width: "38px",
          height: "38px",
          borderRadius: "var(--radius-md)",
          background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 0 15px rgba(99, 102, 241, 0.5)",
          fontWeight: 800,
          color: "#fff",
          fontSize: "1.2rem"
        }}>
          ⚡
        </div>
        <div>
          <div style={{
            fontSize: "1.25rem",
            fontWeight: 800,
            letterSpacing: "-0.02em",
            background: "linear-gradient(135deg, #ffffff 0%, #94a3b8 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent"
          }}>
            InvestPulse
          </div>
          <div style={{ fontSize: "0.7rem", color: "var(--accent-cyan)", fontWeight: 600, letterSpacing: "0.05em" }}>
            NSE 842+ & YFINANCE
          </div>
        </div>
      </div>

      {/* Tabs */}
      <nav style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
        {[
          { id: "explorer", label: "Stock Explorer", icon: "📊" },
          { id: "nse_catalog", label: "NSE 840+ Catalog", icon: "🇮🇳" },
          { id: "portfolio", label: "My Portfolio", icon: "💼" },
          { id: "watchlist", label: "Watchlist", icon: "⭐" },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "0.55rem 1rem",
                borderRadius: "var(--radius-md)",
                border: "none",
                background: isActive ? "linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(168, 85, 247, 0.15) 100%)" : "transparent",
                color: isActive ? "#ffffff" : "var(--text-muted)",
                border: isActive ? "1px solid rgba(99, 102, 241, 0.4)" : "1px solid transparent",
                fontWeight: isActive ? 600 : 500,
                fontSize: "0.88rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                transition: "all 0.2s ease"
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Search Input & Auth Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <form onSubmit={handleSearchSubmit}>
          <input
            type="text"
            className="glass-input"
            style={{ width: "180px", padding: "0.45rem 0.85rem", fontSize: "0.85rem" }}
            placeholder="Search stock (e.g. AAPL, TCS)..."
            value={navSearch}
            onChange={(e) => setNavSearch(e.target.value)}
          />
        </form>

        {user ? (
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <div style={{
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid var(--bg-card-border)",
              padding: "0.45rem 0.8rem",
              borderRadius: "var(--radius-md)",
              fontSize: "0.82rem",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "0.4rem"
            }}>
              <span style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "var(--gain)",
                boxShadow: "0 0 8px var(--gain)"
              }} />
              <span>{user.email.split("@")[0]}</span>
            </div>
            <button
              onClick={onLogout}
              className="btn-secondary"
              style={{ padding: "0.45rem 0.75rem", fontSize: "0.82rem" }}
              title="Sign Out"
            >
              Logout
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="btn-primary"
            style={{ padding: "0.45rem 1rem", fontSize: "0.85rem" }}
          >
            Sign In / Register
          </button>
        )}
      </div>
    </header>
  );
}
