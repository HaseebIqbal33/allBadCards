import {ClientGameItem, GameItem} from "../Engine/Games/Game/GameContract";

export const serverGameToClientGame = (game: GameItem): ClientGameItem =>
{
	const {
		dateCreated,
		blackCard,
		chooserGuid,
		id,
		kickedPlayers,
		lastWinner,
		ownerGuid,
		pendingPlayers,
		playerOrder,
		players,
		revealIndex,
		roundCards,
		roundIndex,
		roundStarted,
		settings,
		spectators,
		started
	} = game;

	return {
		dateCreated,
		blackCard,
		chooserGuid,
		id,
		kickedPlayers,
		lastWinner,
		ownerGuid,
		pendingPlayers,
		playerOrder,
		players,
		revealIndex,
		roundCards,
		roundIndex,
		roundStarted,
		settings,
		spectators,
		started
	};
};