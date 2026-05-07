import { useState, useEffect, useRef } from "react";
import { BudgetManager } from "@/components/BudgetManager";
import { TransactionHistory } from "@/components/TransactionHistory";
import { FinanceChatbot } from "@/components/FinanceChatbot";
import { Header } from "@/components/Header";
import { PortfolioSummary } from "@/components/PortfolioSummary";
import { ExpenseChart } from "@/components/ExpenseChart";
import { TransactionRateChart } from "@/components/TransactionRateChart";
import { CategoryBreakdownChart } from "@/components/CategoryBreakdownChart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/* ─────────────────────────────────────────────
   Floating orb component for background depth
───────────────────────────────────────────── */
const FloatingOrb = ({
  size,
  top,
  left,
  color,
  delay,
  duration,
}: {
  size: number;
  top: string;
  left: string;
  color: string;
  delay: number;
  duration: number;
}) => (
  <div
    style={{
      position: "absolute",
      width: size,
      height: size,
      top,
      left,
      borderRadius: "50%",
      background: color,
      filter: "blur(80px)",
      opacity: 0.18,
      animation: `orbFloat ${duration}s ease-in-out ${delay}s infinite alternate`,
      pointerEvents: "none",
    }}
  />
);

/* ─────────────────────────────────────────────
   Animated grid overlay for futuristic texture
───────────────────────────────────────────── */
const GridOverlay = () => (
  <div
    style={{
      position: "fixed",
      inset: 0,
      backgroundImage: `
        linear-gradient(rgba(99,179,237,0.035) 1px, transparent 1px),
        linear-gradient(90deg, rgba(99,179,237,0.035) 1px, transparent 1px)
      `,
      backgroundSize: "48px 48px",
      pointerEvents: "none",
      zIndex: 0,
    }}
  />
);

/* ─────────────────────────────────────────────
   Animated tab indicator line
───────────────────────────────────────────── */
const tabs = [
  { value: "dashboard", label: "Dashboard", icon: "◈" },
  { value: "budget",    label: "Budget",    icon: "◉" },
  { value: "transactions", label: "Transactions", icon: "◎" },
  { value: "assistant", label: "AI Assistant", icon: "◇" },
];

/* ─────────────────────────────────────────────
   Staggered reveal wrapper
───────────────────────────────────────────── */
const Reveal = ({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(28px)",
        transition: `opacity 0.65s cubic-bezier(.22,1,.36,1) ${delay}ms, transform 0.65s cubic-bezier(.22,1,.36,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
};

/* ─────────────────────────────────────────────
   Glass card wrapper with hover lift
───────────────────────────────────────────── */
const GlassCard = ({
  children,
  className = "",
  style = {},
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) => (
  <div
    className={className}
    style={{
      background: "rgba(15,23,42,0.55)",
      backdropFilter: "blur(18px)",
      border: "1px solid rgba(99,179,237,0.13)",
      borderRadius: "20px",
      boxShadow: "0 8px 48px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.05)",
      transition: "transform 0.35s cubic-bezier(.22,1,.36,1), box-shadow 0.35s ease",
      ...style,
    }}
    onMouseEnter={e => {
      (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)";
      (e.currentTarget as HTMLDivElement).style.boxShadow =
        "0 20px 64px rgba(0,0,0,0.45), 0 0 0 1px rgba(99,179,237,0.22), inset 0 1px 0 rgba(255,255,255,0.07)";
    }}
    onMouseLeave={e => {
      (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
      (e.currentTarget as HTMLDivElement).style.boxShadow =
        "0 8px 48px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.05)";
    }}
  >
    {children}
  </div>
);

/* ─────────────────────────────────────────────
   Main Dashboard
───────────────────────────────────────────── */
const Dashboard = () => {
  const [searchTerm, setSearchTerm]     = useState("");
  const [activeTab, setActiveTab]       = useState("dashboard");
  const [mounted, setMounted]           = useState(false);
  const [prevTab, setPrevTab]           = useState("dashboard");
  const [tabAnimating, setTabAnimating] = useState(false);

  useEffect(() => {
    // Mount animation
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  const handleTabChange = (val: string) => {
    if (val === activeTab) return;
    setTabAnimating(true);
    setPrevTab(activeTab);
    setTimeout(() => {
      setActiveTab(val);
      setTabAnimating(false);
    }, 220);
  };

  return (
    <>
      {/* ── Global keyframes injected once ── */}
      <style>{`
        @keyframes orbFloat {
          from { transform: translate(0, 0) scale(1); }
          to   { transform: translate(30px, -40px) scale(1.12); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes scanline {
          0%   { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        @keyframes titleReveal {
          0%   { opacity:0; letter-spacing: 0.5em; filter: blur(8px); }
          100% { opacity:1; letter-spacing: 0.01em; filter: blur(0); }
        }
        @keyframes subtitleReveal {
          0%   { opacity:0; transform: translateX(-16px); }
          100% { opacity:1; transform: translateX(0); }
        }
        @keyframes pulse-border {
          0%, 100% { border-color: rgba(99,179,237,0.15); }
          50%       { border-color: rgba(99,179,237,0.40); }
        }
        .tab-content-enter {
          animation: tabIn 0.35s cubic-bezier(.22,1,.36,1) forwards;
        }
        @keyframes tabIn {
          from { opacity:0; transform: translateY(18px) scale(0.98); }
          to   { opacity:1; transform: translateY(0) scale(1); }
        }
        .tab-content-exit {
          animation: tabOut 0.22s ease forwards;
        }
        @keyframes tabOut {
          from { opacity:1; transform: translateY(0); }
          to   { opacity:0; transform: translateY(-12px); }
        }
        .tab-trigger-active {
          background: linear-gradient(135deg, rgba(59,130,246,0.85), rgba(99,179,237,0.7)) !important;
          box-shadow: 0 0 24px rgba(59,130,246,0.4), inset 0 1px 0 rgba(255,255,255,0.15) !important;
        }
        .tab-trigger {
          transition: all 0.28s cubic-bezier(.22,1,.36,1) !important;
          position: relative;
          overflow: hidden;
        }
        .tab-trigger::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.06), transparent);
          opacity: 0;
          transition: opacity 0.25s;
        }
        .tab-trigger:hover::after { opacity: 1; }
        .shimmer-text {
          background: linear-gradient(90deg,
            #e2e8f0 0%,
            #93c5fd 40%,
            #e2e8f0 60%,
            #e2e8f0 100%
          );
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 4s linear infinite;
        }
        .glow-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #60a5fa;
          box-shadow: 0 0 8px 2px #60a5fa;
          animation: pulse 2s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 8px 2px rgba(96,165,250,0.8); }
          50%       { box-shadow: 0 0 16px 4px rgba(96,165,250,0.4); }
        }
      `}</style>

      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #0a0f1e 0%, #0d1b3e 40%, #07111f 100%)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* ── Ambient orbs ── */}
        <FloatingOrb size={520} top="-120px" left="-80px"  color="radial-gradient(circle, #1d4ed8, #0ea5e9)" delay={0}   duration={8}  />
        <FloatingOrb size={400} top="30%"   left="65%"   color="radial-gradient(circle, #0ea5e9, #6366f1)" delay={2}   duration={11} />
        <FloatingOrb size={300} top="70%"   left="10%"   color="radial-gradient(circle, #0f172a, #1e40af)" delay={1.5} duration={9}  />
        <FloatingOrb size={250} top="10%"   left="80%"   color="radial-gradient(circle, #7c3aed, #1d4ed8)" delay={3}   duration={13} />

        {/* ── Grid texture ── */}
        <GridOverlay />

        {/* ── Scanline sweep (subtle, slow) ── */}
        <div
          style={{
            position: "fixed",
            top: 0, left: 0, right: 0,
            height: "2px",
            background: "linear-gradient(90deg, transparent, rgba(99,179,237,0.2), transparent)",
            animation: "scanline 8s linear infinite",
            zIndex: 1,
            pointerEvents: "none",
          }}
        />

        {/* ── Header ── */}
        <div style={{ position: "relative", zIndex: 10 }}>
          <Header
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onTabChange={handleTabChange}
          />
        </div>

        {/* ── Main content ── */}
        <div
          className="container mx-auto px-6 py-8"
          style={{
            position: "relative",
            zIndex: 2,
            opacity: mounted ? 1 : 0,
            transform: mounted ? "none" : "translateY(24px)",
            transition: "opacity 0.7s ease, transform 0.7s cubic-bezier(.22,1,.36,1)",
          }}
        >
          {/* ── Page title ── */}
          <div className="mb-8" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div>
              <h1
                className="text-3xl font-bold mb-1"
                style={{
                  animation: "titleReveal 0.9s cubic-bezier(.22,1,.36,1) forwards",
                  fontFamily: "'DM Serif Display', Georgia, serif",
                  letterSpacing: "-0.01em",
                }}
              >
                <span className="shimmer-text">Personal Finance Dashboard</span>
              </h1>
              <p
                style={{
                  color: "rgba(148,163,184,0.85)",
                  fontSize: "0.95rem",
                  animation: "subtitleReveal 0.7s 0.3s ease both",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span className="glow-dot" />
                Manage your budget, track expenses, and get financial insights
              </p>
            </div>
          </div>

          {/* ── Tabs ── */}
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="mt-8"
          >
            {/* Tab list */}
            <TabsList
              className="grid w-full grid-cols-4"
              style={{
                background: "rgba(15,23,42,0.7)",
                backdropFilter: "blur(16px)",
                border: "1px solid rgba(99,179,237,0.15)",
                borderRadius: "16px",
                padding: "6px",
                animation: "pulse-border 4s ease infinite",
                boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
              }}
            >
              {tabs.map((tab, i) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className={`tab-trigger text-slate-300 rounded-xl font-medium ${
                    activeTab === tab.value ? "tab-trigger-active text-white" : ""
                  }`}
                  style={{
                    fontSize: "0.875rem",
                    letterSpacing: "0.02em",
                    padding: "10px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "7px",
                    animationDelay: `${i * 80}ms`,
                  }}
                >
                  <span style={{ fontSize: "0.75rem", opacity: 0.75 }}>{tab.icon}</span>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* ── DASHBOARD TAB ── */}
            <TabsContent
              value="dashboard"
              className={`mt-6 ${!tabAnimating && activeTab === "dashboard" ? "tab-content-enter" : ""}`}
            >
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Reveal delay={0}>
                    <GlassCard><PortfolioSummary /></GlassCard>
                  </Reveal>
                  <Reveal delay={80}>
                    <GlassCard><BudgetManager /></GlassCard>
                  </Reveal>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Reveal delay={140}>
                    <GlassCard><ExpenseChart /></GlassCard>
                  </Reveal>
                  <Reveal delay={200}>
                    <GlassCard><TransactionRateChart /></GlassCard>
                  </Reveal>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Reveal delay={260} className="lg:col-span-2">
                    <GlassCard>
                      <TransactionHistory
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                      />
                    </GlassCard>
                  </Reveal>
                  <Reveal delay={320}>
                    <GlassCard><CategoryBreakdownChart /></GlassCard>
                  </Reveal>
                </div>
              </div>
            </TabsContent>

            {/* ── BUDGET TAB ── */}
            <TabsContent
              value="budget"
              className={`mt-6 ${!tabAnimating && activeTab === "budget" ? "tab-content-enter" : ""}`}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Reveal delay={0}>
                  <GlassCard><BudgetManager /></GlassCard>
                </Reveal>
                <Reveal delay={100}>
                  <GlassCard><PortfolioSummary /></GlassCard>
                </Reveal>
              </div>
            </TabsContent>

            {/* ── TRANSACTIONS TAB ── */}
            <TabsContent
              value="transactions"
              className={`mt-6 ${!tabAnimating && activeTab === "transactions" ? "tab-content-enter" : ""}`}
            >
              <Reveal delay={0}>
                <GlassCard>
                  <TransactionHistory
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                  />
                </GlassCard>
              </Reveal>
            </TabsContent>

            {/* ── ASSISTANT TAB ── */}
            <TabsContent
              value="assistant"
              className={`mt-6 ${!tabAnimating && activeTab === "assistant" ? "tab-content-enter" : ""}`}
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Reveal delay={0} className="lg:col-span-2">
                  <GlassCard><FinanceChatbot /></GlassCard>
                </Reveal>
                <div className="space-y-6">
                  <Reveal delay={100}>
                    <GlassCard><PortfolioSummary /></GlassCard>
                  </Reveal>
                  <Reveal delay={180}>
                    <GlassCard><BudgetManager /></GlassCard>
                  </Reveal>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default Dashboard;