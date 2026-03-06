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
import { useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  BarChart3,
  CheckCircle,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Pencil,
  PlayCircle,
  Plus,
  Receipt,
  Shield,
  Trash2,
  Users,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { User } from "../backend.d";
import {
  useAddVideoMutation,
  useAllPaymentSubmissions,
  useAllUsers,
  useAllVideos,
  useClaimFirstAdminMutation,
  useDeleteUserMutation,
  useDeleteVideoMutation,
  useIsAdmin,
  useIsAdminAssigned,
  useUpdateUserMutation,
  useUpdateUserStatusMutation,
  useVerifyPaymentSubmissionMutation,
} from "../hooks/useQueries";

// Admin PIN -- change this to your preferred password
const ADMIN_PIN = "admin@tm11";
const ADMIN_SESSION_KEY = "tm11_admin_unlocked";

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
  const { data: isAdminAssigned } = useIsAdminAssigned();
  const claimFirstAdminMutation = useClaimFirstAdminMutation();
  const { data: users, isLoading: usersLoading } = useAllUsers();
  const { data: videos, isLoading: videosLoading } = useAllVideos();
  const { data: paymentSubmissions, isLoading: paymentsLoading } =
    useAllPaymentSubmissions();

  const updateUserStatusMutation = useUpdateUserStatusMutation();
  const updateUserMutation = useUpdateUserMutation();
  const deleteUserMutation = useDeleteUserMutation();
  const addVideoMutation = useAddVideoMutation();
  const deleteVideoMutation = useDeleteVideoMutation();
  const verifyPaymentMutation = useVerifyPaymentSubmissionMutation();

  const [addVideoOpen, setAddVideoOpen] = useState(false);
  const [videoForm, setVideoForm] = useState<AddVideoFormData>(initialFormData);
  const [formError, setFormError] = useState<string | null>(null);

  // PIN login state
  const [pinUnlocked, setPinUnlocked] = useState(
    () => sessionStorage.getItem(ADMIN_SESSION_KEY) === "1",
  );
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);

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

  const handlePinLogin = async () => {
    if (!pinInput.trim()) {
      setPinError("Please enter your admin PIN.");
      return;
    }
    if (pinInput !== ADMIN_PIN) {
      setPinError("Incorrect PIN. Please try again.");
      setPinInput("");
      return;
    }
    setPinError("");
    setPinLoading(true);
    // Silently try to claim first admin on blockchain if not yet assigned
    if (!isAdminAssigned) {
      try {
        await claimFirstAdminMutation.mutateAsync();
      } catch {
        // ignore -- may already be assigned or fail silently
      }
    }
    sessionStorage.setItem(ADMIN_SESSION_KEY, "1");
    setPinUnlocked(true);
    setPinLoading(false);
    toast.success("Welcome, Admin!");
  };

  if (adminLoading) {
    return (
      <div className="p-6 space-y-4" data-ocid="admin.loading_state">
        <Skeleton className="h-8 w-48 animate-shimmer" />
        <Skeleton className="h-64 animate-shimmer rounded-xl" />
      </div>
    );
  }

  // Show PIN login if not unlocked via PIN and not already admin on blockchain
  if (!pinUnlocked && !isAdmin) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full max-w-sm space-y-6"
          data-ocid="admin.login.panel"
        >
          {/* Logo */}
          <div className="text-center space-y-3">
            <div className="w-20 h-20 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center mx-auto">
              <Lock className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h2 className="font-display font-black text-2xl text-foreground">
                Admin Login
              </h2>
              <p className="text-muted-foreground text-sm font-body mt-1">
                Enter your admin PIN to access the panel
              </p>
            </div>
          </div>

          <Card className="card-premium border border-primary/20">
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="adminPin"
                  className="font-ui text-sm text-foreground"
                >
                  Admin PIN
                </Label>
                <div className="relative">
                  <Input
                    id="adminPin"
                    type={showPin ? "text" : "password"}
                    value={pinInput}
                    onChange={(e) => {
                      setPinInput(e.target.value);
                      setPinError("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handlePinLogin();
                    }}
                    placeholder="Enter admin PIN"
                    className="bg-input border-border font-mono text-base pr-10"
                    autoFocus
                    data-ocid="admin.login.input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPin ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {pinError && (
                  <p
                    className="text-destructive text-sm font-body flex items-center gap-1.5"
                    data-ocid="admin.login.error_state"
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    {pinError}
                  </p>
                )}
              </div>

              <Button
                className="w-full bg-primary text-primary-foreground font-ui text-base py-5 hover:opacity-90"
                onClick={handlePinLogin}
                disabled={pinLoading || !pinInput.trim()}
                data-ocid="admin.login.submit_button"
              >
                {pinLoading ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <Shield className="w-5 h-5 mr-2" />
                )}
                {pinLoading ? "Logging in…" : "Login"}
              </Button>
            </CardContent>
          </Card>

          <Button
            variant="ghost"
            className="w-full font-ui text-muted-foreground hover:text-foreground"
            onClick={() => navigate({ to: "/dashboard" })}
            data-ocid="admin.login.cancel_button"
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
                              <div className="flex items-center gap-1.5">
                                <Switch
                                  checked={user.isActive}
                                  onCheckedChange={() =>
                                    handleToggleUserStatus(
                                      user.id,
                                      user.isActive,
                                    )
                                  }
                                  disabled={updateUserStatusMutation.isPending}
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
                      setEditForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Full name"
                    className="bg-input border-border font-body"
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
                      setEditForm((prev) => ({ ...prev, isActive: checked }))
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
                  {updateUserMutation.isPending ? "Saving..." : "Save Changes"}
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
                  {deleteUserMutation.isPending ? "Deleting..." : "Delete User"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
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
