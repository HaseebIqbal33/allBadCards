import {ArrayUtils} from "./ArrayUtils";
import {CardId, ClientGameItem} from "../Platform/Contract";
import {GameDataStorePayload} from "../DataStore/GameDataStore";

export const cardDefsLoaded = (gameData: GameDataStorePayload) => {

	const playedCards = Object.values(gameData.game?.roundCards ?? {});
	const loadableCards = ArrayUtils.flatten<CardId>(playedCards).filter(c => !c.customInput);
	const loadedCards = Object.values(gameData.roundCardDefs).length > 0;

	return playedCards.length === 0 || loadedCards || loadableCards.length === 0;
};

export const getTrueRoundsToWin = (game: ClientGameItem | undefined) =>
{
	const suggested = game?.settings?.suggestedRoundsToWin ?? 7;
	const set = game?.settings?.roundsToWin;

	return set ?? suggested;
};