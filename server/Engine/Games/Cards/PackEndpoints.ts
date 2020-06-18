import {Express} from "express";
import {logRequest, onExpressError, sendWithBuildVersion} from "../../../Utils/ExpressUtils";
import {PackManager} from "./PackManager";
import {FilterQuery} from "mongodb";
import {ICustomCardPack} from "../Game/GameContract";
import apicache from "apicache";
import {CardCastConnector} from "./CardCastConnector";

const cache = apicache.middleware;

export const RegisterPackEndpoints = (app: Express, clientFolder: string) =>
{
	app.get("/api/pack/get", cache("5 minutes"), async (req, res) =>
	{
		logRequest(req);
		try
		{
			const pack = await PackManager.getCustomPack(req.query.pack);
			if (!pack)
			{
				throw new Error("Pack not found!");
			}
			sendWithBuildVersion(pack, res);
		}
		catch (error)
		{
			onExpressError(res, error, req.url, req.query, req.body);
		}
	});

	app.get("/api/packs/mine", async (req, res) =>
	{
		logRequest(req);
		try
		{
			const result = await PackManager.getPacksForOwner(req);
			sendWithBuildVersion({
				result
			}, res);
		}
		catch (error)
		{
			onExpressError(res, error, req.url, req.query, req.body);
		}
	});

	app.get("/api/packs/myfaves", cache("5 seconds"), async (req, res) =>
	{
		logRequest(req);
		try
		{
			const result = await PackManager.getMyFavoritePacks(req);
			sendWithBuildVersion({
				result
			}, res);
		}
		catch (error)
		{
			onExpressError(res, error, req.url, req.query, req.body);
		}
	});

	app.get("/api/cardcast-pack-export", cache("10 minutes"), async (req, res) =>
	{
		try
		{
			const packs = await CardCastConnector.getCachedDeck(req.query.input);
			res.send({
				packs
			})
		}
		catch (error)
		{
			onExpressError(res, error, req.url, req.query, req.body);
		}
	});

	app.get("/api/packs/search", async (req, res) =>
	{
		logRequest(req);
		try
		{
			const query: FilterQuery<ICustomCardPack> = {
				isPublic: true
			};

			if(req.query.nsfw !== "true")
			{
				query.isNsfw = false;
			}

			if (req.query.category)
			{
				query.categories = {
					$in: [req.query.category]
				};
			}

			if (req.query.search)
			{
				query["definition.pack.name"] = {
					$regex: new RegExp(".*" + req.query.search + ".*", "gi")
				};
			}

			const result = await PackManager.getPacks(req, query, req.query.sort, req.query.zeroBasedPage);

			sendWithBuildVersion({
				result
			}, res);
		}
		catch (error)
		{
			onExpressError(res, error, req.url, req.query, req.body);
		}
	});

	app.post("/api/pack/update", async (req, res, next) =>
	{
		logRequest(req);
		try
		{
			const pack = await PackManager.upsertPack(req, req.body.pack);
			sendWithBuildVersion(pack, res);
		}
		catch (error)
		{
			onExpressError(res, error, req.url, req.query, req.body);
		}
	});

	app.post("/api/pack/favorite", async (req, res, next) =>
	{
		logRequest(req);
		try
		{
			const pack = await PackManager.addFavorite(req, req.body.packId);
			sendWithBuildVersion(pack, res);
		}
		catch (error)
		{
			onExpressError(res, error, req.url, req.query, req.body);
		}
	});

	app.post("/api/pack/unfavorite", async (req, res, next) =>
	{
		logRequest(req);
		try
		{
			const pack = await PackManager.removeFavorite(req, req.body.packId);
			sendWithBuildVersion(pack, res);
		}
		catch (error)
		{
			onExpressError(res, error, req.url, req.query, req.body);
		}
	});
};