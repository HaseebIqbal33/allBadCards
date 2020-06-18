import {CardPack, GameItem, ICardPackDefinition, ICardPackSummary, ICardTypes, ICustomCardPack, ICustomPackDataInput, ICustomPackSearchResult, PackFavorites} from "../Game/GameContract";
import {loadFileAsJson} from "../../../Utils/FileUtils";
import {Database} from "../../../DB/Database";
import {packInputToPackDef} from "../../../Utils/PackUtils";
import {AuthCookie} from "../../Auth/AuthCookie";
import {Request} from "express";
import {FilterQuery} from "mongodb";

class _PackManager
{
	public static Instance = new _PackManager();

	public packTypeDefinition: ICardTypes;
	public packs: { [key: string]: ICardPackDefinition } = {};

	constructor()
	{
		this.initialize();
	}

	private initialize()
	{
		this.packTypeDefinition = loadFileAsJson<ICardTypes>("./server/data/types.json");

		this.packTypeDefinition.types.forEach(type =>
		{
			type.packs.forEach(packForType =>
			{
				this.packs[packForType] = loadFileAsJson<ICardPackDefinition>(`./server/data/${type.id}/packs/${packForType}.json`);
			});
		});
	}

	public async getPack(packId: string)
	{
		let pack: ICardPackDefinition | null = null;

		const isCustom = !(packId in PackManager.packs);
		if (isCustom)
		{
			const foundPack = await this.getCustomPack(packId);
			if (foundPack)
			{
				pack = foundPack.definition;
			}
		}
		else
		{
			pack = PackManager.packs[packId];
		}

		if (!pack)
		{
			throw new Error(`Could not find pack with ID '${packId}'`);
		}

		return pack;
	}

	public getPacksForGame(gameItem: GameItem)
	{
		return [...gameItem.settings.includedPacks, ...gameItem.settings.includedCustomPackIds];
	}

	public definitionsToCardPack<T>(packId: string, defs: T[])
	{
		return defs.reduce((acc, cardVal, cardIndex) =>
		{
			acc[cardIndex] = {
				cardIndex,
				packId
			};

			return acc;
		}, {} as CardPack);
	}

	public async getCustomPack(packId: string)
	{
		return await Database.collections.packs.findOne({
			["definition.pack.id"]: packId
		});
	}

	public async upsertPack(req: Request, packInput: ICustomPackDataInput)
	{
		const storedUserData = AuthCookie.get(req);
		if (!storedUserData || !storedUserData.userId)
		{
			throw new Error("Not logged in!");
		}

		let existingPack: ICustomCardPack | null = null;
		if (packInput.id)
		{
			existingPack = await this.getCustomPack(packInput.id);

			if (existingPack && storedUserData.userId !== existingPack.owner)
			{
				throw new Error("You don't have permission to update this pack");
			}
		}

		const packDefFromInput = packInputToPackDef(packInput);

		const now = new Date();
		const toSave: ICustomCardPack = {
			packId: packDefFromInput.pack.id,
			owner: storedUserData.userId,
			definition: packDefFromInput,
			dateCreated: existingPack?.dateCreated ?? now,
			dateUpdated: now,
			isNsfw: packInput.isNsfw,
			isPublic: packInput.isPublic,
			categories: packInput.categories,
			favorites: existingPack?.favorites ?? 0
		};

		await Database.collections.packs.updateOne({
			id: toSave.packId
		}, {
			$set: toSave
		}, {
			upsert: true
		});

		return toSave;
	}

	public async getPacks(req: Request, query: FilterQuery<ICustomCardPack>, sort: string = "newest", zeroBasedPage: number = 0, fetchAll = false): Promise<ICustomPackSearchResult>
	{
		let packsPromise = Database.collections.packs
			.find(query);

		switch (sort)
		{
			case "favorites":
				packsPromise = packsPromise.sort({
					favorites: -1
				});
				break;
			case "newest":
				packsPromise = packsPromise.sort({dateUpdated: -1});
				break;
			case "largest":
				packsPromise = packsPromise.sort({
					"definition.quantity.total": -1
				});
				break;
			default:
				break;
		}

		if (!fetchAll)
		{
			packsPromise = packsPromise
				.skip(12 * zeroBasedPage)
				.limit(12);
		}

		const packs = await packsPromise.toArray();

		const storedUserData = AuthCookie.get(req);
		let userFavorites: PackFavorites = {};
		if (storedUserData?.userId)
		{
			const packIds = packs.map(p => p.packId);

			const favorites = await Database.collections.packFavorites.find({
				userId: storedUserData.userId,
				packId: {
					$in: packIds
				}
			}).toArray();

			userFavorites = favorites.reduce((acc, item) =>
			{
				acc[item.packId] = true;
				return acc;
			}, {} as PackFavorites);
		}

		return {
			packs,
			hasMore: packs.length === 12,
			userFavorites
		};
	}

	public async getMyFavoritePacks(req: Request): Promise<ICustomPackSearchResult>
	{
		const storedUserData = AuthCookie.get(req);
		if (!storedUserData?.userId)
		{
			return {
				packs: [],
				userFavorites: {},
				hasMore: false
			};
		}

		const userFavorites = await Database.collections.packFavorites.find({
			userId: storedUserData.userId
		}).toArray();

		return await this.getPacks(req, {
			packId: {
				$in: userFavorites.map(fav => fav.packId)
			}
		}, "favorites", undefined, true);
	}

	public async getPacksForOwner(req: Request)
	{
		const storedUserData = AuthCookie.get(req);

		const owner = storedUserData?.userId;
		if (!owner)
		{
			throw new Error("You must be logged in to get your packs");
		}

		return this.getPacks(req, {
			owner
		});
	}

	public async addFavorite(req: Request, packId: string)
	{
		const storedUserData = AuthCookie.get(req);
		if (!storedUserData || !storedUserData.userId)
		{
			throw new Error("Not logged in!");
		}

		const result = await Database.collections.packFavorites
			.updateOne({
				packId,
				userId: storedUserData.userId
			}, {
				$set: {
					packId,
					userId: storedUserData.userId
				}
			}, {
				upsert: true
			});

		const result2 = await Database.collections.packs.updateOne({
			packId
		}, {
			$inc: {
				favorites: 1
			}
		});

		if (result.upsertedCount < 1)
		{
			throw new Error("This item is already favorited!")
		}

		return;
	}

	public async removeFavorite(req: Request, packId: string)
	{
		const storedUserData = AuthCookie.get(req);
		if (!storedUserData || !storedUserData.userId)
		{
			throw new Error("Not logged in!");
		}

		const result = await Database.collections.packFavorites.deleteOne({
			packId,
			userId: storedUserData.userId
		});

		await Database.collections.packs.updateOne({
			packId
		}, {
			$inc: {
				favorites: -1
			}
		});

		if (result.deletedCount && result.deletedCount < 1)
		{
			throw new Error("This item was not favorited!")
		}

		return;
	}

	public getPackNames(which: "all" | "official" | "thirdParty" | "family" = "all")
	{
		let packIds: string[];
		switch (which)
		{
			case "all":
				packIds = PackManager.packTypeDefinition.types.reduce((acc, type) =>
				{
					acc.push(...type.packs);
					return acc;
				}, [] as string[]);
				break;
			case "official":
				packIds = PackManager.packTypeDefinition.types[0].packs;
				break;
			case "thirdParty":
				packIds = PackManager.packTypeDefinition.types[1].packs;
				break;
			case "family":
				packIds = ["family_edition"];
				break;
			default:
				throw new Error("No pack type " + which + " exists!");
		}

		const packs = packIds.map(packId =>
		{
			const packDef = PackManager.packs[packId];
			return {
				name: packDef.pack.name,
				quantity: packDef.quantity,
				isOfficial: PackManager.packTypeDefinition.types[0].packs.includes(packId),
				packId
			} as ICardPackSummary
		});

		return packs;
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
}

export const PackManager = new _PackManager();