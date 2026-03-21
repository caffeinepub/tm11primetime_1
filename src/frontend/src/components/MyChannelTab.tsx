import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Edit,
  Loader2,
  Play,
  Plus,
  Trash2,
  Tv,
  Upload,
  Video,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useChannelVideos,
  useCreateChannelMutation,
  useDeleteChannelVideoMutation,
  useMyChannelByPhone,
  useUpdateChannelMutation,
  useUploadVideoToChannelMutation,
} from "../hooks/useQueries";

const VIDEO_CATEGORIES = [
  "Education",
  "Entertainment",
  "Sports",
  "News",
  "Other",
];

// ── Create Channel Form ───────────────────────────────────────────────────────

function CreateChannelForm({ phone }: { phone: string }) {
  const createChannel = useCreateChannelMutation();
  const [form, setForm] = useState({
    name: "",
    description: "",
    thumbnailUrl: "",
    bannerUrl: "",
  });

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error("Channel name is required");
      return;
    }
    try {
      await createChannel.mutateAsync({
        phone,
        name: form.name,
        description: form.description,
        thumbnailUrl: form.thumbnailUrl,
        bannerUrl: form.bannerUrl,
      });
      toast.success("Channel created successfully!");
    } catch {
      toast.error("Failed to create channel");
    }
  };

  return (
    <Card className="card-premium border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="font-display font-bold text-lg flex items-center gap-2">
          <Tv className="w-5 h-5 text-primary" />
          Create Your Channel
        </CardTitle>
        <p className="text-muted-foreground text-sm font-body">
          Start sharing your content with the Tm11primeTime community
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label className="font-ui text-sm">Channel Name *</Label>
          <Input
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="My Awesome Channel"
            className="bg-input border-border font-body"
            data-ocid="mychannel.name.input"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="font-ui text-sm">Description</Label>
          <Textarea
            value={form.description}
            onChange={(e) =>
              setForm((p) => ({ ...p, description: e.target.value }))
            }
            placeholder="Tell viewers what your channel is about..."
            className="bg-input border-border font-body resize-none"
            rows={3}
            data-ocid="mychannel.description.textarea"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="font-ui text-sm">Profile Image URL</Label>
            <Input
              value={form.thumbnailUrl}
              onChange={(e) =>
                setForm((p) => ({ ...p, thumbnailUrl: e.target.value }))
              }
              placeholder="https://example.com/avatar.jpg"
              className="bg-input border-border font-body"
              data-ocid="mychannel.thumbnail.input"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="font-ui text-sm">Banner Image URL</Label>
            <Input
              value={form.bannerUrl}
              onChange={(e) =>
                setForm((p) => ({ ...p, bannerUrl: e.target.value }))
              }
              placeholder="https://example.com/banner.jpg"
              className="bg-input border-border font-body"
              data-ocid="mychannel.banner.input"
            />
          </div>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={createChannel.isPending}
          className="w-full font-ui"
          data-ocid="mychannel.create.primary_button"
        >
          {createChannel.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Plus className="w-4 h-4 mr-2" />
          )}
          {createChannel.isPending ? "Creating..." : "Create Channel"}
        </Button>
      </CardContent>
    </Card>
  );
}

// ── Upload Video Dialog ───────────────────────────────────────────────────────

function UploadVideoDialog({
  phone,
  channelId,
}: {
  phone: string;
  channelId: bigint;
}) {
  const uploadVideo = useUploadVideoToChannelMutation();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    url: "",
    description: "",
    thumbnailUrl: "",
    category: "",
  });

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.url.trim()) {
      toast.error("Title and YouTube URL are required");
      return;
    }
    try {
      await uploadVideo.mutateAsync({
        phone,
        channelId,
        title: form.title,
        url: form.url,
        description: form.description,
        thumbnailUrl: form.thumbnailUrl,
        category: form.category || "Other",
      });
      toast.success("Video uploaded successfully!");
      setForm({
        title: "",
        url: "",
        description: "",
        thumbnailUrl: "",
        category: "",
      });
      setOpen(false);
    } catch {
      toast.error("Failed to upload video");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className="font-ui"
          data-ocid="mychannel.upload.open_modal_button"
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload Video
        </Button>
      </DialogTrigger>
      <DialogContent
        className="bg-card border-border max-w-lg"
        data-ocid="mychannel.upload.dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-display font-bold text-foreground">
            Upload Video
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="font-ui text-sm">Video Title *</Label>
            <Input
              value={form.title}
              onChange={(e) =>
                setForm((p) => ({ ...p, title: e.target.value }))
              }
              placeholder="My Amazing Video"
              className="bg-input border-border font-body"
              data-ocid="mychannel.upload.title.input"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="font-ui text-sm">YouTube URL *</Label>
            <Input
              value={form.url}
              onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))}
              placeholder="https://youtube.com/watch?v=..."
              className="bg-input border-border font-body"
              data-ocid="mychannel.upload.url.input"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="font-ui text-sm">Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) =>
                setForm((p) => ({ ...p, description: e.target.value }))
              }
              placeholder="Describe your video..."
              className="bg-input border-border font-body resize-none"
              rows={2}
              data-ocid="mychannel.upload.description.textarea"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="font-ui text-sm">Thumbnail URL</Label>
              <Input
                value={form.thumbnailUrl}
                onChange={(e) =>
                  setForm((p) => ({ ...p, thumbnailUrl: e.target.value }))
                }
                placeholder="https://example.com/thumb.jpg"
                className="bg-input border-border font-body"
                data-ocid="mychannel.upload.thumbnail.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-ui text-sm">Category</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm((p) => ({ ...p, category: v }))}
              >
                <SelectTrigger
                  className="bg-input border-border font-body"
                  data-ocid="mychannel.upload.category.select"
                >
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {VIDEO_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat} className="font-body">
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="border-border font-ui"
            data-ocid="mychannel.upload.cancel_button"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={uploadVideo.isPending}
            className="font-ui"
            data-ocid="mychannel.upload.submit_button"
          >
            {uploadVideo.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            {uploadVideo.isPending ? "Uploading..." : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Edit Channel Dialog ───────────────────────────────────────────────────────

function EditChannelDialog({
  phone,
  channel,
}: {
  phone: string;
  channel: {
    id: bigint;
    name: string;
    description: string;
    thumbnailUrl: string;
    bannerUrl: string;
  };
}) {
  const updateChannel = useUpdateChannelMutation();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: channel.name,
    description: channel.description,
    thumbnailUrl: channel.thumbnailUrl,
    bannerUrl: channel.bannerUrl,
  });

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error("Channel name is required");
      return;
    }
    try {
      await updateChannel.mutateAsync({
        phone,
        channelId: channel.id,
        name: form.name,
        description: form.description,
        thumbnailUrl: form.thumbnailUrl,
        bannerUrl: form.bannerUrl,
      });
      toast.success("Channel updated!");
      setOpen(false);
    } catch {
      toast.error("Failed to update channel");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="border-border font-ui"
          data-ocid="mychannel.edit.open_modal_button"
        >
          <Edit className="w-3.5 h-3.5 mr-1.5" />
          Edit Channel
        </Button>
      </DialogTrigger>
      <DialogContent
        className="bg-card border-border max-w-lg"
        data-ocid="mychannel.edit.dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-display font-bold text-foreground">
            Edit Channel
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="font-ui text-sm">Channel Name *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="bg-input border-border font-body"
              data-ocid="mychannel.edit.name.input"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="font-ui text-sm">Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) =>
                setForm((p) => ({ ...p, description: e.target.value }))
              }
              className="bg-input border-border font-body resize-none"
              rows={3}
              data-ocid="mychannel.edit.description.textarea"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="font-ui text-sm">Profile Image URL</Label>
              <Input
                value={form.thumbnailUrl}
                onChange={(e) =>
                  setForm((p) => ({ ...p, thumbnailUrl: e.target.value }))
                }
                className="bg-input border-border font-body"
                data-ocid="mychannel.edit.thumbnail.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-ui text-sm">Banner Image URL</Label>
              <Input
                value={form.bannerUrl}
                onChange={(e) =>
                  setForm((p) => ({ ...p, bannerUrl: e.target.value }))
                }
                className="bg-input border-border font-body"
                data-ocid="mychannel.edit.banner.input"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="border-border font-ui"
            data-ocid="mychannel.edit.cancel_button"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={updateChannel.isPending}
            className="font-ui"
            data-ocid="mychannel.edit.save_button"
          >
            {updateChannel.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : null}
            {updateChannel.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── My Channel Tab ─────────────────────────────────────────────────────────────

export function MyChannelTab({ phone }: { phone: string }) {
  const { data: channel, isLoading } = useMyChannelByPhone(phone);
  const { data: videos, isLoading: videosLoading } = useChannelVideos(
    channel?.id ?? BigInt(0),
    !!channel,
  );
  const deleteVideo = useDeleteChannelVideoMutation();

  if (isLoading) {
    return (
      <div className="space-y-4" data-ocid="mychannel.loading_state">
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
    );
  }

  if (!channel) {
    return <CreateChannelForm phone={phone} />;
  }

  const handleDeleteVideo = async (videoId: bigint) => {
    if (!confirm("Delete this video?")) return;
    try {
      await deleteVideo.mutateAsync({ phone, videoId });
      toast.success("Video deleted");
    } catch {
      toast.error("Failed to delete video");
    }
  };

  return (
    <div className="space-y-6">
      {/* Channel Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="card-premium border-primary/20 overflow-hidden">
          {/* Banner */}
          {channel.bannerUrl && (
            <div className="h-28 overflow-hidden">
              <img
                src={channel.bannerUrl}
                alt="banner"
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <Avatar className="w-16 h-16 border-2 border-primary/30 flex-shrink-0">
                <AvatarImage src={channel.thumbnailUrl} />
                <AvatarFallback className="bg-primary/20 text-primary font-display font-bold text-xl">
                  {channel.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h2 className="font-display font-bold text-xl text-foreground">
                  {channel.name}
                </h2>
                {channel.description && (
                  <p className="text-muted-foreground text-sm font-body mt-1">
                    {channel.description}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-3">
                  <EditChannelDialog phone={phone} channel={channel} />
                  <UploadVideoDialog phone={phone} channelId={channel.id} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Videos List */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="card-premium">
          <CardHeader className="pb-3">
            <CardTitle className="font-display font-bold text-base flex items-center gap-2">
              <Video className="w-4 h-4 text-primary" />
              My Videos
              {videos && videos.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {videos.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {videosLoading && (
              <div
                className="grid grid-cols-2 sm:grid-cols-3 gap-3"
                data-ocid="mychannel.videos.loading_state"
              >
                <Skeleton className="aspect-video rounded-xl" />
                <Skeleton className="aspect-video rounded-xl" />
                <Skeleton className="aspect-video rounded-xl" />
              </div>
            )}

            {!videosLoading && (!videos || videos.length === 0) && (
              <div
                className="text-center py-10 text-muted-foreground font-body"
                data-ocid="mychannel.videos.empty_state"
              >
                <Play className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="font-ui font-semibold">No videos yet</p>
                <p className="text-sm mt-1">
                  Click "Upload Video" to share your first video
                </p>
              </div>
            )}

            {videos && videos.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <AnimatePresence>
                  {videos.map((video, idx) => (
                    <motion.div
                      key={String(video.id)}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: idx * 0.04 }}
                      className="group relative rounded-xl border border-border overflow-hidden bg-muted/30 hover:border-primary/30 transition-colors"
                      data-ocid={`mychannel.video.item.${idx + 1}`}
                    >
                      <div className="flex gap-3 p-3">
                        {/* Thumbnail */}
                        <a
                          href={video.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-shrink-0"
                        >
                          <div className="w-20 h-14 rounded-lg overflow-hidden bg-muted relative">
                            {video.thumbnailUrl ? (
                              <img
                                src={video.thumbnailUrl}
                                alt={video.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/10">
                                <Play className="w-5 h-5 text-primary/60" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                              <Play className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </div>
                        </a>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <a
                            href={video.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <p className="text-sm font-ui font-medium text-foreground line-clamp-2 hover:text-primary transition-colors">
                              {video.title}
                            </p>
                          </a>
                          {video.category && (
                            <Badge
                              variant="secondary"
                              className="mt-1 text-[10px] px-1.5 py-0 h-4"
                            >
                              {video.category}
                            </Badge>
                          )}
                        </div>
                        {/* Delete */}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="w-7 h-7 flex-shrink-0 text-destructive/60 hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteVideo(video.id)}
                          disabled={deleteVideo.isPending}
                          data-ocid={`mychannel.video.delete_button.${idx + 1}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
