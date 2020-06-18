import {DataStore} from "./DataStore";
import {Platform} from "../Platform/platform";
import {ErrorDataStore} from "./ErrorDataStore";
import {ICustomCardPack, PackCategories} from "../Platform/Contract";
import {ValuesOf} from "../../../../server/Engine/Games/Game/GameContract";

export interface PackCreatorDataStorePayload
{
	ownerId: string | null;
	packId: string | null;
	packName: string;
	blackCards: string[];
	whiteCards: string[];
	isEdited: boolean;
	isNsfw: boolean;
	isPublic: boolean;
	categories: ValuesOf<typeof PackCategories>[];
}

class _PackCreatorDataStore extends DataStore<PackCreatorDataStorePayload>
{
	private static InitialState: PackCreatorDataStorePayload = {
		ownerId: null,
		packId: null,
		packName: "",
		whiteCards: [],
		blackCards: [],
		isEdited: false,
		isNsfw: true,
		isPublic: true,
		categories: []
	};

	public static Instance = new _PackCreatorDataStore(_PackCreatorDataStore.InitialState);

	protected update(data: Partial<PackCreatorDataStorePayload>)
	{
		if (data.blackCards !== undefined)
		{
			const cards = [...data.blackCards];
			cards.forEach((card, i) =>
			{
				cards[i] = card.replace(/_+/g, "_");
			});
			data.blackCards = cards;
		}

		super.update(data);
	}


	public hydrate(id: string)
	{
		return Platform.getPack(id, true)
			.then(data =>
			{
				this.update({
					ownerId: data.owner,
					packId: data.definition.pack.id,
					isNsfw: data.isNsfw,
					isPublic: data.isPublic,
					whiteCards: data.definition.white,
					blackCards: data.definition.black.map(bc => bc.content),
					packName: data.definition.pack.name,
					isEdited: false,
					categories: data.categories
				})
			})
			.catch(ErrorDataStore.add);
	}

	public hydrateFromData(pack: PackCreatorDataStorePayload, replace = true)
	{
		const allBlack = replace
			? pack.blackCards ?? []
			: [...this.state.blackCards, ...pack.blackCards];

		const allWhite = replace
			? pack.whiteCards ?? []
			: [...this.state.whiteCards, ...(pack.whiteCards ?? [])];

		this.update({
			blackCards: allBlack,
			whiteCards: allWhite,
			packName: pack?.packName ?? ""
		})
	}

	public reset()
	{
		this.update(_PackCreatorDataStore.InitialState);
	}

	public addBlackCard = () =>
	{
		this.update({
			isEdited: true,
			blackCards: [...this.state.blackCards, ""]
		});
	};

	public massAddBlackCards = (values: string[]) =>
	{
		this.update({
			isEdited: true,
			blackCards: [...this.state.blackCards, ...values]
		});
	};

	public massAddWhiteCards = (values: string[]) =>
	{
		this.update({
			isEdited: true,
			whiteCards: [...this.state.whiteCards, ...values]
		});
	};

	public editBlackCard = (index: number, value: string) =>
	{
		const newCards = this.state.blackCards;
		newCards[index] = value;

		this.update({
			isEdited: true,
			blackCards: newCards
		});
	};

	public addWhiteCard = () =>
	{
		this.update({
			isEdited: true,
			whiteCards: [...this.state.whiteCards, ""]
		});
	};

	public editWhiteCard = (index: number, value: string) =>
	{
		const newCards = [...this.state.whiteCards];
		newCards[index] = value;

		this.update({
			isEdited: true,
			whiteCards: newCards
		});
	};

	public removeBlackCard = (index: number) =>
	{
		const newCards = [...this.state.blackCards];
		newCards.splice(index, 1);

		this.update({
			isEdited: true,
			blackCards: newCards
		})
	};

	public removeWhiteCard = (index: number) =>
	{
		const newCards = [...this.state.whiteCards];
		newCards.splice(index, 1);

		this.update({
			isEdited: true,
			whiteCards: newCards
		})
	};

	public setPackName = (name: string) =>
	{
		this.update({
			isEdited: true,
			packName: name
		});
	};

	public getValidity(): string | undefined
	{
		if (this.state.packName.length < 3)
		{
			return "Pack name must be at least 3 characters long";
		}

		const validWhiteCards = this.state.whiteCards.filter(c => c.trim().length > 0);
		const validBlackCards = this.state.blackCards.filter(c => c.trim().length > 0);

		if (validWhiteCards.length === 0 && validBlackCards.length === 0)
		{
			return "You need at least one card";
		}

		if (this.state.categories.length === 0)
		{
			return "You must select a category";
		}

		if (this.state.categories.length > 3)
		{
			return "You can only select 3 categories";
		}

		const blackCardErrorIndices = this.state.blackCards.filter(value =>
		{
			const underscores = value.match(/_/g) ?? [];
			return underscores.length > 3;
		}).map((card, i) => i);

		if (blackCardErrorIndices.length)
		{
			const blackCardErrMessage = blackCardErrorIndices.length
				? `Prompt IDs with errors: ${blackCardErrorIndices.join(", ")}. `
				: "";

			return `${blackCardErrMessage}`;
		}
	}

	public setIsNsfw = (nsfw: boolean) =>
	{
		this.update({
			isEdited: true,
			isNsfw: nsfw
		});
	};

	public setIsPublic = (isPublic: boolean) =>
	{
		this.update({
			isEdited: true,
			isPublic
		});
	};

	public save = async (): Promise<ICustomCardPack> =>
	{
		return new Promise((resolve, reject) =>
		{
			Platform.savePack({
				isPublic: this.state.isPublic,
				isNsfw: this.state.isNsfw,
				id: this.state.packId,
				packName: this.state.packName,
				blackCards: this.state.blackCards,
				whiteCards: this.state.whiteCards,
				categories: this.state.categories
			}).then(data =>
			{
				resolve(data);
				this.update({
					isEdited: false
				});
			})
				.catch(e =>
				{
					ErrorDataStore.add(e);
					reject(e);
				});
		});
	};

	public setCategories(categories: ValuesOf<typeof PackCategories>[])
	{
		if (categories.length <= 3)
		{
			this.update({
				isEdited: true,
				categories
			});
		}
	}
}

export const PackCreatorDataStore = _PackCreatorDataStore.Instance;