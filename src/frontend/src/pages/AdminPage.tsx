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
  Edit,
  Loader2,
  PlayCircle,
  Plus,
  Receipt,
  Shield,
  Trash2,
  Users,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  useAddVideoMutation,
  useAllUsers,
  useAllVideos,
  useDeleteVideoMutation,
  useIsAdmin,
  useUpdateUserStatusMutation,
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
  const { data: users, isLoading: usersLoading } = useAllUsers();
  const { data: videos, isLoading: videosLoading } = useAllVideos();

  const updateUserStatusMutation = useUpdateUserStatusMutation();
  const addVideoMutation = useAddVideoMutation();
  const deleteVideoMutation = useDeleteVideoMutation();

  const [addVideoOpen, setAddVideoOpen] = useState(false);
  const [videoForm, setVideoForm] = useState<AddVideoFormData>(initialFormData);
  const [formError, setFormError] = useState<string | null>(null);

  // Payment submission from localStorage
  const [lastPaymentSubmission, setLastPaymentSubmission] = useState<{
    txId: string;
    userName: string;
    phone: string;
    submittedAt: string;
  } | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("tm11_payment_submission");
      if (raw) {
        setLastPaymentSubmission(JSON.parse(raw));
      }
    } catch {
      // ignore parse errors
    }
  }, []);

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

  if (adminLoading) {
    return (
      <div className="p-6 space-y-4" data-ocid="admin.loading_state">
        <Skeleton className="h-8 w-48 animate-shimmer" />
        <Skeleton className="h-64 animate-shimmer rounded-xl" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4 max-w-sm">
          <Alert variant="destructive" data-ocid="admin.error_state">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription className="font-body">
              Access denied. Admin privileges required.
            </AlertDescription>
          </Alert>
          <Button
            variant="outline"
            onClick={() => navigate({ to: "/dashboard" })}
            data-ocid="admin.back.button"
          >
            Back to Dashboard
          </Button>
        </div>
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
        <TabsList className="bg-card border border-border h-auto p-1 mb-6">
          <TabsTrigger
            value="users"
            className="flex items-center gap-1.5 font-ui data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            data-ocid="admin.users.tab"
          >
            <Users className="w-4 h-4" />
            Users ({totalUsers})
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
          {/* Last payment submission info from localStorage */}
          {lastPaymentSubmission && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-4"
              data-ocid="admin.payment_submission.panel"
            >
              <div className="flex items-start gap-3 bg-primary/10 border border-primary/30 rounded-xl px-4 py-3">
                <Receipt className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-ui font-semibold text-primary mb-1">
                    Last Payment Submission
                  </p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-body text-foreground/80">
                    <span>
                      <span className="text-muted-foreground">Name: </span>
                      <span className="font-medium">
                        {lastPaymentSubmission.userName}
                      </span>
                    </span>
                    <span className="text-border hidden sm:inline">·</span>
                    <span>
                      <span className="text-muted-foreground">Phone: </span>
                      <span className="font-medium">
                        {lastPaymentSubmission.phone}
                      </span>
                    </span>
                    <span className="text-border hidden sm:inline">·</span>
                    <span>
                      <span className="text-muted-foreground">UTR: </span>
                      <span className="font-mono font-medium text-primary">
                        {lastPaymentSubmission.txId}
                      </span>
                    </span>
                    <span className="text-border hidden sm:inline">·</span>
                    <span className="text-muted-foreground">
                      {new Date(
                        lastPaymentSubmission.submittedAt,
                      ).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem("tm11_payment_submission");
                    setLastPaymentSubmission(null);
                  }}
                  className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 text-xs font-ui underline"
                  aria-label="Dismiss payment submission"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          )}

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
