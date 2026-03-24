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
  const renderCard = () => {
    switch (card.type) {
      case 'property':
        return <PropertyCard card={card} onClick={onClick} selected={selected} />;
      case 'wild_property':
        return <WildPropertyCard card={card} onClick={onClick} selected={selected} />;
      case 'action':
        return <ActionCard card={card} onClick={onClick} selected={selected} />;
      case 'rent':
        return <RentCard card={card} onClick={onClick} selected={selected} />;
      case 'money':
        return <MoneyCard card={card} onClick={onClick} selected={selected} />;
      default:
        return null;
    }
  };

  if (small) {
    return (
      <div
        className="flex-none"
        style={{ width: 80, height: 116 }}
      >
        <div style={{ transform: 'scale(0.55)', transformOrigin: 'top left' }}>
          {renderCard()}
        </div>
      </div>
    );
  }

  return renderCard();
}
