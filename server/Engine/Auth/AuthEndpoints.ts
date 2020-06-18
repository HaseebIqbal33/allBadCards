import {Express} from "express";
import {Auth} from "./Auth";
import {Config} from "../../../config/config";
import {logRequest, onExpressError, sendWithBuildVersion} from "../../Utils/ExpressUtils";
import {AuthCookie} from "./AuthCookie";

export const RegisterAuthEndpoints = (app: Express, clientFolder: string) =>
{
	app.get("/auth/authorize", (req, res) =>
	{
		logRequest(req);
		try
		{
			Auth.authorize(req, res);
		}
		catch (error)
		{
			onExpressError(res, error, req.url, req.query, req.body);
		}
	});

	app.get("/auth/logout", (req, res) =>
	{
		logRequest(req);
		try
		{
			AuthCookie.clear(req, res);

			res.send({success: true});
		}
		catch (error)
		{
			onExpressError(res, error, req.url, req.query, req.body);
		}
	});

	app.get("/auth/redirect", async (req, res) =>
	{
		logRequest(req);
		try
		{
			await Auth.storeUserToken(req, res);

			const domain = req.get("host");
			const host = Config.getHost(domain).replace("local:5000", "local:3000");

			const state = decodeURIComponent(req.query.state) || "/";

			res.redirect(host + state);
		}
		catch (error)
		{
			onExpressError(res, error, req.url, req.query, req.body);
		}
	});

	app.get("/auth/status", async (req, res) =>
	{
		logRequest(req);
		try
		{
			const result = await Auth.getRefreshAuthStatus(req, res);

			AuthCookie.set(result, req, res);

			sendWithBuildVersion({
				status: result
			}, res);
		}
		catch (error)
		{
			onExpressError(res, error, req.url, req.query, req.body);
		}
	});
};