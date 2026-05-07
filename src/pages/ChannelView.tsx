import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BellOff, Bell, Send, ImagePlus, X, Users } from "lucide-react";
import { getChannelBySlug, getChannelMemberCount } from "@/api/channels";
import { useChannelMessages } from "@/hooks/useChannelMessages";
import { useChannelMember } from "@/hooks/useChannelMember";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import MessageGroup from "@/components/communities/MessageGroup";
import DaySeparator from "@/components/communities/DaySeparator";
import NewMessagesPill from "@/components/communities/NewMessagesPill";
import { format, isSameDay } from "date-fns";
import { toast } from "sonner";
import type { OptimisticMessage } from "@/hooks/useChannelMessages";
import type { MessageRow } from "@/api/messages";

const GROUP_WINDOW_MS = 5 * 60_000;

export default function ChannelView() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const { data: currentUser } = useCurrentUser();
  const isAdmin = !!currentUser?.is_admin;

  const { data: channel, isLoading: chLoading } = useQuery({
    queryKey: ["channel", slug],
    queryFn: () => getChannelBySlug(slug!),
    enabled: !!slug,
  });

  const { data: memberCount } = useQuery({
    queryKey: ["channelMemberCount", channel?.id],
    queryFn: () => getChannelMemberCount(channel!.id),
    enabled: !!channel?.id,
  });

  const { messages, reactions, loading, hasMore, loadOlder, send, typingUsers, broadcastTyping } = useChannelMessages(channel?.id);
  const { membership, toggleMute, markRead } = useChannelMember(channel?.id);

  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState<MessageRow | null>(null);
  const [pendingImage, setPendingImage] = useState<{ file: File; previewUrl: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [showPill, setShowPill] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastCountRef = useRef(0);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const canPost = !channel?.is_admin_post_only || isAdmin;

  const scrollToBottom = (smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
    setShowPill(false);
  };

  useEffect(() => {
    if (!loading && messages.length > 0 && lastCountRef.current === 0) {
      scrollToBottom(false);
      lastCountRef.current = messages.length;
    }
  }, [loading, messages.length]);

  useEffect(() => {
    if (messages.length > lastCountRef.current) {
      const el = scrollRef.current;
      const nearBottom = el ? el.scrollHeight - el.scrollTop - el.clientHeight < 120 : true;
      if (nearBottom) {
        scrollToBottom();
        markRead();
      } else {
        setShowPill(true);
      }
      lastCountRef.current = messages.length;
    }
  }, [messages.length, markRead]);

  const handleScroll = useCallback(async () => {
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (nearBottom) {
      setShowPill(false);
      markRead();
    }
    if (el.scrollTop < 80 && hasMore && !loadingOlder && !loading) {
      const prevHeight = el.scrollHeight;
      setLoadingOlder(true);
      await loadOlder();
      setLoadingOlder(false);
      // Maintain scroll position after prepending older messages
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight - prevHeight;
      });
    }
  }, [hasMore, loadingOlder, loading, loadOlder, markRead]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Only images are supported"); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("Image must be under 10 MB"); return; }
    const previewUrl = URL.createObjectURL(file);
    setPendingImage({ file, previewUrl });
    e.target.value = "";
  };

  const handleSend = async () => {
    if (!canPost) return;
    const body = draft.trim();
    if (!body && !pendingImage) return;

    let attachmentUrl: string | undefined;
    if (pendingImage) {
      setUploading(true);
      const ext = pendingImage.file.name.split(".").pop() ?? "jpg";
      const path = `${user!.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("channel-attachments").upload(path, pendingImage.file);
      setUploading(false);
      if (upErr) { toast.error("Image upload failed"); return; }
      const { data: urlData } = supabase.storage.from("channel-attachments").getPublicUrl(path);
      attachmentUrl = urlData.publicUrl;
      URL.revokeObjectURL(pendingImage.previewUrl);
      setPendingImage(null);
    }

    setDraft("");
    const payload = {
      body,
      attachmentUrl,
      attachmentType: attachmentUrl ? "image" : undefined,
      replyToId: replyTo?.id,
      replyToPreview: replyTo ?? undefined,
    };
    setReplyTo(null);
    await send(payload);
    requestAnimationFrame(() => scrollToBottom());
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDraft(e.target.value);
    if (currentUser?.full_name) {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      broadcastTyping(currentUser.full_name.split(" ")[0]);
      typingTimeoutRef.current = setTimeout(() => { typingTimeoutRef.current = null; }, 2000);
    }
  };

  // Group messages by day, then into sender groups within 5min
  const groupedByDay = useMemo(() => {
    const days: { date: string; groups: OptimisticMessage[][] }[] = [];
    for (const m of messages) {
      const last = days[days.length - 1];
      if (!last || !isSameDay(new Date(last.date), new Date(m.created_at))) {
        days.push({ date: m.created_at, groups: [[m]] });
        continue;
      }
      const lastGroup = last.groups[last.groups.length - 1];
      const prev = lastGroup[lastGroup.length - 1];
      const sameSender = prev.sender_id === m.sender_id;
      const within = new Date(m.created_at).getTime() - new Date(prev.created_at).getTime() < GROUP_WINDOW_MS;
      if (sameSender && within) lastGroup.push(m);
      else last.groups.push([m]);
    }
    return days;
  }, [messages]);

  if (chLoading || !channel) {
    return <div className="p-4 text-sm text-muted-foreground">Loading…</div>;
  }

  const muted = !!membership?.is_muted;

  return (
    <div className="flex flex-col bg-background" style={{ height: 'calc(100dvh - 4rem - env(safe-area-inset-bottom, 0px))' }}>
      {/* Header */}
      <header className="flex items-center gap-2 px-2 py-3 border-b border-border bg-background sticky top-0 z-10">
        <Link to="/communities" className="p-2 rounded-full hover:bg-accent" aria-label="Back">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-foreground truncate">#{channel.name}</h1>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            {channel.description && <span className="truncate">{channel.description}</span>}
            {memberCount != null && (
              <span className="flex items-center gap-0.5 shrink-0">
                {channel.description && <span>·</span>}
                <Users className="h-3 w-3" />
                {memberCount}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => toggleMute(!muted)}
          className="p-2 rounded-full hover:bg-accent"
          aria-label={muted ? "Unmute" : "Mute"}
        >
          {muted ? <BellOff className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
        </button>
      </header>

      {/* Message list */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto relative" onScroll={handleScroll}>
        {loadingOlder && <p className="text-xs text-center text-muted-foreground py-2">Loading…</p>}
        {!loadingOlder && hasMore && messages.length > 0 && (
          <p className="text-xs text-center text-muted-foreground py-2">Scroll up for more</p>
        )}
        {loading && <p className="text-sm text-muted-foreground p-4">Loading messages…</p>}
        {!loading && messages.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No messages yet — be the first to say hi.</p>
        )}
        {groupedByDay.map((day) => (
          <div key={day.date}>
            <DaySeparator date={day.date} />
            {day.groups.map((g, i) => (
              <MessageGroup
                key={`${day.date}-${i}-${g[0].id}`}
                messages={g}
                reactions={reactions}
                currentUserId={user?.id ?? ""}
                isAdmin={isAdmin}
                onReply={(m) => { setReplyTo(m); }}
              />
            ))}
          </div>
        ))}
        <div ref={bottomRef} />
        {showPill && <NewMessagesPill onClick={() => scrollToBottom()} />}
      </div>

      {/* Composer */}
      <div className="border-t border-border bg-background">
        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <p className="text-xs text-muted-foreground px-3 pt-1">
            {typingUsers.length === 1
              ? `${typingUsers[0]} is typing…`
              : `${typingUsers.slice(0, 2).join(", ")} are typing…`}
          </p>
        )}

        {/* Reply preview bar */}
        {replyTo && (
          <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border bg-muted/30">
            <div className="flex-1 min-w-0 border-l-2 border-primary pl-2">
              <p className="text-xs font-medium text-muted-foreground">{(replyTo as any).sender?.full_name ?? "Member"}</p>
              <p className="text-xs text-muted-foreground truncate">{replyTo.body ?? "📎 Image"}</p>
            </div>
            <button onClick={() => setReplyTo(null)} className="p-1 rounded hover:bg-accent">
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>
        )}

        {/* Pending image preview */}
        {pendingImage && (
          <div className="relative inline-block px-3 py-1.5">
            <img src={pendingImage.previewUrl} alt="pending" className="h-20 rounded-lg object-cover" />
            <button
              onClick={() => { URL.revokeObjectURL(pendingImage.previewUrl); setPendingImage(null); }}
              className="absolute top-0.5 right-0.5 bg-background rounded-full p-0.5 shadow"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <div className="p-2">
          {canPost ? (
            <div className="flex items-end gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageSelect}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-full hover:bg-accent text-muted-foreground shrink-0"
                aria-label="Attach image"
                disabled={uploading}
              >
                <ImagePlus className="h-5 w-5" />
              </button>
              <textarea
                value={draft}
                onChange={handleTyping}
                onKeyDown={handleKey}
                placeholder={`Message #${channel.name}`}
                rows={1}
                className="flex-1 resize-none bg-muted border border-input rounded-lg px-3 py-2 text-sm max-h-32 focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <button
                onClick={handleSend}
                disabled={(!draft.trim() && !pendingImage) || uploading}
                className="p-2 rounded-full bg-primary text-primary-foreground disabled:opacity-40 shrink-0"
                aria-label="Send"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <p className="text-xs text-center text-muted-foreground py-2">
              Only admins can post in this channel.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
