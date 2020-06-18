import ReactGA from "react-ga";
import {CardId, ClientGameItem, GamesList, IBlackCardDefinition, ICardPackDefinition, ICardPackSummary, IClientAuthStatus, ICustomCardPack, ICustomPackDataInput, ICustomPackSearchResult, IGameClientSettings, IGameSettings, PackSearch} from "./Contract";
import {Fetcher} from "./Fetcher";
import {EnvDataStore} from "@Global/DataStore/EnvDataStore";

export interface GamePayload extends ClientGameItem, WithBuildVersion
{
}

export interface WithBuildVersion
{
	buildVersion: number;
}

export type IWhiteCard = string;

class _Platform
{
	public static Instance = new _Platform();

	private loadedWhiteCards: { [packId: string]: IWhiteCard[] } = {};

	public trackEvent(action: string, label?: string, value?: number)
	{
		ReactGA.event({
			action,
			category: "Game",
			label,
			value
		});
	}

	public async getGame(gameId: string)
	{
		return Fetcher.doGet<ClientGameItem>(`/api/game/get?gameId=${gameId}`);
	}

	public async createGame(guid: string, nickname: string)
	{
		this.trackEvent("create");

		return Fetcher.doPost<ClientGameItem>("/api/game/create", {
			guid,
			nickname,
			isFamily: EnvDataStore.state.site.family
		});
	}

	public async sendChat(guid: string, gameId: string, message: string)
	{
		this.trackEvent("chat-message", gameId);

		return Fetcher.doPost(`/api/game/send-chat`, {
			gameId: gameId,
			message: message,
			playerGuid: guid
		})
	}

	public async joinGame(guid: string, gameId: string, nickname: string, isSpectating = false)
	{
		this.trackEvent("join", gameId);

		return Fetcher.doPost<ClientGameItem>("/api/game/join", {
			guid,
			gameId,
			nickname,
			isSpectating
		});
	}

	public async removePlayer(gameId: string, targetGuid: string, guid: string)
	{
		this.trackEvent("remove-player", gameId);

		return Fetcher.doPost<ClientGameItem>("/api/game/kick", {
			gameId,
			targetGuid,
			guid
		});
	}

	public async startGame(
		guid: string,
		gameId: string,
		settings: IGameSettings)
	{
		this.trackEvent("start", gameId);

		return Fetcher.doPost<ClientGameItem>("/api/game/start", {
			gameId,
			guid,
			settings
		});
	}

	public async updateSettings(
		guid: string,
		gameId: string,
		settings: IGameClientSettings)
	{
		this.trackEvent("start", gameId);

		return Fetcher.doPost<ClientGameItem>("/api/game/update-settings", {
			gameId,
			guid,
			settings
		});
	}

	public async playCards(gameId: string, guid: string, cardIds: CardId[])
	{
		this.trackEvent("play-cards", gameId);

		return Fetcher.doPost<ClientGameItem>("/api/game/play-cards", {
			gameId,
			guid,
			cardIds
		});
	}

	public async forfeit(gameId: string, guid: string, playedCards: CardId[])
	{
		this.trackEvent("my-cards-suck", gameId);

		return Fetcher.doPost<ClientGameItem>("/api/game/forfeit", {
			gameId,
			guid,
			playedCards
		});
	}

	public async restart(gameId: string, guid: string)
	{
		this.trackEvent("game-restart", gameId);

		return Fetcher.doPost<ClientGameItem>("/api/game/restart", {
			gameId,
			guid,
		});
	}

	public async selectWinnerCard(gameId: string, guid: string, winningPlayerGuid: string)
	{
		this.trackEvent("selected-winner", gameId);

		return Fetcher.doPost<ClientGameItem>("/api/game/select-winner-card", {
			gameId,
			guid,
			winningPlayerGuid
		});
	}

	public async revealNext(gameId: string, guid: string)
	{
		return Fetcher.doPost<ClientGameItem>("/api/game/reveal-next", {
			gameId,
			guid,
		});
	}

	public async startRound(gameId: string, guid: string)
	{
		this.trackEvent("round-start", gameId);

		return Fetcher.doPost<ClientGameItem>("/api/game/start-round", {
			gameId,
			guid,
		});
	}

	public async addRandomPlayer(gameId: string, guid: string)
	{
		this.trackEvent("round-start", gameId);

		return Fetcher.doPost<ClientGameItem>("/api/game/add-random-player", {
			gameId,
			guid,
		});
	}

	public async nextRound(gameId: string, guid: string)
	{
		return Fetcher.doPost<ClientGameItem>("/api/game/next-round", {
			gameId,
			guid,
		});
	}

	public async skipBlack(gameId: string, guid: string)
	{
		return Fetcher.doPost<ClientGameItem>("/api/game/skip-black", {
			gameId,
			guid,
		});
	}

	public async getWhiteCard(cardId: CardId)
	{
		const {
			cardIndex,
			packId
		} = cardId;

		return new Promise<IWhiteCard>((resolve, reject) =>
		{
			if (packId in this.loadedWhiteCards && this.loadedWhiteCards[packId].length > cardIndex)
			{
				resolve(this.loadedWhiteCards[packId][cardIndex]);
			}
			else
			{
				Fetcher.doGet<{ card: IWhiteCard }>(`/api/game/get-white-card?packId=${packId}&cardIndex=${cardIndex}`)
					.then(data =>
					{
						if (!data)
						{
							reject("Card not found");
						}

						const card = data.card;
						this.loadedWhiteCards[packId] = this.loadedWhiteCards[packId] ?? {};
						this.loadedWhiteCards[packId][cardIndex] = card;
						resolve(card);
					})
					.catch(e => reject(e));
			}
		})
	}

	public async getBlackCard(cardId: CardId)
	{
		return Fetcher.doGet<IBlackCardDefinition>(`/api/game/get-black-card?packId=${cardId.packId}&cardIndex=${cardId.cardIndex}`);
	}

	public async getWhiteCards(cards: CardId[])
	{
		const promises = cards.map(cardId => this.getWhiteCard(cardId));

		return Promise.all(promises);
	}

	public async getPacks(type: "all" | "official" | "thirdParty" | "family" = "all")
	{
		return Fetcher.doGet<ICardPackSummary[]>("/api/game/get-packnames?type=" + type);
	}

	public async getGames(zeroBasedPage = 0)
	{
		return Fetcher.doGet<GamesList>(`/api/games/public?zeroBasedPage=${zeroBasedPage}`);
	}

	public async getCardCastPackCached(deckId: string)
	{
		this.trackEvent("cardcast-cached", deckId);

		return Fetcher.doGet<{packs: ICardPackDefinition[]}>(`/api/cardcast-pack-export?input=${deckId}`);
	}

	public registerUser()
	{
		this.trackEvent("register-user");

		return Fetcher.doGet<{ guid: string }>(`/api/user/register`);
	}

	public getAuthStatus()
	{
		this.trackEvent("auth-status");

		return Fetcher.doGet<{status: IClientAuthStatus}>("/auth/status")
	}

	public logOut()
	{
		return Fetcher.doGet("/auth/logout");
	}

	public getPack(packId: string, bustCache = false)
	{
		const append = bustCache ? Date.now() : "";
		return Fetcher.doGet<ICustomCardPack>(`/api/pack/get?pack=${packId}&${append}`);
	}

	public getMyPacks()
	{
		this.trackEvent("get-my-packs");

		return Fetcher.doGet<{result: ICustomPackSearchResult}>(`/api/packs/mine`);
	}

	public searchPacks(input: PackSearch, zeroBasedPage = 0)
	{
		this.trackEvent("pack-search");

		const search = input.search ? `&search=${encodeURIComponent(input.search)}` : "";
		const category = input.category ? `&category=${encodeURIComponent(input.category as string)}` : "";
		const sort = input.sort ? `&sort=${encodeURIComponent(input.sort)}` : "";
		return Fetcher.doGet<{result: ICustomPackSearchResult}>(`/api/packs/search?zeroBasedPage=${zeroBasedPage}&nsfw=${!!input.nsfw}${search}${category}${sort}`);
	}

	public getMyFavoritePacks()
	{
		return Fetcher.doGet<{result: ICustomPackSearchResult}>(`/api/packs/myfaves`);
	}

	public savePack(packData: ICustomPackDataInput)
	{
		this.trackEvent("pack-edit-or-create");

		return Fetcher.doPost<ICustomCardPack>("/api/pack/update", {
			pack: packData
		});
	}

	public favoritePack(packId: string)
	{
		this.trackEvent("pack-favorite");

		return Fetcher.doPost<ICustomCardPack>("/api/pack/favorite", {
			packId
		});
	}

	public unfavoritePack(packId: string)
	{
		this.trackEvent("pack-unfavorite");

		return Fetcher.doPost<ICustomCardPack>("/api/pack/unfavorite", {
			packId
		});
	}

	public setPlayerApproval(gameId: string, targetGuid: string, approved: boolean)
	{
		return Fetcher.doPost("/api/game/player-approval", {
			gameId,
			targetGuid,
			approved
		});
	}
}

export const Platform = _Platform.Instance;