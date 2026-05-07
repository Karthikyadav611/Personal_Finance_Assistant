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
import { Eye, EyeOff,Mail, Lock, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { API_BASE_URL } from "@/config/api";

interface LoginForm {
  email: string;
  password: string;
}

export const LoginPage = () => {
  const navigate = useNavigate();
const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState<LoginForm>({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async () => {
    setError("");

    if (!form.email || !form.password) {
      setError("Email and password are required");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.message || "Login failed");
      }

      localStorage.setItem("token", data.token);

      navigate("/dashboard");
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
        <Card className="border border-white/10 bg-white/5 backdrop-blur-2xl shadow-2xl shadow-purple-900/20 rounded-3xl overflow-hidden">
          <CardHeader className="space-y-3 pb-2 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-violet-700 shadow-lg shadow-purple-700/30">
              <span className="text-2xl font-bold text-white">₹</span>
            </div>

            <CardTitle className="text-3xl font-bold text-white tracking-tight">
              Welcome Back
            </CardTitle>

            <CardDescription className="text-slate-300 text-sm">
              Login to your AI-powered finance assistant
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5 pt-6">
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

         <div className="space-y-2">
  <div className="flex items-center justify-between">
    <label className="text-sm font-medium text-slate-300">
      Password
    </label>

    <button className="text-xs text-purple-400 hover:text-purple-300 transition-colors">
      Forgot password?
    </button>
  </div>

  <div className="relative">
    <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

    <Input
      type={showPassword ? "text" : "password"}
      name="password"
      placeholder="Enter your password"
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

            {/* Login Button */}
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="group h-12 w-full rounded-xl bg-gradient-to-r from-purple-600 to-violet-700 text-white transition-all duration-300 hover:scale-[1.01] hover:from-purple-500 hover:to-violet-600 hover:shadow-lg hover:shadow-purple-700/30"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <div className="flex items-center gap-2">
                  Login
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              )}
            </Button>

            {/* Divider */}
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-700" />
              </div>

              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-transparent px-3 text-slate-500">
                  Secure Authentication
                </span>
              </div>
            </div>

            {/* Register */}
            <p className="text-center text-sm text-slate-400">
              Don&apos;t have an account?{" "}

              <span
                onClick={() => navigate("/register")}
                className="cursor-pointer font-medium text-purple-400 transition-colors hover:text-purple-300"
              >
                Create Account
              </span>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
