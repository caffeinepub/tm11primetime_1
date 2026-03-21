import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  CheckCircle,
  Clock,
  Gift,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { usePhoneAuth } from "../hooks/usePhoneAuth";
import type { Transaction } from "../hooks/useQueries";
import { useUserByPhone } from "../hooks/useQueries";

const TX_TYPE_CONFIG: Record<
  string,
  {
    label: string;
    color: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  joining_bonus: {
    label: "Joining Bonus",
    color: "bg-green-500/20 text-green-300 border-green-500/30",
    icon: Gift,
  },
  level_earning: {
    label: "Level Earning",
    color: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    icon: TrendingUp,
  },
  membership_fee: {
    label: "Membership Fee",
    color: "bg-red-500/20 text-red-300 border-red-500/30",
    icon: TrendingDown,
  },
  withdrawal: {
    label: "Withdrawal",
    color: "bg-amber/20 text-amber border-amber/30",
    icon: ArrowUpRight,
  },
};

function formatDate(timestamp: bigint): string {
  const ms = Number(timestamp) / 1_000_000;
  return new Date(ms).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatAmount(amount: bigint, txType: string): string {
  const rs = Number(amount) / 100;
  const isDebit = txType === "membership_fee" || txType === "withdrawal";
  return `${isDebit ? "-" : "+"}₹${rs.toFixed(2)}`;
}

// Demo transactions for sample content
const SAMPLE_TRANSACTIONS: Transaction[] = [
  {
    id: BigInt(1),
    userId: BigInt(1),
    txType: "joining_bonus",
    amount: BigInt(15000),
    note: "Welcome joining bonus",
    timestamp: BigInt((Date.now() - 86400000) * 1_000_000),
  },
  {
    id: BigInt(2),
    userId: BigInt(1),
    txType: "membership_fee",
    amount: BigInt(11800),
    note: "Membership fee (₹100 + 18% GST)",
    timestamp: BigInt((Date.now() - 86400000) * 1_000_000),
  },
  {
    id: BigInt(3),
    userId: BigInt(1),
    txType: "level_earning",
    amount: BigInt(1000),
    note: "Level 1 earning from Priya Sharma",
    timestamp: BigInt((Date.now() - 72000000) * 1_000_000),
  },
  {
    id: BigInt(4),
    userId: BigInt(1),
    txType: "level_earning",
    amount: BigInt(500),
    note: "Level 2 earning from Rahul Kumar",
    timestamp: BigInt((Date.now() - 36000000) * 1_000_000),
  },
  {
    id: BigInt(5),
    userId: BigInt(1),
    txType: "level_earning",
    amount: BigInt(400),
    note: "Level 3 earning from Amit Singh",
    timestamp: BigInt((Date.now() - 18000000) * 1_000_000),
  },
  {
    id: BigInt(6),
    userId: BigInt(1),
    txType: "level_earning",
    amount: BigInt(300),
    note: "Level 4 earning from Sunita Patel",
    timestamp: BigInt((Date.now() - 3600000) * 1_000_000),
  },
];

export default function WalletPage() {
  const phoneAuth = usePhoneAuth();

  const { data: userProfile } = useUserByPhone(phoneAuth.phone);

  const walletBalance = userProfile?.walletBalance ?? BigInt(0);
  const walletRs = Number(walletBalance) / 100;

  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [withdrawUpi, setWithdrawUpi] = useState("");
  const [withdrawSubmitted, setWithdrawSubmitted] = useState(false);
  const canWithdraw = walletRs >= 500;

  // Transactions are principal-gated and not available for phone-based users.
  // Show sample/demo data to illustrate the structure.
  const txLoading = false;
  const displayTransactions: Transaction[] = SAMPLE_TRANSACTIONS;

  // Compute stats
  const totalEarned =
    displayTransactions
      .filter((t) => t.txType !== "membership_fee" && t.txType !== "withdrawal")
      .reduce((sum, t) => sum + Number(t.amount), 0) / 100;

  const totalDebited =
    displayTransactions
      .filter((t) => t.txType === "membership_fee" || t.txType === "withdrawal")
      .reduce((sum, t) => sum + Number(t.amount), 0) / 100;

  const levelEarnings =
    displayTransactions
      .filter((t) => t.txType === "level_earning")
      .reduce((sum, t) => sum + Number(t.amount), 0) / 100;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="font-display font-black text-2xl text-foreground">
          My <span className="text-gradient-gold">Wallet</span>
        </h1>
        <p className="text-muted-foreground text-sm font-body mt-1">
          Track your earnings and transaction history
        </p>
      </motion.div>

      {/* Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6"
      >
        <Card className="card-premium border-primary/30 overflow-hidden relative">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-5 bg-gradient-to-br from-primary to-accent" />
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center glow-gold">
                <Wallet className="w-6 h-6 text-primary" />
              </div>
              <div>
                <div className="text-muted-foreground text-sm font-body">
                  Available Balance
                </div>
                <div className="font-display font-black text-4xl text-gradient-gold">
                  ₹{walletRs.toFixed(2)}
                </div>
              </div>
            </div>
            <div className="text-xs text-muted-foreground font-body">
              {userProfile?.name ?? phoneAuth.userName ?? "Member"} •{" "}
              {userProfile?.referralCode && (
                <span className="text-primary font-medium">
                  Code: {userProfile.referralCode}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Withdrawal Section */}
      {canWithdraw && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.08 }}
          className="mb-6"
        >
          <Card className="card-premium border-green-500/30">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-500/15 flex items-center justify-center">
                    <Banknote className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <div className="font-display font-bold text-foreground">
                      Withdrawal Available
                    </div>
                    <div className="text-xs text-muted-foreground font-body">
                      Your balance has reached ₹500
                    </div>
                  </div>
                </div>
                {!withdrawSubmitted && !showWithdrawForm && (
                  <button
                    onClick={() => setShowWithdrawForm(true)}
                    type="button"
                    className="px-4 py-2 rounded-xl bg-green-500/20 text-green-300 border border-green-500/30 text-sm font-ui font-semibold hover:bg-green-500/30 transition-colors"
                  >
                    Request Withdrawal
                  </button>
                )}
              </div>

              {withdrawSubmitted ? (
                <div className="flex items-center gap-2 text-green-400 text-sm font-body bg-green-500/10 rounded-xl p-3">
                  <CheckCircle className="w-4 h-4" />
                  Withdrawal request submitted! Admin will process it within
                  24–48 hours.
                </div>
              ) : showWithdrawForm ? (
                <div className="space-y-3">
                  <div>
                    <label
                      htmlFor="withdraw-upi"
                      className="text-xs text-muted-foreground font-ui mb-1 block"
                    >
                      Your UPI ID
                    </label>
                    <input
                      type="text"
                      value={withdrawUpi}
                      onChange={(e) => setWithdrawUpi(e.target.value)}
                      id="withdraw-upi"
                      placeholder="yourname@upi"
                      className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (withdrawUpi.trim()) {
                          setWithdrawSubmitted(true);
                          setShowWithdrawForm(false);
                        }
                      }}
                      disabled={!withdrawUpi.trim()}
                      type="button"
                      className="flex-1 px-4 py-2 rounded-xl bg-green-500/20 text-green-300 border border-green-500/30 text-sm font-ui font-semibold hover:bg-green-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Submit Request
                    </button>
                    <button
                      onClick={() => setShowWithdrawForm(false)}
                      type="button"
                      className="px-4 py-2 rounded-xl bg-muted/40 text-muted-foreground text-sm font-ui hover:bg-muted/60 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
        >
          <Card className="card-premium">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <ArrowDownRight className="w-4 h-4 text-green-400" />
                <span className="text-xs text-muted-foreground font-ui">
                  Total Earned
                </span>
              </div>
              <div className="font-display font-bold text-2xl text-green-400">
                ₹{totalEarned.toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="card-premium">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-muted-foreground font-ui">
                  Level Earnings
                </span>
              </div>
              <div className="font-display font-bold text-2xl text-blue-400">
                ₹{levelEarnings.toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
        >
          <Card className="card-premium">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <ArrowUpRight className="w-4 h-4 text-red-400" />
                <span className="text-xs text-muted-foreground font-ui">
                  Total Debited
                </span>
              </div>
              <div className="font-display font-bold text-2xl text-red-400">
                ₹{totalDebited.toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Transaction History */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Card className="card-premium">
          <CardHeader className="pb-3">
            <CardTitle className="font-display font-bold text-lg text-foreground">
              Transaction History
            </CardTitle>
            <p className="text-muted-foreground text-xs font-body mt-1">
              Showing sample transactions. Full history will be available once
              your account is fully activated.
            </p>
          </CardHeader>
          <CardContent className="p-0">
            {txLoading ? (
              <div className="p-5 space-y-3" data-ocid="wallet.loading_state">
                {["s1", "s2", "s3", "s4", "s5"].map((k) => (
                  <Skeleton
                    key={k}
                    className="h-12 rounded-lg animate-shimmer"
                  />
                ))}
              </div>
            ) : displayTransactions.length === 0 ? (
              <div className="p-10 text-center" data-ocid="wallet.empty_state">
                <Wallet className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-30" />
                <p className="text-muted-foreground font-body text-sm">
                  No transactions yet
                </p>
              </div>
            ) : (
              <ScrollArea className="max-h-96">
                <Table data-ocid="wallet.table">
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground font-ui text-xs uppercase tracking-wide">
                        Type
                      </TableHead>
                      <TableHead className="text-muted-foreground font-ui text-xs uppercase tracking-wide">
                        Note
                      </TableHead>
                      <TableHead className="text-muted-foreground font-ui text-xs uppercase tracking-wide text-right">
                        Amount
                      </TableHead>
                      <TableHead className="text-muted-foreground font-ui text-xs uppercase tracking-wide hidden sm:table-cell">
                        Date
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...displayTransactions]
                      .sort((a, b) => Number(b.timestamp) - Number(a.timestamp))
                      .map((tx, i) => {
                        const config = TX_TYPE_CONFIG[tx.txType] ?? {
                          label: tx.txType,
                          color: "bg-muted text-muted-foreground",
                          icon: Clock,
                        };
                        const isDebit =
                          tx.txType === "membership_fee" ||
                          tx.txType === "withdrawal";
                        const ocidIndex = i + 1;
                        return (
                          <TableRow
                            key={tx.id.toString()}
                            className="border-border hover:bg-muted/30 transition-colors"
                            data-ocid={`wallet.row.${ocidIndex}`}
                          >
                            <TableCell className="py-3">
                              <Badge
                                variant="outline"
                                className={`text-xs ${config.color} whitespace-nowrap`}
                              >
                                <config.icon className="w-3 h-3 mr-1" />
                                {config.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-3 text-sm text-muted-foreground font-body max-w-[200px]">
                              <span className="truncate block">{tx.note}</span>
                            </TableCell>
                            <TableCell
                              className={`py-3 text-sm font-display font-bold text-right whitespace-nowrap ${
                                isDebit ? "text-red-400" : "text-green-400"
                              }`}
                            >
                              {formatAmount(tx.amount, tx.txType)}
                            </TableCell>
                            <TableCell className="py-3 text-xs text-muted-foreground font-body hidden sm:table-cell whitespace-nowrap">
                              {formatDate(tx.timestamp)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
