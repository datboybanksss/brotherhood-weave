import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ImagePlus, Send, X } from "lucide-react";
import { formatDistanceToNow, isSameDay } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useDirectMessages } from "@/hooks/useDirectMessages";
import { getConversationOtherUser, editDirectMessage, softDeleteDirectMessage } from "@/api/direct-messages";
import type { DirectMessageRow } from "@/api/direct-messages";
import type { OptimisticDM } from "@/hooks/useDirectMessages";
import Avatar from "@/components/Avatar";
import MessageGroup from "@/components/communities/MessageGroup";
import DaySeparator from "@/components/communities/DaySeparator";
import type { OptimisticMessage } from "@/hooks/useChannelMessages";
import type { MessageRow } from "@/api/messages";

const GROUP_WINDOW_MS = 5 * 60_000;

export default function ConversationView() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();

  const { data: otherUser } = useQuery({
    queryKey: ["conversationOther", id],
    queryFn: () => getConversationOtherUser(id!),
    enabled: !!id,
    staleTime: 30_000,
  });

  const { messages, loading, hasMore, loadOlder, send, markRead } = useDirectMessages(id);

  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState<DirectMessageRow | null>(null);
  const [pendingImage, setPendingImage] = useState<{ file: File; previewUrl: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastCountRef = useRef(0);

  const scrollToBottom = (smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
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
      if (nearBottom) { scrollToBottom(); markRead(); }
      lastCountRef.current = messages.length;
      qc.invalidateQueries({ queryKey: ["conversations"] });
    }
  }, [messages.length, markRead, qc]);

  const handleScroll = useCallback(async () => {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 120) markRead();
    if (el.scrollTop < 80 && hasMore && !loadingOlder && !loading) {
      const prevHeight = el.scrollHeight;
      setLoadingOlder(true);
      await loadOlder();
      setLoadingOlder(false);
      requestAnimationFrame(() => { el.scrollTop = el.scrollHeight - prevHeight; });
    }
  }, [hasMore, loadingOlder, loading, loadOlder, markRead]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Only images are supported"); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("Image must be under 10 MB"); return; }
    setPendingImage({ file, previewUrl: URL.createObjectURL(file) });
    e.target.value = "";
  };

  const handleSend = async () => {
    const body = draft.trim();
    if (!body && !pendingImage) return;

    let attachmentUrl: string | undefined;
    if (pendingImage) {
      setUploading(true);
      const ext = pendingImage.file.name.split(".").pop() ?? "jpg";
      const path = `dm/${user!.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("channel-attachments").upload(path, pendingImage.file);
      setUploading(false);
      if (upErr) { toast.error("Image upload failed"); return; }
      const { data: urlData } = supabase.storage.from("channel-attachments").getPublicUrl(path);
      attachmentUrl = urlData.publicUrl;
      URL.revokeObjectURL(pendingImage.previewUrl);
      setPendingImage(null);
    }

    const currentReply = replyTo;
    setDraft("");
    setReplyTo(null);
    await send({ body, attachmentUrl, attachmentType: attachmentUrl ? "image" : undefined, replyToId: currentReply?.id, replyToPreview: currentReply ?? undefined });
    requestAnimationFrame(() => scrollToBottom());
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const groupedByDay = useMemo(() => {
    const days: { date: string; groups: OptimisticDM[][] }[] = [];
    for (const m of messages) {
      const last = days[days.length - 1];
      if (!last || !isSameDay(new Date(last.date), new Date(m.created_at))) {
        days.push({ date: m.created_at, groups: [[m]] });
        continue;
      }
      const lastGroup = last.groups[last.groups.length - 1];
      const prev = lastGroup[lastGroup.length - 1];
      if (prev.sender_id === m.sender_id && new Date(m.created_at).getTime() - new Date(prev.created_at).getTime() < GROUP_WINDOW_MS) {
        lastGroup.push(m);
      } else {
        last.groups.push([m]);
      }
    }
    return days;
  }, [messages]);

  const presenceText = otherUser?.last_seen_at
    ? Date.now() - new Date(otherUser.last_seen_at).getTime() < 2 * 60_000
      ? "Online"
      : `Last seen ${formatDistanceToNow(new Date(otherUser.last_seen_at), { addSuffix: true })}`
    : null;

  return (
    <div className="flex flex-col h-[100dvh] bg-background">
      {/* Header */}
      <header className="flex items-center gap-2 px-2 py-3 border-b border-border bg-background sticky top-0 z-10">
        <button
          onClick={() => nav("/communities?layer=messages")}
          className="p-2 rounded-full hover:bg-accent"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        {otherUser && (
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <Avatar userId={otherUser.id} size="sm" showStatus />
            <div className="min-w-0">
              <p className="font-semibold text-sm text-foreground truncate">{otherUser.full_name}</p>
              {presenceText && (
                <p className={`text-[10px] leading-none ${presenceText === "Online" ? "text-green-500" : "text-muted-foreground"}`}>
                  {presenceText}
                </p>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Message list */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto" onScroll={handleScroll}>
        {loadingOlder && <p className="text-xs text-center text-muted-foreground py-2">Loading…</p>}
        {loading && <p className="text-sm text-muted-foreground p-4">Loading…</p>}
        {!loading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full py-16 px-8 text-center space-y-2">
            <p className="text-sm font-medium text-foreground">Start the conversation</p>
            <p className="text-xs text-muted-foreground">
              Messages are private between you and {otherUser?.full_name?.split(" ")[0] ?? "this member"}.
            </p>
          </div>
        )}
        {groupedByDay.map((day) => (
          <div key={day.date}>
            <DaySeparator date={day.date} />
            {day.groups.map((g, i) => (
              <MessageGroup
                key={`${day.date}-${i}-${g[0].id}`}
                messages={g as unknown as OptimisticMessage[]}
                reactions={[]}
                currentUserId={user?.id ?? ""}
                isAdmin={false}
                onReply={(m) => setReplyTo(m as unknown as DirectMessageRow)}
                onDeleteMessage={async (msgId) => { await softDeleteDirectMessage(msgId); }}
                onSaveEditMessage={async (msgId, body) => { await editDirectMessage(msgId, body); }}
              />
            ))}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div className="border-t border-border bg-background">
        {replyTo && (
          <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border bg-muted/30">
            <div className="flex-1 min-w-0 border-l-2 border-primary pl-2">
              <p className="text-xs font-medium text-muted-foreground">
                {(replyTo as any).sender?.full_name ?? "Member"}
              </p>
              <p className="text-xs text-muted-foreground truncate">{replyTo.body ?? "📎 Image"}</p>
            </div>
            <button onClick={() => setReplyTo(null)} className="p-1 rounded hover:bg-accent">
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>
        )}
        {pendingImage && (
          <div className="relative inline-block px-3 py-1.5">
            <img src={pendingImage.previewUrl} alt="pending" className="h-20 rounded-lg object-cover" />
            <button
              onClick={() => { URL.revokeObjectURL(pendingImage.previewUrl); setPendingImage(null); }}
              className="absolute top-0.5 right-0.5 bg-background rounded-full p-0.5"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
        <div className="p-2">
          <div className="flex items-end gap-2">
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="p-2 rounded-full hover:bg-accent text-muted-foreground shrink-0"
              aria-label="Attach image"
            >
              <ImagePlus className="h-5 w-5" />
            </button>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKey}
              placeholder={otherUser ? `Message ${otherUser.full_name.split(" ")[0]}…` : "Message…"}
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
        </div>
      </div>
    </div>
  );
}
