import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowRight,
  Crown,
  Gift,
  Loader2,
  Phone,
  Play,
  Shield,
  Star,
  TrendingUp,
  Users,
  Video,
  Wallet,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { getActorWithRetry, normalizePhone } from "../globalActor";
import { usePhoneAuth } from "../hooks/usePhoneAuth";

const LEVEL_EARNINGS = [
  { level: "1", amount: "₹10" },
  { level: "2", amount: "₹5" },
  { level: "3", amount: "₹4" },
  { level: "4", amount: "₹3" },
  { level: "5", amount: "₹2" },
  { level: "6", amount: "₹1" },
  { level: "7", amount: "₹0.50" },
  { level: "8–15", amount: "₹0.25" },
];

const FEATURES = [
  {
    icon: Gift,
    title: "₹150 Joining Bonus",
    desc: "Instant wallet credit when you join",
    color: "text-green-400",
  },
  {
    icon: TrendingUp,
    title: "15-Level Earnings",
    desc: "Earn from your entire referral network",
    color: "text-blue-400",
  },
  {
    icon: Video,
    title: "Premium Video Library",
    desc: "Exclusive content for paid members",
    color: "text-purple-400",
  },
  {
    icon: Users,
    title: "Matrix Network",
    desc: "3x15 matrix, each slot earns you money",
    color: "text-pink-400",
  },
  {
    icon: Wallet,
    title: "Instant Withdrawals",
    desc: "Transfer earnings to your bank (min ₹500)",
    color: "text-amber",
  },
  {
    icon: Shield,
    title: "ICP Blockchain",
    desc: "All data secured on Internet Computer",
    color: "text-cyan-400",
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const phoneAuth = usePhoneAuth();
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<"idle" | "checking" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // Auto-login if returning user
  useEffect(() => {
    if (phoneAuth.isLoggedIn && phoneAuth.phone) {
      navigate({ to: "/dashboard" });
    }
  }, [phoneAuth.isLoggedIn, phoneAuth.phone, navigate]);

  const handleLogin = async () => {
    const raw = phone.trim();
    if (!raw) {
      setErrorMsg("Please enter your mobile number.");
      setStatus("error");
      return;
    }
    const normalized = normalizePhone(raw);
    if (normalized.length !== 10) {
      setErrorMsg("Please enter a valid 10-digit mobile number.");
      setStatus("error");
      return;
    }
    setStatus("checking");
    setErrorMsg("");
    try {
      const actor = await getActorWithRetry();
      const user = await actor.getUserByPhone(normalized);
      if (user) {
        phoneAuth.login(user.phone, user.id, user.name);
        if (user.isPaid) {
          navigate({ to: "/dashboard" });
        } else {
          navigate({ to: "/register", search: { step: "payment" } });
        }
      } else {
        // New user — go to register
        navigate({ to: "/register", search: { ref: undefined } });
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Connection failed. Please retry.";
      setErrorMsg(msg);
      setStatus("error");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-card via-background to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,oklch(0.82_0.16_85/0.08)_0%,transparent_60%)]" />

        <div className="relative max-w-5xl mx-auto px-4 pt-10 pb-16 sm:pt-16 sm:pb-24">
          {/* App name */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3 mb-8"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center glow-gold">
              <Crown className="w-5 h-5 text-primary" />
            </div>
            <span className="font-display text-2xl font-bold text-gradient-gold">
              Tm11<span className="text-foreground/70">prime</span>Time
            </span>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Tagline */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <h1 className="font-display text-4xl sm:text-5xl font-bold leading-tight mb-4">
                Earn While You{" "}
                <span className="text-gradient-gold">Connect &amp; Watch</span>
              </h1>
              <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
                Join Tm11primeTime — India's premier multi-level matrix platform
                with a premium video library. Earn ₹150 joining bonus and build
                your network across 15 levels.
              </p>
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Star className="w-4 h-4 text-primary" />
                  <span>₹150 Joining Bonus</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Star className="w-4 h-4 text-primary" />
                  <span>15-Level Matrix</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Star className="w-4 h-4 text-primary" />
                  <span>Premium Videos</span>
                </div>
              </div>
            </motion.div>

            {/* Right: Login card */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="bg-card border-border shadow-card">
                <CardContent className="p-6">
                  <h2 className="font-display text-xl font-semibold mb-1">
                    Login / Register
                  </h2>
                  <p className="text-muted-foreground text-sm mb-5">
                    Enter your mobile number to continue
                  </p>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="lp-phone"
                        className="text-foreground/80 text-sm"
                      >
                        Mobile Number
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="lp-phone"
                          name="phone"
                          type="tel"
                          inputMode="numeric"
                          placeholder="10-digit mobile number"
                          value={phone}
                          onChange={(e) => {
                            setPhone(e.target.value);
                            setStatus("idle");
                            setErrorMsg("");
                          }}
                          onKeyDown={handleKeyDown}
                          disabled={status === "checking"}
                          className="pl-10 bg-secondary border-border"
                          data-ocid="login.input"
                          autoComplete="tel"
                        />
                      </div>
                    </div>

                    {status === "error" && errorMsg && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="flex items-start gap-2 text-destructive text-sm"
                        data-ocid="login.error_state"
                      >
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>{errorMsg}</span>
                      </motion.div>
                    )}

                    <Button
                      onClick={handleLogin}
                      disabled={status === "checking"}
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-ui font-semibold"
                      data-ocid="login.primary_button"
                    >
                      {status === "checking" ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Checking your account…
                        </>
                      ) : (
                        <>
                          Continue
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>

                    <p className="text-center text-xs text-muted-foreground">
                      New user? Enter your number and we'll guide you through
                      registration.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-5xl mx-auto px-4 py-12">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="font-display text-2xl font-bold text-center mb-8"
        >
          Why Join Tm11primeTime?
        </motion.h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="bg-card border-border h-full card-hover">
                <CardContent className="p-5">
                  <f.icon className={`w-7 h-7 mb-3 ${f.color}`} />
                  <h3 className="font-ui font-semibold text-base mb-1">
                    {f.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">{f.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Earnings Table */}
      <section className="max-w-5xl mx-auto px-4 py-8 pb-16">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <h2 className="font-display text-2xl font-bold text-center mb-2">
            Matrix Earnings Structure
          </h2>
          <p className="text-center text-muted-foreground text-sm mb-8">
            Earn on every join in your 15-level referral network
          </p>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {LEVEL_EARNINGS.map((e) => (
              <div
                key={e.level}
                className="bg-card border border-border rounded-xl p-3 text-center"
              >
                <div className="text-xs text-muted-foreground mb-1 font-ui">
                  Level {e.level}
                </div>
                <div className="font-display font-bold text-primary text-sm">
                  {e.amount}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* CTA */}
      <section className="bg-card border-t border-border">
        <div className="max-w-5xl mx-auto px-4 py-12 text-center">
          <Play className="w-10 h-10 text-primary mx-auto mb-4" />
          <h2 className="font-display text-2xl font-bold mb-3">
            Ready to Start Earning?
          </h2>
          <p className="text-muted-foreground mb-6">
            Join thousands of members and start earning from your network today.
          </p>
          <Button
            onClick={() => navigate({ to: "/register" })}
            size="lg"
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-ui font-semibold px-8"
            data-ocid="landing.primary_button"
          >
            Join Now — ₹118 only
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-6">
        <p className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Tm11primeTime. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
