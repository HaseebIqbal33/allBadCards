import {DataStore} from "./DataStore";
import {GamePayload, IWhiteCard, Platform} from "../Platform/platform";
import {UserDataStore} from "./UserDataStore";
import deepEqual from "deep-equal";
import {CardId, ClientGameItem, IBlackCardDefinition, ICardPackSummary, ICustomCardPack, IGameClientSettings, IGameSettings, PackTypes} from "../Platform/Contract";
import {ErrorDataStore} from "./ErrorDataStore";
import {BrowserUtils} from "../Utils/BrowserUtils";
import {AudioUtils} from "../Utils/AudioUtils";
import {gamesOwnedLsKey} from "../../Areas/GameDashboard/GameDashboard";
import moment from "moment";
import {SocketDataStore} from "./SocketDataStore";
import {ChatDataStore} from "./ChatDataStore";
import {EnvDataStore} from "./EnvDataStore";
import {ArrayUtils} from "../Utils/ArrayUtils";

export type WhiteCardMap = {
	[packId: string]: {
		[cardIndex: number]: IWhiteCard
	}
};

export interface GameDataStorePayload
{
	/**
	 * This is used just to SET settings. Reading settings should be done using the `game` property
	 */
	ownerSettings: IGameClientSettings,
	loaded: boolean;
	game: GamePayload | null;
	loadedPacks: ICardPackSummary[];
	roundStartTime: moment.Moment;
	roundCardDefs: WhiteCardMap;
	playerCardDefs: WhiteCardMap;
	blackCardDef: IBlackCardDefinition | null;
	customPackDefs: { [key: string]: ICustomCardPack };
	customPacksLoading: boolean;
}

class _GameDataStore extends DataStore<GameDataStorePayload>
{
	private initialized = false;

	private static InitialState: GameDataStorePayload = {
		loaded: false,
		game: null,
		loadedPacks: [],
		roundCardDefs: {},
		playerCardDefs: {},
		blackCardDef: null,
		roundStartTime: moment(),
		customPackDefs: {},
		customPacksLoading: false,
		ownerSettings: {
			skipReveal: false,
			hideDuringReveal: false,
			includedCustomPackIds: [],
			includedPacks: [],
			inviteLink: null,
			playerLimit: 50,
			public: false,
			winnerBecomesCzar: false,
			roundTimeoutSeconds: null,
			allowCustoms: false,
			requireJoinApproval: true
		},
	};

	public static Instance = new _GameDataStore(_GameDataStore.InitialState);

	public initialize()
	{
		if (this.initialized)
		{
			return;
		}

		this.initialized = true;

		SocketDataStore.listen(data =>
		{
			if (data.updateType === "game" && data.gamePayload)
			{
				if (!this.state.game?.id || data.gamePayload?.id === this.state.game?.id)
				{
					this.update({
						game: data.gamePayload
					});
				}
			}
		});
	}

	public getDefaultPacks(packs: ICardPackSummary[])
	{
		const officialDefaults = packs.filter(a =>
			!a.packId.match(/pax|conversion|gencon|mass_effect|midterm|house_of_cards|jack_white|hawaii|desert_bus|reject|geek/gi)
			&& a.isOfficial
		);

		const thirdPartyDefaults = packs.filter(a =>
			!a.isOfficial
			&& !a.packId.match(/toronto|knit|colorado|kentucky|texas|hombres|corps|insanity/gi)
		);

		return [...officialDefaults, ...thirdPartyDefaults].map(p => p.packId);
	}

	public storeOwnedGames(game: ClientGameItem)
	{
		const gamesOwnedString = localStorage.getItem(gamesOwnedLsKey) ?? "[]";
		const gamesOwned = JSON.parse(gamesOwnedString) as string[];
		gamesOwned.push(game.id);
		localStorage.setItem(gamesOwnedLsKey, JSON.stringify(gamesOwned));
	}

	public clear()
	{
		this.update(_GameDataStore.InitialState);
	}


	protected update(data: Partial<GameDataStorePayload>)
	{
		let prev = {...this.state};

		super.update(data);

		console.groupCollapsed("[GameDataStore] Update...");
		console.log("New: ", data);
		console.log("Prev: ", prev);
		console.log("Result:", this.state);
		console.groupEnd();

		const meGuid = UserDataStore.state.playerGuid;

		const prevBuildVersion = prev.game?.buildVersion;
		const newBuildVersion = this.state.game?.buildVersion;
		if (prevBuildVersion && newBuildVersion && prevBuildVersion !== newBuildVersion)
		{
			location.href = location.href + "";
		}

		if (this.state.ownerSettings
			&& this.state.game
			&& this.state.loaded
			&& prev.loaded
			&& !deepEqual(prev.ownerSettings, this.state.ownerSettings)
			&& this.state.game.ownerGuid === UserDataStore.state.playerGuid)
		{
			Platform.updateSettings(
				this.state.game.ownerGuid,
				this.state.game.id,
				this.state.ownerSettings)
				.catch(ErrorDataStore.add);
		}

		const newCustomPacks = this.state.ownerSettings.includedCustomPackIds.filter(p => !prev.ownerSettings?.includedCustomPackIds.includes(p));

		if (newCustomPacks.length > 0)
		{
			this.update({
				customPacksLoading: true
			});
		}

		let loaded = 0;
		newCustomPacks.forEach(pack =>
		{
			Platform.getPack(pack)
				.then(packData =>
				{
					this.update({
						customPackDefs: {
							...this.state.customPackDefs,
							[pack]: packData
						}
					});
				})
				.finally(() =>
				{
					loaded++;
					if (loaded === newCustomPacks.length)
					{
						this.update({
							customPacksLoading: false
						});
					}
				});
		});

		if (!deepEqual(prev.game?.roundCards, this.state.game?.roundCards))
		{
			this.loadRoundCards();
		}

		const iAmAPlayer = meGuid in (this.state.game?.players ?? {});
		if (iAmAPlayer && !deepEqual(prev.game?.players[meGuid], this.state.game?.players[meGuid]))
		{
			this.loadPlayerCards(meGuid);
		}

		if (!deepEqual(prev.game?.blackCard, this.state.game?.blackCard))
		{
			this.loadBlackCard();
		}

		if (!prev.game?.roundStarted && this.state.game?.roundStarted)
		{
			this.update({
				roundStartTime: moment()
			});
		}

		const becameCzar = prev.game?.chooserGuid !== meGuid && this.state.game?.chooserGuid === meGuid;
		if (becameCzar)
		{
			AudioUtils.multiTone(3);
		}
	}

	private loadRoundCards()
	{
		const toLoad = this.state.game?.roundCards ?? [];

		const cardIds = ArrayUtils.flatten<CardId>(Object.values(toLoad)).filter(card => !card.customInput);

		return this.loadWhiteCardMap(cardIds)
			.then(roundCardDefs => this.update({
				roundCardDefs
			}));
	}

	private loadPlayerCards(playerGuid: string)
	{
		const toLoad = this.state.game?.players[playerGuid].whiteCards;
		if (!toLoad)
		{
			return;
		}

		const cardIds = Object.values(toLoad);

		return this.loadWhiteCardMap(cardIds)
			.then(playerCardDefs => this.update({
				playerCardDefs
			}));
	}

	private loadBlackCard()
	{
		const blackCard = this.state.game?.blackCard;
		if ((!blackCard || blackCard.cardIndex === -1) && blackCard?.cardIndex !== 0)
		{
			return Promise.resolve();
		}

		return Platform.getBlackCard(blackCard)
			.then(blackCardDef => this.update({
				blackCardDef
			}));
	}

	private async loadWhiteCardMap(cardIds: CardId[]): Promise<WhiteCardMap>
	{
		const data = await Platform.getWhiteCards(cardIds);

		let map: WhiteCardMap = {};
		data.forEach((cardDef, index) =>
		{
			const cardId = cardIds[index];
			if (!(cardId.packId in map))
			{
				map[cardId.packId] = {};
			}

			map[cardId.packId][cardId.cardIndex] = cardDef;
		});

		console.log(map);

		return map;
	}

	public hydrate(gameId: string)
	{
		this.update({
			loaded: false
		});

		console.log("[GameDataStore] Hydrating...", gameId);

		return Platform.getGame(gameId)
			.then(data =>
			{
				this.update({
					loaded: true,
					game: data as GamePayload,
					ownerSettings: data.settings
				});

				SocketDataStore.initialize();

				ChatDataStore.clear();
				ChatDataStore.initialize();

				this.initialize();

				if (this.state.loadedPacks.length === 0)
				{
					const envSite = EnvDataStore.state.site;
					let packs: PackTypes = "thirdParty";
					if (envSite.family)
					{
						packs = "family";
					}

					Platform.getPacks(packs)
						.then(data =>
						{
							this.update({
								loadedPacks: data
							});
						});
				}
			})
			.catch(e =>
			{
				this.update({
					loaded: true,
				});
				console.error(e);
			});
	}

	public playWhiteCards(cardIds: CardId[] | undefined, userGuid: string)
	{
		BrowserUtils.scrollToTop();

		console.log("[GameDataStore] Played white cards...", cardIds, userGuid);

		if (!this.state.game || !cardIds)
		{
			throw new Error("Invalid card or game!");
		}

		return Platform.playCards(this.state.game.id, userGuid, cardIds)
			.catch(e => console.error(e));
	}

	public chooseWinner(chooserGuid: string, winningPlayerGuid: string)
	{
		BrowserUtils.scrollToTop();

		if (!this.state.game || !chooserGuid)
		{
			throw new Error("Invalid card or game!");
		}

		return Platform.selectWinnerCard(this.state.game.id, chooserGuid, winningPlayerGuid)
			.catch(e => console.error(e));
	}

	public revealNext(userGuid: string)
	{
		if (!this.state.game)
		{
			throw new Error("Invalid card or game!");
		}

		return Platform.revealNext(this.state.game.id, userGuid)
			.catch(e => console.error(e));
	}

	public skipBlack(userGuid: string)
	{
		if (!this.state.game)
		{
			throw new Error("Invalid card or game!");
		}

		return Platform.skipBlack(this.state.game.id, userGuid)
			.catch(e => console.error(e));
	}

	public startRound(userGuid: string)
	{
		BrowserUtils.scrollToTop();

		if (!this.state.game)
		{
			throw new Error("Invalid card or game!");
		}

		return Platform.startRound(this.state.game.id, userGuid)
			.catch(e => console.error(e));
	}

	public addRandomPlayer(userGuid: string)
	{
		if (!this.state.game)
		{
			throw new Error("Invalid card or game!");
		}

		return Platform.addRandomPlayer(this.state.game.id, userGuid)
			.catch(e => console.error(e));
	}

	public setIncludedPacks(includedPacks: string[])
	{
		this.setSetting({
			includedPacks
		});
	}

	public setIncludeCustomPacks(includedCustomPackIds: string[])
	{
		this.setSetting({
			includedCustomPackIds
		});
	}

	public setRequiredRounds(rounds: number | undefined)
	{
		this.setSetting({
			roundsToWin: rounds
		});
	}

	public setPlayerLimit(limit: number)
	{
		this.setSetting({
			playerLimit: limit
		});
	}

	public setRoundTimeout(seconds: number | null)
	{
		this.setSetting({
			roundTimeoutSeconds: seconds
		});
	}

	public setHideDuringReveal(hideDuringReveal: boolean)
	{
		this.setSetting({
			hideDuringReveal
		});
	}

	public setWinnerBecomesCzar(winnerBecomesCzar: boolean)
	{
		this.setSetting({
			winnerBecomesCzar
		});
	}

	public setGamePublic(isPublic: boolean)
	{
		this.setSetting({
			public: isPublic
		});
	}

	public setRequireJoinApproval(requireJoinApproval: boolean)
	{
		this.setSetting({
			requireJoinApproval
		});
	}

	public setSkipReveal(skipReveal: boolean)
	{
		this.setSetting({
			skipReveal
		});
	}

	public setInviteLink(inviteLink: string)
	{
		this.setSetting({
			inviteLink
		});
	}

	public setAllowCustoms(allowCustoms: boolean)
	{
		this.setSetting({
			allowCustoms
		});
	}

	private setSetting(partial: Partial<IGameSettings>)
	{
		this.update({
			ownerSettings: {
				...this.state.ownerSettings,
				...partial
			}
		});
	}

	public restart(playerGuid: string)
	{
		this.update({
			loaded: false
		});

		const game = this.state.game;
		if (!game)
		{
			throw new Error("Invalid card or game!");
		}

		return Platform.restart(game.id, playerGuid).then(() =>
		{
			this.update({
				loaded: true
			});
		});
	}

	public forfeit(playerGuid: string, cardsNeeded: number)
	{
		const game = this.state.game;
		if (!game)
		{
			throw new Error("Invalid card or game!");
		}

		const toPlay: CardId[] = [];
		const myCards = game.players[playerGuid].whiteCards;
		while (toPlay.length < cardsNeeded)
		{
			let cardIndex = Math.floor(Math.random() * myCards.length);
			const card = myCards[cardIndex];
			if (!toPlay.find(a => deepEqual(card, a)))
			{
				toPlay.push(card);
			}
		}

		BrowserUtils.scrollToTop();

		return this.playWhiteCards(toPlay, playerGuid)
			.then(() =>
			{
				Platform.forfeit(game.id, playerGuid, toPlay);
			});
	}
}

export const GameDataStore = _GameDataStore.Instance;