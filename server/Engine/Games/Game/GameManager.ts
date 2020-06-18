import {Database} from "../../../DB/Database";
import shortid from "shortid";
import {hri} from "allbadcards-human-readable-ids";
import {CardManager} from "../Cards/CardManager";
import * as http from "http";
import {Config} from "../../../../config/config";
import {ArrayUtils} from "../../../Utils/ArrayUtils";
import {RandomPlayerNicknames} from "./RandomPlayers";
import {logError, logMessage} from "../../../logger";
import {CardId, CardPackMap, ChatPayload, GameItem, IGameSettings, IPlayer, PlayerMap} from "./GameContract";
import deepEqual from "deep-equal";
import {UserUtils} from "../../User/UserUtils";
import {PackManager} from "../Cards/PackManager";
import cloneDeep from "clone-deep";
import {UserManager} from "../../User/UserManager";
import {RedisConnector} from "../../Redis/RedisClient";
import {PlayerManager} from "../Players/PlayerManager";
import {GameSockets} from "../../Sockets/GameSockets";
import {AuthCookie} from "../../Auth/AuthCookie";
import {IAuthContext} from "../../Auth/UserContract";
import {Request} from "express";
import {Game} from "./Game";

export let GameManager: _GameManager;

class _GameManager
{
	private redisPub: RedisConnector;
	private redisSub: RedisConnector;
	private gameSockets: GameSockets;

	// key = playerGuid, value = WS key
	private gameRoundTimers: { [gameId: string]: NodeJS.Timeout } = {};
	private gameCardTimers: { [gameId: string]: NodeJS.Timeout } = {};

	constructor(server: http.Server)
	{
		logMessage("Starting WebSocket Server");

		Database.initialize();

		const wsPort = Config.Environment === "local"
			? 8080
			: undefined;
		this.gameSockets = new GameSockets(server, wsPort);

		this.initializeRedis();
	}

	private static get games()
	{
		return Database.db.collection<GameItem>("games");
	}

	public static create(server: http.Server)
	{
		GameManager = new _GameManager(server);
	}

	public async getGame(gameId: string)
	{
		let existingGame: GameItem | null;
		try
		{
			existingGame = await _GameManager.games.findOne({
				id: gameId
			});
		}
		catch (e)
		{
			throw new Error("Could not find game.");
		}

		if (!existingGame)
		{
			throw new Error("Game not found: " + gameId);
		}

		if (existingGame.settings.roundTimeoutSeconds === undefined)
		{
			existingGame.settings.roundTimeoutSeconds = 60;
		}

		return existingGame;
	}

	/**
	 * Update a game in the DB
	 * @param {GameItem} newGame The updated game data
	 * @param {boolean} modifySuggestedRounds If true, we will update the suggested rounds to win (like if the player count changes or they turn on the Use Suggested setting)
	 * @param {boolean} triggerUpdate
	 * @returns {Promise<GameItem>}
	 */
	public async updateGame(newGame: GameItem, modifySuggestedRounds = false, triggerUpdate = false)
	{
		if (triggerUpdate)
		{
			newGame.dateUpdated = new Date();
		}

		newGame.settings.suggestedRoundsToWin = Game.calculateSuggestedRoundsToWin(newGame, modifySuggestedRounds);

		await Database.db.collection<GameItem>("games").updateOne({
			id: newGame.id
		}, {
			$set: newGame
		});

		this.updateRedisGame(newGame);

		return newGame;
	}

	public updateRedisChat(player: IPlayer, chatPayload: ChatPayload)
	{
		UserManager.validateUser(player);

		this.redisPub.client.publish("chat", JSON.stringify(chatPayload));
	}

	public async createGame(
		req: Request,
		authContext: IAuthContext,
		owner: IPlayer,
		nickname: string): Promise<GameItem>
	{
		UserManager.validateUser(owner);

		const ownerGuid = owner.guid;

		logMessage(`Creating game for ${ownerGuid}`);

		const gameId = hri.random();

		const isFamilyMode = req.body.isFamily;
		const packNames = PackManager.getPackNames(isFamilyMode ? "family" : "thirdParty");
		const defaultPacks = PackManager.getDefaultPacks(packNames);
		const myFaves = await PackManager.getMyFavoritePacks(req);
		const includedCustomPackIds = myFaves.packs
			.filter(p => !isFamilyMode || !p.isNsfw)
			.map(p => p.definition.pack.id);

		try
		{
			const now = new Date();

			const initialGameItem: GameItem = {
				id: gameId,
				roundIndex: 0,
				roundStarted: false,
				ownerGuid,
				lastTrueOwnerGuid: ownerGuid,
				chooserGuid: null,
				dateCreated: now,
				dateUpdated: now,
				players: {
					[ownerGuid]: PlayerManager.createPlayer(authContext, ownerGuid, nickname, false, false)
				},
				playerOrder: [],
				spectators: {},
				pendingPlayers: {},
				kickedPlayers: {},
				started: false,
				blackCard: {
					cardIndex: -1,
					packId: ""
				},
				roundCards: {},
				usedBlackCards: {},
				usedWhiteCards: {},
				revealIndex: -1,
				lastWinner: undefined,
				settings: {
					public: false,
					hideDuringReveal: false,
					skipReveal: false,
					suggestedRoundsToWin: 7,
					playerLimit: 50,
					inviteLink: null,
					includedPacks: defaultPacks,
					includedCustomPackIds,
					winnerBecomesCzar: false,
					allowCustoms: false,
					roundTimeoutSeconds: null,
					requireJoinApproval: true
				}
			};

			initialGameItem.settings.suggestedRoundsToWin = Game.calculateSuggestedRoundsToWin(initialGameItem, false);

			const insertedGame = await this.guaranteeNewGame(initialGameItem);

			const game = await this.getGame(insertedGame.id);

			logMessage(`Created game for ${ownerGuid}: ${game.id}`);

			this.gameSockets.updateGames(game);

			return game;
		}
		catch (e)
		{
			logError(e);

			throw new Error("Could not create game.");
		}
	}

	public async joinGame(authContext: IAuthContext, player: IPlayer, gameId: string, nickname: string, isSpectating: boolean, isRandom: boolean)
	{
		const playerGuid = player.guid;

		const existingGame = await this.getGame(gameId);

		UserManager.validateUser(player);

		if (Object.keys(existingGame.players).length >= existingGame.settings.playerLimit && !isSpectating)
		{
			throw new Error("This game is full.");
		}

		const newGame = {...existingGame};

		const playerToAdd = Game.readdOrCreatePlayer(newGame, playerGuid, nickname, () =>
		{
			return PlayerManager.createPlayer(authContext, playerGuid, escape(nickname), isSpectating, isRandom);
		});

		if (playerToAdd.isApproved === false)
		{
			throw new Error("The game owner denied your join request.");
		}

		Game.setPlayerIdle(newGame, playerGuid, false);
		Game.addPlayerToGame(newGame, playerToAdd, isSpectating);

		// If the game already started, deal in this new person
		if (newGame.started && !isSpectating && !newGame.started)
		{
			const newGameWithCards = await this.dealWhiteCards(newGame);
			newGame.players[playerGuid].whiteCards = newGameWithCards.players[playerGuid].whiteCards;
		}

		await this.updateGame(newGame, true);

		return newGame;
	}

	public async kickPlayer(gameId: string, targetGuid: string, owner: IPlayer, kickedForTimeout = false, overrideValidation = false)
	{
		const ownerGuid = owner.guid;

		const existingGame = await this.getGame(gameId);

		if (!overrideValidation)
		{
			UserManager.validateUser(owner);
		}

		if (existingGame.ownerGuid !== ownerGuid && targetGuid !== ownerGuid)
		{
			throw new Error("You don't have kick permission!",);
		}

		const newGame = {...existingGame};

		let canKickPlayer = false;

		const isKickScenario = !kickedForTimeout || (kickedForTimeout && newGame.started && newGame.settings.public);

		// Only kick people if the game is started
		if (newGame.kickedPlayers && isKickScenario)
		{
			const playerToKick = newGame.players[targetGuid] ?? newGame.pendingPlayers[targetGuid] ?? newGame.spectators[targetGuid];
			if (playerToKick)
			{
				playerToKick.kickedForTimeout = kickedForTimeout;
				newGame.kickedPlayers[targetGuid] = playerToKick;
				canKickPlayer = true;
			}
		}
		else
		{
			Game.setPlayerIdle(newGame, targetGuid, true);
		}

		if (canKickPlayer)
		{
			delete newGame.pendingPlayers[targetGuid];
			delete newGame.players[targetGuid];
			delete newGame.roundCards[targetGuid];
			delete newGame.spectators[targetGuid];
			newGame.playerOrder = ArrayUtils.shuffle(Object.keys(newGame.players));

			const nonRandoms = Object.keys(newGame.players).filter(pg => !newGame.players[pg].isRandom);
			const isOnlyRemainingPlayer = nonRandoms.length === 0;
			if (isOnlyRemainingPlayer && kickedForTimeout)
			{
				return;
			}

			// If the owner deletes themselves, pick a new owner
			if (targetGuid === ownerGuid)
			{
				if (!isOnlyRemainingPlayer)
				{
					newGame.ownerGuid = nonRandoms[0];
					if (!kickedForTimeout)
					{
						newGame.lastTrueOwnerGuid = newGame.ownerGuid;
					}
				}
				else if (kickedForTimeout)
				{
					// We don't want to kick, but we don't want to trigger an error either.
					return;
				}
				else
				{
					throw new Error("You can't leave the game if you're the only player");
				}
			}

			// If the owner deletes themselves, pick a new owner
			if (targetGuid === existingGame.chooserGuid)
			{
				newGame.chooserGuid = newGame.ownerGuid;
			}
		}

		await this.updateGame(newGame, true);

		return newGame;
	}

	public async nextRound(gameId: string, lastChooser: IPlayer)
	{
		UserManager.validateUser(lastChooser);

		const chooserGuid = lastChooser.guid;

		if (gameId in this.gameRoundTimers)
		{
			clearTimeout(this.gameRoundTimers[gameId]);
		}

		const existingGame = await this.getGame(gameId);

		if (existingGame.chooserGuid !== chooserGuid)
		{
			throw new Error("You are not the chooser!");
		}

		let newGame = {...existingGame};
		Game.setPlayerIdle(newGame, chooserGuid, false);

		// Reset white card reveal
		newGame.revealIndex = -1;

		newGame.roundStarted = false;

		// Iterate the round index
		newGame.roundIndex = existingGame.roundIndex + 1;

		const validPendingPlayers = cloneDeep(newGame.pendingPlayers);
		Object.keys(validPendingPlayers).forEach(pg =>
		{
			if (validPendingPlayers[pg].isApproved === false)
			{
				delete validPendingPlayers[pg];
			}
		});

		newGame.players = {...newGame.players, ...validPendingPlayers};
		newGame.pendingPlayers = {};
		const playerGuids = Object.keys(newGame.players);
		const nonRandomPlayerGuids = playerGuids.filter(pg => !newGame.players[pg].isRandom);

		// Grab a new chooser
		const chooserIndex = newGame.roundIndex % nonRandomPlayerGuids.length;
		newGame.chooserGuid = nonRandomPlayerGuids[chooserIndex];

		if (newGame.settings.winnerBecomesCzar && newGame.lastWinner && !newGame.lastWinner.isRandom)
		{
			newGame.chooserGuid = newGame.lastWinner.guid;
		}

		if (!newGame.chooserGuid)
		{
			newGame.chooserGuid = newGame.ownerGuid;
		}

		// Remove last winner
		newGame.lastWinner = undefined;

		// Remove the played white card from each player's hand
		newGame.players = playerGuids.reduce((acc, playerGuid) =>
		{
			const player = newGame.players[playerGuid];
			const newPlayer = {...player};
			const usedCards = newGame.roundCards[playerGuid] ?? [];
			newPlayer.whiteCards = player.whiteCards.filter(wc =>
				!usedCards.find(uc => deepEqual(uc, wc))
			);
			acc[playerGuid] = newPlayer;

			return acc;
		}, {} as PlayerMap);

		// Reset the played cards for the round
		newGame.roundCards = {};

		// Grab the new black card
		newGame = await this.gameDealNewBlackCard(newGame);

		// Deal a new hand
		newGame = await this.dealWhiteCards(newGame);

		const updatedPlayerCount = Object.keys(existingGame.players).length !== Object.keys(newGame.players).length;

		await this.updateGame(newGame, updatedPlayerCount, true);

		return newGame;
	}

	public async startGame(
		gameId: string,
		owner: IPlayer,
		settings: IGameSettings,
	)
	{
		const ownerGuid = owner.guid;

		const existingGame = await this.getGame(gameId);

		UserManager.validateUser(owner);

		if (existingGame.ownerGuid !== ownerGuid)
		{
			throw new Error("User cannot start game");
		}

		let newGame = {...existingGame};

		const playerGuids = Object.keys(existingGame.players);
		newGame.chooserGuid = playerGuids[0];
		newGame.started = true;
		newGame.settings = {...newGame.settings, ...settings};

		newGame = await this.gameDealNewBlackCard(newGame);
		newGame = await this.dealWhiteCards(newGame);

		await this.updateGame(newGame, false, true);

		return newGame;
	}

	public async updateSettings(
		gameId: string,
		owner: IPlayer,
		settings: Partial<IGameSettings>,
	)
	{
		UserManager.validateUser(owner);

		const ownerGuid = owner.guid;

		const existingGame = await this.getGame(gameId);

		if (existingGame.ownerGuid !== ownerGuid)
		{
			throw new Error("User cannot edit settings");
		}

		let newGame = {...existingGame};

		const didSetRoundsToWin = newGame.settings.roundsToWin !== settings.roundsToWin;

		newGame.settings = {...newGame.settings, ...settings};

		if (newGame.settings.playerLimit > 50)
		{
			throw new Error("Player limit cannot be greater than 50");
		}

		await this.updateGame(newGame, didSetRoundsToWin);

		return newGame;
	}

	public async restartGame(
		gameId: string,
		player: IPlayer
	)
	{
		const playerGuid = player.guid;

		const existingGame = await this.getGame(gameId);

		UserManager.validateUser(player);

		const newGame = {...existingGame};

		if (existingGame.ownerGuid !== playerGuid)
		{
			throw new Error("User cannot start game");
		}

		Object.keys(newGame.players).forEach(pg =>
		{
			newGame.players[pg].whiteCards = [];
			newGame.players[pg].wins = 0;
		});

		newGame.roundIndex = 0;
		newGame.revealIndex = -1;
		newGame.roundCards = {};
		newGame.roundStarted = false;
		newGame.started = false;
		newGame.blackCard = {
			cardIndex: -1,
			packId: ""
		};
		newGame.lastWinner = undefined;

		await this.updateGame(newGame, false, true);

		return newGame;
	}

	public async playCard(gameId: string, player: IPlayer, cardIds: CardId[], overrideValidation = false)
	{
		const playerGuid = player.guid;

		const existingGame = await this.getGame(gameId);
		if (!overrideValidation)
		{
			UserManager.validateUser(player);
		}

		const playerWhoPlayed = existingGame.players[playerGuid];
		const cardsAreInPlayerHand = cardIds.every(cid =>
			!!cid.customInput || playerWhoPlayed.whiteCards.find(
			wc => deepEqual(wc, cid)
			)
		);

		if (!cardsAreInPlayerHand)
		{
			throw new Error("You cannot play cards that aren't in your hand.");
		}

		const blackCardDef = await CardManager.getBlackCard(existingGame.blackCard);
		const targetPicked = blackCardDef.pick;
		if (targetPicked !== cardIds.length)
		{
			throw new Error("You submitted the wrong number of cards. Expected " + targetPicked + " but received " + cardIds.length);
		}

		const newGame = {...existingGame};
		if (!overrideValidation)
		{
			Game.setPlayerIdle(newGame, playerGuid, false);
		}

		newGame.roundCards[playerGuid] = cardIds;
		newGame.playerOrder = ArrayUtils.shuffle(Object.keys(newGame.players));

		await this.updateGame(newGame);

		return newGame;
	}

	public async myCardsSuck(gameId: string, player: IPlayer, playedCards: CardId[])
	{
		const playerGuid = player.guid;

		const existingGame = await this.getGame(gameId);

		UserManager.validateUser(player);

		const newGame = {...existingGame};

		// Get the cards they haven't played
		const unplayedCards = existingGame.players[playerGuid].whiteCards.filter(c =>
			!playedCards.find(pc => deepEqual(pc, c))
		);

		unplayedCards.forEach(cardId =>
		{
			newGame.usedWhiteCards[cardId.packId] = newGame.usedWhiteCards[cardId.packId] ?? {};
			newGame.usedWhiteCards[cardId.packId][cardId.cardIndex] = cardId;
		});

		// clear out the player's cards
		newGame.players[playerGuid].whiteCards = [];

		await this.updateGame(newGame, false, true);

		return newGame;
	}

	public async revealNext(gameId: string, player: IPlayer)
	{
		clearTimeout(this.gameCardTimers[gameId]);

		const existingGame = await this.getGame(gameId);

		UserManager.validateUser(player);

		if (existingGame.chooserGuid !== player.guid)
		{
			throw new Error("You are not the chooser!");
		}

		const newGame = {...existingGame};
		newGame.revealIndex = newGame.revealIndex + 1;
		if (newGame.settings.skipReveal)
		{
			newGame.revealIndex = Object.keys(newGame.roundCards).length;
		}

		Game.setPlayerIdle(newGame, player.guid, false);

		await this.updateGame(newGame, false, true);

		return newGame;
	}

	public async skipBlack(gameId: string, player: IPlayer)
	{
		const existingGame = await this.getGame(gameId);

		UserManager.validateUser(player);

		if (existingGame.chooserGuid !== player.guid)
		{
			throw new Error("You are not the chooser!");
		}

		const newGame = {...existingGame};
		Game.setPlayerIdle(newGame, player.guid, false);
		const newGameWithBlackCard = await this.gameDealNewBlackCard(newGame);

		await this.updateGame(newGameWithBlackCard);

		return newGame;
	}

	public async startRound(gameId: string, player: IPlayer)
	{
		const playerGuid = player.guid;

		const existingGame = await this.getGame(gameId);

		UserManager.validateUser(player);

		if (existingGame.chooserGuid !== playerGuid)
		{
			throw new Error("You are not the chooser!");
		}

		const newGame = {...existingGame};
		Game.setPlayerIdle(newGame, playerGuid, false);
		newGame.roundStarted = true;
		newGame.lastWinner = undefined;

		await this.updateGame(newGame, false, true);

		this.randomPlayersPlayCard(gameId);

		if (newGame.settings.roundTimeoutSeconds !== null)
		{
			this.gameCardTimers[gameId] = setTimeout(() =>
			{
				this.playCardsForSlowPlayers(gameId);
			}, (newGame.settings.roundTimeoutSeconds + 2) * 1000);
		}

		return newGame;
	}

	public async addRandomPlayer(gameId: string, owner: IPlayer)
	{
		UserManager.validateUser(owner);

		const ownerGuid = owner.guid;

		const existingGame = await this.getGame(gameId);

		if (existingGame.ownerGuid !== ownerGuid)
		{
			throw new Error("You are not the owner!");
		}

		let newGame = {...existingGame};

		const used = Object.keys(newGame.players).map(pg => newGame.players[pg].nickname);
		const [newNickname] = ArrayUtils.getRandomUnused(RandomPlayerNicknames, used);

		const userId = shortid.generate();
		const fakePlayer: IPlayer = {
			guid: userId,
			secret: UserUtils.generateSecret(userId)
		};

		newGame = await this.joinGame(AuthCookie.DefaultAuthContext, fakePlayer, gameId, newNickname, false, true);

		return newGame;
	}

	public async selectWinnerCard(gameId: string, player: IPlayer, winnerPlayerGuid: string)
	{
		const playerGuid = player.guid;

		const existingGame = await this.getGame(gameId);

		UserManager.validateUser(player);

		if (existingGame.chooserGuid !== playerGuid)
		{
			throw new Error("You are not the chooser!");
		}

		const newGame = {...existingGame};
		newGame.players[winnerPlayerGuid].wins = newGame.players[winnerPlayerGuid].wins + 1;
		newGame.lastWinner = newGame.players[winnerPlayerGuid];

		await this.updateGame(newGame, false, true);

		const settings = newGame.settings;
		const playerMap = newGame.players;
		const players = Object.values(newGame.players);
		const playerGuids = Object.keys(playerMap);
		const playerWinning = players.reduce((p, c) =>
		{
			return p.wins < c.wins
				? c
				: p;
		});

		const gameWinnerGuid = playerGuids.find(pg => (playerWinning?.wins ?? 0) >= (settings?.roundsToWin ?? 50));

		if (!gameWinnerGuid)
		{
			this.gameRoundTimers[gameId] = setTimeout(() =>
			{
				this.nextRound(gameId, player);
			}, 10000);
		}

		return newGame;
	}

	public async gameDealNewBlackCard(gameItem: GameItem)
	{
		const allowedCards: CardPackMap = {};
		const includedPacks = PackManager.getPacksForGame(gameItem);

		for (let packId of includedPacks)
		{
			const pack = await PackManager.getPack(packId);
			allowedCards[packId] = PackManager.definitionsToCardPack(packId, pack.black);
		}

		const newCard = CardManager.getAllowedCard(allowedCards, gameItem.usedBlackCards);

		const newGame = cloneDeep(gameItem);
		newGame.blackCard = newCard;
		newGame.usedBlackCards[newCard.packId] = newGame.usedBlackCards[newCard.packId] ?? {};
		newGame.usedBlackCards[newCard.packId][newCard.cardIndex] = newCard;

		return newGame;
	}

	public async dealWhiteCards(gameItem: GameItem)
	{
		const newGame = cloneDeep(gameItem);

		let usedWhiteCards: CardPackMap = {...gameItem.usedWhiteCards};

		const playerKeys = Object.keys(gameItem.players);

		const blackCardPack = await PackManager.getPack(gameItem.blackCard.packId);
		const blackCard = blackCardPack.black[gameItem.blackCard.cardIndex];
		const pick = blackCard.pick;

		// Assume the hand size is 10. If pick is more than 1, pick that many more.
		const targetHandSize = 10 + (pick - 1);

		let allWhiteCards = gameItem.settings.includedPacks.reduce((acc, packId) =>
		{
			const packCount = PackManager.packs[packId].white.length;
			acc += packCount;
			return acc;
		}, 0);

		if (gameItem.settings.includedCustomPackIds.length > 0)
		{
			for (let packId of gameItem.settings.includedCustomPackIds)
			{
				const pack = await PackManager.getPack(packId);
				const whiteCardsForPack = pack.white;
				allWhiteCards += whiteCardsForPack.length;
			}
		}

		const usedWhiteCardCount = Object.keys(usedWhiteCards).reduce((acc, packId) =>
		{
			acc += Object.keys(usedWhiteCards[packId]).length;
			return acc;
		}, 0);

		const availableCardRemainingCount = allWhiteCards - usedWhiteCardCount;
		const requiredCards = playerKeys.reduce((acc: number, pg) =>
		{
			const needed = targetHandSize - gameItem.players[pg].whiteCards.length;
			acc += needed;
			return acc;
		}, 0);
		const totalCardsRequired = playerKeys.length * targetHandSize;

		// If we run out of white cards, reset them
		if (availableCardRemainingCount < requiredCards)
		{
			usedWhiteCards = playerKeys.reduce((acc, pg) =>
			{
				const player = newGame.players[pg];
				player.whiteCards.forEach(wc => {
					acc[wc.packId] = acc[wc.packId] ?? {};
					acc[wc.packId][wc.cardIndex] = wc;
				});

				return acc;
			}, {} as CardPackMap);
		}

		if (allWhiteCards < requiredCards)
		{
			throw new Error(`Your packs only contain ${allWhiteCards} cards, but you need at least ${totalCardsRequired}`);
		}

		let allowedCards: CardPackMap = {};
		const includedPacks = PackManager.getPacksForGame(gameItem);
		for (let packId of includedPacks)
		{
			const pack = await PackManager.getPack(packId);
			allowedCards[packId] = pack.white.reduce((acc, cardVal, cardIndex) =>
			{
				acc[cardIndex] = {
					cardIndex,
					packId
				};

				return acc;
			}, {} as { [cardIndex: number]: CardId });
		}

		playerKeys.forEach(playerGuid =>
		{
			const cards = [...gameItem.players[playerGuid].whiteCards];

			while (cards.length < targetHandSize)
			{
				const newCard = CardManager.getAllowedCard(allowedCards, usedWhiteCards);
				usedWhiteCards[newCard.packId] = usedWhiteCards[newCard.packId] ?? {};
				usedWhiteCards[newCard.packId][newCard.cardIndex] = newCard;

				cards.push(newCard);
			}

			newGame.players[playerGuid].whiteCards = cards;
		});

		newGame.usedWhiteCards = usedWhiteCards;

		return newGame;
	}

	public async setPlayerApproval(gameId: string, targetGuid: string, owner: IPlayer, isApproved: boolean)
	{
		const existingGame = await this.getGame(gameId);

		UserManager.validateUser(owner);

		if (existingGame.ownerGuid !== owner.guid)
		{
			throw new Error("You don't have permission to perform this action!",);
		}

		const newGame = {...existingGame};

		const targetPlayer = newGame.pendingPlayers[targetGuid] ?? newGame.players[targetGuid] ?? newGame.spectators[targetGuid];
		if (!targetPlayer)
		{
			throw new Error("This player is no longer in this game");
		}

		targetPlayer.isApproved = isApproved;

		if(!newGame.started && targetGuid in newGame.pendingPlayers)
		{
			delete newGame.pendingPlayers[targetGuid];
			newGame.players[targetGuid] = targetPlayer;
		}

		if (isApproved)
		{
			await this.updateGame(newGame, false, true);
		}
		else
		{
			await this.kickPlayer(gameId, targetGuid, owner);
		}
	}

	private initializeRedis()
	{
		logMessage("Initializing Redis connections...");
		this.redisPub = RedisConnector.create();
		this.redisSub = RedisConnector.create();

		this.redisSub.client.on("message", async (channel, dataString) =>
		{
			switch (channel)
			{
				case "games":
					const gameItem = JSON.parse(dataString) as GameItem;

					this.gameSockets.updateGames(gameItem);
					break;

				case "chat":
					const chatPayload = JSON.parse(dataString) as ChatPayload;

					this.gameSockets.updateChats(chatPayload);
					break;
			}
		});

		this.redisSub.client.subscribe(`games`, `chat`);
	}

	private updateRedisGame(gameItem: GameItem)
	{
		this.redisPub.client.publish("games", JSON.stringify(gameItem));
	}

	private async guaranteeNewGame(initialGameItem: GameItem)
	{
		let returnedGame: GameItem = initialGameItem;
		try
		{
			await _GameManager.games.insertOne(initialGameItem);
		}
		catch (e)
		{
			if (e.code === 11000)
			{
				const game = {...initialGameItem};
				game.id = hri.random();
				returnedGame = game;
				await this.guaranteeNewGame(game);
			}
		}

		return returnedGame;
	}

	private async playCardsForSlowPlayers(gameId: string)
	{
		const existingGame = await this.getGame(gameId);
		const newGame = {...existingGame};

		const blackCardDef = await CardManager.getBlackCard(newGame.blackCard);
		const targetPicked = blackCardDef.pick;
		const allEligiblePlayerGuids = newGame.playerOrder.filter(pg => pg !== newGame.chooserGuid);
		const remaining = allEligiblePlayerGuids.filter(pg => !(pg in newGame.roundCards));

		for (let pg of remaining)
		{
			await this.playRandomCardForPlayer(newGame, pg, targetPicked);
		}
	}

	private randomPlayersPlayCard(gameId: string)
	{
		this.getGame(gameId)
			.then(async existingGame =>
			{
				const newGame = {...existingGame};
				const blackCardDef = await CardManager.getBlackCard(newGame.blackCard);
				const targetPicked = blackCardDef.pick;
				const randomPlayerGuids = Object.keys(newGame.players).filter(pg => newGame.players[pg].isRandom);

				for (let pg of randomPlayerGuids)
				{
					await this.playRandomCardForPlayer(newGame, pg, targetPicked);
				}
			});
	}

	private async playRandomCardForPlayer(game: GameItem, playerGuid: string, targetPicked: number)
	{
		const player = game.players[playerGuid];
		let cards: CardId[] = [];
		for (let i = 0; i < targetPicked; i++)
		{
			const [, newCards] = ArrayUtils.getRandomUnused(player.whiteCards, cards);
			cards = newCards;
		}

		await this.playCard(game.id, {
			secret: "",
			guid: player.guid
		}, cards, true);
	}
}

export const CreateGameManager = _GameManager.create;
