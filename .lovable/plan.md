# Communities Tab — Real-Time Channel Messaging

Build the 5th bottom tab: department channels + #general + #announcements with Supabase Realtime, edit/delete, reactions, unread tracking, and per-channel mute. Database-enforced RLS, no push notifications, no DMs, no uploads.

---

## Pre-build confirmations

**1. Realtime publications enabled on:** `messages`, `message_reactions`, `channel_members` (the latter so unread badges update reactively when `last_read_at` changes).

**2. Two separate UPDATE policies on `messages`:**
- **Edit policy** — `USING (sender_id = auth.uid() AND deleted_at IS NULL AND now() - created_at <= interval '15 minutes')`. Trigger additionally enforces this and immutability of `sender_id`/`channel_id`/`created_at`.
- **Soft-delete policy** — `USING (sender_id = auth.uid() OR is_current_user_admin())`. No time limit. The BEFORE UPDATE trigger detects `deleted_at` transitioning NULL→NOT NULL, sets `deleted_by = auth.uid()` and overwrites `body = '[deleted]'`.

These are two distinct policies because the Edit window must NOT block soft-delete after 15 min, and admins must be able to soft-delete but not edit.

**3. Optimistic message dedup strategy:**
- Composer generates a `clientTempId` (uuid) and renders the message immediately into the local cache with status `sending` and a synthetic `id = temp:<uuid>`.
- Insert sends `clientTempId` in a new `messages.client_temp_id` column (nullable, indexed). The BEFORE INSERT trigger preserves it as-is — only `sender_id` is overridden.
- On insert success the returned real row replaces the temp row by matching `client_temp_id`.
- The Realtime INSERT handler checks `payload.new.client_temp_id` against a `Set` of pending temp ids for this session. If matched, it's ignored. If not matched (other user, or different device), it's appended normally.

---

## Files to create / modify

### Migration (single file)
`supabase/migrations/{ts}_communities.sql` — enums, 4 tables, indexes, RLS, triggers, `get_unread_count` function, Realtime publications, seed 8 channels, seed sample messages.

### API layer
- `src/api/channels.ts` — `getMyChannels()` (joins last message + unread count via RPC).
- `src/api/messages.ts` — `sendMessage`, `editMessage`, `softDeleteMessage`, `getMessageHistory(channelId, before?)`.
- `src/api/reactions.ts` — `toggleReaction`, `getReactionsForMessages(ids[])`.

### Hooks
- `src/hooks/useMyChannels.ts` — react-query + Realtime on `messages` + `channel_members`.
- `src/hooks/useChannelMessages.ts` — paginated history + Realtime + optimistic merge with temp-id dedup.
- `src/hooks/useChannelMember.ts` — own membership row, mute toggle, debounced `markRead()`.
- `src/hooks/useTotalUnreadCount.ts` — aggregates unread across channels for tab dot.

### Pages
- `src/pages/Communities.tsx` — channel list.
- `src/pages/ChannelView.tsx` — chat at `/communities/:slug`.

### Components (all ≤ 50 lines)
- `ChannelRow`, `ChannelHeader`, `MessageList`, `MessageGroup`, `MessageBubble`, `MessageReactions`, `MessageActionSheet`, `EmojiPicker` (8 hardcoded), `MessageComposer`, `DaySeparator`, `NewMessagesPill`, `ChannelInfoSheet` — all under `src/components/communities/`.

### Modified
- `src/components/BottomTabNav.tsx` — 5 tabs, MessageSquare icon, red dot from `useTotalUnreadCount`.
- `src/App.tsx` — add `/communities` and `/communities/:slug` inside `PaidLayout`.

---

## Database design highlights

```text
channels (8 seeded rows)
  id, slug UNIQUE, name, channel_type ENUM, department_id?, description?,
  is_admin_post_only, display_order, created_at
  CHECK: (type='department' AND dept IS NOT NULL) OR (type!='department' AND dept IS NULL)

channel_members (PK channel_id+user_id)
  joined_at, last_read_at, is_muted

messages
  id, channel_id, sender_id, body, client_temp_id?,
  created_at, edited_at?, deleted_at?, deleted_by?
  CHECK char_length(body) BETWEEN 1 AND 2000
  INDEX (channel_id, created_at DESC), INDEX (sender_id)

message_reactions (PK message_id+user_id+emoji)
  emoji (1-10 chars), created_at; INDEX (message_id)
```

### Auto-join triggers (4)
1. AFTER UPDATE `users` (payment_status pending→paid) → insert into #general, #announcements, all of user's department channels. `ON CONFLICT DO NOTHING`.
2. AFTER INSERT `user_departments` → insert into matching dept channel IF user is paid.
3. AFTER DELETE `user_departments` → remove from matching dept channel.
4. AFTER UPDATE `users` (rejected_at NULL→NOT NULL) → delete all channel_members rows for user.

### Enforcement triggers
- **BEFORE INSERT messages**: force `sender_id = auth.uid()` (when authenticated). `client_temp_id` passes through untouched. Service role bypasses for seed.
- **BEFORE UPDATE messages**:
  - If body changed: assert immutability of `sender_id`/`channel_id`/`created_at`/`client_temp_id`, `auth.uid() = sender_id`, within 15 min, set `edited_at = now()`.
  - If `deleted_at` NULL→NOT NULL: assert author OR admin, set `deleted_by = auth.uid()`, overwrite `body = '[deleted]'`.

### Function
`get_unread_count(channel_id uuid, user_id uuid) returns int` — STABLE SECURITY DEFINER.

### RLS summary
- `channels` SELECT: admin OR member.
- `channel_members` SELECT: own row, admin, or fellow channel member. UPDATE: own row only. No client INSERT/DELETE.
- `messages` SELECT: admin or channel member. INSERT: channel member + (NOT is_admin_post_only OR admin) + sender_id = auth.uid(). UPDATE: edit policy + soft-delete policy. No DELETE.
- `message_reactions` SELECT: anyone who can read the message. INSERT/DELETE: channel member, user_id = auth.uid().

All admin checks use existing `is_current_user_admin()`.

---

## UI behavior highlights

**Communities list** — ordered by last message time (NULLS LAST), then `display_order`. Row: colored badge, name, last-message preview ("Kgosi: Welcome…" or italic "[deleted]"), relative time, red unread badge ("9+" cap), mute icon if muted.

**Channel view**:
- Sticky header (back, name+description, kebab → mute toggle + info sheet).
- 50-message pages, scroll-up loads previous, day separators, sender grouping (5-min window), auto-scroll only if within 150px of bottom else "↓ New messages" pill.
- Composer: multiline grow-to-5-lines, Send disabled when empty/over 2000, char counter shown only within 100 of limit. On `#announcements` for non-admins: composer hidden, muted notice shown.
- Mark-as-read: debounced (5s) `last_read_at` update on view open + on new message arrival when tab focused.

**Message bubble** — flat-text under avatar column. Avatar+name+timestamp only on first of group. "(edited)" beside timestamp. Soft-deleted: italic muted "[deleted]"; if `deleted_by != sender_id`, append "by admin". Long-press/hover → action sheet (Add reaction / Edit (own, ≤15 min) / Delete (own or admin) / Copy text).

**Reactions** — 8-emoji picker (👍 ❤️ 🔥 😂 🙏 💯 👏 🤝). Chips show emoji + count. Tap chip = toggle own reaction.

**Bottom tab badge** — `useTotalUnreadCount` aggregates RPC across user's channels; subscribes to Realtime on `messages` + `channel_members`. Red dot only on Communities tab icon.

---

## Seed data

**8 channels** mapped to existing department UUIDs (general, announcements, fitness, personal-brand-content, service, marketing-merchandise, student, entrepreneurs).

**Sample messages** seeded via SQL: 3 in #general, 2 in #announcements, 2 in #entrepreneurs from existing admins (resolved by `is_admin = true` lookup).

---

## Build order

1. Migration: tables, indexes, RLS, triggers, function, publications, seed.
2. Verify auto-join via direct SQL on a paid user.
3. `useMyChannels` + `Communities.tsx` + `ChannelRow`.
4. Update `BottomTabNav` (5 tabs) + `useTotalUnreadCount`.
5. `ChannelView` scaffold: header, composer, plain MessageList.
6. Realtime + optimistic send with `client_temp_id` dedup.
7. Grouping, day separators, auto-scroll, NewMessagesPill.
8. ActionSheet: edit (15 min), soft delete, copy.
9. Reactions: picker, chips, toggle.
10. ChannelInfoSheet + mute toggle.
11. Admin "deleted by admin" subtext.
12. Smoke tests.

---

## Smoke tests

a. Auto-join: new paid user appears in #general, #announcements, dept channels; add/remove dept on /me updates membership.
b. Realtime: two browsers, message in #general arrives <1s for the other.
c. Edit/delete: edit within 15 min works; >15 min fails; soft-delete shows "[deleted]"; admin-deleted shows "by admin".
d. Reactions: toggle on, re-tap toggles off, different user increments count.
e. Unread: User B posts → User A sees red dot on tab + badge on row → opening clears them.
f. Security: non-member SELECT returns empty; non-member INSERT returns RLS error.
g. #announcements: non-admin sees no composer + notice; admin can post.
h. Mute: toggle persists across reload.
i. Components ≤50 lines, no try/catch, no edits to `src/components/ui/`.
j. **client_temp_id integrity:** send a message via the UI with a known clientTempId; immediately run `SELECT id, client_temp_id FROM messages ORDER BY created_at DESC LIMIT 1` — confirm `client_temp_id` matches the value the client sent and is NOT NULL. If it's NULL, the BEFORE INSERT trigger is stripping it and optimistic dedup will double-render every send.
