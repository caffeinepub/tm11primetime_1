import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { Separator } from "@/components/ui/separator";
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
import { useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  BarChart3,
  CheckCircle,
  Copy,
  Info,
  Loader2,
  PlayCircle,
  Plus,
  Receipt,
  RefreshCw,
  Shield,
  Trash2,
  Users,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useAddVideoMutation,
  useAllPaymentSubmissions,
  useAllUsers,
  useAllVideos,
  useClaimFirstAdminMutation,
  useDeleteVideoMutation,
  useIsAdmin,
  useIsAdminAssigned,
  useUpdateUserStatusMutation,
  useVerifyPaymentSubmissionMutation,
} from "../hooks/useQueries";

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
  description: string;
  duration: string;
}

const initialFormData: AddVideoFormData = {
  title: "",
  category: "",
  url: "",
  description: "",
  duration: "",
};

export default function AdminPage() {
  const navigate = useNavigate();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: isAdminAssigned, isLoading: adminAssignedLoading } =
    useIsAdminAssigned();
  const claimFirstAdminMutation = useClaimFirstAdminMutation();
  const { data: users, isLoading: usersLoading } = useAllUsers();
  const { data: videos, isLoading: videosLoading } = useAllVideos();
  const { data: paymentSubmissions, isLoading: paymentsLoading } =
    useAllPaymentSubmissions();

  const updateUserStatusMutation = useUpdateUserStatusMutation();
  const addVideoMutation = useAddVideoMutation();
  const deleteVideoMutation = useDeleteVideoMutation();
  const verifyPaymentMutation = useVerifyPaymentSubmissionMutation();

  const [addVideoOpen, setAddVideoOpen] = useState(false);
  const [videoForm, setVideoForm] = useState<AddVideoFormData>(initialFormData);
  const [formError, setFormError] = useState<string | null>(null);
  const [adminToken, setAdminToken] = useState("");

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

  if (adminLoading || adminAssignedLoading) {
    return (
      <div className="p-6 space-y-4" data-ocid="admin.loading_state">
        <Skeleton className="h-8 w-48 animate-shimmer" />
        <Skeleton className="h-64 animate-shimmer rounded-xl" />
      </div>
    );
  }

  if (!isAdmin) {
    const handleActivateAdmin = () => {
      const token = adminToken.trim();
      if (!token) {
        toast.error("Please paste your admin token first.");
        return;
      }
      sessionStorage.setItem("caffeineAdminToken", token);
      toast.success("Token saved — reloading…");
      window.location.reload();
    };

    const handleClaimFirstAdmin = async () => {
      try {
        await claimFirstAdminMutation.mutateAsync();
        toast.success("You are now admin!");
        window.location.reload();
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Failed to claim admin access";
        toast.error(msg);
      }
    };

    // Section A: No admin assigned yet — show "Become Admin" flow
    if (!isAdminAssigned) {
      return (
        <div className="p-6 flex items-center justify-center min-h-[60vh]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="w-full max-w-lg space-y-6"
            data-ocid="admin.claim.panel"
          >
            {/* Header */}
            <div className="text-center space-y-3">
              <div className="relative mx-auto w-20 h-20">
                <div className="w-20 h-20 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                  <Shield className="w-10 h-10 text-primary" />
                </div>
                <span className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-green-500 border-2 border-background flex items-center justify-center">
                  <CheckCircle className="w-3.5 h-3.5 text-white" />
                </span>
              </div>
              <div>
                <h2 className="font-display font-black text-2xl text-foreground">
                  Claim Admin Access
                </h2>
                <p className="text-muted-foreground text-sm font-body mt-1.5 leading-relaxed">
                  No admin has been set up yet for this app.
                </p>
              </div>
            </div>

            {/* One-click claim card */}
            <Card className="card-premium border border-primary/30 bg-primary/5">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  </div>
                  <div>
                    <p className="font-ui font-semibold text-sm text-foreground">
                      You are the app owner
                    </p>
                    <p className="text-muted-foreground text-sm font-body mt-0.5 leading-relaxed">
                      Since no admin has been assigned yet, click the button
                      below to become admin instantly. This can only be done
                      once.
                    </p>
                  </div>
                </div>

                <Button
                  className="w-full bg-primary text-primary-foreground font-ui text-base py-5 hover:opacity-90"
                  onClick={handleClaimFirstAdmin}
                  disabled={claimFirstAdminMutation.isPending}
                  data-ocid="admin.claim.primary_button"
                >
                  {claimFirstAdminMutation.isPending ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <Shield className="w-5 h-5 mr-2" />
                  )}
                  {claimFirstAdminMutation.isPending
                    ? "Claiming…"
                    : "Become Admin"}
                </Button>
              </CardContent>
            </Card>

            <Button
              variant="ghost"
              className="w-full font-ui text-muted-foreground hover:text-foreground"
              onClick={() => navigate({ to: "/dashboard" })}
              data-ocid="admin.claim.cancel_button"
            >
              Back to Dashboard
            </Button>
          </motion.div>
        </div>
      );
    }

    // Section B: Admin already assigned, but you're not them — show token entry
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full max-w-xl space-y-6"
          data-ocid="admin.claim.panel"
        >
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center mx-auto">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h2 className="font-display font-black text-2xl text-foreground">
                Admin Access Setup
              </h2>
              <p className="text-muted-foreground text-sm font-body mt-1">
                Your admin token is stored in your Caffeine project's
                environment variables as{" "}
                <code className="font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded text-xs">
                  CAFFEINE_ADMIN_TOKEN
                </code>
              </p>
            </div>
          </div>

          {/* Step 1 — Automatic */}
          <Card className="card-premium border border-border">
            <CardHeader className="pb-3">
              <CardTitle className="font-display font-bold text-base text-foreground flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-black flex items-center justify-center">
                  1
                </span>
                <RefreshCw className="w-4 h-4 text-primary" />
                Automatic (Preferred)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-muted-foreground text-sm font-body leading-relaxed">
                The Caffeine platform automatically passes your admin token via
                the URL when you open the app from your project dashboard.{" "}
                <strong className="text-foreground font-ui">
                  If you just deployed this app, try refreshing the page.
                </strong>
              </p>
              <Button
                variant="outline"
                className="mt-3 w-full border-primary/30 text-primary hover:bg-primary/10 font-ui"
                onClick={() => window.location.reload()}
                data-ocid="admin.claim.primary_button"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Page
              </Button>
            </CardContent>
          </Card>

          <div className="flex items-center gap-3">
            <Separator className="flex-1 bg-border" />
            <span className="text-muted-foreground text-xs font-ui uppercase tracking-widest">
              or
            </span>
            <Separator className="flex-1 bg-border" />
          </div>

          {/* Step 2 — Manual */}
          <Card className="card-premium border border-border">
            <CardHeader className="pb-3">
              <CardTitle className="font-display font-bold text-base text-foreground flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-muted/40 text-muted-foreground text-xs font-black flex items-center justify-center">
                  2
                </span>
                <Copy className="w-4 h-4 text-muted-foreground" />
                Manual Token Entry
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <Alert className="border-amber-500/30 bg-amber-500/10">
                <Info className="w-4 h-4 text-amber-400" />
                <AlertDescription className="font-body text-xs text-foreground/80 leading-relaxed">
                  Go to your{" "}
                  <strong className="font-ui text-foreground">
                    Caffeine project settings
                  </strong>{" "}
                  → Environment Variables → copy the value of{" "}
                  <code className="font-mono text-primary bg-primary/10 px-1 rounded text-xs">
                    CAFFEINE_ADMIN_TOKEN
                  </code>
                  , then paste it below.
                </AlertDescription>
              </Alert>

              <div className="space-y-1.5">
                <Label htmlFor="adminToken" className="font-ui text-sm">
                  Admin Token
                </Label>
                <Input
                  id="adminToken"
                  type="password"
                  value={adminToken}
                  onChange={(e) => setAdminToken(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleActivateAdmin();
                  }}
                  placeholder="Paste your CAFFEINE_ADMIN_TOKEN here"
                  className="bg-input border-border font-mono text-sm"
                  data-ocid="admin.claim.input"
                />
              </div>

              <Button
                className="w-full bg-primary text-primary-foreground font-ui"
                disabled={!adminToken.trim()}
                onClick={handleActivateAdmin}
                data-ocid="admin.claim.submit_button"
              >
                <Shield className="w-4 h-4 mr-2" />
                Activate Admin
              </Button>
            </CardContent>
          </Card>

          <Button
            variant="ghost"
            className="w-full font-ui text-muted-foreground hover:text-foreground"
            onClick={() => navigate({ to: "/dashboard" })}
            data-ocid="admin.claim.cancel_button"
          >
            Back to Dashboard
          </Button>
        </motion.div>
      </div>
    );
  }

  // Stats
  const totalUsers = users?.length ?? 0;
  const paidUsers = users?.filter((u) => u.isPaid).length ?? 0;
  const activeUsers = users?.filter((u) => u.isActive).length ?? 0;
  const totalWallet =
    (users ?? []).reduce((sum, u) => sum + Number(u.walletBalance), 0) / 100;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 mb-6"
      >
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
          <Shield className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="font-display font-black text-2xl text-foreground">
            Admin <span className="text-gradient-gold">Panel</span>
          </h1>
          <p className="text-muted-foreground text-sm font-body">
            Manage users, videos, and platform settings
          </p>
        </div>
      </motion.div>

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
            Payments ({paymentSubmissions?.length ?? 0})
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
            <CardHeader className="pb-3">
              <CardTitle className="font-display font-bold text-lg text-foreground">
                All Users
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {usersLoading ? (
                <div
                  className="p-5 space-y-3"
                  data-ocid="admin.users.loading_state"
                >
                  {["s1", "s2", "s3", "s4", "s5"].map((k) => (
                    <Skeleton
                      key={k}
                      className="h-12 rounded-lg animate-shimmer"
                    />
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
                </div>
              ) : (
                <ScrollArea className="max-h-[500px]">
                  <Table data-ocid="admin.users.table">
                    <TableHeader>
                      <TableRow className="border-border hover:bg-transparent">
                        {[
                          "Name",
                          "Email",
                          "Phone",
                          "Balance",
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
                              {user.email || "—"}
                            </TableCell>
                            <TableCell className="py-3 text-sm text-muted-foreground font-body">
                              {user.phone || "—"}
                            </TableCell>
                            <TableCell className="py-3 text-sm font-display font-bold text-green-400">
                              ₹{(Number(user.walletBalance) / 100).toFixed(2)}
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
                              <Switch
                                checked={user.isActive}
                                onCheckedChange={() =>
                                  handleToggleUserStatus(user.id, user.isActive)
                                }
                                disabled={updateUserStatusMutation.isPending}
                                data-ocid={`admin.users.switch.${ocidIndex}`}
                              />
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

        {/* ── PAYMENTS TAB ── */}
        <TabsContent value="payments" data-ocid="admin.payments.panel">
          <Card className="card-premium">
            <CardHeader className="pb-3">
              <CardTitle className="font-display font-bold text-lg text-foreground flex items-center gap-2">
                <Receipt className="w-5 h-5 text-primary" />
                Payment Submissions
              </CardTitle>
              <p className="text-muted-foreground text-xs font-body mt-1">
                Review and verify user payment proof submissions
              </p>
            </CardHeader>
            <CardContent className="p-0">
              {paymentsLoading ? (
                <div
                  className="p-5 space-y-3"
                  data-ocid="admin.payments.loading_state"
                >
                  {["s1", "s2", "s3", "s4"].map((k) => (
                    <Skeleton
                      key={k}
                      className="h-12 rounded-lg animate-shimmer"
                    />
                  ))}
                </div>
              ) : !paymentSubmissions || paymentSubmissions.length === 0 ? (
                <div
                  className="p-10 text-center"
                  data-ocid="admin.payments.empty_state"
                >
                  <Receipt className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-30" />
                  <p className="text-muted-foreground font-body text-sm">
                    No payment submissions yet
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
                      {paymentSubmissions.map((submission, i) => {
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
                        const isPending = submission.status === "pending";
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
                            <TableCell className="py-3">
                              <span className="font-mono text-xs text-primary bg-primary/10 px-2 py-0.5 rounded">
                                {submission.utr}
                              </span>
                            </TableCell>
                            <TableCell className="py-3">
                              <Badge
                                variant="outline"
                                className={
                                  submission.status === "approved"
                                    ? "border-green-500/30 text-green-300 bg-green-500/10 text-xs"
                                    : submission.status === "rejected"
                                      ? "border-red-500/30 text-red-300 bg-red-500/10 text-xs"
                                      : "border-amber-500/30 text-amber-300 bg-amber-500/10 text-xs"
                                }
                              >
                                {submission.status === "approved" && (
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                )}
                                {submission.status === "rejected" && (
                                  <XCircle className="w-3 h-3 mr-1" />
                                )}
                                {String(submission.status)
                                  .charAt(0)
                                  .toUpperCase() +
                                  String(submission.status).slice(1)}
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
                                    data-ocid={`admin.payments.delete_button.${ocidIndex}`}
                                  >
                                    {verifyPaymentMutation.isPending ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <XCircle className="w-3 h-3 mr-1" />
                                    )}
                                    Reject
                                  </Button>
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground font-body italic">
                                  Resolved
                                </span>
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
                      data-ocid="admin.videos.cancel.button"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAddVideo}
                      disabled={addVideoMutation.isPending}
                      className="bg-primary text-primary-foreground font-ui"
                      data-ocid="admin.videos.submit.button"
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
                    <Skeleton
                      key={k}
                      className="h-12 rounded-lg animate-shimmer"
                    />
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
                        {["Title", "Category", "Duration", "Actions"].map(
                          (h) => (
                            <TableHead
                              key={h}
                              className="text-muted-foreground font-ui text-xs uppercase tracking-wide"
                            >
                              {h}
                            </TableHead>
                          ),
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {videos.map((video, i) => {
                        const ocidIndex = i + 1;
                        const durationSec = Number(video.duration);
                        const mins = Math.floor(durationSec / 60);
                        return (
                          <TableRow
                            key={video.id.toString()}
                            className="border-border hover:bg-muted/20 transition-colors"
                            data-ocid={`admin.videos.item.${ocidIndex}`}
                          >
                            <TableCell className="py-3 font-ui font-medium text-sm text-foreground max-w-[200px]">
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
                            <TableCell className="py-3 text-sm text-muted-foreground font-body">
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
                label: "Active Users",
                value: activeUsers,
                color: "text-primary",
                bgColor: "bg-primary/15",
                icon: Users,
              },
              {
                label: "Total Wallet (₹)",
                value: `₹${totalWallet.toFixed(2)}`,
                color: "text-gradient-gold",
                bgColor: "bg-primary/15",
                icon: BarChart3,
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
                      className={`font-display font-black text-3xl ${
                        stat.label === "Total Wallet (₹)"
                          ? "text-gradient-gold"
                          : stat.color
                      }`}
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

          {/* Unpaid users alert */}
          {totalUsers > 0 && totalUsers - paidUsers > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-4"
            >
              <Alert className="border-amber/30 bg-amber/10">
                <AlertCircle className="w-4 h-4 text-amber" />
                <AlertDescription className="font-body text-sm text-foreground/80">
                  {totalUsers - paidUsers} user(s) have registered but not
                  completed payment.
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
