import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Banknote,
  BarChart3,
  CheckCircle,
  Crown,
  ExternalLink,
  FileText,
  IndianRupee,
  Link as LinkIcon,
  Loader2,
  Lock,
  LogOut,
  Network,
  Pencil,
  Phone,
  PlayCircle,
  Plus,
  Receipt,
  RefreshCw,
  Shield,
  Trash2,
  Tv,
  UserCheck,
  Users,
  XCircle,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { ReferralNode, User } from "../backend.d";
import { getActorWithRetry } from "../globalActor";
import {
  useAddVideoMutation,
  useAllChannelsAdmin,
  useAllPaymentSubmissions,
  useAllReferralTreesAdmin,
  useAllUserVideosAdmin,
  useAllUsers,
  useAllVideosPublic,
  useDeleteChannelAdminMutation,
  useDeletePaymentSubmissionMutation,
  useDeleteUserMutation,
  useDeleteUserVideoAdminMutation,
  useDeleteVideoMutation,
  useReferralTreeByPhoneAdmin,
  useUpdateUserMutation,
  useUpdateUserStatusMutation,
  useUpdateVideoChannelInfoMutation,
  useVerifyPaymentSubmissionMutation,
} from "../hooks/useQueries";

// ── Admin Password ────────────────────────────────────────────────────────────

const ADMIN_PASSWORD = "aakbn@1014";
const ADMIN_SESSION_KEY = "admin_logged_in";

// ── Helpers ───────────────────────────────────────────────────────────────────

const VIDEO_CATEGORIES = [
  "Tutorial",
  "Educational",
  "Entertainment",
  "Wellness",
  "Devotional",
  "Media",
];

interface AddVideoFormData {
  title: string;
  category: string;
  url: string;
  channelUrl: string;
  thumbnailUrl: string;
  description: string;
  duration: string;
}

const initialFormData: AddVideoFormData = {
  title: "",
  category: "",
  url: "",
  channelUrl: "",
  thumbnailUrl: "",
  description: "",
  duration: "",
};

// ── Channel data model (localStorage-only) ────────────────────────────────────

interface Channel {
  id: string;
  name: string;
  url: string;
}

// ── Admin Watch Time Helper ───────────────────────────────────────────────────

function formatAdminWatchTime(phone: string): string {
  const raw = localStorage.getItem(`watchTime_${phone}`);
  const secs = raw ? Number.parseInt(raw, 10) : 0;
  if (Number.isNaN(secs) || secs === 0) return "—";
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m} min`;
}

// ── Admin Matrix Node (compact, inline version of DashboardPage's MatrixNode) ─

const adminLevelColors = [
  {
    bg: "bg-primary/15 border-primary/35",
    text: "text-primary",
    dot: "bg-primary",
  },
  {
    bg: "bg-amber-500/12 border-amber-500/28",
    text: "text-amber-400",
    dot: "bg-amber-400",
  },
  {
    bg: "bg-blue-500/12 border-blue-500/28",
    text: "text-blue-400",
    dot: "bg-blue-400",
  },
  {
    bg: "bg-emerald-500/12 border-emerald-500/28",
    text: "text-emerald-400",
    dot: "bg-emerald-400",
  },
  {
    bg: "bg-purple-500/12 border-purple-500/28",
    text: "text-purple-400",
    dot: "bg-purple-400",
  },
  {
    bg: "bg-rose-500/12 border-rose-500/28",
    text: "text-rose-400",
    dot: "bg-rose-400",
  },
  {
    bg: "bg-cyan-500/12 border-cyan-500/28",
    text: "text-cyan-400",
    dot: "bg-cyan-400",
  },
];

function getAdminColor(depth: number) {
  return adminLevelColors[depth % adminLevelColors.length];
}

interface AdminMatrixNodeProps {
  node: ReferralNode | null;
  depth: number;
  maxDepth: number;
  slotIndex: number;
}

function AdminMatrixNode({
  node,
  depth,
  maxDepth,
  slotIndex,
}: AdminMatrixNodeProps) {
  const color = getAdminColor(depth);
  const isLeafLevel = depth >= maxDepth;

  const childSlots: Array<ReferralNode | null> = [null, null, null];
  if (node) {
    node.children.slice(0, 3).forEach((child, i) => {
      childSlots[i] = child;
    });
  }

  const filledChildCount = node ? Math.min(node.children.length, 3) : 0;

  return (
    <div className="flex flex-col items-center" style={{ minWidth: "120px" }}>
      {node ? (
        <div
          className={`relative w-28 rounded-xl border px-2.5 py-2 flex flex-col gap-1 shadow-sm transition-all hover:scale-[1.03] ${color.bg}`}
          data-ocid={`admin.matrix.node.${depth}.${slotIndex}`}
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
              Root
            </span>
          )}
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
        <div className="w-28 rounded-xl border border-dashed border-border/50 px-2.5 py-3 flex flex-col items-center gap-1.5 opacity-50">
          <div className="w-6 h-6 rounded-full border border-dashed border-muted-foreground/40 flex items-center justify-center">
            <Plus className="w-3 h-3 text-muted-foreground" />
          </div>
          <span className="text-muted-foreground font-ui text-[9px] text-center leading-tight">
            Empty Slot
          </span>
        </div>
      )}

      {node && !isLeafLevel && (
        <div className="flex flex-col items-center w-full">
          <div className="w-px h-4 bg-border/40" />
          <div className="relative flex items-start justify-center gap-3 w-full">
            {(["a", "b", "c"] as const).map((slotKey, i) => (
              <div key={slotKey} className="flex flex-col items-center">
                <div className="w-px h-4 bg-border/40" />
                <AdminMatrixNode
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

// ── Matrix Admin Tab ──────────────────────────────────────────────────────────

interface MatrixAdminTabProps {
  allReferralTrees: Array<{
    totalNetwork: bigint;
    directReferrals: bigint;
    referralCode: string;
    userId: bigint;
    name: string;
    isPaid: boolean;
    phone: string;
  }>;
  allTreesLoading: boolean;
  refetchAllTrees: () => void;
  selectedPhone: string | null;
  setSelectedPhone: (phone: string | null) => void;
  selectedUserTree: ReferralNode | null;
  selectedTreeLoading: boolean;
}

function MatrixAdminTab({
  allReferralTrees,
  allTreesLoading,
  refetchAllTrees,
  selectedPhone,
  setSelectedPhone,
  selectedUserTree,
  selectedTreeLoading,
}: MatrixAdminTabProps) {
  return (
    <div className="space-y-4" data-ocid="admin.matrix.panel">
      {/* ── Section A: Network Summary Table ── */}
      <Card className="card-premium">
        <CardHeader className="pb-3 flex flex-row items-start justify-between gap-2">
          <div>
            <CardTitle className="font-display font-bold text-lg text-foreground flex items-center gap-2">
              <Network className="w-5 h-5 text-primary" />
              Network Summary
            </CardTitle>
            <p className="text-muted-foreground text-xs font-body mt-1">
              All users and their matrix tree positions. Click "View Tree" to
              inspect a user's downline.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="border-border font-ui text-xs flex-shrink-0"
            onClick={refetchAllTrees}
            disabled={allTreesLoading}
            data-ocid="admin.matrix.secondary_button"
          >
            {allTreesLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5 mr-1" />
            )}
            Refresh
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {allTreesLoading ? (
            <div
              className="p-5 space-y-3"
              data-ocid="admin.matrix.loading_state"
            >
              {["s1", "s2", "s3", "s4", "s5"].map((k) => (
                <Skeleton key={k} className="h-12 rounded-lg" />
              ))}
            </div>
          ) : !allReferralTrees || allReferralTrees.length === 0 ? (
            <div
              className="p-10 text-center"
              data-ocid="admin.matrix.empty_state"
            >
              <Network className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-30" />
              <p className="text-muted-foreground font-body text-sm">
                No matrix data yet.
              </p>
              <p className="text-muted-foreground font-body text-xs mt-1 opacity-70">
                Click Refresh to load network data.
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-[500px]">
              <Table data-ocid="admin.matrix.table">
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    {[
                      "Name",
                      "Phone",
                      "Referral Code",
                      "Paid",
                      "Direct Refs",
                      "Total Network",
                      "Actions",
                    ].map((h) => (
                      <TableHead
                        key={h}
                        className="text-muted-foreground font-ui text-xs uppercase tracking-wide whitespace-nowrap"
                      >
                        {h}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allReferralTrees.map((row, i) => {
                    const ocidIndex = i + 1;
                    return (
                      <TableRow
                        key={row.userId.toString()}
                        className={`border-border hover:bg-muted/20 transition-colors ${selectedPhone === row.phone ? "bg-primary/5" : ""}`}
                        data-ocid={`admin.matrix.item.${ocidIndex}`}
                      >
                        <TableCell className="py-3 font-ui font-medium text-sm text-foreground">
                          {row.name}
                        </TableCell>
                        <TableCell className="py-3 text-sm text-muted-foreground font-body">
                          {row.phone || "—"}
                        </TableCell>
                        <TableCell className="py-3">
                          <code className="font-ui text-xs text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                            {row.referralCode || "—"}
                          </code>
                        </TableCell>
                        <TableCell className="py-3">
                          {row.isPaid ? (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-400" />
                          )}
                        </TableCell>
                        <TableCell className="py-3 text-sm font-display font-bold text-foreground">
                          {Number(row.directReferrals)}
                        </TableCell>
                        <TableCell className="py-3 text-sm font-display font-bold text-primary">
                          {Number(row.totalNetwork)}
                        </TableCell>
                        <TableCell className="py-3">
                          <Button
                            size="sm"
                            variant={
                              selectedPhone === row.phone
                                ? "default"
                                : "outline"
                            }
                            onClick={() => {
                              if (selectedPhone === row.phone) {
                                setSelectedPhone(null);
                              } else {
                                setSelectedPhone(row.phone);
                              }
                            }}
                            className={`font-ui text-xs h-7 px-2.5 ${
                              selectedPhone === row.phone
                                ? "bg-primary text-primary-foreground"
                                : "border-primary/40 text-primary hover:bg-primary/10"
                            }`}
                            data-ocid={`admin.matrix.view_button.${ocidIndex}`}
                          >
                            {selectedPhone === row.phone
                              ? "Close"
                              : "View Tree"}
                          </Button>
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

      {/* ── Section B: Tree Viewer ── */}
      {selectedPhone && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          data-ocid="admin.matrix.tree.panel"
        >
          <Card className="card-premium border-primary/20">
            <CardHeader className="pb-3 flex flex-row items-start justify-between gap-2">
              <div>
                <CardTitle className="font-display font-bold text-lg text-foreground flex items-center gap-2">
                  <Network className="w-5 h-5 text-primary" />
                  {selectedUserTree
                    ? `${selectedUserTree.name}'s Matrix Tree`
                    : "Loading Tree..."}
                </CardTitle>
                <p className="text-muted-foreground text-xs font-body mt-1">
                  Phone: {selectedPhone} ·{" "}
                  {selectedUserTree
                    ? `Referral Code: ${selectedUserTree.referralCode}`
                    : ""}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedPhone(null)}
                className="border-border font-ui text-xs flex-shrink-0"
                data-ocid="admin.matrix.tree.close_button"
              >
                Close
              </Button>
            </CardHeader>
            <CardContent>
              {selectedTreeLoading ? (
                <div
                  className="space-y-3"
                  data-ocid="admin.matrix.tree.loading_state"
                >
                  <div className="flex justify-center gap-3">
                    {["t1", "t2", "t3"].map((k) => (
                      <Skeleton
                        key={k}
                        className="h-16 w-28 rounded-xl animate-shimmer"
                      />
                    ))}
                  </div>
                </div>
              ) : selectedUserTree ? (
                <ScrollArea className="w-full">
                  <div
                    className="overflow-x-auto overflow-y-visible pb-4"
                    data-ocid="admin.matrix.tree.scroll"
                  >
                    <div className="flex justify-center pt-6 min-w-max pb-4 px-4">
                      <AdminMatrixNode
                        node={selectedUserTree}
                        depth={0}
                        maxDepth={5}
                        slotIndex={0}
                      />
                    </div>
                  </div>
                  <p className="text-center text-muted-foreground/60 font-body text-[10px] mt-2 pb-2">
                    Tree shows up to 5 levels deep · Each member has 3 referral
                    slots
                  </p>
                </ScrollArea>
              ) : (
                <div
                  className="py-10 text-center"
                  data-ocid="admin.matrix.tree.empty_state"
                >
                  <Network className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-30" />
                  <p className="text-muted-foreground font-body text-sm">
                    No tree data found for this user.
                  </p>
                  <p className="text-muted-foreground font-body text-xs mt-1 opacity-70">
                    User may not have an active membership yet.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

// ── Admin Login Screen ────────────────────────────────────────────────────────

interface AdminLoginScreenProps {
  onLogin: () => void;
}

function AdminLoginScreen({ onLogin }: AdminLoginScreenProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    if (!password.trim()) {
      setError("Please enter your admin password.");
      return;
    }
    setLoading(true);
    setError(null);

    // Brief delay for UX feedback
    setTimeout(() => {
      if (password === ADMIN_PASSWORD) {
        localStorage.setItem(ADMIN_SESSION_KEY, "true");
        onLogin();
      } else {
        setError("Incorrect password. Please try again.");
        setLoading(false);
      }
    }, 400);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm"
        data-ocid="admin.login.panel"
      >
        {/* Icon */}
        <div className="flex justify-center mb-7">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-lg shadow-primary/10">
              <Shield className="w-9 h-9 text-primary" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center shadow-md">
              <Lock className="w-3 h-3 text-black" />
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="font-display font-black text-2xl text-foreground mb-2">
            Admin <span className="text-gradient-gold">Login</span>
          </h1>
          <p className="text-muted-foreground text-sm font-body leading-relaxed">
            Enter your admin password to access the control panel.
          </p>
        </div>

        {/* Login Card */}
        <Card className="card-premium border border-primary/15">
          <CardContent className="p-6 space-y-5">
            {error && (
              <Alert variant="destructive" data-ocid="admin.login.error_state">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription className="font-body text-sm">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-1.5">
              <Label
                htmlFor="adminPassword"
                className="font-ui text-sm text-muted-foreground"
              >
                Admin Password
              </Label>
              <Input
                id="adminPassword"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Enter admin password"
                className="bg-input border-border font-body text-sm"
                autoFocus
                data-ocid="admin.login.input"
              />
            </div>

            <Button
              className="w-full bg-primary text-primary-foreground font-ui text-base py-5 hover:opacity-90 transition-opacity"
              onClick={handleLogin}
              disabled={loading}
              data-ocid="admin.login.primary_button"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <Shield className="w-5 h-5 mr-2" />
              )}
              {loading ? "Verifying..." : "Login"}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

// ── Main Admin Panel ──────────────────────────────────────────────────────────

export default function AdminPage() {
  // Simple local password auth -- no blockchain dependency
  const [joiningBonus, setJoiningBonus] = useState<number>(150);
  const [joiningBonusInput, setJoiningBonusInput] = useState<string>("150");
  const [savingBonus, setSavingBonus] = useState(false);
  const [withdrawalRequests, setWithdrawalRequests] = useState<
    Array<{
      id: bigint;
      userId: bigint;
      phone: string;
      upiId: string;
      amount: bigint;
      documentUrl: string;
      status: string;
      timestamp: bigint;
    }>
  >([]);
  const [withdrawalLoading, setWithdrawalLoading] = useState(false);

  const fetchWithdrawalRequests = async () => {
    setWithdrawalLoading(true);
    try {
      const actor = await getActorWithRetry();
      const reqs = await (actor as any).getWithdrawalRequestsWithPassword(
        ADMIN_PASSWORD,
      );
      setWithdrawalRequests(reqs);
    } catch (_e) {
      toast.error("Failed to load withdrawal requests");
    } finally {
      setWithdrawalLoading(false);
    }
  };

  const handleWithdrawalStatus = async (id: bigint, status: string) => {
    try {
      const actor = await getActorWithRetry();
      await (actor as any).updateWithdrawalStatusWithPassword(
        ADMIN_PASSWORD,
        id,
        status,
      );
      toast.success(`Request marked as ${status}`);
      fetchWithdrawalRequests();
    } catch (_e) {
      toast.error("Failed to update status");
    }
  };

  // Load joining bonus from backend
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional
  useEffect(() => {
    getActorWithRetry()
      .then((actor) => (actor as any).getJoiningBonus() as Promise<bigint>)
      .then((v) => {
        const n = Number(v);
        setJoiningBonus(n);
        setJoiningBonusInput(String(n));
      })
      .catch(() => {});
  }, []);

  const handleSaveBonus = async () => {
    const val = Number.parseInt(joiningBonusInput, 10);
    if (Number.isNaN(val) || val < 0) {
      toast.error("Enter a valid amount");
      return;
    }
    setSavingBonus(true);
    try {
      const actor = await getActorWithRetry();
      await (actor as any).setJoiningBonusWithPassword(
        ADMIN_PASSWORD,
        BigInt(val),
      );
      setJoiningBonus(val);
      toast.success(`Joining bonus updated to ₹${val}`);
    } catch (e) {
      toast.error(`Failed to save: ${String(e)}`);
    } finally {
      setSavingBonus(false);
    }
  };

  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem(ADMIN_SESSION_KEY) === "true";
  });

  const handleLogin = () => {
    setIsAdminLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem(ADMIN_SESSION_KEY);
    setIsAdminLoggedIn(false);
  };

  // Admin data queries -- enabled only when logged in
  const {
    data: users,
    isLoading: usersLoading,
    refetch: refetchUsers,
  } = useAllUsers(isAdminLoggedIn);

  const { data: videos, isLoading: videosLoading } = useAllVideosPublic();

  const {
    data: paymentSubmissions,
    isLoading: paymentsLoading,
    refetch: refetchPayments,
  } = useAllPaymentSubmissions(isAdminLoggedIn);

  // queryClient MUST be declared before the useEffect that uses it
  const queryClient = useQueryClient();

  // Force-refetch users and payments immediately after admin login
  useEffect(() => {
    if (isAdminLoggedIn) {
      void queryClient.invalidateQueries({ queryKey: ["allUsers"] });
      void queryClient.invalidateQueries({
        queryKey: ["allPaymentSubmissions"],
      });
      setTimeout(() => {
        void refetchUsers();
        void refetchPayments();
      }, 300);
    }
  }, [isAdminLoggedIn, queryClient, refetchUsers, refetchPayments]);

  const updateUserStatusMutation = useUpdateUserStatusMutation();
  const updateUserMutation = useUpdateUserMutation();
  const deleteUserMutation = useDeleteUserMutation();
  const addVideoMutation = useAddVideoMutation();
  const deleteVideoMutation = useDeleteVideoMutation();
  const updateVideoChannelInfoMutation = useUpdateVideoChannelInfoMutation();
  const verifyPaymentMutation = useVerifyPaymentSubmissionMutation();

  const [addVideoOpen, setAddVideoOpen] = useState(false);
  const [videoForm, setVideoForm] = useState<AddVideoFormData>(initialFormData);
  const [formError, setFormError] = useState<string | null>(null);

  // Edit user dialog state
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    isActive: true,
  });
  const [editOpen, setEditOpen] = useState(false);

  // Delete user dialog state
  const [deleteUserId, setDeleteUserId] = useState<bigint | null>(null);
  const [deleteUserName, setDeleteUserName] = useState("");

  const deletePaymentMutation = useDeletePaymentSubmissionMutation();
  const [deletePaymentId, setDeletePaymentId] = useState<bigint | null>(null);
  const [deletePaymentName, setDeletePaymentName] = useState("");

  // ── Channels state (localStorage) ────────────────────────────────────────
  const [channels, setChannels] = useState<Channel[]>(() => {
    try {
      const raw = localStorage.getItem("admin_channels");
      return raw ? (JSON.parse(raw) as Channel[]) : [];
    } catch {
      return [];
    }
  });
  const [channelForm, setChannelForm] = useState({ name: "", url: "" });
  const [editingChannelId, setEditingChannelId] = useState<string | null>(null);
  const [channelFormError, setChannelFormError] = useState<string | null>(null);
  const [addChannelOpen, setAddChannelOpen] = useState(false);
  const [deleteChannelId, setDeleteChannelId] = useState<string | null>(null);
  const [deleteChannelName, setDeleteChannelName] = useState("");

  // Persist channels to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("admin_channels", JSON.stringify(channels));
  }, [channels]);

  // Video channel/thumbnail URLs are now stored in the backend, not localStorage

  // ── Matrix state ───────────────────────────────────────────────────────────
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);

  const {
    data: allReferralTrees,
    isLoading: allTreesLoading,
    refetch: refetchAllTrees,
  } = useAllReferralTreesAdmin(isAdminLoggedIn);

  const { data: selectedUserTree, isLoading: selectedTreeLoading } =
    useReferralTreeByPhoneAdmin(selectedPhone);

  const { data: adminUserChannels = [], isLoading: userChannelsLoading } =
    useAllChannelsAdmin(isAdminLoggedIn);

  const { data: adminUserVideos = [], isLoading: userVideosLoading } =
    useAllUserVideosAdmin(isAdminLoggedIn);

  const deleteChannelAdmin = useDeleteChannelAdminMutation();
  const deleteUserVideoAdmin = useDeleteUserVideoAdminMutation();
  // ── Auto-Approve state ─────────────────────────────────────────────────────
  const [autoApproveEnabled, setAutoApproveEnabled] = useState<boolean>(() => {
    return localStorage.getItem("admin_auto_approve") === "true";
  });
  const autoApproveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const isProcessingRef = useRef<boolean>(false);

  // ── Auto-Approve polling effect ────────────────────────────────────────────
  useEffect(() => {
    if (!autoApproveEnabled || !isAdminLoggedIn) {
      if (autoApproveIntervalRef.current !== null) {
        clearInterval(autoApproveIntervalRef.current);
        autoApproveIntervalRef.current = null;
      }
      return;
    }

    const processAutoApproval = async () => {
      if (isProcessingRef.current) return;
      isProcessingRef.current = true;

      try {
        const result = await refetchPayments();
        const submissions = result.data;
        if (!submissions || submissions.length === 0) return;

        // Collect UTRs already approved to detect duplicates
        const approvedUtrs = new Set<string>();
        for (const sub of submissions) {
          const statusRaw = sub.status;
          const statusStr =
            typeof statusRaw === "object" && statusRaw !== null
              ? (Object.keys(statusRaw as object)[0] ?? "pending")
              : String(statusRaw);
          if (statusStr === "approved") {
            approvedUtrs.add(sub.utr.trim().toLowerCase());
          }
        }

        // Process each pending submission
        for (const sub of submissions) {
          const statusRaw = sub.status;
          const statusStr =
            typeof statusRaw === "object" && statusRaw !== null
              ? (Object.keys(statusRaw as object)[0] ?? "pending")
              : String(statusRaw);

          if (statusStr !== "pending") continue;

          const utr = sub.utr.trim();
          const amount = sub.amount.trim();

          // Validate UTR: must be exactly 12 digits
          const utrValid = /^\d{12}$/.test(utr);
          // Validate amount: must equal "118"
          const amountValid = amount === "118";
          // Check for duplicate UTR among already-approved submissions
          const isDuplicateUtr = approvedUtrs.has(utr.toLowerCase());

          let rejectionReason = "";
          if (!utrValid) rejectionReason = "UTR must be exactly 12 digits";
          else if (!amountValid) rejectionReason = "Amount must be ₹118";
          else if (isDuplicateUtr) rejectionReason = "Duplicate UTR number";

          const allValid = utrValid && amountValid && !isDuplicateUtr;

          try {
            if (allValid) {
              await verifyPaymentMutation.mutateAsync({
                submissionId: sub.id,
                action: "approve",
              });
              approvedUtrs.add(utr.toLowerCase());
              toast.success(`Auto-approved payment for ${sub.name}`);
            } else {
              await verifyPaymentMutation.mutateAsync({
                submissionId: sub.id,
                action: "reject",
              });
              toast.error(
                `Auto-rejected invalid payment for ${sub.name} (${rejectionReason})`,
              );
            }
          } catch (err) {
            const msg = err instanceof Error ? err.message : "Processing error";
            toast.error(`Failed to process payment for ${sub.name}: ${msg}`);
          }
        }
      } finally {
        isProcessingRef.current = false;
      }
    };

    // Run immediately on enable, then every 10 seconds
    void processAutoApproval();
    autoApproveIntervalRef.current = setInterval(() => {
      void processAutoApproval();
    }, 10_000);

    return () => {
      if (autoApproveIntervalRef.current !== null) {
        clearInterval(autoApproveIntervalRef.current);
        autoApproveIntervalRef.current = null;
      }
    };
  }, [
    autoApproveEnabled,
    isAdminLoggedIn,
    refetchPayments,
    verifyPaymentMutation,
  ]);

  // ── Show login if not authenticated ──────────────────────────────────────

  if (!isAdminLoggedIn) {
    return <AdminLoginScreen onLogin={handleLogin} />;
  }

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleVideoFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setVideoForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setFormError(null);
  };

  const handleAddVideo = async () => {
    if (
      !videoForm.title.trim() ||
      !videoForm.category ||
      !videoForm.url.trim() ||
      !videoForm.duration
    ) {
      setFormError("Please fill in all required fields.");
      return;
    }
    const durationNum = Number.parseInt(videoForm.duration, 10);
    if (Number.isNaN(durationNum) || durationNum <= 0) {
      setFormError("Duration must be a positive number (in seconds).");
      return;
    }
    try {
      setFormError(null);
      await addVideoMutation.mutateAsync({
        title: videoForm.title,
        category: videoForm.category,
        url: videoForm.url,
        description: videoForm.description,
        duration: BigInt(durationNum),
        channelUrl: videoForm.channelUrl.trim(),
        thumbnailUrl: videoForm.thumbnailUrl.trim(),
      });
      toast.success("Video added successfully!");
      setVideoForm(initialFormData);
      setAddVideoOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to add video";
      setFormError(msg);
    }
  };

  const handleDeleteVideo = async (videoId: bigint, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await deleteVideoMutation.mutateAsync(videoId);
      toast.success("Video deleted.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to delete video";
      toast.error(msg);
    }
  };

  const handleToggleUserStatus = async (
    userId: bigint,
    currentStatus: boolean,
  ) => {
    try {
      await updateUserStatusMutation.mutateAsync({
        userId,
        isActive: !currentStatus,
      });
      toast.success(`User ${!currentStatus ? "activated" : "deactivated"}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update user";
      toast.error(msg);
    }
  };

  const handleOpenEditUser = (user: User) => {
    setEditUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      phone: user.phone,
      isActive: user.isActive,
    });
    setEditOpen(true);
  };

  const handleSaveEditUser = async () => {
    if (!editUser) return;
    try {
      await updateUserMutation.mutateAsync({
        userId: editUser.id,
        name: editForm.name.trim(),
        email: editForm.email.trim(),
        phone: editForm.phone.trim(),
        isActive: editForm.isActive,
      });
      toast.success("User updated successfully.");
      setEditOpen(false);
      setEditUser(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update user";
      toast.error(msg);
    }
  };

  const handleConfirmDeleteUser = async () => {
    if (deleteUserId === null) return;
    try {
      await deleteUserMutation.mutateAsync(deleteUserId);
      toast.success(`"${deleteUserName}" removed.`);
      setDeleteUserId(null);
      setDeleteUserName("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to delete user";
      toast.error(msg);
    }
  };

  const handleConfirmDeletePayment = async () => {
    if (deletePaymentId === null) return;
    try {
      await deletePaymentMutation.mutateAsync(deletePaymentId);
      toast.success("Payment record deleted.");
      setDeletePaymentId(null);
      setDeletePaymentName("");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to delete payment";
      toast.error(msg);
    }
  };

  // ── Summary stats ─────────────────────────────────────────────────────────

  const totalUsers = users?.length ?? 0;
  const paidUsers = users?.filter((u) => u.isPaid).length ?? 0;
  const activeUsers = users?.filter((u) => u.isActive).length ?? 0;
  const visiblePaymentSubmissions = paymentSubmissions;

  const pendingPayments =
    paymentSubmissions?.filter((p) => {
      const s = p.status;
      return typeof s === "object" ? "pending" in s : String(s) === "pending";
    }).length ?? 0;

  // ── Full admin panel ──────────────────────────────────────────────────────

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="admin-panel"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="p-6 max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-display font-black text-2xl text-foreground">
                Admin <span className="text-gradient-gold">Panel</span>
              </h1>
              <p className="text-muted-foreground text-sm font-body">
                Manage users, payments, videos, and platform stats
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="border-border font-ui text-muted-foreground hover:text-foreground"
              data-ocid="admin.header.button"
            >
              <LogOut className="w-4 h-4 mr-1.5" />
              Log Out
            </Button>
          </motion.div>
        </div>

        <Tabs defaultValue="users">
          <TabsList className="bg-card border border-border h-auto p-1 mb-6 flex-wrap gap-1">
            <TabsTrigger
              value="users"
              className="flex items-center gap-1.5 font-ui data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              data-ocid="admin.users.tab"
            >
              <Users className="w-4 h-4" />
              Users ({totalUsers})
            </TabsTrigger>
            <TabsTrigger
              value="payments"
              className="flex items-center gap-1.5 font-ui data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              data-ocid="admin.payments.tab"
            >
              <Receipt className="w-4 h-4" />
              Payments
              {pendingPayments > 0 && (
                <Badge className="ml-1 h-4 px-1.5 text-xs bg-amber-500 text-black">
                  {pendingPayments}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="videos"
              className="flex items-center gap-1.5 font-ui data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              data-ocid="admin.videos.tab"
            >
              <PlayCircle className="w-4 h-4" />
              Videos ({videos?.length ?? 0})
            </TabsTrigger>
            <TabsTrigger
              value="channels"
              className="flex items-center gap-1.5 font-ui data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              data-ocid="admin.channels.tab"
            >
              <LinkIcon className="w-4 h-4" />
              Channels ({channels.length})
            </TabsTrigger>
            <TabsTrigger
              value="matrix"
              className="flex items-center gap-1.5 font-ui data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              data-ocid="admin.matrix.tab"
            >
              <Network className="w-4 h-4" />
              Matrix
            </TabsTrigger>
            <TabsTrigger
              value="userchannels"
              className="flex items-center gap-1.5 font-ui data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              data-ocid="admin.userchannels.tab"
            >
              <Tv className="w-4 h-4" />
              User Channels ({adminUserChannels.length})
            </TabsTrigger>
            <TabsTrigger
              value="withdrawals"
              className="flex items-center gap-1.5 font-ui data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              onClick={fetchWithdrawalRequests}
            >
              <Banknote className="w-4 h-4" />
              Withdrawals
              {withdrawalRequests.filter((r) => r.status === "pending").length >
                0 && (
                <Badge className="ml-1 h-4 px-1.5 text-xs bg-amber-500 text-black">
                  {
                    withdrawalRequests.filter((r) => r.status === "pending")
                      .length
                  }
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="stats"
              className="flex items-center gap-1.5 font-ui data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              data-ocid="admin.stats.tab"
            >
              <BarChart3 className="w-4 h-4" />
              Stats
            </TabsTrigger>
          </TabsList>

          {/* ── USERS TAB ── */}
          <TabsContent value="users">
            <Card className="card-premium">
              <CardHeader className="pb-3 flex flex-row items-start justify-between gap-2">
                <CardTitle className="font-display font-bold text-lg text-foreground">
                  All Users
                </CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-border font-ui text-xs flex-shrink-0"
                  onClick={() => {
                    void refetchUsers();
                    toast.success("Refreshed user data");
                  }}
                  disabled={usersLoading}
                  data-ocid="admin.users.secondary_button"
                >
                  {usersLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5 mr-1" />
                  )}
                  Refresh
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {usersLoading ? (
                  <div
                    className="p-5 space-y-3"
                    data-ocid="admin.users.loading_state"
                  >
                    {["s1", "s2", "s3", "s4", "s5"].map((k) => (
                      <Skeleton key={k} className="h-12 rounded-lg" />
                    ))}
                  </div>
                ) : !users || users.length === 0 ? (
                  <div
                    className="p-10 text-center"
                    data-ocid="admin.users.empty_state"
                  >
                    <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-30" />
                    <p className="text-muted-foreground font-body text-sm">
                      No users registered yet
                    </p>
                    <p className="text-muted-foreground font-body text-xs mt-1 opacity-70">
                      If you expect users here, click Refresh above.
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="max-h-[500px]">
                    <Table data-ocid="admin.users.table">
                      <TableHeader>
                        <TableRow className="border-border hover:bg-transparent">
                          {[
                            "Name",
                            "Phone",
                            "Email",
                            "Balance",
                            "Watch Time",
                            "Paid",
                            "Status",
                            "Actions",
                          ].map((h) => (
                            <TableHead
                              key={h}
                              className="text-muted-foreground font-ui text-xs uppercase tracking-wide whitespace-nowrap"
                            >
                              {h}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((user, i) => {
                          const ocidIndex = i + 1;
                          return (
                            <TableRow
                              key={user.id.toString()}
                              className="border-border hover:bg-muted/20 transition-colors"
                              data-ocid={`admin.users.item.${ocidIndex}`}
                            >
                              <TableCell className="py-3 font-ui font-medium text-sm text-foreground">
                                {user.name}
                              </TableCell>
                              <TableCell className="py-3 text-sm text-muted-foreground font-body">
                                {user.phone || "—"}
                              </TableCell>
                              <TableCell className="py-3 text-sm text-muted-foreground font-body">
                                {user.email || "—"}
                              </TableCell>
                              <TableCell className="py-3 text-sm font-display font-bold text-green-400">
                                ₹{Number(user.walletBalance).toFixed(2)}
                              </TableCell>
                              <TableCell className="py-3">
                                <span className="font-ui text-xs text-blue-300">
                                  {formatAdminWatchTime(user.phone)}
                                </span>
                              </TableCell>
                              <TableCell className="py-3">
                                {user.isPaid ? (
                                  <CheckCircle className="w-4 h-4 text-green-400" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-red-400" />
                                )}
                              </TableCell>
                              <TableCell className="py-3">
                                <Badge
                                  variant="outline"
                                  className={
                                    user.isActive
                                      ? "border-green-500/30 text-green-300 bg-green-500/10 text-xs"
                                      : "border-red-500/30 text-red-300 bg-red-500/10 text-xs"
                                  }
                                >
                                  {user.isActive ? "Active" : "Inactive"}
                                </Badge>
                              </TableCell>
                              <TableCell className="py-3">
                                <div className="flex items-center gap-1.5">
                                  <Switch
                                    checked={user.isActive}
                                    onCheckedChange={() =>
                                      handleToggleUserStatus(
                                        user.id,
                                        user.isActive,
                                      )
                                    }
                                    disabled={
                                      updateUserStatusMutation.isPending
                                    }
                                    data-ocid={`admin.users.switch.${ocidIndex}`}
                                  />
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleOpenEditUser(user)}
                                    className="text-muted-foreground hover:text-primary hover:bg-primary/10 w-8 h-8"
                                    data-ocid={`admin.users.edit_button.${ocidIndex}`}
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      setDeleteUserId(user.id);
                                      setDeleteUserName(user.name);
                                    }}
                                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 w-8 h-8"
                                    data-ocid={`admin.users.delete_button.${ocidIndex}`}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
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

            {/* ── Edit User Dialog ── */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
              <DialogContent
                className="bg-card border-border max-w-md"
                data-ocid="admin.users.edit.dialog"
              >
                <DialogHeader>
                  <DialogTitle className="font-display font-bold text-foreground">
                    Edit User
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="editName" className="font-ui text-sm">
                      Full Name
                    </Label>
                    <Input
                      id="editName"
                      value={editForm.name}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="Full name"
                      className="bg-input border-border font-body"
                      data-ocid="admin.users.edit.input"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="editEmail" className="font-ui text-sm">
                      Email
                    </Label>
                    <Input
                      id="editEmail"
                      type="email"
                      value={editForm.email}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      placeholder="Email address"
                      className="bg-input border-border font-body"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="editPhone" className="font-ui text-sm">
                      Phone
                    </Label>
                    <Input
                      id="editPhone"
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          phone: e.target.value,
                        }))
                      }
                      placeholder="Phone number"
                      className="bg-input border-border font-body"
                    />
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <Label htmlFor="editActive" className="font-ui text-sm">
                      Active Status
                    </Label>
                    <Switch
                      id="editActive"
                      checked={editForm.isActive}
                      onCheckedChange={(checked) =>
                        setEditForm((prev) => ({
                          ...prev,
                          isActive: checked,
                        }))
                      }
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setEditOpen(false)}
                    className="border-border font-ui"
                    data-ocid="admin.users.edit.cancel_button"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveEditUser}
                    disabled={updateUserMutation.isPending}
                    className="bg-primary text-primary-foreground font-ui"
                    data-ocid="admin.users.edit.save_button"
                  >
                    {updateUserMutation.isPending ? (
                      <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                    ) : null}
                    {updateUserMutation.isPending
                      ? "Saving..."
                      : "Save Changes"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* ── Delete User AlertDialog ── */}
            <AlertDialog
              open={deleteUserId !== null}
              onOpenChange={(open) => {
                if (!open) {
                  setDeleteUserId(null);
                  setDeleteUserName("");
                }
              }}
            >
              <AlertDialogContent
                className="bg-card border-border"
                data-ocid="admin.users.delete.dialog"
              >
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-display font-bold text-foreground">
                    Delete User
                  </AlertDialogTitle>
                  <AlertDialogDescription className="font-body text-muted-foreground">
                    Are you sure you want to permanently delete{" "}
                    <span className="font-semibold text-foreground">
                      "{deleteUserName}"
                    </span>
                    ? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel
                    className="font-ui border-border"
                    data-ocid="admin.users.delete.cancel_button"
                  >
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleConfirmDeleteUser}
                    disabled={deleteUserMutation.isPending}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-ui"
                    data-ocid="admin.users.delete.confirm_button"
                  >
                    {deleteUserMutation.isPending ? (
                      <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                    ) : null}
                    {deleteUserMutation.isPending
                      ? "Deleting..."
                      : "Delete User"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </TabsContent>

          {/* ── PAYMENTS TAB ── */}
          <TabsContent value="payments" data-ocid="admin.payments.panel">
            {/* Joining Bonus Settings Card */}
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-4"
            >
              <Card
                className="card-premium border-primary/20"
                data-ocid="admin.joining_bonus.card"
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center flex-shrink-0">
                      <IndianRupee className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-ui font-semibold text-sm text-foreground mb-0.5">
                        Joining Bonus (₹)
                      </div>
                      <p className="text-xs text-muted-foreground font-body mb-3">
                        Amount credited to user wallet on payment approval.
                        Currently:{" "}
                        <strong className="text-primary">
                          ₹{joiningBonus}
                        </strong>
                      </p>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          value={joiningBonusInput}
                          onChange={(e) => setJoiningBonusInput(e.target.value)}
                          className="w-28 bg-secondary border-border font-ui text-sm h-8"
                          placeholder="150"
                          data-ocid="admin.joining_bonus.input"
                        />
                        <Button
                          size="sm"
                          onClick={handleSaveBonus}
                          disabled={savingBonus}
                          className="bg-primary text-primary-foreground font-ui text-xs h-8"
                          data-ocid="admin.joining_bonus.save_button"
                        >
                          {savingBonus ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            "Save"
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            {/* Auto-Approve Toggle Card */}
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="mb-4"
            >
              <Card
                className={`border transition-colors duration-300 ${autoApproveEnabled ? "border-amber-500/40 bg-amber-500/5" : "card-premium"}`}
                data-ocid="admin.payments.auto_approve.card"
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors duration-300 ${autoApproveEnabled ? "bg-amber-500/20 border border-amber-500/30" : "bg-muted border border-border"}`}
                    >
                      <Zap
                        className={`w-5 h-5 transition-colors duration-300 ${autoApproveEnabled ? "text-amber-400" : "text-muted-foreground"}`}
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-3 mb-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-ui font-semibold text-sm text-foreground">
                            Auto-Approve Payments
                          </span>
                          <Badge
                            variant="outline"
                            className={`text-xs font-ui font-bold transition-colors duration-300 ${autoApproveEnabled ? "border-green-500/40 text-green-300 bg-green-500/10" : "border-border text-muted-foreground bg-muted/30"}`}
                          >
                            {autoApproveEnabled ? "ON" : "OFF"}
                          </Badge>
                        </div>
                        <Switch
                          checked={autoApproveEnabled}
                          onCheckedChange={(checked) => {
                            setAutoApproveEnabled(checked);
                            localStorage.setItem(
                              "admin_auto_approve",
                              String(checked),
                            );
                            toast.success(
                              checked
                                ? "Auto-approval enabled — polling every 10 seconds"
                                : "Auto-approval disabled",
                            );
                          }}
                          data-ocid="admin.payments.auto_approve.toggle"
                        />
                      </div>
                      <p className="text-muted-foreground font-body text-xs leading-relaxed mb-1.5">
                        <span className="font-semibold text-foreground/70">
                          Validations:
                        </span>{" "}
                        UTR must be 12 digits · Amount must be ₹118 · No
                        duplicate UTR
                      </p>
                      {autoApproveEnabled && (
                        <motion.p
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="text-amber-400/80 font-body text-xs flex items-center gap-1.5"
                        >
                          <Zap className="w-3 h-3 flex-shrink-0" />
                          When ON, all pending payments are checked every 10
                          seconds automatically.
                        </motion.p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <Card className="card-premium">
              <CardHeader className="pb-3 flex flex-row items-start justify-between gap-2">
                <div>
                  <CardTitle className="font-display font-bold text-lg text-foreground flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-primary" />
                    Payment Submissions
                  </CardTitle>
                  <p className="text-muted-foreground text-xs font-body mt-1">
                    Review and verify user payment proof submissions
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-border font-ui text-xs flex-shrink-0"
                  onClick={() => {
                    void refetchPayments();
                    void refetchUsers();
                    toast.success("Refreshed payment data");
                  }}
                  disabled={paymentsLoading}
                  data-ocid="admin.payments.secondary_button"
                >
                  {paymentsLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5 mr-1" />
                  )}
                  Refresh
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {paymentsLoading ? (
                  <div
                    className="p-5 space-y-3"
                    data-ocid="admin.payments.loading_state"
                  >
                    {["s1", "s2", "s3", "s4"].map((k) => (
                      <Skeleton key={k} className="h-12 rounded-lg" />
                    ))}
                  </div>
                ) : !visiblePaymentSubmissions ||
                  visiblePaymentSubmissions.length === 0 ? (
                  <div
                    className="p-10 text-center"
                    data-ocid="admin.payments.empty_state"
                  >
                    <Receipt className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-30" />
                    <p className="text-muted-foreground font-body text-sm">
                      No payment submissions yet.
                    </p>
                    <p className="text-muted-foreground font-body text-xs mt-1 opacity-70">
                      Click Refresh to reload the latest submissions.
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="max-h-[560px]">
                    <Table data-ocid="admin.payments.table">
                      <TableHeader>
                        <TableRow className="border-border hover:bg-transparent">
                          {[
                            "Name",
                            "Phone",
                            "Amount",
                            "UTR / Transaction ID",
                            "Status",
                            "Submitted At",
                            "Actions",
                          ].map((h) => (
                            <TableHead
                              key={h}
                              className="text-muted-foreground font-ui text-xs uppercase tracking-wide whitespace-nowrap"
                            >
                              {h}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {visiblePaymentSubmissions.map((submission, i) => {
                          const ocidIndex = i + 1;
                          const submittedAt = new Date(
                            Number(submission.timestamp / BigInt(1_000_000)),
                          ).toLocaleString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          });
                          const statusRaw = submission.status;
                          const statusStr =
                            typeof statusRaw === "object" && statusRaw !== null
                              ? (Object.keys(statusRaw as object)[0] ??
                                "pending")
                              : String(statusRaw);
                          const isPending = statusStr === "pending";
                          return (
                            <TableRow
                              key={submission.id.toString()}
                              className="border-border hover:bg-muted/20 transition-colors"
                              data-ocid={`admin.payments.item.${ocidIndex}`}
                            >
                              <TableCell className="py-3 font-ui font-medium text-sm text-foreground">
                                {submission.name}
                              </TableCell>
                              <TableCell className="py-3 text-sm text-muted-foreground font-body">
                                {submission.phone}
                              </TableCell>
                              <TableCell className="py-3 text-sm font-display font-bold text-green-400 whitespace-nowrap">
                                ₹{submission.amount}
                              </TableCell>
                              <TableCell className="py-3">
                                <span className="font-mono text-xs text-primary bg-primary/10 px-2 py-0.5 rounded">
                                  {submission.utr}
                                </span>
                              </TableCell>
                              <TableCell className="py-3">
                                <Badge
                                  variant="outline"
                                  className={
                                    statusStr === "approved"
                                      ? "border-green-500/30 text-green-300 bg-green-500/10 text-xs"
                                      : statusStr === "rejected"
                                        ? "border-red-500/30 text-red-300 bg-red-500/10 text-xs"
                                        : "border-amber-500/30 text-amber-300 bg-amber-500/10 text-xs"
                                  }
                                >
                                  {statusStr === "approved" && (
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                  )}
                                  {statusStr === "rejected" && (
                                    <XCircle className="w-3 h-3 mr-1" />
                                  )}
                                  {statusStr.charAt(0).toUpperCase() +
                                    statusStr.slice(1)}
                                </Badge>
                              </TableCell>
                              <TableCell className="py-3 text-xs text-muted-foreground font-body whitespace-nowrap">
                                {submittedAt}
                              </TableCell>
                              <TableCell className="py-3">
                                {isPending ? (
                                  <div className="flex items-center gap-1.5">
                                    <Button
                                      size="sm"
                                      onClick={async () => {
                                        try {
                                          await verifyPaymentMutation.mutateAsync(
                                            {
                                              submissionId: submission.id,
                                              action: "approve",
                                            },
                                          );
                                          toast.success(
                                            `Payment approved for ${submission.name}`,
                                          );
                                        } catch (err) {
                                          const msg =
                                            err instanceof Error
                                              ? err.message
                                              : "Failed to approve";
                                          toast.error(msg);
                                        }
                                      }}
                                      disabled={verifyPaymentMutation.isPending}
                                      className="bg-green-600 hover:bg-green-700 text-white font-ui text-xs h-7 px-2.5"
                                      data-ocid={`admin.payments.confirm_button.${ocidIndex}`}
                                    >
                                      {verifyPaymentMutation.isPending ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                      ) : (
                                        <CheckCircle className="w-3 h-3 mr-1" />
                                      )}
                                      Approve
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={async () => {
                                        try {
                                          await verifyPaymentMutation.mutateAsync(
                                            {
                                              submissionId: submission.id,
                                              action: "reject",
                                            },
                                          );
                                          toast.success(
                                            `Payment rejected for ${submission.name}`,
                                          );
                                        } catch (err) {
                                          const msg =
                                            err instanceof Error
                                              ? err.message
                                              : "Failed to reject";
                                          toast.error(msg);
                                        }
                                      }}
                                      disabled={verifyPaymentMutation.isPending}
                                      className="border-red-500/30 text-red-400 hover:bg-red-500/10 font-ui text-xs h-7 px-2.5"
                                      data-ocid={`admin.payments.reject_button.${ocidIndex}`}
                                    >
                                      {verifyPaymentMutation.isPending ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                      ) : (
                                        <XCircle className="w-3 h-3 mr-1" />
                                      )}
                                      Reject
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => {
                                        setDeletePaymentId(submission.id);
                                        setDeletePaymentName(submission.name);
                                      }}
                                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 w-7 h-7 p-0"
                                      data-ocid={`admin.payments.delete_button.${ocidIndex}`}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs text-muted-foreground font-body italic">
                                      Resolved
                                    </span>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => {
                                        setDeletePaymentId(submission.id);
                                        setDeletePaymentName(submission.name);
                                      }}
                                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 w-7 h-7 p-0"
                                      data-ocid={`admin.payments.resolved_delete_button.${ocidIndex}`}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                  </div>
                                )}
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
          </TabsContent>

          {/* ── Delete Payment AlertDialog ── */}
          <AlertDialog
            open={deletePaymentId !== null}
            onOpenChange={(open) => {
              if (!open) {
                setDeletePaymentId(null);
                setDeletePaymentName("");
              }
            }}
          >
            <AlertDialogContent
              className="bg-card border-border"
              data-ocid="admin.payments.delete.dialog"
            >
              <AlertDialogHeader>
                <AlertDialogTitle className="font-display font-bold text-foreground">
                  Delete Payment Record
                </AlertDialogTitle>
                <AlertDialogDescription className="font-body text-muted-foreground">
                  Delete this payment record for{" "}
                  <span className="font-semibold text-foreground">
                    "{deletePaymentName}"
                  </span>
                  ? This removes it from view.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel
                  className="font-ui border-border"
                  data-ocid="admin.payments.delete.cancel_button"
                >
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleConfirmDeletePayment}
                  disabled={deletePaymentMutation.isPending}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-ui"
                  data-ocid="admin.payments.delete.confirm_button"
                >
                  {deletePaymentMutation.isPending ? (
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                  ) : null}
                  {deletePaymentMutation.isPending ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* ── VIDEOS TAB ── */}
          <TabsContent value="videos">
            <Card className="card-premium">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="font-display font-bold text-lg text-foreground">
                  All Videos
                </CardTitle>
                <Dialog open={addVideoOpen} onOpenChange={setAddVideoOpen}>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      className="bg-primary text-primary-foreground hover:opacity-90 font-ui"
                      data-ocid="admin.videos.open_modal_button"
                    >
                      <Plus className="w-4 h-4 mr-1.5" />
                      Add Video
                    </Button>
                  </DialogTrigger>
                  <DialogContent
                    className="bg-card border-border max-w-lg"
                    data-ocid="admin.videos.dialog"
                  >
                    <DialogHeader>
                      <DialogTitle className="font-display font-bold text-foreground">
                        Add New Video
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                      {formError && (
                        <Alert
                          variant="destructive"
                          data-ocid="admin.videos.form.error_state"
                        >
                          <AlertCircle className="w-4 h-4" />
                          <AlertDescription className="font-body text-sm">
                            {formError}
                          </AlertDescription>
                        </Alert>
                      )}
                      <div className="space-y-1.5">
                        <Label htmlFor="vTitle" className="font-ui text-sm">
                          Title *
                        </Label>
                        <Input
                          id="vTitle"
                          name="title"
                          value={videoForm.title}
                          onChange={handleVideoFormChange}
                          placeholder="Enter video title"
                          className="bg-input border-border font-body"
                          data-ocid="admin.videos.title.input"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="vCategory" className="font-ui text-sm">
                          Category *
                        </Label>
                        <Select
                          value={videoForm.category}
                          onValueChange={(v) =>
                            setVideoForm((prev) => ({ ...prev, category: v }))
                          }
                        >
                          <SelectTrigger
                            id="vCategory"
                            className="bg-input border-border font-body"
                            data-ocid="admin.videos.category.select"
                          >
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border">
                            {VIDEO_CATEGORIES.map((cat) => (
                              <SelectItem
                                key={cat}
                                value={cat}
                                className="font-ui text-sm"
                              >
                                {cat}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="vUrl" className="font-ui text-sm">
                          Video URL *
                        </Label>
                        <Input
                          id="vUrl"
                          name="url"
                          value={videoForm.url}
                          onChange={handleVideoFormChange}
                          placeholder="https://youtube.com/embed/..."
                          className="bg-input border-border font-body"
                          data-ocid="admin.videos.url.input"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="vChannelUrl"
                          className="font-ui text-sm"
                        >
                          Channel URL
                        </Label>
                        {channels.length > 0 ? (
                          <Select
                            value={videoForm.channelUrl}
                            onValueChange={(v) =>
                              setVideoForm((prev) => ({
                                ...prev,
                                channelUrl: v === "__manual__" ? "" : v,
                              }))
                            }
                          >
                            <SelectTrigger
                              id="vChannelUrl"
                              className="bg-input border-border font-body"
                              data-ocid="admin.videos.channel.select"
                            >
                              <SelectValue placeholder="Select channel (optional)" />
                            </SelectTrigger>
                            <SelectContent className="bg-popover border-border">
                              <SelectItem
                                value="__manual__"
                                className="font-ui text-sm text-muted-foreground italic"
                              >
                                — None / Enter manually —
                              </SelectItem>
                              {channels.map((ch) => (
                                <SelectItem
                                  key={ch.id}
                                  value={ch.url}
                                  className="font-ui text-sm"
                                >
                                  {ch.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : null}
                        <Input
                          id="vChannelUrlManual"
                          name="channelUrl"
                          value={videoForm.channelUrl}
                          onChange={handleVideoFormChange}
                          placeholder="https://youtube.com/@yourchannel (optional)"
                          className="bg-input border-border font-body"
                          data-ocid="admin.videos.channelurl.input"
                        />
                        {channels.length > 0 && (
                          <p className="text-muted-foreground font-body text-xs">
                            Select from your saved channels above, or type a URL
                            directly.
                          </p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="vThumbnailUrl"
                          className="font-ui text-sm"
                        >
                          Thumbnail URL
                        </Label>
                        <Input
                          id="vThumbnailUrl"
                          name="thumbnailUrl"
                          value={videoForm.thumbnailUrl}
                          onChange={handleVideoFormChange}
                          placeholder="https://example.com/thumbnail.jpg (optional)"
                          className="bg-input border-border font-body"
                          data-ocid="admin.videos.thumbnail.input"
                        />
                        <p className="text-muted-foreground font-body text-xs">
                          Custom thumbnail image URL for this video card.
                        </p>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="vDesc" className="font-ui text-sm">
                          Description
                        </Label>
                        <Textarea
                          id="vDesc"
                          name="description"
                          value={videoForm.description}
                          onChange={handleVideoFormChange}
                          placeholder="Enter video description"
                          className="bg-input border-border font-body resize-none"
                          rows={3}
                          data-ocid="admin.videos.description.textarea"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="vDuration" className="font-ui text-sm">
                          Duration (seconds) *
                        </Label>
                        <Input
                          id="vDuration"
                          name="duration"
                          type="number"
                          value={videoForm.duration}
                          onChange={handleVideoFormChange}
                          placeholder="e.g. 1800 for 30 minutes"
                          className="bg-input border-border font-body"
                          data-ocid="admin.videos.duration.input"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setAddVideoOpen(false)}
                        className="border-border font-ui"
                        data-ocid="admin.videos.cancel_button"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleAddVideo}
                        disabled={addVideoMutation.isPending}
                        className="bg-primary text-primary-foreground font-ui"
                        data-ocid="admin.videos.submit_button"
                      >
                        {addVideoMutation.isPending ? (
                          <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                        ) : null}
                        {addVideoMutation.isPending ? "Adding..." : "Add Video"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="p-0">
                {videosLoading ? (
                  <div
                    className="p-5 space-y-3"
                    data-ocid="admin.videos.loading_state"
                  >
                    {["s1", "s2", "s3", "s4"].map((k) => (
                      <Skeleton key={k} className="h-12 rounded-lg" />
                    ))}
                  </div>
                ) : !videos || videos.length === 0 ? (
                  <div
                    className="p-10 text-center"
                    data-ocid="admin.videos.empty_state"
                  >
                    <PlayCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-30" />
                    <p className="text-muted-foreground font-body text-sm">
                      No videos added yet. Click "Add Video" to get started.
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="max-h-[500px]">
                    <Table data-ocid="admin.videos.table">
                      <TableHeader>
                        <TableRow className="border-border hover:bg-transparent">
                          {[
                            "Title",
                            "Category",
                            "Thumbnail",
                            "Channel URL",
                            "Duration",
                            "Actions",
                          ].map((h) => (
                            <TableHead
                              key={h}
                              className="text-muted-foreground font-ui text-xs uppercase tracking-wide whitespace-nowrap"
                            >
                              {h}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {videos.map((video, i) => {
                          const ocidIndex = i + 1;
                          const durationSec = Number(video.duration);
                          const mins = Math.floor(durationSec / 60);
                          const assignedChannelUrl = video.channelUrl ?? "";
                          const assignedThumbnailUrl = video.thumbnailUrl ?? "";
                          return (
                            <TableRow
                              key={video.id.toString()}
                              className="border-border hover:bg-muted/20 transition-colors"
                              data-ocid={`admin.videos.item.${ocidIndex}`}
                            >
                              <TableCell className="py-3 font-ui font-medium text-sm text-foreground max-w-[160px]">
                                <span className="truncate block">
                                  {video.title}
                                </span>
                              </TableCell>
                              <TableCell className="py-3">
                                <Badge
                                  variant="outline"
                                  className="text-xs border-primary/30 text-primary"
                                >
                                  {video.category}
                                </Badge>
                              </TableCell>
                              {/* Thumbnail cell */}
                              <TableCell className="py-3">
                                {assignedThumbnailUrl ? (
                                  <div className="flex items-center gap-1.5">
                                    <img
                                      src={assignedThumbnailUrl}
                                      alt="thumb"
                                      className="w-12 h-8 object-cover rounded border border-border"
                                    />
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={async () => {
                                        const newUrl = prompt(
                                          "Edit Thumbnail URL:",
                                          assignedThumbnailUrl,
                                        );
                                        if (newUrl !== null) {
                                          await updateVideoChannelInfoMutation.mutateAsync(
                                            {
                                              videoId: video.id,
                                              channelUrl: assignedChannelUrl,
                                              thumbnailUrl: newUrl.trim(),
                                            },
                                          );
                                          toast.success("Thumbnail updated");
                                        }
                                      }}
                                      className="text-muted-foreground hover:text-primary hover:bg-primary/10 w-6 h-6 flex-shrink-0"
                                      data-ocid={`admin.videos.thumbnail_edit_button.${ocidIndex}`}
                                    >
                                      <Pencil className="w-3 h-3" />
                                    </Button>
                                  </div>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={async () => {
                                      const newUrl = prompt(
                                        "Enter Thumbnail URL for this video:",
                                      );
                                      if (newUrl?.trim()) {
                                        await updateVideoChannelInfoMutation.mutateAsync(
                                          {
                                            videoId: video.id,
                                            channelUrl: assignedChannelUrl,
                                            thumbnailUrl: newUrl.trim(),
                                          },
                                        );
                                        toast.success("Thumbnail added");
                                      }
                                    }}
                                    className="text-muted-foreground hover:text-primary text-xs h-7 px-2"
                                    data-ocid={`admin.videos.thumbnail_add_button.${ocidIndex}`}
                                  >
                                    <Plus className="w-3 h-3 mr-1" />
                                    Add
                                  </Button>
                                )}
                              </TableCell>
                              <TableCell className="py-3 max-w-[180px]">
                                {assignedChannelUrl ? (
                                  <div className="flex items-center gap-1.5">
                                    <a
                                      href={assignedChannelUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="font-body text-xs text-primary hover:underline truncate block max-w-[130px]"
                                    >
                                      {assignedChannelUrl}
                                    </a>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={async () => {
                                        const newUrl = prompt(
                                          "Edit Channel URL:",
                                          assignedChannelUrl,
                                        );
                                        if (newUrl !== null) {
                                          await updateVideoChannelInfoMutation.mutateAsync(
                                            {
                                              videoId: video.id,
                                              channelUrl: newUrl.trim(),
                                              thumbnailUrl:
                                                assignedThumbnailUrl,
                                            },
                                          );
                                          toast.success("Channel URL updated");
                                        }
                                      }}
                                      className="text-muted-foreground hover:text-primary hover:bg-primary/10 w-6 h-6 flex-shrink-0"
                                      data-ocid={`admin.videos.channel_edit_button.${ocidIndex}`}
                                    >
                                      <Pencil className="w-3 h-3" />
                                    </Button>
                                  </div>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={async () => {
                                      const newUrl = prompt(
                                        "Enter Channel URL for this video:",
                                      );
                                      if (newUrl?.trim()) {
                                        await updateVideoChannelInfoMutation.mutateAsync(
                                          {
                                            videoId: video.id,
                                            channelUrl: newUrl.trim(),
                                            thumbnailUrl: assignedThumbnailUrl,
                                          },
                                        );
                                        toast.success("Channel URL added");
                                      }
                                    }}
                                    className="text-muted-foreground hover:text-primary text-xs h-7 px-2"
                                    data-ocid={`admin.videos.channel_add_button.${ocidIndex}`}
                                  >
                                    <Plus className="w-3 h-3 mr-1" />
                                    Add URL
                                  </Button>
                                )}
                              </TableCell>
                              <TableCell className="py-3 text-sm text-muted-foreground font-body whitespace-nowrap">
                                {mins}m {durationSec % 60}s
                              </TableCell>
                              <TableCell className="py-3">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    handleDeleteVideo(video.id, video.title)
                                  }
                                  disabled={deleteVideoMutation.isPending}
                                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 w-8 h-8"
                                  data-ocid={`admin.videos.delete_button.${ocidIndex}`}
                                >
                                  {deleteVideoMutation.isPending ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-4 h-4" />
                                  )}
                                </Button>
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
          </TabsContent>

          {/* ── CHANNELS TAB ── */}
          <TabsContent value="channels">
            <Card className="card-premium">
              <CardHeader className="pb-3 flex flex-row items-start justify-between gap-2">
                <div>
                  <CardTitle className="font-display font-bold text-lg text-foreground flex items-center gap-2">
                    <LinkIcon className="w-5 h-5 text-primary" />
                    Channel URLs
                  </CardTitle>
                  <p className="text-muted-foreground text-xs font-body mt-1">
                    Manage channel links for your platform
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingChannelId(null);
                    setChannelForm({ name: "", url: "" });
                    setChannelFormError(null);
                    setAddChannelOpen(true);
                  }}
                  className="bg-primary text-primary-foreground font-ui text-xs"
                  data-ocid="admin.channels.primary_button"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Channel
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* ── Inline Add / Edit Form ── */}
                {addChannelOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                    className="border border-primary/20 rounded-xl p-4 bg-primary/5 space-y-3"
                  >
                    <h3 className="font-ui font-semibold text-sm text-foreground">
                      {editingChannelId ? "Edit Channel" : "Add New Channel"}
                    </h3>
                    {channelFormError && (
                      <Alert
                        variant="destructive"
                        data-ocid="admin.channels.form.error_state"
                      >
                        <AlertCircle className="w-4 h-4" />
                        <AlertDescription className="font-body text-sm">
                          {channelFormError}
                        </AlertDescription>
                      </Alert>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="channelName"
                          className="font-ui text-sm text-muted-foreground"
                        >
                          Channel Name *
                        </Label>
                        <Input
                          id="channelName"
                          value={channelForm.name}
                          onChange={(e) => {
                            setChannelForm((prev) => ({
                              ...prev,
                              name: e.target.value,
                            }));
                            setChannelFormError(null);
                          }}
                          placeholder="e.g. YouTube Main Channel"
                          className="bg-input border-border font-body text-sm"
                          data-ocid="admin.channels.name.input"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="channelUrl"
                          className="font-ui text-sm text-muted-foreground"
                        >
                          Channel URL *
                        </Label>
                        <Input
                          id="channelUrl"
                          value={channelForm.url}
                          onChange={(e) => {
                            setChannelForm((prev) => ({
                              ...prev,
                              url: e.target.value,
                            }));
                            setChannelFormError(null);
                          }}
                          placeholder="https://youtube.com/@yourchannel"
                          className="bg-input border-border font-body text-sm"
                          data-ocid="admin.channels.url.input"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        size="sm"
                        onClick={() => {
                          const name = channelForm.name.trim();
                          const url = channelForm.url.trim();
                          if (!name) {
                            setChannelFormError("Channel name is required.");
                            return;
                          }
                          if (!url) {
                            setChannelFormError("Channel URL is required.");
                            return;
                          }
                          if (
                            !url.startsWith("http://") &&
                            !url.startsWith("https://")
                          ) {
                            setChannelFormError(
                              "URL must start with http:// or https://",
                            );
                            return;
                          }
                          if (editingChannelId) {
                            setChannels((prev) =>
                              prev.map((ch) =>
                                ch.id === editingChannelId
                                  ? { ...ch, name, url }
                                  : ch,
                              ),
                            );
                            toast.success("Channel updated successfully!");
                          } else {
                            setChannels((prev) => [
                              ...prev,
                              { id: crypto.randomUUID(), name, url },
                            ]);
                            toast.success("Channel added successfully!");
                          }
                          setChannelForm({ name: "", url: "" });
                          setEditingChannelId(null);
                          setChannelFormError(null);
                          setAddChannelOpen(false);
                        }}
                        className="bg-primary text-primary-foreground font-ui text-xs"
                        data-ocid="admin.channels.save.button"
                      >
                        {editingChannelId ? "Update Channel" : "Save Channel"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setAddChannelOpen(false);
                          setEditingChannelId(null);
                          setChannelForm({ name: "", url: "" });
                          setChannelFormError(null);
                        }}
                        className="border-border font-ui text-xs"
                        data-ocid="admin.channels.cancel_button"
                      >
                        Cancel
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* ── Channel List ── */}
                {channels.length === 0 ? (
                  <div
                    className="py-10 text-center"
                    data-ocid="admin.channels.empty_state"
                  >
                    <LinkIcon className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-30" />
                    <p className="text-muted-foreground font-body text-sm">
                      No channels added yet.
                    </p>
                    <p className="text-muted-foreground font-body text-xs mt-1 opacity-70">
                      Click "Add Channel" to add your first channel URL.
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="max-h-[500px]">
                    <Table data-ocid="admin.channels.table">
                      <TableHeader>
                        <TableRow className="border-border hover:bg-transparent">
                          {["Name", "URL", "Actions"].map((h) => (
                            <TableHead
                              key={h}
                              className="text-muted-foreground font-ui text-xs uppercase tracking-wide"
                            >
                              {h}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {channels.map((channel, i) => {
                          const ocidIndex = i + 1;
                          return (
                            <TableRow
                              key={channel.id}
                              className="border-border hover:bg-muted/20 transition-colors"
                              data-ocid={`admin.channels.item.${ocidIndex}`}
                            >
                              <TableCell className="py-3 font-ui font-medium text-sm text-foreground max-w-[180px]">
                                <span className="truncate block">
                                  {channel.name}
                                </span>
                              </TableCell>
                              <TableCell className="py-3 max-w-[260px]">
                                <a
                                  href={channel.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-body text-xs text-primary hover:underline truncate block"
                                >
                                  {channel.url}
                                </a>
                              </TableCell>
                              <TableCell className="py-3">
                                <div className="flex items-center gap-1.5">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      setEditingChannelId(channel.id);
                                      setChannelForm({
                                        name: channel.name,
                                        url: channel.url,
                                      });
                                      setChannelFormError(null);
                                      setAddChannelOpen(true);
                                    }}
                                    className="text-muted-foreground hover:text-primary hover:bg-primary/10 w-8 h-8"
                                    data-ocid={`admin.channels.edit_button.${ocidIndex}`}
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      setDeleteChannelId(channel.id);
                                      setDeleteChannelName(channel.name);
                                    }}
                                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 w-8 h-8"
                                    data-ocid={`admin.channels.delete_button.${ocidIndex}`}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
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

            {/* ── Delete Channel AlertDialog ── */}
            <AlertDialog
              open={deleteChannelId !== null}
              onOpenChange={(open) => {
                if (!open) {
                  setDeleteChannelId(null);
                  setDeleteChannelName("");
                }
              }}
            >
              <AlertDialogContent
                className="bg-card border-border"
                data-ocid="admin.channels.delete.dialog"
              >
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-display font-bold text-foreground">
                    Delete Channel
                  </AlertDialogTitle>
                  <AlertDialogDescription className="font-body text-muted-foreground">
                    Are you sure you want to delete{" "}
                    <span className="font-semibold text-foreground">
                      "{deleteChannelName}"
                    </span>
                    ? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel
                    className="font-ui border-border"
                    data-ocid="admin.channels.delete.cancel_button"
                  >
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      setChannels((prev) =>
                        prev.filter((ch) => ch.id !== deleteChannelId),
                      );
                      toast.success(`"${deleteChannelName}" deleted.`);
                      setDeleteChannelId(null);
                      setDeleteChannelName("");
                    }}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-ui"
                    data-ocid="admin.channels.delete.confirm_button"
                  >
                    Delete Channel
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </TabsContent>

          {/* ── MATRIX TAB ── */}
          <TabsContent value="matrix">
            <MatrixAdminTab
              allReferralTrees={allReferralTrees ?? []}
              allTreesLoading={allTreesLoading}
              refetchAllTrees={() => void refetchAllTrees()}
              selectedPhone={selectedPhone}
              setSelectedPhone={setSelectedPhone}
              selectedUserTree={(selectedUserTree as ReferralNode) ?? null}
              selectedTreeLoading={selectedTreeLoading}
            />
          </TabsContent>

          {/* ── USER CHANNELS TAB ── */}
          <TabsContent value="userchannels">
            <div className="space-y-6">
              {/* User Channels */}
              <Card className="card-premium">
                <CardHeader className="pb-3">
                  <CardTitle className="font-display font-bold text-lg flex items-center gap-2">
                    <Tv className="w-5 h-5 text-primary" />
                    User Channels
                  </CardTitle>
                  <p className="text-muted-foreground text-xs font-body">
                    Channels created by users
                  </p>
                </CardHeader>
                <CardContent>
                  {userChannelsLoading ? (
                    <div
                      className="space-y-2"
                      data-ocid="admin.userchannels.loading_state"
                    >
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-12 rounded-lg" />
                      ))}
                    </div>
                  ) : adminUserChannels.length === 0 ? (
                    <div
                      className="text-center py-8 text-muted-foreground font-body text-sm"
                      data-ocid="admin.userchannels.empty_state"
                    >
                      No user channels yet.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {adminUserChannels.map((ch, idx) => (
                        <div
                          key={String(ch.id)}
                          className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/20"
                          data-ocid={`admin.userchannels.row.${idx + 1}`}
                        >
                          {ch.thumbnailUrl ? (
                            <img
                              src={ch.thumbnailUrl}
                              alt={ch.name}
                              className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                              <Tv className="w-5 h-5 text-primary" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-ui font-semibold text-sm text-foreground truncate">
                              {ch.name}
                            </p>
                            <p className="text-xs text-muted-foreground font-body">
                              Owner: {ch.ownerPhone}
                            </p>
                            {ch.description && (
                              <p className="text-xs text-muted-foreground font-body truncate">
                                {ch.description}
                              </p>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:bg-destructive/10 flex-shrink-0"
                            onClick={async () => {
                              if (
                                !confirm(
                                  "Delete this channel and all its videos?",
                                )
                              )
                                return;
                              try {
                                await deleteChannelAdmin.mutateAsync(ch.id);
                                toast.success("Channel deleted");
                              } catch {
                                toast.error("Failed to delete channel");
                              }
                            }}
                            data-ocid={`admin.userchannels.delete_button.${idx + 1}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* User Videos */}
              <Card className="card-premium">
                <CardHeader className="pb-3">
                  <CardTitle className="font-display font-bold text-lg flex items-center gap-2">
                    <PlayCircle className="w-5 h-5 text-primary" />
                    User Uploaded Videos
                  </CardTitle>
                  <p className="text-muted-foreground text-xs font-body">
                    Videos uploaded by users to their channels
                  </p>
                </CardHeader>
                <CardContent>
                  {userVideosLoading ? (
                    <div
                      className="space-y-2"
                      data-ocid="admin.uservideos.loading_state"
                    >
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-12 rounded-lg" />
                      ))}
                    </div>
                  ) : adminUserVideos.length === 0 ? (
                    <div
                      className="text-center py-8 text-muted-foreground font-body text-sm"
                      data-ocid="admin.uservideos.empty_state"
                    >
                      No user videos yet.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {adminUserVideos.map((video, idx) => (
                        <div
                          key={String(video.id)}
                          className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/20"
                          data-ocid={`admin.uservideos.row.${idx + 1}`}
                        >
                          {video.thumbnailUrl ? (
                            <img
                              src={video.thumbnailUrl}
                              alt={video.title}
                              className="w-16 h-10 rounded-lg object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-16 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                              <PlayCircle className="w-5 h-5 text-primary" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-ui font-semibold text-sm text-foreground truncate">
                              {video.title}
                            </p>
                            <p className="text-xs text-muted-foreground font-body">
                              By: {video.ownerPhone}
                            </p>
                            {video.category && (
                              <Badge
                                variant="secondary"
                                className="text-[10px] px-1.5 py-0 h-4 mt-0.5"
                              >
                                {video.category}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <a
                              href={video.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-primary hover:bg-primary/10"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Button>
                            </a>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:bg-destructive/10"
                              onClick={async () => {
                                if (!confirm("Delete this video?")) return;
                                try {
                                  await deleteUserVideoAdmin.mutateAsync(
                                    video.id,
                                  );
                                  toast.success("Video deleted");
                                } catch {
                                  toast.error("Failed to delete video");
                                }
                              }}
                              data-ocid={`admin.uservideos.delete_button.${idx + 1}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── STATS TAB ── */}
          <TabsContent value="stats">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  label: "Total Users",
                  value: totalUsers,
                  color: "text-blue-400",
                  bgColor: "bg-blue-500/15",
                  icon: Users,
                },
                {
                  label: "Paid Members",
                  value: paidUsers,
                  color: "text-green-400",
                  bgColor: "bg-green-500/15",
                  icon: CheckCircle,
                },
                {
                  label: "Pending Payments",
                  value: pendingPayments,
                  color: "text-amber-400",
                  bgColor: "bg-amber-500/15",
                  icon: Receipt,
                },
                {
                  label: "Total Videos",
                  value: videos?.length ?? 0,
                  color: "text-primary",
                  bgColor: "bg-primary/15",
                  icon: PlayCircle,
                },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.07 }}
                >
                  <Card
                    className="card-premium"
                    data-ocid={`admin.stats.card.${i + 1}`}
                  >
                    <CardContent className="p-5">
                      <div
                        className={`w-10 h-10 rounded-xl ${stat.bgColor} flex items-center justify-center mb-3`}
                      >
                        <stat.icon className={`w-5 h-5 ${stat.color}`} />
                      </div>
                      <div
                        className={`font-display font-black text-3xl ${stat.color}`}
                      >
                        {stat.value}
                      </div>
                      <div className="text-muted-foreground text-xs font-ui mt-1">
                        {stat.label}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Summary info */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="card-premium">
                <CardContent className="p-5">
                  <h3 className="font-ui text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                    User Breakdown
                  </h3>
                  <div className="space-y-2.5">
                    {[
                      { label: "Total Registered", value: totalUsers },
                      { label: "Paid Members", value: paidUsers },
                      { label: "Active Users", value: activeUsers },
                      {
                        label: "Unpaid Users",
                        value: totalUsers - paidUsers,
                      },
                    ].map((row) => (
                      <div
                        key={row.label}
                        className="flex justify-between items-center text-sm"
                      >
                        <span className="text-muted-foreground font-body">
                          {row.label}
                        </span>
                        <span className="font-display font-bold text-foreground">
                          {row.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="card-premium">
                <CardContent className="p-5">
                  <h3 className="font-ui text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                    Payment Overview
                  </h3>
                  <div className="space-y-2.5">
                    {[
                      {
                        label: "Total Submissions",
                        value: paymentSubmissions?.length ?? 0,
                      },
                      { label: "Pending", value: pendingPayments },
                      {
                        label: "Approved",
                        value:
                          paymentSubmissions?.filter(
                            (p) => String(p.status) === "approved",
                          ).length ?? 0,
                      },
                      {
                        label: "Rejected",
                        value:
                          paymentSubmissions?.filter(
                            (p) => String(p.status) === "rejected",
                          ).length ?? 0,
                      },
                    ].map((row) => (
                      <div
                        key={row.label}
                        className="flex justify-between items-center text-sm"
                      >
                        <span className="text-muted-foreground font-body">
                          {row.label}
                        </span>
                        <span className="font-display font-bold text-foreground">
                          {row.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Unpaid alert */}
            {totalUsers > 0 && totalUsers - paidUsers > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-4"
              >
                <Alert className="border-amber-500/30 bg-amber-500/10">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  <AlertDescription className="font-body text-sm text-foreground/80">
                    {totalUsers - paidUsers} user(s) have registered but not
                    completed payment.
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}
          </TabsContent>

          {/* ── WITHDRAWALS TAB ── */}
          <TabsContent value="withdrawals">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-display font-bold text-foreground">
                Withdrawal Requests
              </h3>
              <Button
                size="sm"
                variant="outline"
                onClick={fetchWithdrawalRequests}
                disabled={withdrawalLoading}
              >
                <RefreshCw
                  className={`w-4 h-4 mr-1.5 ${withdrawalLoading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </div>
            {withdrawalLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-16 rounded-xl" />
                <Skeleton className="h-16 rounded-xl" />
                <Skeleton className="h-16 rounded-xl" />
              </div>
            ) : withdrawalRequests.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <Banknote className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="font-body">No withdrawal requests yet.</p>
                  <p className="text-xs mt-1">
                    Click Refresh to load requests.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {withdrawalRequests.map((req) => (
                  <Card key={String(req.id)} className="card-premium">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="text-sm font-ui font-semibold text-foreground">
                              {req.phone}
                            </span>
                            <Badge
                              className={
                                req.status === "approved"
                                  ? "bg-green-500/20 text-green-300 border-green-500/30"
                                  : req.status === "rejected"
                                    ? "bg-red-500/20 text-red-300 border-red-500/30"
                                    : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                              }
                            >
                              {req.status}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            UPI:{" "}
                            <span className="text-foreground">{req.upiId}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Amount:{" "}
                            <span className="text-green-300 font-semibold">
                              ₹{String(req.amount)}
                            </span>
                          </div>
                          {req.documentUrl && (
                            <a
                              href={req.documentUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline mt-1"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              View Document
                            </a>
                          )}
                        </div>
                        {req.status === "pending" && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() =>
                                handleWithdrawalStatus(req.id, "approved")
                              }
                              className="bg-green-500/20 text-green-300 border border-green-500/30 hover:bg-green-500/30 h-8 px-3"
                              variant="ghost"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={() =>
                                handleWithdrawalStatus(req.id, "rejected")
                              }
                              className="bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 h-8 px-3"
                              variant="ghost"
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>
    </AnimatePresence>
  );
}
