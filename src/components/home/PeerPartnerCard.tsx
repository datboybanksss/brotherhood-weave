import { useCurrentPeerPartner } from "@/hooks/useCurrentPeerPartner";
import PeerPartnerCardWaiting from "./PeerPartnerCardWaiting";
import PeerPartnerCardSingle from "./PeerPartnerCardSingle";
import PeerPartnerCardTrio from "./PeerPartnerCardTrio";

export default function PeerPartnerCard() {
  const { data, isLoading } = useCurrentPeerPartner();
  if (isLoading || !data) return null;
  const { partners, weekEnd } = data;
  if (partners.length === 0) return <PeerPartnerCardWaiting />;
  if (partners.length === 1) return <PeerPartnerCardSingle partner={partners[0]} weekEnd={weekEnd} />;
  return <PeerPartnerCardTrio partners={partners} weekEnd={weekEnd} />;
}
