import NextEventBanner from "./NextEventBanner";
import PulsePeerCard from "./PulsePeerCard";
import ActiveChannelsSummary from "./ActiveChannelsSummary";
import ConnectCarousel from "./ConnectCarousel";
import PulseActivityFeed from "./PulseActivityFeed";

interface Props { onGoToChannels: () => void; }

export default function PulseTab({ onGoToChannels }: Props) {
  return (
    <div className="p-4 space-y-5 pb-10">
      <NextEventBanner />
      <PulsePeerCard />
      <ActiveChannelsSummary onViewAll={onGoToChannels} />
      <ConnectCarousel />
      <PulseActivityFeed />
    </div>
  );
}
