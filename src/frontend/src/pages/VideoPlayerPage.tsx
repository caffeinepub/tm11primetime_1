import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowLeft,
  Bell,
  CheckCircle,
  Clock,
  ExternalLink,
  Loader2,
  Play,
  Trophy,
} from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { Video } from "../backend.d";
import { usePhoneAuth } from "../hooks/usePhoneAuth";
import {
  useAllVideos,
  useRecordWatchProgressMutation,
  useWatchHistory,
} from "../hooks/useQueries";

const CATEGORY_GRADIENTS: Record<string, string> = {
  Tutorial: "from-blue-900 to-blue-700",
  Educational: "from-purple-900 to-purple-700",
  Entertainment: "from-pink-900 to-rose-700",
  Wellness: "from-green-900 to-emerald-700",
  Devotional: "from-amber-900 to-yellow-700",
  Media: "from-cyan-900 to-teal-700",
  default: "from-slate-900 to-slate-700",
};

function formatDuration(seconds: bigint): string {
  const s = Number(seconds);
  const m = Math.floor(s / 60);
  const remaining = s % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const mins = m % 60;
    return `${h}h ${mins}m`;
  }
  return `${m}:${remaining.toString().padStart(2, "0")}`;
}

// Sample videos matching the ones in VideosPage
const SAMPLE_VIDEOS: Video[] = [
  {
    id: BigInt(1),
    title: "How to Build a Referral Network in 30 Days",
    category: "Tutorial",
    url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    description:
      "Step-by-step guide to building a powerful referral network from scratch. Learn the strategies used by top earners in the industry.",
    duration: BigInt(1800),
    createdAt: BigInt(Date.now() * 1000000),
    channelUrl: "",
    thumbnailUrl: "",
  },
  {
    id: BigInt(2),
    title: "Understanding MLM Income Streams",
    category: "Educational",
    url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    description:
      "Deep dive into multi-level marketing and how to maximize your earnings through a structured referral system.",
    duration: BigInt(2700),
    createdAt: BigInt(Date.now() * 1000000),
    channelUrl: "",
    thumbnailUrl: "",
  },
  {
    id: BigInt(3),
    title: "Bollywood Blockbusters 2024 Highlights",
    category: "Entertainment",
    url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    description: "Catch up on the biggest Bollywood releases of the year.",
    duration: BigInt(3600),
    createdAt: BigInt(Date.now() * 1000000),
    channelUrl: "",
    thumbnailUrl: "",
  },
  {
    id: BigInt(4),
    title: "Morning Yoga for Energy & Focus",
    category: "Wellness",
    url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    description:
      "Start your day with a powerful 30-minute yoga routine for energy and mental clarity.",
    duration: BigInt(1800),
    createdAt: BigInt(Date.now() * 1000000),
    channelUrl: "",
    thumbnailUrl: "",
  },
  {
    id: BigInt(5),
    title: "Bhagavad Gita: Teachings for Modern Life",
    category: "Devotional",
    url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    description:
      "Ancient wisdom adapted for contemporary challenges and professional life.",
    duration: BigInt(2400),
    createdAt: BigInt(Date.now() * 1000000),
    channelUrl: "",
    thumbnailUrl: "",
  },
  {
    id: BigInt(6),
    title: "India's Tech Revolution: 2024 Report",
    category: "Media",
    url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    description:
      "In-depth look at India's booming tech sector and the opportunities it creates.",
    duration: BigInt(1500),
    createdAt: BigInt(Date.now() * 1000000),
    channelUrl: "",
    thumbnailUrl: "",
  },
];

export default function VideoPlayerPage() {
  const { id } = useParams({ from: "/layout/videos/$id" });
  const navigate = useNavigate();

  const phoneAuth = usePhoneAuth();
  const userId = phoneAuth.userId;

  const { data: allVideos, isLoading: videosLoading } = useAllVideos();
  const { data: watchHistory } = useWatchHistory(userId);
  const recordProgressMutation = useRecordWatchProgressMutation();

  const [watchedSeconds, setWatchedSeconds] = useState(0);
  const [subscribed, setSubscribed] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Find the video from real data or sample data
  const videosSource =
    allVideos && allVideos.length > 0 ? allVideos : SAMPLE_VIDEOS;
  const video = videosSource.find((v) => v.id.toString() === id) ?? null;

  // Load existing watch record
  useEffect(() => {
    if (!watchHistory || !id) return;
    const record = watchHistory.find((r) => r.videoId.toString() === id);
    if (record) {
      setWatchedSeconds(Number(record.watchedSeconds));
      setSubscribed(record.subscribed);
      if (record.completed) {
        setIsCompleted(true);
        setHasSaved(true);
      }
    }
  }, [watchHistory, id]);

  // Simulate watch progress when "playing"
  useEffect(() => {
    if (!isPlaying || !video) return;
    intervalRef.current = setInterval(() => {
      setWatchedSeconds((prev) => {
        const next = Math.min(prev + 1, Number(video.duration));
        return next;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, video]);

  // Check completion
  useEffect(() => {
    if (!video || hasSaved) return;
    const durationSec = Number(video.duration);
    if (watchedSeconds >= durationSec && subscribed && !isCompleted) {
      setIsCompleted(true);
      handleMarkComplete();
    }
  }, [watchedSeconds, subscribed, video, isCompleted, hasSaved]);

  const handleMarkComplete = useCallback(async () => {
    if (!video || !userId || hasSaved) return;
    try {
      await recordProgressMutation.mutateAsync({
        userId,
        videoId: video.id,
        watchedSeconds: BigInt(watchedSeconds),
        subscribed,
      });
      setHasSaved(true);
      // Persist cumulative watch time to localStorage for admin panel display
      if (phoneAuth.phone) {
        const key = `watchTime_${phoneAuth.phone}`;
        const existing = Number.parseInt(localStorage.getItem(key) ?? "0", 10);
        localStorage.setItem(key, String(existing + watchedSeconds));
      }
      toast.success("Video completed! Great job watching till the end!", {
        icon: <Trophy className="w-4 h-4 text-primary" />,
      });
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to save progress";
      toast.error(msg);
    }
  }, [
    video,
    userId,
    hasSaved,
    watchedSeconds,
    subscribed,
    recordProgressMutation,
    phoneAuth.phone,
  ]);

  const progressPercent = video
    ? Math.min(100, (watchedSeconds / Number(video.duration)) * 100)
    : 0;

  // gradient used for future thumbnail display
  const _gradient = video
    ? (CATEGORY_GRADIENTS[video.category] ?? CATEGORY_GRADIENTS.default)
    : CATEGORY_GRADIENTS.default;

  // Read channel URL directly from video record (stored in backend)
  const channelUrl = video?.channelUrl || null;

  if (videosLoading) {
    return (
      <div className="p-6 space-y-4" data-ocid="player.loading_state">
        <Skeleton className="h-8 w-48 animate-shimmer" />
        <Skeleton className="aspect-video w-full max-w-4xl animate-shimmer rounded-xl" />
        <Skeleton className="h-32 animate-shimmer rounded-xl" />
      </div>
    );
  }

  if (!video) {
    return (
      <div className="p-6" data-ocid="player.error_state">
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription className="font-body">
            Video not found. It may have been removed.
          </AlertDescription>
        </Alert>
        <Button
          variant="ghost"
          className="mt-4"
          onClick={() => navigate({ to: "/videos" })}
          data-ocid="player.back.button"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Videos
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Back Button */}
      <button
        type="button"
        onClick={() => navigate({ to: "/videos" })}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4 font-ui text-sm"
        data-ocid="player.back.button"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Videos
      </button>

      <div className="space-y-5">
        {/* Video Player */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="relative rounded-2xl overflow-hidden bg-card border border-border shadow-card">
            {/* Actual video embed */}
            <div className="aspect-video relative">
              {video.url.includes("youtube") ||
              video.url.includes("youtu.be") ? (
                <iframe
                  src={video.url}
                  title={video.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                  data-ocid="player.editor"
                />
              ) : (
                <video
                  src={video.url}
                  controls
                  className="absolute inset-0 w-full h-full"
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onTimeUpdate={(e) => {
                    setWatchedSeconds(
                      Math.floor((e.target as HTMLVideoElement).currentTime),
                    );
                  }}
                  data-ocid="player.editor"
                >
                  <track kind="captions" />
                </video>
              )}
            </div>

            {/* Completion overlay */}
            {isCompleted && (
              <div className="absolute top-3 right-3">
                <div className="bg-green-500/90 backdrop-blur rounded-full flex items-center gap-1.5 px-3 py-1.5">
                  <CheckCircle className="w-4 h-4 text-white" />
                  <span className="text-white text-xs font-ui font-semibold">
                    Completed
                  </span>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Video Info */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="card-premium">
            <CardContent className="p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="flex-1 min-w-0">
                  <h1 className="font-display font-bold text-xl text-foreground leading-snug mb-2">
                    {video.title}
                  </h1>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant="outline"
                      className="text-xs border-primary/30 text-primary"
                    >
                      {video.category}
                    </Badge>
                    <div className="flex items-center gap-1 text-muted-foreground text-xs font-ui">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDuration(video.duration)}
                    </div>
                    {isCompleted && (
                      <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Completed
                      </Badge>
                    )}
                    {channelUrl && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground gap-1.5 font-ui"
                        onClick={() => window.open(channelUrl, "_blank")}
                        data-ocid="player.channel.button"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Visit Channel
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {video.description && (
                <p className="text-muted-foreground text-sm font-body leading-relaxed">
                  {video.description}
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Watch Progress & Completion Controls */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
        >
          <Card className="card-premium border-primary/20">
            <CardContent className="p-5 space-y-5">
              <h2 className="font-display font-bold text-foreground">
                Completion Requirements
              </h2>

              {/* Watch Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Play className="w-4 h-4 text-primary" />
                    <span className="text-sm font-ui text-foreground/80">
                      Watch Progress
                    </span>
                  </div>
                  <span className="text-sm font-ui font-medium text-foreground">
                    {formatDuration(BigInt(watchedSeconds))} /{" "}
                    {formatDuration(video.duration)}
                  </span>
                </div>
                <Progress
                  value={progressPercent}
                  className="h-2 bg-secondary"
                  data-ocid="player.progress.panel"
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground font-body">
                  <span>{Math.round(progressPercent)}% watched</span>
                  {progressPercent >= 100 ? (
                    <span className="text-green-400 font-ui font-medium">
                      ✓ Watch requirement met
                    </span>
                  ) : (
                    <span>Must watch 100% to complete</span>
                  )}
                </div>
              </div>

              {/* Simulate watch (for demo) */}
              {!isCompleted && (
                <div className="flex gap-2">
                  <Button
                    variant={isPlaying ? "outline" : "default"}
                    size="sm"
                    onClick={() => setIsPlaying(!isPlaying)}
                    className={
                      isPlaying
                        ? "border-border"
                        : "bg-primary text-primary-foreground"
                    }
                    data-ocid="player.watch.toggle"
                  >
                    {isPlaying ? "⏸ Pause Tracking" : "▶ Start Watching"}
                  </Button>
                  {isPlaying && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground font-body animate-pulse">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Tracking watch time...
                    </div>
                  )}
                </div>
              )}

              {/* Subscribe Requirement */}
              <div className="flex items-center justify-between border-t border-border pt-4">
                <div className="flex items-center gap-3">
                  <Bell className="w-4 h-4 text-primary" />
                  <div>
                    <div className="text-sm font-ui text-foreground/80 font-medium">
                      Channel Subscription
                    </div>
                    <div className="text-xs text-muted-foreground font-body">
                      Subscribe to mark as complete
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {subscribed && (
                    <span className="text-xs text-green-400 font-ui font-medium">
                      ✓ Subscribed
                    </span>
                  )}
                  <Switch
                    checked={subscribed}
                    onCheckedChange={setSubscribed}
                    disabled={isCompleted}
                    data-ocid="player.subscribe.switch"
                  />
                </div>
              </div>

              {/* Completion Status */}
              {isCompleted ? (
                <Alert
                  className="border-green-500/30 bg-green-500/10"
                  data-ocid="player.success_state"
                >
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <AlertDescription className="text-green-300 font-body text-sm">
                    🎉 Video completed! Your progress has been saved.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div
                      className={`flex items-center gap-2 p-2.5 rounded-lg border ${
                        progressPercent >= 100
                          ? "border-green-500/30 bg-green-500/10 text-green-400"
                          : "border-border bg-muted/50 text-muted-foreground"
                      }`}
                    >
                      {progressPercent >= 100 ? (
                        <CheckCircle className="w-4 h-4 flex-shrink-0" />
                      ) : (
                        <Play className="w-4 h-4 flex-shrink-0" />
                      )}
                      <span className="font-ui text-xs">Watch Full Video</span>
                    </div>
                    <div
                      className={`flex items-center gap-2 p-2.5 rounded-lg border ${
                        subscribed
                          ? "border-green-500/30 bg-green-500/10 text-green-400"
                          : "border-border bg-muted/50 text-muted-foreground"
                      }`}
                    >
                      {subscribed ? (
                        <CheckCircle className="w-4 h-4 flex-shrink-0" />
                      ) : (
                        <Bell className="w-4 h-4 flex-shrink-0" />
                      )}
                      <span className="font-ui text-xs">Subscribe Channel</span>
                    </div>
                  </div>

                  <Button
                    className="w-full bg-primary text-primary-foreground hover:opacity-90 font-display font-bold"
                    onClick={handleMarkComplete}
                    disabled={
                      progressPercent < 100 ||
                      !subscribed ||
                      recordProgressMutation.isPending ||
                      !userId
                    }
                    data-ocid="player.complete.button"
                  >
                    {recordProgressMutation.isPending ? (
                      <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                    ) : (
                      <Trophy className="mr-2 w-4 h-4" />
                    )}
                    {recordProgressMutation.isPending
                      ? "Saving..."
                      : "Mark as Complete"}
                  </Button>
                  {!userId && (
                    <p className="text-xs text-muted-foreground text-center font-body">
                      Login to save your progress
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
