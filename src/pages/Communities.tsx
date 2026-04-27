import { useMyChannels } from "@/hooks/useMyChannels";
import ChannelRow from "@/components/communities/ChannelRow";

export default function Communities() {
  const { data, isLoading } = useMyChannels();

  return (
    <div className="space-y-2">
      <div className="sticky top-0 bg-background z-10 p-4 pb-3 border-b border-border">
        <h1 className="text-xl font-bold text-foreground">Communities</h1>
      </div>
      <div className="px-2">
        {isLoading && <p className="text-sm text-muted-foreground p-4">Loading…</p>}
        {data?.map((c) => <ChannelRow key={c.id} channel={c} />)}
        {data?.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8 px-4">
            No channels yet — make sure you've joined a department on the Me tab.
          </p>
        )}
      </div>
    </div>
  );
}