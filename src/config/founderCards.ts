import kgosietsileCard from '@/assets/founders/kgosietsile-matlala.png';
import thembaCard from '@/assets/founders/themba-gama.png';

export interface FounderCardConfig {
  cardImageUrl: string;
  avatarScale?: number;
  avatarObjectPosition?: string;
}

export const founderCards: Record<string, FounderCardConfig> = {
  'Kgosietsile Matlala': {
    cardImageUrl: kgosietsileCard,
    avatarScale: 2.4,
    avatarObjectPosition: 'center 20%',
  },
  'Themba Gama': {
    cardImageUrl: thembaCard,
    avatarScale: 1.05,
    avatarObjectPosition: 'center 5%',
  },
};
