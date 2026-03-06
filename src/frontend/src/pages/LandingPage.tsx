import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Crown,
  Loader2,
  Play,
  Shield,
  Star,
  TrendingUp,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const LEVEL_EARNINGS = [
  { level: 1, amount: "₹10" },
  { level: 2, amount: "₹5" },
  { level: 3, amount: "₹4" },
  { level: 4, amount: "₹3" },
  { level: 5, amount: "₹2" },
  { level: 6, amount: "₹1" },
  { level: 7, amount: "₹0.50" },
  { level: "8-15", amount: "₹0.25" },
];

const features = [
  {
    icon: Crown,
    title: "₹150 Joining Bonus",
    desc: "Instant credit to your wallet on membership activation",
  },
  {
    icon: TrendingUp,
    title: "15-Level Earnings",
    desc: "Earn on every referral up to 15 levels deep in your network",
  },
  {
    icon: Play,
    title: "Premium Content",
    desc: "Tutorials, Entertainment, Wellness, Devotional & more",
  },
  {
    icon: Shield,
    title: "Secure Platform",
    desc: "Built on Internet Computer for decentralized security",
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { login, isLoggingIn, isInitializing, identity } =
    useInternetIdentity();

  const handleLogin = () => {
    if (identity) {
      navigate({ to: "/dashboard" });
      return;
    }
    login();
  };

  // Redirect if already authenticated
  if (identity && !isInitializing) {
    navigate({ to: "/dashboard" });
    return null;
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col">
        {/* Background */}
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url('/assets/generated/hero-banner.dim_1920x600.jpg')`,
            backgroundSize: "cover",
            backgroundPosition: "center top",
          }}
        />
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-background/50 via-background/70 to-background" />
        <div className="absolute inset-0 z-0 bg-gradient-to-r from-background/60 via-transparent to-background/60" />

        {/* Header */}
        <header className="relative z-10 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center glow-gold animate-pulse-gold">
              <Crown className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-black text-xl text-gradient-gold">
              Tm11primeTime
            </span>
          </div>
          <Button
            onClick={() => navigate({ to: "/register" })}
            variant="outline"
            className="border-primary/60 text-primary hover:bg-primary hover:text-primary-foreground font-ui"
            data-ocid="landing.register.button"
          >
            Join Now
          </Button>
        </header>

        {/* Hero Content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 py-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-primary/20 border border-primary/30 rounded-full px-4 py-1.5 mb-6">
              <Star className="w-4 h-4 text-primary fill-primary" />
              <span className="text-primary text-sm font-ui font-medium">
                India's Premium Referral Platform
              </span>
            </div>

            <h1 className="font-display font-black text-4xl md:text-6xl lg:text-7xl mb-4 leading-tight">
              <span className="text-foreground">Earn While You</span>
              <br />
              <span className="text-gradient-gold">Watch & Share</span>
            </h1>

            <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto mb-10 font-body leading-relaxed">
              Join Tm11primeTime — get ₹150 joining bonus instantly, access
              premium video content, and earn through 15 levels of referrals.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                size="lg"
                onClick={() => navigate({ to: "/register" })}
                className="bg-primary text-primary-foreground hover:opacity-90 font-display font-bold text-lg px-8 py-6 glow-gold"
                data-ocid="landing.join.primary_button"
              >
                Join Now — ₹118 only
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={handleLogin}
                disabled={isLoggingIn || isInitializing}
                className="border-border text-foreground hover:bg-secondary font-ui text-base px-8 py-6"
                data-ocid="landing.login.button"
              >
                {isLoggingIn ? (
                  <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                ) : null}
                {isLoggingIn ? "Connecting..." : "Login"}
              </Button>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap justify-center gap-8 mt-16">
              {[
                { label: "Joining Bonus", value: "₹150" },
                { label: "Membership Fee", value: "₹118" },
                { label: "Referral Levels", value: "15" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="font-display font-black text-3xl text-gradient-gold">
                    {stat.value}
                  </div>
                  <div className="text-muted-foreground text-sm font-ui mt-1">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="font-display font-black text-3xl md:text-4xl text-foreground mb-3">
            Why Join <span className="text-gradient-gold">Tm11primeTime?</span>
          </h2>
          <p className="text-muted-foreground font-body max-w-xl mx-auto">
            A complete ecosystem for earning, learning, and entertainment.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((feat, i) => (
            <motion.div
              key={feat.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            >
              <Card className="card-premium h-full hover:border-primary/40 transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center mb-4">
                    <feat.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-display font-bold text-foreground mb-2">
                    {feat.title}
                  </h3>
                  <p className="text-muted-foreground text-sm font-body leading-relaxed">
                    {feat.desc}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Level Earnings Section */}
      <section className="py-20 px-6 bg-card/50">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-display font-black text-3xl md:text-4xl text-foreground mb-3">
              Level <span className="text-gradient-gold">Earnings Plan</span>
            </h2>
            <p className="text-muted-foreground font-body">
              Earn on every new member that joins under your referral network
            </p>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {LEVEL_EARNINGS.map((item, i) => (
              <motion.div
                key={String(item.level)}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <div
                  className={`rounded-xl p-4 text-center border transition-all duration-300 ${
                    i === 0
                      ? "bg-primary/20 border-primary/40 glow-gold"
                      : "bg-card border-border hover:border-primary/30"
                  }`}
                >
                  <div className="text-muted-foreground text-xs font-ui mb-1">
                    Level {item.level}
                  </div>
                  <div
                    className={`font-display font-black text-xl ${
                      i === 0 ? "text-gradient-gold" : "text-foreground"
                    }`}
                  >
                    {item.amount}
                  </div>
                  <div className="text-muted-foreground text-xs font-ui mt-1">
                    per join
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-display font-black text-3xl md:text-4xl text-foreground mb-4">
            Ready to Start <span className="text-gradient-gold">Earning?</span>
          </h2>
          <p className="text-muted-foreground font-body mb-8 max-w-lg mx-auto">
            Pay ₹118 (₹100 + 18% GST), get ₹150 joining bonus, and start earning
            through your referral network today.
          </p>
          <Button
            size="lg"
            onClick={() => navigate({ to: "/register" })}
            className="bg-primary text-primary-foreground hover:opacity-90 font-display font-bold text-lg px-10 py-6 glow-gold"
            data-ocid="landing.cta.primary_button"
          >
            Get Started Now
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6 text-center">
        <p className="text-muted-foreground text-sm font-body">
          © {new Date().getFullYear()} Tm11primeTime. Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
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
