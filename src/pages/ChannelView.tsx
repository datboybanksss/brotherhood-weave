import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BellOff, Bell, Send } from "lucide-react";
import { getChannelBySlug } from "@/api/channels";
import { useChannelMessages } from "@/hooks/useChannelMessages";
import { useChannelMember } from "@/hooks/useChannelMember";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useAuth } from "@/hooks/useAuth";
import MessageGroup from "@/components/communities/MessageGroup";
import DaySeparator from "@/components/communities/DaySeparator";
import NewMessagesPill from "@/components/communities/NewMessagesPill";
import { format, isSameDay } from "date-fns";
import type { OptimisticMessage } from "@/hooks/useChannelMessages";

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

  const { messages, reactions, loading, send } = useChannelMessages(channel?.id);
  const { membership, toggleMute, markRead } = useChannelMember(channel?.id);

  const [draft, setDraft] = useState("");
  const [showPill, setShowPill] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastCountRef = useRef(0);

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

  const handleSend = async () => {
    const body = draft.trim();
    if (!body || !canPost) return;
    setDraft("");
    await send(body);
    requestAnimationFrame(() => scrollToBottom());
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (chLoading || !channel) {
    return <div className="p-4 text-sm text-muted-foreground">Loading…</div>;
  }

  const muted = !!membership?.is_muted;

  return (
    <div className="flex flex-col h-[100dvh] bg-background">
      <header className="flex items-center gap-2 px-2 py-3 border-b border-border bg-background sticky top-0 z-10">
        <Link to="/communities" className="p-2 rounded-full hover:bg-accent" aria-label="Back">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-foreground truncate">#{channel.name}</h1>
          {channel.description && (
            <p className="text-xs text-muted-foreground truncate">{channel.description}</p>
          )}
        </div>
        <button
          onClick={() => toggleMute(!muted)}
          className="p-2 rounded-full hover:bg-accent"
          aria-label={muted ? "Unmute" : "Mute"}
        >
          {muted ? <BellOff className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
        </button>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto relative" onScroll={() => {
        const el = scrollRef.current;
        if (!el) return;
        const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
        if (nearBottom) {
          setShowPill(false);
          markRead();
        }
      }}>
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
              />
            ))}
          </div>
        ))}
        <div ref={bottomRef} />
        {showPill && <NewMessagesPill onClick={() => scrollToBottom()} />}
      </div>

      <div className="border-t border-border p-2 bg-background">
        {canPost ? (
          <div className="flex items-end gap-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKey}
              placeholder={`Message #${channel.name}`}
              rows={1}
              className="flex-1 resize-none bg-muted border border-input rounded-lg px-3 py-2 text-sm max-h-32 focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <button
              onClick={handleSend}
              disabled={!draft.trim()}
              className="p-2 rounded-full bg-primary text-primary-foreground disabled:opacity-40"
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
  );
}