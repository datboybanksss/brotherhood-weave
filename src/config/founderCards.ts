import kgosietsileCard from '@/assets/founders/kgosietsile-matlala.png';
import thembaCard from '@/assets/founders/themba-gama.png';
import kgosiBanksCard from '@/assets/founders/kgosi-banks.png';

export interface FounderCardConfig {
  cardImageUrl: string;
  avatarScale?: number;
  avatarObjectPosition?: string;
  avatarTransformOrigin?: string;
}

export const founderCards: Record<string, FounderCardConfig> = {
  'Kgosietsile Matlala': {
    cardImageUrl: kgosietsileCard,
    avatarScale: 2.4,
    avatarObjectPosition: 'center 20%',
    avatarTransformOrigin: '50% 25%',
  },
  'Themba Gama': {
    cardImageUrl: thembaCard,
    avatarScale: 1.05,
    avatarObjectPosition: 'center 5%',
    avatarTransformOrigin: '50% 25%',
  },
  'Kgosi Banks': {
    cardImageUrl: kgosiBanksCard,
    avatarScale: 1.4,
    avatarObjectPosition: 'center 80%',
    avatarTransformOrigin: '50% 65%',
  },
};
