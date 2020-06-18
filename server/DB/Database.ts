import {Db, MongoClient} from "mongodb";
import * as fs from "fs";
import * as path from "path";
import {Config} from "../../config/config";
import {logError, logMessage} from "../logger";
import {GameItem, ICustomCardPack, IUserPackFavorite} from "../Engine/Games/Game/GameContract";
import {Patron} from "../Engine/Auth/UserContract";

class _Database
{
	public static Instance = new _Database();
	public collections: Collections;

	private _client: MongoClient;
	private url: string;
	private initialized = false;

	constructor()
	{
		const keysFile = fs.readFileSync(path.resolve(process.cwd(), "./config/keys.json"), "utf8");
		const keys = JSON.parse(keysFile)[0];
		this.url = keys.mongo[Config.Environment];
	}

	private get client()
	{
		if (!this._client)
		{
			throw new Error("Mongo failed to connect");
		}

		return this._client;
	}

	public initialize()
	{
		if (this.initialized)
		{
			return;
		}

		this.initialized = true;

		logMessage("Connecting to mongo");
		MongoClient.connect(this.url, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
		}, async (err, client) =>
		{
			logMessage("Mongo connection attempt finished");
			if (err)
			{
				logError(err);
				throw err;
			}

			this.initializeClient(client);

			await this.collections.games.createIndex({
				id: 1
			}, {
				unique: true
			});

			await this.collections.games.createIndex({
				["settings.public"]: 1,
				dateCreated: -1,
				dateUpdated: -1
			});

			await this.collections.users.createIndex({
				userId: 1
			});

			await this.collections.packs.createIndex({
				["definition.pack.id"]: 1,
				owner: 1,
				categories: 1
			});

			await this.collections.packFavorites.createIndex({
				packId: 1,
				userId: 1
			});
		});
	}

	private initializeClient(client: MongoClient)
	{
		this._client = client;
		const db = client.db("letsplaywtf");

		this.collections = new Collections(db);
	}

	public get db()
	{
		return this.client.db("letsplaywtf");
	}
}

class Collections
{
	constructor(private readonly db: Db)
	{

	}

	public get games()
	{
		return this.db.collection<GameItem>("games");
	}

	public get users()
	{
		return this.db.collection<Patron>("patrons");
	}

	public get packs()
	{
		return this.db.collection<ICustomCardPack>("packs");
	}

	public get packFavorites()
	{
		return this.db.collection<IUserPackFavorite>("pack_favorites");
	}
}


export const Database = _Database.Instance;