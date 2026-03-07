import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Crown,
  Lock,
  MessageCircle,
  Play,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { ReferralNode } from "../backend.d";
import { usePhoneAuth } from "../hooks/usePhoneAuth";
import { useReferralTreeByCode, useUserByPhone } from "../hooks/useQueries";

// ─── Tree Node Component ──────────────────────────────────────────────────────

interface TreeNodeProps {
  node: ReferralNode;
  depth?: number;
  maxDepth?: number;
}

function TreeNode({ node, depth = 0, maxDepth = 5 }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = node.children && node.children.length > 0;
  const canExpand = depth < maxDepth;

  const levelColors = [
    "bg-primary/20 border-primary/40 text-primary",
    "bg-accent/20 border-accent/40 text-accent-foreground",
    "bg-blue-500/15 border-blue-500/30 text-blue-300",
    "bg-green-500/15 border-green-500/30 text-green-300",
    "bg-purple-500/15 border-purple-500/30 text-purple-300",
  ];
  const colorClass = levelColors[depth % levelColors.length];

  return (
    <div className="relative">
      {/* Vertical connector line from parent */}
      {depth > 0 && (
        <div className="absolute left-4 -top-3 w-px h-3 bg-border/60" />
      )}

      <div
        className={`relative flex flex-col gap-1 ${depth > 0 ? "ml-8 mt-2" : ""}`}
      >
        {/* Node Card */}
        <div
          className={`flex items-center gap-2 p-2.5 rounded-lg border transition-all cursor-default ${colorClass} ${
            hasChildren && canExpand ? "cursor-pointer hover:opacity-80" : ""
          }`}
          onClick={() => hasChildren && canExpand && setExpanded(!expanded)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              if (hasChildren && canExpand) setExpanded(!expanded);
            }
          }}
          role={hasChildren && canExpand ? "button" : undefined}
          tabIndex={hasChildren && canExpand ? 0 : undefined}
        >
          <Crown className="w-3.5 h-3.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="font-ui font-semibold text-xs truncate">
              {node.name}
            </div>
            <div className="font-body text-xs opacity-70 truncate">
              {node.referralCode}
            </div>
          </div>
          {depth === 0 && (
            <Badge
              variant="outline"
              className="text-xs border-primary/30 text-primary shrink-0"
            >
              You
            </Badge>
          )}
          {hasChildren && canExpand && (
            <div className="flex-shrink-0">
              {expanded ? (
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 opacity-70" />
              )}
            </div>
          )}
          {hasChildren && (
            <span className="text-xs opacity-70 font-ui shrink-0">
              {node.children.length}
            </span>
          )}
        </div>

        {/* Children */}
        {expanded && hasChildren && canExpand && (
          <div className="relative">
            {/* Vertical connector line for children */}
            <div className="absolute left-4 top-0 bottom-4 w-px bg-border/40" />
            <div>
              {node.children.map((child) => (
                <TreeNode
                  key={child.id.toString()}
                  node={child}
                  depth={depth + 1}
                  maxDepth={maxDepth}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const phoneAuth = usePhoneAuth();

  const { data: userProfile, isLoading: userLoading } = useUserByPhone(
    phoneAuth.phone,
  );
  const { data: referralTree, isLoading: treeLoading } = useReferralTreeByCode(
    userProfile?.referralCode ?? null,
  );

  const isLoading = userLoading;

  const walletBalance = userProfile?.walletBalance ?? BigInt(0);
  const walletRs = Number(walletBalance) / 100;

  const referralCount = referralTree?.children?.length ?? 0;

  const totalNetworkCount = (node: ReferralNode | null | undefined): number => {
    if (!node) return 0;
    return (
      node.children.length +
      node.children.reduce((sum, child) => sum + totalNetworkCount(child), 0)
    );
  };

  const networkCount = totalNetworkCount(referralTree);

  const referralLink = userProfile?.referralCode
    ? `${window.location.origin}/register?ref=${userProfile.referralCode}`
    : "";

  const copyReferralLink = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success("Referral link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOnWhatsApp = () => {
    const referralCode = userProfile?.referralCode ?? "";
    const message = `Join Tm11primeTime! Use my referral code *${referralCode}* to register: ${referralLink}`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, "_blank");
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6" data-ocid="dashboard.loading_state">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {["s1", "s2", "s3"].map((k) => (
            <Skeleton key={k} className="h-28 rounded-xl animate-shimmer" />
          ))}
        </div>
        <Skeleton className="h-40 rounded-xl animate-shimmer" />
        <Skeleton className="h-64 rounded-xl animate-shimmer" />
      </div>
    );
  }

  if (!phoneAuth.isLoggedIn) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4 max-w-sm">
          <Alert
            className="border-primary/30 bg-primary/10"
            data-ocid="dashboard.error_state"
          >
            <AlertCircle className="w-4 h-4 text-primary" />
            <AlertDescription className="font-body text-sm">
              You need to register first to access the dashboard.
            </AlertDescription>
          </Alert>
          <Button
            onClick={() => navigate({ to: "/register" })}
            className="bg-primary text-primary-foreground"
            data-ocid="dashboard.register.button"
          >
            Register Now
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="font-display font-black text-2xl text-foreground">
          Welcome back,{" "}
          <span className="text-gradient-gold">
            {userProfile?.name ?? phoneAuth.userName ?? "Member"}
          </span>
          !
        </h1>
        <p className="text-muted-foreground text-sm font-body mt-1">
          {userProfile?.isPaid ? (
            <span className="text-green-400 font-ui font-medium">
              ✓ Active Member
            </span>
          ) : (
            <span className="text-amber font-ui">
              ⚠ Complete payment to activate membership
            </span>
          )}
        </p>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Wallet */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
        >
          <Card
            className="card-premium hover:border-primary/40 transition-colors cursor-pointer"
            onClick={() => navigate({ to: "/wallet" })}
            data-ocid="dashboard.wallet.card"
          >
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-primary" />
                </div>
                <Badge
                  variant="outline"
                  className="text-xs border-primary/30 text-primary"
                >
                  Wallet
                </Badge>
              </div>
              <div className="font-display font-black text-3xl text-gradient-gold">
                ₹{walletRs.toFixed(2)}
              </div>
              <p className="text-muted-foreground text-xs font-body mt-1">
                Available balance
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Direct Referrals */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="card-premium">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-accent-foreground" />
                </div>
                <Badge
                  variant="outline"
                  className="text-xs border-accent/30 text-accent-foreground"
                >
                  Level 1
                </Badge>
              </div>
              <div className="font-display font-black text-3xl text-foreground">
                {referralCount}
              </div>
              <p className="text-muted-foreground text-xs font-body mt-1">
                Direct referrals
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Total Network */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
        >
          <Card className="card-premium">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-green-500/15 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                </div>
                <Badge
                  variant="outline"
                  className="text-xs border-green-500/30 text-green-400"
                >
                  Network
                </Badge>
              </div>
              <div className="font-display font-black text-3xl text-foreground">
                {networkCount}
              </div>
              <p className="text-muted-foreground text-xs font-body mt-1">
                Total network size
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Referral Link Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Card className="card-premium border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="font-display font-bold text-lg text-foreground">
              Your Referral Link
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {userProfile?.isPaid ? (
              /* ── Active: show link, copy button, code, and WhatsApp share ── */
              <>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-secondary/60 border border-border rounded-lg px-3 py-2.5 min-w-0">
                    <div className="font-body text-sm text-muted-foreground truncate">
                      {referralLink ||
                        "Complete registration to get your referral link"}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={copyReferralLink}
                    disabled={!referralLink}
                    className="border-primary/40 text-primary hover:bg-primary hover:text-primary-foreground shrink-0"
                    data-ocid="dashboard.referral.copy.button"
                  >
                    {copied ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    {copied ? "Copied!" : "Copy"}
                  </Button>
                </div>

                {userProfile?.referralCode && (
                  <div className="flex items-center flex-wrap gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground text-xs font-ui">
                        Your code:
                      </span>
                      <code className="text-primary text-sm font-ui font-bold bg-primary/10 px-2 py-0.5 rounded">
                        {userProfile.referralCode}
                      </code>
                    </div>

                    {/* WhatsApp Share Button */}
                    <Button
                      size="sm"
                      onClick={shareOnWhatsApp}
                      disabled={!referralLink}
                      className="bg-green-600 hover:bg-green-700 text-white shrink-0 gap-1.5"
                      data-ocid="dashboard.referral.whatsapp.button"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Share on WhatsApp
                    </Button>
                  </div>
                )}
              </>
            ) : (
              /* ── Locked: payment not yet approved ── */
              <div
                className="flex items-start gap-3 rounded-lg border border-border bg-secondary/30 px-4 py-4"
                data-ocid="dashboard.referral.locked.card"
              >
                <div className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-ui font-medium text-sm text-muted-foreground">
                    Referral Code Pending
                  </p>
                  <p className="font-body text-xs text-muted-foreground/70 mt-0.5 leading-relaxed">
                    Your referral code will be available after admin approves
                    your payment. Once approved, you'll be able to invite
                    friends and earn rewards.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Referral Tree */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.25 }}
      >
        <Card className="card-premium">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="font-display font-bold text-lg text-foreground">
                Referral Matrix Tree
              </CardTitle>
              <Badge
                variant="outline"
                className="text-xs border-primary/30 text-primary"
              >
                Auto-expanded
              </Badge>
            </div>
            <p className="text-muted-foreground text-xs font-body">
              Your downline network — 5 levels shown
            </p>
          </CardHeader>
          <CardContent>
            {treeLoading ? (
              <div
                className="space-y-2"
                data-ocid="dashboard.tree.loading_state"
              >
                {([0, 1, 2, 3] as const).map((i) => (
                  <Skeleton
                    key={i}
                    className="h-10 rounded-lg animate-shimmer"
                    style={{
                      marginLeft: `${i * 32}px`,
                      width: `calc(100% - ${i * 32}px)`,
                    }}
                  />
                ))}
              </div>
            ) : referralTree ? (
              <div className="overflow-x-auto" data-ocid="dashboard.tree.panel">
                <TreeNode node={referralTree} depth={0} maxDepth={5} />
              </div>
            ) : (
              <div
                className="py-10 text-center"
                data-ocid="dashboard.tree.empty_state"
              >
                <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                <p className="text-muted-foreground font-body text-sm">
                  No referral tree yet. Share your referral link to build your
                  network!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Link to Videos */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <Card
          className="card-premium border-accent/20 cursor-pointer hover:border-accent/40 transition-colors"
          onClick={() => navigate({ to: "/videos" })}
          data-ocid="dashboard.videos.card"
        >
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
              <Play className="w-6 h-6 text-accent-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-display font-bold text-foreground text-base">
                Browse Premium Content
              </h3>
              <p className="text-muted-foreground text-sm font-body">
                Tutorials, Entertainment, Wellness, Devotional & more
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
