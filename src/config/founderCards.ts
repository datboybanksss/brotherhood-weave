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
    avatarScale: 1.15,
    avatarObjectPosition: 'center bottom',
    avatarTransformOrigin: '50% 100%',
  },
  'Themba Gama': {
    cardImageUrl: thembaCard,
    avatarScale: 1.1,
    avatarObjectPosition: 'center bottom',
    avatarTransformOrigin: '50% 100%',
  },
  'Kgosi Banks': {
    cardImageUrl: kgosiBanksCard,
    avatarScale: 1.5,
    avatarObjectPosition: 'center bottom',
    avatarTransformOrigin: '50% 100%',
  },
};
