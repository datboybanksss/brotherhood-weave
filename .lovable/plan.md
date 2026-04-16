

## Plan: Add camera capture option for avatar upload

**What**: Allow users to take a selfie directly from the avatar upload button on mobile devices, in addition to choosing an existing photo.

**How**: This is a one-line change. The existing file input already has `accept="image/*"`. On mobile browsers, changing this to `accept="image/*" capture="user"` would force camera-only. But the better UX is to keep `accept="image/*"` and add `capture="environment"` as a separate option — or simply rely on the browser's native behavior.

Actually, the simplest and best approach: the current `accept="image/*"` already prompts mobile users to choose between Camera and Photo Library on both iOS and Android. No code change needed for that.

However, we can improve the UX by splitting into two clear buttons:

**Changes to `src/components/account/EditProfileForm.tsx`**:
- Add a second file input with `capture="user"` (front-facing camera) for a dedicated "Take a selfie" button
- Keep the existing "Upload photo" button for gallery selection
- Both feed into the same `avatarMutation`

Two buttons:
1. **📷 Take a selfie** — opens front camera directly (`capture="user"`)
2. **🖼 Upload from gallery** — opens file picker (current behavior)

This works natively on mobile browsers with zero external libraries. On desktop, both will fall back to the file picker.

