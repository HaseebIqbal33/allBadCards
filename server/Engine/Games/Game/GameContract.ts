export type PlayerMap = { [key: string]: GamePlayer };
export type CardPack = { [cardIndex: number]: CardId };
export type CardPackMap = { [packId: string]: CardPack };

export type ValuesOf<T> = T[keyof T]

export interface IPlayer
{
	guid: string;
	secret: string;
}

export interface GamePlayer
{
	guid: string;
	nickname: string;
	wins: number;
	whiteCards: CardId[];
	isSpectating: boolean;
	isRandom: boolean;
	isSubscriber?: boolean;
	levels?: string[];
	kickedForTimeout?: boolean;
	isIdle?: boolean;
	isApproved: boolean | null;
}

export interface CardId
{
	packId: string;
	cardIndex: number;
	customInput?: string;
}

export interface IGameSettings
{
	public: boolean;
	hideDuringReveal: boolean;
	skipReveal: boolean;
	playerLimit: number;
	suggestedRoundsToWin?: number;
	roundsToWin?: number;
	inviteLink: string | null;
	includedPacks: string[];
	includedCustomPackIds: string[];
	winnerBecomesCzar: boolean;
	roundTimeoutSeconds: number | null;
	allowCustoms: boolean;
	requireJoinApproval?: boolean;
}

export interface GameItem extends ClientGameItem
{
	dateUpdated: Date;
	usedBlackCards: CardPackMap;
	usedWhiteCards: CardPackMap;
	lastTrueOwnerGuid: string;
}

export interface ClientGameItem
{
	dateCreated: Date;
	id: string;
	roundIndex: number;
	roundStarted: boolean;
	ownerGuid: string;
	chooserGuid: string | null;
	started: boolean;
	players: PlayerMap;
	spectators: PlayerMap;
	pendingPlayers: PlayerMap;
	kickedPlayers: PlayerMap;
	blackCard: CardId;
	// key = player guid, value = white card ID
	roundCards: { [playerGuid: string]: CardId[] };
	playerOrder: string[];
	revealIndex: number;
	lastWinner: GamePlayer | undefined;
	settings: IGameSettings;
}

export interface GamePayload extends Partial<ClientGameItem>
{
	buildVersion: number;
}

export interface ChatPayload
{
	message: string;
	playerGuid: string;
	gameId: string;
}

export interface ICardTypes
{
	types: ICardType[];
}

export type CardTypeId = "official" | "thirdparty";

export interface ICardType
{
	id: CardTypeId;
	name: string;
	packs: string[];
	quantity: number;
}

export interface ICardPackQuantity
{
	black: number;
	white: number;
	total: number;
}

export interface ICardPackTypeDefinition
{
	packs: ICardPackSummary[];
}

export interface ICardPackSummary
{
	name: string;
	packId: string;
	isOfficial: boolean;
	quantity: ICardPackQuantity;
}

export interface ICardPackDefinition
{
	pack: {
		name: string;
		id: string;
	};
	quantity: ICardPackQuantity;
	black: IBlackCardDefinition[];
	white: string[];
	dateStoredMs?: number;
}

export interface ICustomCardPack
{
	packId: string;
	owner: string;
	definition: ICardPackDefinition;
	dateCreated: Date;
	dateUpdated: Date;
	isNsfw: boolean,
	isPublic: boolean;
	categories: ValuesOf<typeof PackCategories>[];
	favorites: number | undefined;
}

export interface IBlackCardDefinition
{
	content: string;
	pick: number;
	draw: number;
}

export interface ICustomPackDataInput
{
	id: string | null;
	packName: string,
	whiteCards: string[],
	blackCards: string[],
	isNsfw: boolean,
	isPublic: boolean
	categories: ValuesOf<typeof PackCategories>[];
}

export interface IUserPackFavorite
{
	packId: string;
	userId: string;
}

export interface ICustomPackSearchResult
{
	packs: ICustomCardPack[];
	hasMore: boolean;
	userFavorites: PackFavorites;
}

export type PackFavorites = { [packId: string]: boolean };

export const PackCategories = [
	"General",
	"Insulting",
	"Movies, Music, & TV",
	"Family-Friendly",
	"Business",
	"Events & Holidays",
	"News & Politics",
	"Places & Things",
	"Hobbies & Activities",
	"Languages"
] as const;