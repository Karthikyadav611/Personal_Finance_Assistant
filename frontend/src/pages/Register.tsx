import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { useNavigate } from "react-router-dom";

import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
} from "lucide-react";

import { motion } from "framer-motion";
import { API_BASE_URL } from "@/config/api";

interface RegisterForm {
  name: string;
  email: string;
  password: string;
}

export const RegisterPage = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState<RegisterForm>({
    name: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async () => {
    setError("");

    if (!form.name || !form.email || !form.password) {
      setError("All fields are required");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));

        throw new Error(errData.message || "Failed to register");
      }

      navigate("/login");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0b1020] px-4 py-10">

      {/* Background Glow */}
      <div className="absolute top-0 left-0 h-[400px] w-[400px] rounded-full bg-purple-700/30 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-blue-700/20 blur-3xl" />

      {/* Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md"
      >
        <Card className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl shadow-2xl shadow-purple-900/20">

          <CardHeader className="space-y-3 pb-2 text-center">

            {/* Logo */}
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-violet-700 shadow-lg shadow-purple-700/30">
              <span className="text-2xl font-bold text-white">₹</span>
            </div>

            <CardTitle className="text-3xl font-bold tracking-tight text-white">
              Create Account
            </CardTitle>

            <CardDescription className="text-sm text-slate-300">
              Start managing your finances smarter with AI
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5 pt-6">

            {/* Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                Full Name
              </label>

              <div className="relative">
                <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <Input
                  name="name"
                  placeholder="Enter your full name"
                  value={form.name}
                  onChange={handleChange}
                  autoComplete="off"
                  className="h-12 rounded-xl border border-slate-700 bg-slate-900/70 pl-11 text-white placeholder:text-slate-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                Email Address
              </label>

              <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <Input
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="off"
                  className="h-12 rounded-xl border border-slate-700 bg-slate-900/70 pl-11 text-white placeholder:text-slate-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                Password
              </label>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <Input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Create a password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  className="h-12 rounded-xl border border-slate-700 bg-slate-900/70 pl-11 pr-12 text-white placeholder:text-slate-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300"
              >
                {error}
              </motion.div>
            )}

            {/* Register Button */}
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="group h-12 w-full rounded-xl bg-gradient-to-r from-purple-600 to-violet-700 text-white transition-all duration-300 hover:scale-[1.01] hover:from-purple-500 hover:to-violet-600 hover:shadow-lg hover:shadow-purple-700/30"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <div className="flex items-center gap-2">
                  Create Account
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              )}
            </Button>

            {/* Footer */}
            <p className="text-center text-sm text-slate-400">
              Already have an account?{" "}

              <span
                onClick={() => navigate("/login")}
                className="cursor-pointer font-medium text-purple-400 transition-colors hover:text-purple-300"
              >
                Login
              </span>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
