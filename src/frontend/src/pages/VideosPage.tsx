import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "@tanstack/react-router";
import {
  BookOpen,
  CheckCircle,
  Clock,
  ExternalLink,
  GraduationCap,
  Heart,
  Loader2,
  Newspaper,
  Play,
  Search,
  Sparkles,
  Tv,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import type { Video, WatchRecord } from "../backend.d";
import { usePhoneAuth } from "../hooks/usePhoneAuth";
import { useVideosByCategory, useWatchHistory } from "../hooks/useQueries";

const CATEGORIES = [
  { value: "All", label: "All", icon: Play },
  { value: "Tutorial", label: "Tutorial", icon: BookOpen },
  { value: "Educational", label: "Educational", icon: GraduationCap },
  { value: "Entertainment", label: "Entertainment", icon: Tv },
  { value: "Wellness", label: "Wellness", icon: Heart },
  { value: "Devotional", label: "Devotional", icon: Sparkles },
  { value: "Media", label: "Media", icon: Newspaper },
];

const CATEGORY_COLORS: Record<string, string> = {
  Tutorial: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  Educational: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  Entertainment: "bg-pink-500/20 text-pink-300 border-pink-500/30",
  Wellness: "bg-green-500/20 text-green-300 border-green-500/30",
  Devotional: "bg-amber/20 text-amber border-amber/30",
  Media: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
};

// Sample video thumbnails via category
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

interface VideoCardProps {
  video: Video;
  watchRecord?: WatchRecord;
  index: number;
  onClick: () => void;
}

function VideoCard({ video, watchRecord, index, onClick }: VideoCardProps) {
  const gradient =
    CATEGORY_GRADIENTS[video.category] ?? CATEGORY_GRADIENTS.default;
  const categoryColor =
    CATEGORY_COLORS[video.category] ?? "bg-muted text-muted-foreground";
  const isCompleted = watchRecord?.completed ?? false;

  const ocidIndex = index + 1;

  // Read channel URL and thumbnail directly from video record (stored in backend)
  const channelUrl = video.channelUrl || null;
  const thumbnailUrl = video.thumbnailUrl || null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ y: -3 }}
    >
      <Card
        className="card-premium overflow-hidden cursor-pointer hover:border-primary/40 transition-all duration-300"
        onClick={onClick}
        data-ocid={`videos.item.${ocidIndex}`}
      >
        {/* Thumbnail */}
        <div
          className={`h-40 bg-gradient-to-br ${gradient} relative flex items-center justify-center`}
        >
          {thumbnailUrl && (
            <img
              src={thumbnailUrl}
              alt={video.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          <div className="relative w-14 h-14 rounded-full bg-white/20 backdrop-blur flex items-center justify-center transition-transform hover:scale-110">
            <Play className="w-6 h-6 text-white ml-0.5" />
          </div>
          {/* Duration badge */}
          <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur rounded px-2 py-0.5 flex items-center gap-1">
            <Clock className="w-3 h-3 text-white/80" />
            <span className="text-white text-xs font-ui">
              {formatDuration(video.duration)}
            </span>
          </div>
          {/* Completion badge */}
          {isCompleted && (
            <div className="absolute top-2 right-2 bg-green-500/90 backdrop-blur rounded-full p-1">
              <CheckCircle className="w-4 h-4 text-white" />
            </div>
          )}
          {/* Progress bar */}
          {watchRecord &&
            !isCompleted &&
            Number(watchRecord.watchedSeconds) > 0 && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                <div
                  className="h-full bg-primary transition-all"
                  style={{
                    width: `${Math.min(100, (Number(watchRecord.watchedSeconds) / Number(video.duration)) * 100)}%`,
                  }}
                />
              </div>
            )}
        </div>

        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-display font-semibold text-foreground text-sm leading-snug line-clamp-2 flex-1">
              {video.title}
            </h3>
          </div>
          <div className="flex items-center justify-between">
            <Badge variant="outline" className={`text-xs ${categoryColor}`}>
              {video.category}
            </Badge>
            {isCompleted && (
              <span className="text-xs text-green-400 font-ui font-medium">
                ✓ Completed
              </span>
            )}
          </div>
          {video.description && (
            <p className="text-muted-foreground text-xs font-body mt-2 line-clamp-2">
              {video.description}
            </p>
          )}
          {/* Channel link button */}
          {channelUrl && (
            <Button
              size="sm"
              variant="outline"
              className="mt-3 w-full h-7 text-xs border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground gap-1.5 font-ui"
              onClick={(e) => {
                e.stopPropagation();
                window.open(channelUrl, "_blank");
              }}
              data-ocid={`videos.channel.button.${ocidIndex}`}
            >
              <ExternalLink className="w-3 h-3" />
              Visit Channel
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Sample/demo videos for empty state
const SAMPLE_VIDEOS: Video[] = [
  {
    id: BigInt(1),
    title: "How to Build a Referral Network in 30 Days",
    category: "Tutorial",
    url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    description:
      "Step-by-step guide to building a powerful referral network from scratch.",
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
      "Deep dive into multi-level marketing and how to maximize your earnings.",
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
    description: "Start your day with a powerful 30-minute yoga routine.",
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
    description: "Ancient wisdom adapted for contemporary challenges.",
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
      "In-depth look at India's booming tech sector and opportunities.",
    duration: BigInt(1500),
    createdAt: BigInt(Date.now() * 1000000),
    channelUrl: "",
    thumbnailUrl: "",
  },
];

export default function VideosPage() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const phoneAuth = usePhoneAuth();
  const userId = phoneAuth.userId;

  const { data: videos, isLoading } = useVideosByCategory(activeCategory);
  const { data: watchHistory } = useWatchHistory(userId);

  const watchMap = new Map<string, WatchRecord>(
    (watchHistory ?? []).map((r) => [r.videoId.toString(), r]),
  );

  // Use real data or sample data if empty
  const displayVideos = (videos && videos.length > 0 ? videos : SAMPLE_VIDEOS)
    .filter((v) => activeCategory === "All" || v.category === activeCategory)
    .filter(
      (v) =>
        !searchQuery ||
        v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.description.toLowerCase().includes(searchQuery.toLowerCase()),
    );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="font-display font-black text-2xl text-foreground">
          Premium <span className="text-gradient-gold">Video Library</span>
        </h1>
        <p className="text-muted-foreground text-sm font-body mt-1">
          Watch videos, complete them, and subscribe to channels to earn rewards
        </p>
      </motion.div>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search videos..."
          className="pl-9 bg-input border-border font-body"
          data-ocid="videos.search_input"
        />
      </div>

      {/* Category Tabs */}
      <div className="overflow-x-auto pb-2 mb-6">
        <Tabs value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList className="bg-card border border-border h-auto p-1 flex-wrap gap-1 w-max min-w-full">
            {CATEGORIES.map((cat) => (
              <TabsTrigger
                key={cat.value}
                value={cat.value}
                className="flex items-center gap-1.5 text-xs font-ui px-3 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                data-ocid={`videos.${cat.value.toLowerCase()}.tab`}
              >
                <cat.icon className="w-3.5 h-3.5" />
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Video Grid */}
      {isLoading ? (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          data-ocid="videos.loading_state"
        >
          {["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8"].map((k) => (
            <Skeleton key={k} className="h-64 rounded-xl animate-shimmer" />
          ))}
        </div>
      ) : displayVideos.length === 0 ? (
        <div className="py-20 text-center" data-ocid="videos.empty_state">
          <Play className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-30" />
          <h3 className="font-display font-bold text-foreground mb-2">
            No videos found
          </h3>
          <p className="text-muted-foreground font-body text-sm">
            {searchQuery
              ? "Try a different search term."
              : "No videos in this category yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {displayVideos.map((video, i) => (
            <VideoCard
              key={video.id.toString()}
              video={video}
              watchRecord={watchMap.get(video.id.toString())}
              index={i}
              onClick={() =>
                navigate({
                  to: "/videos/$id",
                  params: { id: video.id.toString() },
                })
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
