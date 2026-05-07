import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calculator,
  TrendingUp,
  Shield,
  MessageCircle,
  PieChart,
  Wallet,
  ArrowRight,
  CheckCircle,
  Star,
  Sparkles,
  Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

// ─── Utility: lightweight intersection-observer hook ───────────────────────
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); observer.disconnect(); } },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);
  return { ref, inView };
}

// ─── Animated counter ──────────────────────────────────────────────────────
function AnimatedNumber({ target, prefix = "", suffix = "", duration = 1800 }: {
  target: number; prefix?: string; suffix?: string; duration?: number;
}) {
  const [value, setValue] = useState(0);
  const { ref, inView } = useInView();
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setValue(target); clearInterval(timer); }
      else setValue(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target, duration]);
  return <span ref={ref}>{prefix}{value.toLocaleString()}{suffix}</span>;
}

// ─── Floating particle background ─────────────────────────────────────────
function Particles() {
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    size: Math.random() * 4 + 1,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: Math.random() * 20 + 15,
    delay: Math.random() * 10,
    opacity: Math.random() * 0.4 + 0.1,
  }));
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full bg-blue-400"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
            opacity: p.opacity,
            animation: `floatParticle ${p.duration}s ${p.delay}s infinite ease-in-out`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Glow orb background decoration ──────────────────────────────────────
function GlowOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-blue-600/20 blur-[120px] animate-pulse-slow" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-purple-600/20 blur-[120px] animate-pulse-slow" style={{ animationDelay: "2s" }} />
      <div className="absolute top-[40%] left-[50%] w-[300px] h-[300px] rounded-full bg-cyan-500/10 blur-[80px] animate-pulse-slow" style={{ animationDelay: "4s" }} />
    </div>
  );
}

// ─── Section fade-in wrapper ───────────────────────────────────────────────
function FadeIn({ children, delay = 0, className = "" }: {
  children: React.ReactNode; delay?: number; className?: string;
}) {
  const { ref, inView } = useInView();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(40px)",
        transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

// ─── Typing animation ─────────────────────────────────────────────────────
function TypingText({ phrases }: { phrases: string[] }) {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = phrases[phraseIndex];
    let timeout: ReturnType<typeof setTimeout>;
    if (!deleting && displayed.length < current.length) {
      timeout = setTimeout(() => setDisplayed(current.slice(0, displayed.length + 1)), 60);
    } else if (!deleting && displayed.length === current.length) {
      timeout = setTimeout(() => setDeleting(true), 1800);
    } else if (deleting && displayed.length > 0) {
      timeout = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 35);
    } else if (deleting && displayed.length === 0) {
      setDeleting(false);
      setPhraseIndex((i) => (i + 1) % phrases.length);
    }
    return () => clearTimeout(timeout);
  }, [displayed, deleting, phraseIndex, phrases]);

  return (
    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-500">
      {displayed}
      <span className="animate-blink text-blue-400">|</span>
    </span>
  );
}

// ─── Tilt card wrapper ─────────────────────────────────────────────────────
function TiltCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const handleMouseMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 16;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -16;
    el.style.transform = `perspective(800px) rotateX(${y}deg) rotateY(${x}deg) scale(1.02)`;
  };
  const handleMouseLeave = () => {
    if (ref.current) ref.current.style.transform = "perspective(800px) rotateX(0) rotateY(0) scale(1)";
  };
  return (
    <div
      ref={ref}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ transition: "transform 0.2s ease", willChange: "transform" }}
    >
      {children}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────
export const LandingPage = () => {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTimeout(() => setMounted(true), 100);
  }, []);

  const features = [
    {
      icon: <PieChart className="h-8 w-8" />,
      color: "from-blue-500 to-cyan-500",
      glow: "rgba(59,130,246,0.3)",
      title: "Smart Budget Management",
      description: "Track your income and expenses with intelligent categorization and spending insights.",
    },
    {
      icon: <TrendingUp className="h-8 w-8" />,
      color: "from-emerald-500 to-teal-500",
      glow: "rgba(16,185,129,0.3)",
      title: "Financial Analytics",
      description: "Get detailed reports and visualizations to understand your financial patterns.",
    },
    {
      icon: <MessageCircle className="h-8 w-8" />,
      color: "from-purple-500 to-pink-500",
      glow: "rgba(168,85,247,0.3)",
      title: "AI Financial Assistant",
      description: "Chat with our AI to get personalized financial advice and answers to your questions.",
    },
    {
      icon: <Shield className="h-8 w-8" />,
      color: "from-orange-500 to-red-500",
      glow: "rgba(249,115,22,0.3)",
      title: "Secure & Private",
      description: "Your financial data is encrypted and protected with bank-level security.",
    },
  ];

  const benefits = [
    "Track expenses automatically",
    "Set and monitor budgets",
    "Get AI-powered insights",
    "Visualize spending patterns",
    "Receive personalized advice",
    "Export financial reports",
  ];

  const stats = [
    { value: 10000, suffix: "+", label: "Happy Users" },
    { value: 98, suffix: "%", label: "Satisfaction Rate" },
    { value: 4, prefix: "$", suffix: "B+", label: "Tracked Annually" },
    { value: 24, suffix: "/7", label: "AI Support" },
  ];

  return (
    <>
      {/* ── Global animation styles ── */}
      <style>{`
        @keyframes floatParticle {
          0%, 100% { transform: translateY(0) translateX(0) scale(1); opacity: 0.2; }
          33%       { transform: translateY(-30px) translateX(15px) scale(1.2); opacity: 0.6; }
          66%       { transform: translateY(-15px) translateX(-10px) scale(0.8); opacity: 0.3; }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50%       { opacity: 1; transform: scale(1.08); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-12px); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50%       { background-position: 100% 50%; }
        }
        @keyframes slide-in-right {
          from { opacity: 0; transform: translateX(60px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .animate-pulse-slow  { animation: pulse-slow 6s ease-in-out infinite; }
        .animate-blink       { animation: blink 1s step-end infinite; }
        .animate-float       { animation: float 4s ease-in-out infinite; }
        .animate-spin-slow   { animation: spin-slow 20s linear infinite; }
        .shimmer-text {
          background: linear-gradient(90deg, #93c5fd, #a78bfa, #67e8f9, #93c5fd);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 3s linear infinite;
        }
        .gradient-border {
          position: relative;
          background: linear-gradient(135deg, rgba(59,130,246,0.1), rgba(168,85,247,0.1));
          border: 1px solid transparent;
        }
        .gradient-border::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          padding: 1px;
          background: linear-gradient(135deg, rgba(59,130,246,0.5), rgba(168,85,247,0.5));
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
        }
        .card-hover {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .card-hover:hover {
          transform: translateY(-6px);
        }
        .btn-glow {
          position: relative;
          overflow: hidden;
        }
        .btn-glow::after {
          content: "";
          position: absolute;
          inset: -2px;
          border-radius: inherit;
          background: linear-gradient(90deg, #3b82f6, #8b5cf6, #3b82f6);
          background-size: 200% auto;
          animation: shimmer 2s linear infinite;
          z-index: -1;
          filter: blur(8px);
          opacity: 0;
          transition: opacity 0.3s;
        }
        .btn-glow:hover::after { opacity: 1; }
        .number-animate { font-variant-numeric: tabular-nums; }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 relative">

        {/* ── Header ────────────────────────────────────────────────────── */}
        <header
          className="border-b border-slate-700/50 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(-20px)",
            transition: "opacity 0.6s ease, transform 0.6s ease",
          }}
        >
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative p-2 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl shadow-lg shadow-blue-500/30 animate-float">
                  <Calculator className="h-6 w-6 text-white" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                </div>
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  Finance<span className="shimmer-text">GPT</span>
                </h1>
                <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs">
                  <Sparkles className="h-3 w-3 mr-1" /> AI Powered
                </Badge>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  className="text-slate-300 hover:text-white hover:bg-slate-700/50"
                  onClick={() => navigate("/login")}
                >
                  Sign In
                </Button>
                <Button
                  className="btn-glow bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white shadow-lg shadow-blue-500/25 border border-blue-500/30"
                  onClick={() => navigate("/register")}
                >
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <section className="relative py-28 px-6 overflow-hidden">
          <GlowOrbs />
          <Particles />

          {/* Rotating ring decoration */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full border border-blue-500/10 animate-spin-slow pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-purple-500/10 animate-spin-slow pointer-events-none" style={{ animationDirection: "reverse", animationDuration: "30s" }} />

          <div className="container mx-auto text-center relative z-10">
            <div
              className="max-w-4xl mx-auto"
              style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? "translateY(0)" : "translateY(30px)",
                transition: "opacity 0.9s ease 0.2s, transform 0.9s ease 0.2s",
              }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-sm mb-8 backdrop-blur-sm">
                <Zap className="h-4 w-4 text-yellow-400" />
                Powered by advanced AI — smarter than ever
              </div>

              <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight tracking-tight">
                Take Control of Your
                <br />
                <TypingText phrases={["Financial Future", "Money Goals", "Spending Habits", "Investment Path"]} />
              </h1>

              <p
                className="text-xl text-slate-400 mb-10 leading-relaxed max-w-2xl mx-auto"
                style={{
                  opacity: mounted ? 1 : 0,
                  transition: "opacity 0.9s ease 0.5s",
                }}
              >
                FinanceGPT is your intelligent personal finance assistant that helps you budget,
                track expenses, and make smarter financial decisions with AI-powered insights.
              </p>

              <div
                className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
                style={{
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? "translateY(0)" : "translateY(20px)",
                  transition: "opacity 0.9s ease 0.7s, transform 0.9s ease 0.7s",
                }}
              >
                <Button
                  size="lg"
                  className="btn-glow group bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-purple-600 text-white px-10 py-6 text-lg rounded-xl shadow-xl shadow-blue-500/20 border border-blue-400/20 transition-all duration-300"
                  onClick={() => navigate("/register")}
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-slate-600 text-slate-200 hover:bg-slate-700/60 hover:border-slate-500 px-10 py-6 text-lg rounded-xl backdrop-blur-sm transition-all duration-300"
                >
                  Watch Demo
                </Button>
              </div>

              {/* Trust bar */}
              <div
                className="flex flex-wrap items-center justify-center gap-6 text-slate-400 text-sm"
                style={{ opacity: mounted ? 1 : 0, transition: "opacity 1s ease 1s" }}
              >
                {[
                  { icon: <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />, text: "4.9 / 5 Rating" },
                  { text: "10,000+ Happy Users" },
                  { text: "Bank-Level Security" },
                  { text: "No Credit Card Required" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    {i > 0 && <div className="h-3 w-px bg-slate-600 hidden sm:block" />}
                    {item.icon}
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Stats Bar ─────────────────────────────────────────────────── */}
        <section className="relative py-12 px-6">
          <div className="container mx-auto">
            <FadeIn>
              <div className="gradient-border rounded-2xl p-8 backdrop-blur-sm">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                  {stats.map((stat, i) => (
                    <div key={i} className="text-center">
                      <div className="text-4xl font-bold text-white number-animate mb-1">
                        <AnimatedNumber
                          target={stat.value}
                          prefix={stat.prefix}
                          suffix={stat.suffix}
                        />
                      </div>
                      <div className="text-slate-400 text-sm">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* ── Features ──────────────────────────────────────────────────── */}
        <section className="py-24 px-6 bg-slate-900/30 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22[w3.org](http://www.w3.org/2000/svg%22%3E%3Cg) fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.015%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50" />
          <div className="container mx-auto relative z-10">
            <FadeIn className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
                Everything You Need to{" "}
                <span className="shimmer-text">Master Your Finances</span>
              </h2>
              <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                Powerful tools and AI-driven insights to help you achieve your financial goals
              </p>
            </FadeIn>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <FadeIn key={index} delay={index * 0.12}>
                  <TiltCard>
                    <Card
                      className="card-hover h-full bg-slate-800/40 border-slate-700/50 backdrop-blur-sm overflow-hidden relative group"
                      style={{
                        boxShadow: `0 0 0 0 ${feature.glow}`,
                        transition: "box-shadow 0.3s ease, transform 0.3s ease",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.boxShadow = `0 0 30px 5px ${feature.glow}`)
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.boxShadow = `0 0 0 0 ${feature.glow}`)
                      }
                    >
                      {/* Top gradient bar */}
                      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${feature.color}`} />

                      <CardHeader className="pb-3">
                        <div
                          className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.color} text-white mb-4 w-fit shadow-lg`}
                        >
                          {feature.icon}
                        </div>
                        <CardTitle className="text-white text-lg font-semibold">
                          {feature.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CardDescription className="text-slate-400 leading-relaxed">
                          {feature.description}
                        </CardDescription>
                      </CardContent>

                      {/* Hover shine */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-lg" />
                    </Card>
                  </TiltCard>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ── Benefits ──────────────────────────────────────────────────── */}
        <section className="py-24 px-6 relative overflow-hidden">
          <div className="container mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              {/* Left */}
              <FadeIn>
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-sm mb-6">
                    <Sparkles className="h-3 w-3" /> Why 10,000+ users love us
                  </div>
                  <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight leading-tight">
                    Why Choose{" "}
                    <span className="shimmer-text">FinanceGPT?</span>
                  </h2>
                  <p className="text-xl text-slate-400 mb-10 leading-relaxed">
                    Join thousands of users who have transformed their financial lives with
                    our intelligent assistant.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {benefits.map((benefit, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-3 group"
                        style={{
                          opacity: 0,
                          animation: `fadeSlideIn 0.5s ease ${0.1 + index * 0.08}s forwards`,
                        }}
                      >
                        <style>{`
                          @keyframes fadeSlideIn {
                            from { opacity: 0; transform: translateX(-16px); }
                            to   { opacity: 1; transform: translateX(0); }
                          }
                        `}</style>
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500/30 transition-colors">
                          <CheckCircle className="h-4 w-4 text-emerald-400" />
                        </div>
                        <span className="text-slate-300 group-hover:text-white transition-colors">
                          {benefit}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-10">
                    <Button
                      className="btn-glow bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-8 py-5 rounded-xl shadow-xl shadow-blue-500/20 border border-blue-400/20 text-base group"
                      onClick={() => navigate("/register")}
                    >
                      Start Your Journey
                      <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </div>
                </div>
              </FadeIn>

              {/* Right — Dashboard preview */}
              <FadeIn delay={0.2}>
                <div className="relative">
                  {/* Outer glow ring */}
                  <div className="absolute -inset-4 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-3xl blur-xl" />

                  <TiltCard>
                    <Card className="relative gradient-border bg-slate-900/80 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl">
                      {/* Fake window chrome */}
                      <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-700/50">
                        <div className="w-3 h-3 rounded-full bg-red-400/80" />
                        <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
                        <div className="w-3 h-3 rounded-full bg-green-400/80" />
                        <div className="ml-auto flex items-center gap-2 text-xs text-slate-400">
                          <Wallet className="h-3 w-3" />
                          Dashboard
                        </div>
                      </div>

                      <CardContent className="p-6 space-y-5">
                        {/* Balance */}
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-slate-400 text-sm mb-1">Total Balance</p>
                            <p className="text-4xl font-bold text-white tracking-tight">
                              $12,547<span className="text-2xl text-slate-400">.32</span>
                            </p>
                          </div>
                          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                            <TrendingUp className="h-3 w-3 mr-1" /> +7.6%
                          </Badge>
                        </div>

                        {/* Progress bar */}
                        <div>
                          <div className="flex justify-between text-xs text-slate-400 mb-2">
                            <span>Budget Used</span>
                            <span>77%</span>
                          </div>
                          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                              style={{ width: "77%", transition: "width 1.5s ease" }}
                            />
                          </div>
                        </div>

                        {/* Income / Expenses */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                            <p className="text-slate-400 text-xs mb-1">Monthly Income</p>
                            <p className="text-emerald-400 font-bold text-lg">+$4,200</p>
                          </div>
                          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                            <p className="text-slate-400 text-xs mb-1">Monthly Expenses</p>
                            <p className="text-red-400 font-bold text-lg">-$3,247</p>
                          </div>
                        </div>

                        {/* Recent transactions */}
                        <div className="space-y-3">
                          <p className="text-slate-400 text-xs uppercase tracking-wider">Recent</p>
                          {[
                            { label: "Spotify", cat: "Entertainment", amount: "-$9.99", color: "text-red-400" },
                            { label: "Salary", cat: "Income", amount: "+$4,200", color: "text-emerald-400" },
                            { label: "Groceries", cat: "Food", amount: "-$84.30", color: "text-red-400" },
                          ].map((tx, i) => (
                            <div key={i} className="flex items-center justify-between py-2 border-b border-slate-700/30 last:border-0">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-slate-700/60 flex items-center justify-center text-xs text-slate-300 font-medium">
                                  {tx.label[0]}
                                </div>
                                <div>
                                  <p className="text-white text-sm font-medium">{tx.label}</p>
                                  <p className="text-slate-500 text-xs">{tx.cat}</p>
                                </div>
                              </div>
                              <span className={`text-sm font-semibold ${tx.color}`}>{tx.amount}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TiltCard>

                  {/* Floating badge */}
                  <div
                    className="absolute -bottom-4 -right-4 bg-gradient-to-br from-blue-600 to-purple-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg shadow-blue-500/30 animate-float"
                    style={{ animationDelay: "1s" }}
                  >
                    AI Analyzing... ✨
                  </div>
                </div>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* ── CTA ───────────────────────────────────────────────────────── */}
        <section className="py-28 px-6 relative overflow-hidden">
          {/* Animated gradient background */}
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(135deg, rgba(59,130,246,0.15), rgba(168,85,247,0.15), rgba(59,130,246,0.15))",
              backgroundSize: "300% 300%",
              animation: "gradient-shift 8s ease infinite",
            }}
          />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(59,130,246,0.1)_0%,transparent_70%)]" />

          <FadeIn>
            <div className="container mx-auto text-center relative z-10">
              <div className="max-w-3xl mx-auto">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-sm mb-8">
                  <Sparkles className="h-4 w-4" /> Ready to get started?
                </div>
                <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight leading-tight">
                  Transform Your{" "}
                  <span className="shimmer-text">Finances Today</span>
                </h2>
                <p className="text-xl text-slate-400 mb-10 leading-relaxed">
                  Start your journey to financial freedom with FinanceGPT's intelligent tools and
                  personalized guidance.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    size="lg"
                    className="btn-glow group bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-purple-600 text-white px-14 py-6 text-lg rounded-xl shadow-2xl shadow-blue-500/30 border border-blue-400/20 transition-all duration-300"
                    onClick={() => navigate("/dashboard")}
                  >
                    Get Started Now
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </div>
                <p className="text-slate-500 mt-5 text-sm">
                  No credit card required · 14-day free trial · Cancel anytime
                </p>
              </div>
            </div>
          </FadeIn>
        </section>

        {/* ── Footer ────────────────────────────────────────────────────── */}
        <footer className="border-t border-slate-700/50 bg-slate-900/60 backdrop-blur-md py-10 px-6">
          <div className="container mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl shadow-lg shadow-blue-500/30">
                  <Calculator className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">
                  Finance<span className="shimmer-text">GPT</span>
                </span>
              </div>
              <p className="text-slate-500 text-sm">
                © 2025 FinanceGPT. All rights reserved. Your trusted personal finance assistant.
              </p>
              <div className="flex items-center gap-4 text-slate-500 text-sm">
                <a href="#" className="hover:text-slate-300 transition-colors">Privacy</a>
                <a href="#" className="hover:text-slate-300 transition-colors">Terms</a>
                <a href="#" className="hover:text-slate-300 transition-colors">Contact</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};
