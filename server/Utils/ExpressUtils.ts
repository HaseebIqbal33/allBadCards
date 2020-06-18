import {Request, Response} from "express";
import {logError} from "../logger";
import {Config} from "../../config/config";
import {IPlayer} from "../Engine/Games/Game/GameContract";
import {IAuthContext} from "../Engine/Auth/UserContract";
import {AuthCookie} from "../Engine/Auth/AuthCookie";

export const onExpressError = (res: Response, error: Error, ...more: any[]) =>
{
	logError({message: error.message, stack: error.stack}, more);
	res.status(500).send({message: error.message, stack: error.stack});
	throw error;
};

export const sendWithBuildVersion = (data: any, res: Response) =>
{
	res.send({
		...data,
		buildVersion: Config.Version
	});
};

export const playerFromReq = (req: Request): IPlayer =>
{
	return {
		guid: req.cookies["guid"],
		secret: req.cookies["secret"]
	};
};

export const logRequest = (req: Request) =>
{
	const body = req.body
		? JSON.stringify(req.body)
		: undefined;

	const query = req.query
		? JSON.stringify(req.query)
		: undefined;

	//logMessage(req.url, body?.substr(0, 500), query?.substr(0, 500));
};

export const withTryCatch = (req: Request, res: Response, callback: () => void) =>
{
	logRequest(req);

	try
	{
		callback();
	}
	catch (error)
	{
		onExpressError(res, error, req.url, req.query, req.body);
	}
};

export const withAuthContext = async (req: Request, callback: (authContext: IAuthContext) => void) =>
{
	const authContext = AuthCookie.get(req);
	await callback(authContext);
};

export const safeAuthedEndpoint = async (req: Request, res: Response, callback: (authContext: IAuthContext) => void) => {
	try
	{
		await withAuthContext(req, callback);
	}
	catch (error)
	{
		onExpressError(res, error, req.url, req.query, req.body);
	}
};