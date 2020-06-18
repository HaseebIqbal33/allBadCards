import {GameItem, GamePlayer} from "./GameContract";

export class Game
{
	/**
	 * Set a player as idle
	 * @param {GameItem} game
	 * @param {string} playerGuid
	 * @param {boolean} idle
	 * @returns {GameItem}
	 */
	public static setPlayerIdle(game: GameItem, playerGuid: string, idle: boolean)
	{
		if (game.players[playerGuid])
		{
			game.players[playerGuid].isIdle = idle
		}

		if (game.pendingPlayers[playerGuid])
		{
			game.pendingPlayers[playerGuid].isIdle = idle
		}

		return game;
	}

	/**
	 * Create the suggested rounds-to-win value
	 * @param {GameItem} newGame
	 * @param {boolean} modifySuggestedRounds If true, we won't trust the resultant value outright (in case a new player has joined, or another scenario that could cause a game to end immediately)
	 * @returns {number}
	 */
	public static calculateSuggestedRoundsToWin(newGame: GameItem, modifySuggestedRounds: boolean)
	{
		const playerGuids = Object.keys(newGame.players);

		const mostRoundsWon = playerGuids.reduce((acc, guid) =>
		{
			if (newGame.players[guid].wins > acc)
			{
				acc = newGame.players[guid].wins;
			}

			return acc;
		}, 0);

		const minSuggestedRoundsToWin = Math.ceil(32 / playerGuids.length);
		const suggestedRoundsToWin = Math.max(
			minSuggestedRoundsToWin,
			modifySuggestedRounds
				? mostRoundsWon + 1
				: minSuggestedRoundsToWin
		);

		return Math.min(Math.max(4, suggestedRoundsToWin), 7);
	}

	/**
	 * If player was kicked, add them back to the game. Otherwise, create a new player
	 * @param {GameItem} newGame The game data
	 * @param {string} playerGuid The player's guid
	 * @param {() => GamePlayer} playerCreator A function that returns a newly created player
	 * @returns {GamePlayer}
	 */
	public static readdOrCreatePlayer(newGame: GameItem, playerGuid: string, nickname: string, playerCreator: () => GamePlayer)
	{
		let playerToAdd: GamePlayer;
		const playerWasKicked = !!newGame.kickedPlayers?.[playerGuid];
		if (playerWasKicked)
		{
			playerToAdd = newGame.kickedPlayers[playerGuid];
			delete newGame.kickedPlayers[playerGuid];
			playerToAdd.nickname = nickname;
		}
		else
		{
			playerToAdd = playerCreator();
		}

		return playerToAdd;
	}

	/**
	 * Add a player to a game
	 * @param {GameItem} newGame
	 * @param {GamePlayer} playerToAdd
	 * @param {boolean} isSpectating
	 */
	public static addPlayerToGame(newGame: GameItem, playerToAdd: GamePlayer, isSpectating: boolean)
	{
		const playerGuid = playerToAdd.guid;

		const isPending = !playerToAdd.isRandom && (newGame.started || newGame.settings.requireJoinApproval);

		if (isSpectating)
		{
			newGame.spectators[playerGuid] = playerToAdd;
		}
		else if (isPending)
		{
			newGame.pendingPlayers[playerGuid] = playerToAdd;
		}
		else
		{
			newGame.players[playerGuid] = playerToAdd;
		}

		if (playerToAdd.guid === newGame.lastTrueOwnerGuid)
		{
			newGame.ownerGuid = playerToAdd.guid;
		}
	}
}