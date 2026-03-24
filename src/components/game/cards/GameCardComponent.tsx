import { type GameCard } from '@/data/cards';
import { PropertyCard } from './PropertyCard';
import { ActionCard } from './ActionCard';
import { MoneyCard } from './MoneyCard';
import { WildPropertyCard } from './WildPropertyCard';
import { RentCard } from './RentCard';

interface GameCardComponentProps {
  card: GameCard;
  onClick?: () => void;
  selected?: boolean;
  small?: boolean;
}

export function GameCardComponent({ card, onClick, selected, small }: GameCardComponentProps) {
  switch (card.type) {
    case 'property':
      return <PropertyCard card={card} onClick={onClick} selected={selected} small={small} />;
    case 'wild_property':
      return <WildPropertyCard card={card} onClick={onClick} selected={selected} small={small} />;
    case 'action':
      return <ActionCard card={card} onClick={onClick} selected={selected} small={small} />;
    case 'rent':
      return <RentCard card={card} onClick={onClick} selected={selected} small={small} />;
    case 'money':
      return <MoneyCard card={card} onClick={onClick} selected={selected} small={small} />;
    default:
      return null;
  }
}
