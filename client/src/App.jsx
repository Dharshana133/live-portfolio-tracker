import { useState, useEffect } from "react";
import { authService } from "./services/api";
import { Navbar } from "./components/Navbar";
import { AuthModal } from "./components/AuthModal";
import { StockExplorer } from "./components/StockExplorer";
import { NseCatalogTab } from "./components/NseCatalogTab";
import { PortfolioTab } from "./components/PortfolioTab";
import { WatchlistTab } from "./components/WatchlistTab";
import { AiAdvisorTab } from "./components/AiAdvisorTab";
import "./App.css";

export default function App() {
  const [user, setUser] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("explorer");
  const [selectedTicker, setSelectedTicker] = useState("RELIANCE");
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    checkActiveSession();
  }, []);

  const checkActiveSession = async () => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const uData = await authService.getCurrentUser();
          setUser(uData);
        } catch (err) {
          console.error("Stored token invalid or expired", err);
          localStorage.removeItem("token");
        }
      }
    } catch (e) {
      console.error("Session check error", e);
    } finally {
      setInitializing(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  const handleSelectTicker = (ticker) => {
    setSelectedTicker(ticker);
    setActiveTab("explorer");
  };

  if (initializing) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        flexDirection: "column", gap: "1rem", color: "var(--text-muted)"
      }}>
        <div className="spinner" style={{ width: "40px", height: "40px" }} />
        <p style={{ fontWeight: 600 }}>Initializing InvestPulse...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onOpenAuth={() => setAuthModalOpen(true)}
        onLogout={handleLogout}
        onSearchStock={handleSelectTicker}
      />

      {/* Main Tab Body Container */}
      <main style={{
        maxWidth: "1280px",
        width: "calc(100% - 2rem)",
        margin: "0 auto 3rem auto",
        flex: 1
      }}>
        {activeTab === "explorer" && (
          <StockExplorer
            initialTicker={selectedTicker}
            user={user}
            onRequireAuth={() => setAuthModalOpen(true)}
          />
        )}

        {activeTab === "ai_advisor" && (
          <AiAdvisorTab
            onSelectTicker={handleSelectTicker}
            user={user}
            onRequireAuth={() => setAuthModalOpen(true)}
          />
        )}

        {activeTab === "nse_catalog" && (
          <NseCatalogTab
            onSelectTicker={handleSelectTicker}
            user={user}
            onRequireAuth={() => setAuthModalOpen(true)}
          />
        )}

        {activeTab === "portfolio" && (
          <PortfolioTab
            user={user}
            onRequireAuth={() => setAuthModalOpen(true)}
            onSelectTicker={handleSelectTicker}
          />
        )}

        {activeTab === "watchlist" && (
          <WatchlistTab
            user={user}
            onRequireAuth={() => setAuthModalOpen(true)}
            onSelectTicker={handleSelectTicker}
          />
        )}
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: "1px solid var(--bg-card-border)",
        background: "rgba(9, 13, 22, 0.9)",
        padding: "2rem 1rem",
        textAlign: "center",
        color: "var(--text-dim)",
        fontSize: "0.85rem"
      }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: "1rem" }}>
          <div>
            <strong style={{ color: "#fff" }}>InvestPulse Platform</strong> • Real-Time Stock Analytics & Portfolio Tracker
          </div>
          <div>
            Powered by <strong>yfinance API</strong> & Fast-Cache Engine • 842+ NSE Listed Stocks
          </div>
        </div>
      </footer>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={(u) => setUser(u)}
      />
    </div>
  );
}
