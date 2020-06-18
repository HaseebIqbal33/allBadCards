import * as fs from "fs";
import * as path from "path";
import {ICardPackDefinition} from "../Game/GameContract";
import {RedisConnector} from "../../Redis/RedisClient";

class _CardCastConnector
{
	private readonly redis: RedisConnector;

	public static Instance = new _CardCastConnector();

	private memoryTimeouts: { [deckId: string]: NodeJS.Timeout } = {};
	private packs: { [packId: string]: ICardPackDefinition } = {};
	private packList: ICardPackDefinition[] = [];

	constructor()
	{
		this.redis = new RedisConnector();
		this.redis.initialize();

		this.readIntoMemory();
	}

	public async getCachedDeck(input: string): Promise<ICardPackDefinition[]>
	{
		return new Promise((resolve, reject) =>
		{
			let matchedPacks = input in this.packs
				? [this.packs[input]]
				: undefined;
			if (!matchedPacks)
			{
				matchedPacks = this.packList.filter(a => a.pack.name.toLowerCase().includes(input.toLowerCase()));
			}

			if (matchedPacks)
			{
				resolve(matchedPacks);
			}
			else
			{
				reject();
			}
		});
	}

	private readIntoMemory = () =>
	{
		const packsPath = path.resolve(process.cwd(), `./cardcast-packs`);
		const packFiles = fs.readdirSync(packsPath);
		packFiles.forEach(fileName =>
		{
			const packPath = path.resolve(process.cwd(), `./cardcast-packs/${fileName}`);
			const packFile = fs.readFileSync(packPath, "utf8");
			const packDef = JSON.parse(packFile) as ICardPackDefinition;
			this.packs[packDef.pack.id] = packDef;
			this.packList.push(packDef);
		});
	};

	private static capitalize(str: string)
	{
		return str[0].toUpperCase() + str.substr(1) + (str.endsWith(".") ? "" : ".");
	}
}

export const CardCastConnector = _CardCastConnector.Instance;