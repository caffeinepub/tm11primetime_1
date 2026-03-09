import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Copy,
  Crown,
  Lock,
  MessageCircle,
  Phone,
  Play,
  Plus,
  RefreshCw,
  Timer,
  TrendingUp,
  UserCheck,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { ReferralNode } from "../backend.d";
import { PaymentStatus } from "../backend.d";
import { usePhoneAuth } from "../hooks/usePhoneAuth";
import {
  useMyPaymentSubmissions,
  useReferralTreeByCode,
  useUserByPhone,
  useWatchHistory,
} from "../hooks/useQueries";

// ─── Level Earning Rates ──────────────────────────────────────────────────────

function getLevelEarning(level: number): string {
  if (level === 1) return "₹10";
  if (level === 2) return "₹5";
  if (level === 3) return "₹4";
  if (level === 4) return "₹3";
  if (level === 5) return "₹2";
  if (level === 6) return "₹1";
  if (level === 7) return "₹0.50";
  return "₹0.25";
}

// ─── Matrix Tree Node ─────────────────────────────────────────────────────────

interface MatrixNodeProps {
  node: ReferralNode | null;
  depth: number;
  maxDepth: number;
  slotIndex: number;
}

// Level color palette (cycling)
const levelColors = [
  {
    bg: "bg-primary/15 border-primary/35",
    text: "text-primary",
    dot: "bg-primary",
    connector: "border-primary/25",
  },
  {
    bg: "bg-amber-500/12 border-amber-500/28",
    text: "text-amber-400",
    dot: "bg-amber-400",
    connector: "border-amber-500/20",
  },
  {
    bg: "bg-blue-500/12 border-blue-500/28",
    text: "text-blue-400",
    dot: "bg-blue-400",
    connector: "border-blue-500/20",
  },
  {
    bg: "bg-emerald-500/12 border-emerald-500/28",
    text: "text-emerald-400",
    dot: "bg-emerald-400",
    connector: "border-emerald-500/20",
  },
  {
    bg: "bg-purple-500/12 border-purple-500/28",
    text: "text-purple-400",
    dot: "bg-purple-400",
    connector: "border-purple-500/20",
  },
  {
    bg: "bg-rose-500/12 border-rose-500/28",
    text: "text-rose-400",
    dot: "bg-rose-400",
    connector: "border-rose-500/20",
  },
  {
    bg: "bg-cyan-500/12 border-cyan-500/28",
    text: "text-cyan-400",
    dot: "bg-cyan-400",
    connector: "border-cyan-500/20",
  },
];

function getColor(depth: number) {
  return levelColors[depth % levelColors.length];
}

function MatrixNode({ node, depth, maxDepth, slotIndex }: MatrixNodeProps) {
  const color = getColor(depth);
  const isLeafLevel = depth >= maxDepth;

  // Build exactly 3 child slots (filled or empty)
  const childSlots: Array<ReferralNode | null> = [null, null, null];
  if (node) {
    node.children.slice(0, 3).forEach((child, i) => {
      childSlots[i] = child;
    });
  }

  const filledChildCount = node ? Math.min(node.children.length, 3) : 0;

  return (
    <div className="flex flex-col items-center" style={{ minWidth: "120px" }}>
      {/* Node Card */}
      {node ? (
        <div
          className={`relative w-28 rounded-xl border px-2.5 py-2 flex flex-col gap-1 shadow-sm transition-all hover:scale-[1.03] ${color.bg}`}
          data-ocid={`matrix.node.${depth}.${slotIndex}`}
        >
          <div className={`flex items-center gap-1.5 ${color.text}`}>
            <Crown className="w-3 h-3 flex-shrink-0" />
            <span className="font-ui font-bold text-[10px] truncate max-w-[72px]">
              {node.name}
            </span>
          </div>
          {node.phone && (
            <div className="flex items-center gap-1 text-muted-foreground/80">
              <Phone className="w-2.5 h-2.5 flex-shrink-0" />
              <span className="font-ui text-[9px] truncate max-w-[72px]">
                {node.phone}
              </span>
            </div>
          )}
          {node.referredByName && depth > 0 && (
            <div className="flex items-center gap-1 text-muted-foreground/70">
              <UserCheck className="w-2.5 h-2.5 flex-shrink-0" />
              <span className="font-ui text-[9px] truncate max-w-[64px]">
                by: {node.referredByName}
              </span>
            </div>
          )}
          <code className="font-ui text-[9px] text-muted-foreground bg-black/20 rounded px-1 py-0.5 truncate block">
            {node.referralCode}
          </code>
          {depth === 0 && (
            <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[9px] font-ui font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap">
              You
            </span>
          )}
          {/* Child fill indicator */}
          {!isLeafLevel && (
            <div className="flex gap-0.5 mt-0.5">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full ${
                    i < filledChildCount ? color.dot : "bg-border/50"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Empty Slot */
        <div
          className="w-28 rounded-xl border border-dashed border-border/50 px-2.5 py-3 flex flex-col items-center gap-1.5 opacity-50 hover:opacity-70 transition-opacity"
          data-ocid={`matrix.empty.${depth}.${slotIndex}`}
        >
          <div className="w-6 h-6 rounded-full border border-dashed border-muted-foreground/40 flex items-center justify-center">
            <Plus className="w-3 h-3 text-muted-foreground" />
          </div>
          <span className="text-muted-foreground font-ui text-[9px] text-center leading-tight">
            Empty Slot
          </span>
        </div>
      )}

      {/* Children — only render if not at max depth and node exists */}
      {node && !isLeafLevel && (
        <div className="flex flex-col items-center w-full">
          {/* Vertical line down from this node */}
          <div className="w-px h-4 bg-border/40" />

          {/* Horizontal bar connecting to 3 children */}
          <div className="relative flex items-start justify-center gap-3 w-full">
            {/* Horizontal connector line */}
            {filledChildCount > 0 && (
              <div
                className="absolute top-0 h-px bg-border/30"
                style={{
                  left: "calc(50% - (3 * 128px + 2 * 12px) / 2 + 64px)",
                  right: "calc(50% - (3 * 128px + 2 * 12px) / 2 + 64px)",
                  width: filledChildCount > 1 ? "calc(100% - 64px)" : "0",
                }}
              />
            )}

            {(["a", "b", "c"] as const).map((slotKey, i) => (
              <div key={slotKey} className="flex flex-col items-center">
                {/* Vertical drop to child */}
                <div className="w-px h-4 bg-border/40" />
                <MatrixNode
                  node={childSlots[i]}
                  depth={depth + 1}
                  maxDepth={maxDepth}
                  slotIndex={i}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* "More levels" indicator at max depth for filled nodes */}
      {node && isLeafLevel && node.children.length > 0 && (
        <div className="mt-2">
          <span className="text-[9px] font-ui text-muted-foreground bg-secondary/60 px-1.5 py-0.5 rounded-full">
            +{node.children.length} more
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Matrix Tree Legend Row ───────────────────────────────────────────────────

function LevelLegendRow({ level }: { level: number }) {
  const color = getColor(level - 1);
  const slots = Math.min(3 ** level, 2187); // cap for display
  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/30"
      data-ocid={`matrix.level.${level}.row`}
    >
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${color.dot}`} />
      <span className={`font-ui font-semibold text-xs ${color.text}`}>
        Level {level}
      </span>
      <span className="text-muted-foreground font-body text-xs">
        — {getLevelEarning(level)}/join
      </span>
      <span className="ml-auto text-muted-foreground/60 font-ui text-[10px]">
        up to {slots} slots
      </span>
    </div>
  );
}

// ─── Matrix Tree Container ────────────────────────────────────────────────────

interface MatrixTreeProps {
  root: ReferralNode;
}

function MatrixTree({ root }: MatrixTreeProps) {
  const MAX_DEPTH = 7;

  return (
    <div data-ocid="matrix.tree.panel">
      {/* Level legend */}
      <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {Array.from({ length: 8 }, (_, i) => i + 1).map((level) => (
          <LevelLegendRow key={level} level={level} />
        ))}
      </div>

      {/* Tree - horizontally scrollable */}
      <div
        className="overflow-x-auto overflow-y-visible pb-4 scrollbar-thin"
        data-ocid="matrix.tree.scroll"
      >
        <div className="flex justify-center pt-6 min-w-max pb-4 px-4">
          <MatrixNode
            node={root}
            depth={0}
            maxDepth={MAX_DEPTH}
            slotIndex={0}
          />
        </div>
      </div>

      {/* Footer note */}
      <p className="text-center text-muted-foreground/60 font-body text-[10px] mt-2">
        Tree auto-fills — each member has 3 referral slots · Levels 8–15 earn
        ₹0.25/join
      </p>
    </div>
  );
}

// ─── User Summary Card ────────────────────────────────────────────────────────

interface UserSummaryProps {
  name: string;
  phone: string;
  referralCode: string | null;
  isPaid: boolean;
  walletBalance: bigint;
  joinedAt: bigint | null;
}

function UserSummaryCard({
  name,
  phone,
  referralCode,
  isPaid,
  walletBalance,
  joinedAt,
}: UserSummaryProps) {
  const walletRs = Number(walletBalance) / 100;
  const joinedDate = joinedAt
    ? new Date(Number(joinedAt) / 1_000_000).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <Card
      className="card-premium border-primary/25 relative overflow-hidden"
      data-ocid="dashboard.user_summary.card"
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-16 translate-x-16 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-accent/5 rounded-full translate-y-12 -translate-x-12 pointer-events-none" />

      <CardContent className="p-5 relative z-10">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/30 to-accent/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
            <span className="font-display font-black text-xl text-gradient-gold">
              {name.charAt(0).toUpperCase()}
            </span>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-display font-black text-xl text-foreground truncate">
                {name}
              </h2>
              <Badge
                className={`text-[10px] font-ui font-semibold shrink-0 ${
                  isPaid
                    ? "bg-green-500/20 text-green-400 border-green-500/30"
                    : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                }`}
                variant="outline"
                data-ocid="dashboard.user_summary.status.badge"
              >
                {isPaid ? "✓ Active Member" : "⏳ Pending Payment"}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2.5">
              {/* Phone */}
              <div className="flex items-center gap-1.5 col-span-2 sm:col-span-1">
                <Phone className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                <span className="font-ui text-xs text-muted-foreground truncate">
                  {phone}
                </span>
              </div>

              {/* Joined date */}
              {joinedDate && (
                <div className="flex items-center gap-1.5 col-span-2 sm:col-span-1">
                  <Calendar className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                  <span className="font-ui text-xs text-muted-foreground">
                    Joined {joinedDate}
                  </span>
                </div>
              )}

              {/* Referral Code */}
              <div className="flex items-center gap-1.5 col-span-2 sm:col-span-1">
                <Crown className="w-3 h-3 text-primary flex-shrink-0" />
                {referralCode ? (
                  <code className="font-ui text-xs text-primary font-bold bg-primary/10 px-1.5 py-0.5 rounded">
                    {referralCode}
                  </code>
                ) : (
                  <span className="font-ui text-xs text-muted-foreground italic">
                    Pending approval
                  </span>
                )}
              </div>

              {/* Wallet */}
              <div className="flex items-center gap-1.5 col-span-2 sm:col-span-1">
                <Wallet className="w-3 h-3 text-primary flex-shrink-0" />
                <span className="font-ui text-xs font-bold text-gradient-gold">
                  ₹{walletRs.toFixed(2)}
                </span>
                <span className="font-body text-xs text-muted-foreground">
                  balance
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Watch Time Formatter ──────────────────────────────────────────────────────

function formatWatchTime(seconds: number): string {
  if (seconds === 0) return "0 min";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m} min`;
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();

  const phoneAuth = usePhoneAuth();

  const { data: userProfile, isLoading: userLoading } = useUserByPhone(
    phoneAuth.phone,
  );
  const { data: referralTree, isLoading: treeLoading } = useReferralTreeByCode(
    userProfile?.referralCode ?? null,
  );
  const { data: watchHistory } = useWatchHistory(phoneAuth.userId ?? null);
  const totalWatchSeconds =
    watchHistory?.reduce((sum, r) => sum + Number(r.watchedSeconds), 0) ?? 0;

  const { data: mySubmissions } = useMyPaymentSubmissions(phoneAuth.phone);
  const latestSubmission =
    mySubmissions && mySubmissions.length > 0
      ? mySubmissions[mySubmissions.length - 1]
      : null;

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

  const handleTreeRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["referralTreeByCode", userProfile?.referralCode ?? null],
        }),
        queryClient.invalidateQueries({
          queryKey: [
            "userByPhone",
            phoneAuth.phone
              ? phoneAuth.phone
                  .replace(/\D/g, "")
                  .replace(/^91/, "")
                  .replace(/^0/, "")
              : null,
          ],
        }),
      ]);
      toast.success("Tree refreshed!");
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6" data-ocid="dashboard.loading_state">
        <Skeleton className="h-24 rounded-xl animate-shimmer" />
        <Skeleton className="h-32 rounded-xl animate-shimmer" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {["s1", "s2", "s3", "s4"].map((k) => (
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
            onClick={() => navigate({ to: "/register", search: {} })}
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
      {/* ── 1. Greeting ─────────────────────────────────────────────────────── */}
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

      {/* ── 2. User Summary Card (NEW) ──────────────────────────────────────── */}
      {userProfile && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
        >
          <UserSummaryCard
            name={userProfile.name}
            phone={userProfile.phone}
            referralCode={userProfile.isPaid ? userProfile.referralCode : null}
            isPaid={userProfile.isPaid}
            walletBalance={userProfile.walletBalance}
            joinedAt={userProfile.joinedAt}
          />
        </motion.div>
      )}

      {/* ── 3. Payment Status ────────────────────────────────────────────────── */}
      {latestSubmission && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.08 }}
          data-ocid="dashboard.payment_status.card"
        >
          <Card
            className={`card-premium border-l-4 ${
              latestSubmission.status === PaymentStatus.approved
                ? "border-l-green-500"
                : latestSubmission.status === PaymentStatus.rejected
                  ? "border-l-red-500"
                  : "border-l-amber-500"
            }`}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      latestSubmission.status === PaymentStatus.approved
                        ? "bg-green-500/15"
                        : latestSubmission.status === PaymentStatus.rejected
                          ? "bg-red-500/15"
                          : "bg-amber-500/15"
                    }`}
                  >
                    {latestSubmission.status === PaymentStatus.approved ? (
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                    ) : latestSubmission.status === PaymentStatus.rejected ? (
                      <XCircle className="w-5 h-5 text-red-400" />
                    ) : (
                      <Clock className="w-5 h-5 text-amber-400" />
                    )}
                  </div>
                  <div>
                    <div className="font-ui font-semibold text-sm text-foreground">
                      Payment Status
                    </div>
                    <div className="text-xs text-muted-foreground font-body mt-0.5">
                      UTR: {latestSubmission.utr} · ₹{latestSubmission.amount}
                    </div>
                    <div className="text-xs text-muted-foreground/60 font-body mt-0.5">
                      Submitted:{" "}
                      {new Date(
                        Number(latestSubmission.timestamp) / 1_000_000,
                      ).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </div>
                  </div>
                </div>
                <Badge
                  className={`shrink-0 font-ui text-xs ${
                    latestSubmission.status === PaymentStatus.approved
                      ? "bg-green-500/20 text-green-400 border-green-500/30"
                      : latestSubmission.status === PaymentStatus.rejected
                        ? "bg-red-500/20 text-red-400 border-red-500/30"
                        : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                  }`}
                  variant="outline"
                  data-ocid="dashboard.payment_status.badge"
                >
                  {latestSubmission.status === PaymentStatus.approved
                    ? "Approved"
                    : latestSubmission.status === PaymentStatus.rejected
                      ? "Rejected"
                      : "Pending Review"}
                </Badge>
              </div>
              {latestSubmission.status === PaymentStatus.rejected && (
                <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-xs text-red-400 font-body">
                    Your payment was rejected. Please contact admin or resubmit
                    with the correct details.
                  </p>
                </div>
              )}
              {latestSubmission.status === PaymentStatus.pending && (
                <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <p className="text-xs text-amber-400/80 font-body">
                    Your payment is being reviewed. You'll get access once admin
                    approves it.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ── 4. Stats Cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Wallet */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
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
          transition={{ duration: 0.3, delay: 0.15 }}
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
                <span className="text-muted-foreground text-lg font-ui font-normal ml-1">
                  / 3
                </span>
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
          transition={{ duration: 0.3, delay: 0.2 }}
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

        {/* Total Watch Time */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.225 }}
        >
          <Card className="card-premium" data-ocid="dashboard.watchtime.card">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center">
                  <Timer className="w-5 h-5 text-blue-400" />
                </div>
                <Badge
                  variant="outline"
                  className="text-xs border-blue-500/30 text-blue-400"
                >
                  Watch Time
                </Badge>
              </div>
              <div className="font-display font-black text-3xl text-foreground">
                {formatWatchTime(totalWatchSeconds)}
              </div>
              <p className="text-muted-foreground text-xs font-body mt-1">
                Total watched
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ── 5. Referral Link Card ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.25 }}
      >
        <Card className="card-premium border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="font-display font-bold text-lg text-foreground">
              Your Referral Link
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {userProfile?.isPaid ? (
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

      {/* ── 6. Matrix Tree ────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <Card className="card-premium">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="font-display font-bold text-lg text-foreground">
                Referral Matrix Tree
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="text-xs border-primary/30 text-primary"
                >
                  Auto-expanded
                </Badge>
                <Badge
                  variant="outline"
                  className="text-xs border-green-500/30 text-green-400"
                >
                  3 slots/member
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleTreeRefresh}
                  disabled={isRefreshing || treeLoading}
                  className="border-border font-ui text-xs h-7 px-2.5"
                  data-ocid="dashboard.tree.secondary_button"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 mr-1 ${isRefreshing ? "animate-spin" : ""}`}
                  />
                  Refresh
                </Button>
              </div>
            </div>
            <p className="text-muted-foreground text-xs font-body mt-0.5">
              Your complete downline network — auto-updates every 20 seconds
            </p>
          </CardHeader>
          <CardContent>
            {treeLoading ? (
              <div
                className="space-y-3"
                data-ocid="dashboard.tree.loading_state"
              >
                {/* Level legend skeletons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mb-4">
                  {["l1", "l2", "l3", "l4", "l5", "l6", "l7", "l8"].map((k) => (
                    <Skeleton
                      key={k}
                      className="h-8 rounded-lg animate-shimmer"
                    />
                  ))}
                </div>
                {/* Tree skeletons */}
                <div className="flex justify-center gap-3">
                  {["t1", "t2", "t3"].map((k) => (
                    <Skeleton
                      key={k}
                      className="h-16 w-28 rounded-xl animate-shimmer"
                    />
                  ))}
                </div>
              </div>
            ) : referralTree ? (
              <ScrollArea className="w-full">
                <MatrixTree root={referralTree} />
              </ScrollArea>
            ) : (
              <div
                className="py-10 text-center"
                data-ocid="dashboard.tree.empty_state"
              >
                <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-primary/50" />
                </div>
                <p className="text-foreground font-ui font-semibold text-sm mb-1">
                  No referral tree yet
                </p>
                <p className="text-muted-foreground font-body text-xs max-w-xs mx-auto">
                  {userProfile?.isPaid
                    ? "Share your referral link to start building your 3×15 matrix network!"
                    : "Complete your payment to get your referral code and start inviting members."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ── 7. Videos Quick Link ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.35 }}
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
