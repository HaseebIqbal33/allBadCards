import {CardId, CardPackMap} from "../Game/GameContract";
import {PackManager} from "./PackManager";
import {cardPackIndex, cardPackMapToHashTable} from "./CardUtils";

class _CardManager
{
	public static Instance = new _CardManager();

	public getAllowedCard(allowedCards: CardPackMap, usedCards: CardPackMap): CardId
	{
		const allAllowedCards = cardPackMapToHashTable(allowedCards);
		const allUsedCards = cardPackMapToHashTable(usedCards);

		const validCards = Object.values(allAllowedCards).filter(card => {
			return !(cardPackIndex(card) in allUsedCards);
		});

		const randomIndex = Math.floor(Math.random() * validCards.length);

		return validCards[randomIndex];
	}

	public async getWhiteCard(cardId: CardId)
	{
		const pack = await PackManager.getPack(cardId.packId);
		return pack.white[cardId.cardIndex];
	}

	public async getBlackCard(cardId: CardId)
	{
		const pack = await PackManager.getPack(cardId.packId);
		return pack.black[cardId.cardIndex];
	}
}

export const CardManager = _CardManager.Instance;