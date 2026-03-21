import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, Play, Search, Tv, Users, Video } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { UserChannel, UserVideo } from "../backend.d";
import { useAllChannelsPublic, useChannelVideos } from "../hooks/useQueries";

// ── Channel Video Grid ────────────────────────────────────────────────────────

function ChannelVideoGrid({ channelId }: { channelId: bigint }) {
  const { data: videos, isLoading } = useChannelVideos(channelId);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
        <Skeleton className="aspect-video rounded-xl" />
        <Skeleton className="aspect-video rounded-xl" />
        <Skeleton className="aspect-video rounded-xl" />
      </div>
    );
  }

  if (!videos || videos.length === 0) {
    return (
      <div
        className="text-center py-8 text-muted-foreground font-body text-sm"
        data-ocid="channel.videos.empty_state"
      >
        No videos uploaded yet.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
      {videos.map((video, idx) => (
        <motion.div
          key={String(video.id)}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: idx * 0.05 }}
          data-ocid={`channel.video.item.${idx + 1}`}
        >
          <a
            href={video.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group block rounded-xl overflow-hidden border border-border hover:border-primary/40 transition-all duration-200 bg-card"
          >
            <div className="relative aspect-video bg-muted overflow-hidden">
              {video.thumbnailUrl ? (
                <img
                  src={video.thumbnailUrl}
                  alt={video.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/10">
                  <Play className="w-8 h-8 text-primary/60" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <Play className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            <div className="p-2">
              <p className="text-xs font-ui font-medium text-foreground line-clamp-2 leading-tight">
                {video.title}
              </p>
              {video.category && (
                <Badge
                  variant="secondary"
                  className="mt-1 text-[10px] px-1.5 py-0 h-4"
                >
                  {video.category}
                </Badge>
              )}
            </div>
          </a>
        </motion.div>
      ))}
    </div>
  );
}

// ── Channel Card ─────────────────────────────────────────────────────────────

function ChannelCard({
  channel,
  isExpanded,
  onToggle,
}: {
  channel: UserChannel;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const { data: videos } = useChannelVideos(channel.id);
  const videoCount = videos?.length ?? 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="group"
    >
      <Card
        className={`card-premium border transition-all duration-200 cursor-pointer ${
          isExpanded
            ? "border-primary/40 bg-primary/5"
            : "border-border hover:border-primary/30"
        }`}
        onClick={onToggle}
        data-ocid="channels.channel.card"
      >
        {/* Banner */}
        {channel.bannerUrl && (
          <div className="h-24 overflow-hidden rounded-t-xl">
            <img
              src={channel.bannerUrl}
              alt="banner"
              className="w-full h-full object-cover opacity-60"
            />
          </div>
        )}

        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Avatar className="w-12 h-12 border-2 border-border flex-shrink-0">
              <AvatarImage src={channel.thumbnailUrl} />
              <AvatarFallback className="bg-primary/20 text-primary font-display font-bold">
                {channel.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <h3 className="font-display font-bold text-foreground text-base truncate">
                {channel.name}
              </h3>
              {channel.description && (
                <p className="text-muted-foreground text-xs font-body mt-0.5 line-clamp-2">
                  {channel.description}
                </p>
              )}
              <div className="flex items-center gap-3 mt-2">
                <span className="flex items-center gap-1 text-xs text-muted-foreground font-body">
                  <Video className="w-3 h-3" />
                  {videoCount} video{videoCount !== 1 ? "s" : ""}
                </span>
              </div>
            </div>

            <Button
              size="sm"
              variant={isExpanded ? "default" : "outline"}
              className="text-xs font-ui flex-shrink-0"
              data-ocid="channels.channel.toggle"
            >
              {isExpanded ? "Hide" : "View"}
            </Button>
          </div>

          {/* Expanded videos */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="border-t border-border mt-4 pt-4">
                  <h4 className="font-ui font-semibold text-sm text-foreground mb-2">
                    Videos
                  </h4>
                  <ChannelVideoGrid channelId={channel.id} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ── Channels Page ─────────────────────────────────────────────────────────────

export default function ChannelsPage() {
  const { data: channels, isLoading } = useAllChannelsPublic();
  const [expandedId, setExpandedId] = useState<bigint | null>(null);
  const [search, setSearch] = useState("");

  const filtered =
    channels?.filter(
      (ch) =>
        ch.name.toLowerCase().includes(search.toLowerCase()) ||
        ch.description.toLowerCase().includes(search.toLowerCase()),
    ) ?? [];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
          <Tv className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="font-display font-bold text-2xl text-foreground">
            Channels
          </h1>
          <p className="text-muted-foreground text-sm font-body">
            Browse user-created channels and their videos
          </p>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative"
      >
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search channels..."
          className="pl-9 bg-card border-border font-body"
          data-ocid="channels.search_input"
        />
      </motion.div>

      {/* Loading */}
      {isLoading && (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          data-ocid="channels.loading_state"
        >
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      )}

      {/* Empty */}
      {!isLoading && filtered.length === 0 && (
        <div
          className="text-center py-20 text-muted-foreground font-body"
          data-ocid="channels.empty_state"
        >
          <Tv className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-base font-ui font-semibold">
            {search ? "No channels found" : "No channels yet"}
          </p>
          <p className="text-sm mt-1">
            {search
              ? "Try a different search term"
              : "Be the first to create a channel from your dashboard!"}
          </p>
        </div>
      )}

      {/* Channels Grid */}
      <div className="space-y-4">
        {filtered.map((channel) => (
          <ChannelCard
            key={String(channel.id)}
            channel={channel}
            isExpanded={expandedId === channel.id}
            onToggle={() =>
              setExpandedId((prev) => (prev === channel.id ? null : channel.id))
            }
          />
        ))}
      </div>

      {channels && channels.length > 0 && (
        <p className="text-center text-xs text-muted-foreground font-body">
          {filtered.length} channel{filtered.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
