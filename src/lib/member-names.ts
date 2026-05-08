export function formatClubAddressName(fullName: string | null | undefined) {
  const parts = (fullName ?? "").trim().split(/\s+/).filter(Boolean);
  const lastName = parts.length > 1 ? parts[parts.length - 1] : parts[0];
  return lastName ? `Mr. ${lastName}` : "Mr.";
}
