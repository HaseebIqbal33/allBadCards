import {Request, Response} from "express";
import ClientOAuth2 from "client-oauth2";
import {Config} from "../../../config/config";
import {Database} from "../../DB/Database";
import {loadFileAsJson} from "../../Utils/FileUtils";
import {IAuthContext, Patron} from "./UserContract";
import {PatreonConnector} from "./PatreonConnector";
import {AuthCookie} from "./AuthCookie";
import {MatchKeysAndValues} from "mongodb";
import moment from "moment";
import {logError} from "../../logger";

interface TokenWithExpires extends ClientOAuth2.Token
{
	expires: Date;
}

class _Auth
{
	public static Instance = new _Auth();

	private readonly id: string;
	private readonly secret: string;
	private client: ClientOAuth2;

	private constructor()
	{
		const keys = loadFileAsJson("./config/keys.json")[0];

		// Use the client id and secret you received when setting up your OAuth account
		this.id = keys.patreon.id;
		this.secret = keys.patreon.secret;
	}

	private static getRedirectUri(domain: string)
	{
		return `${Config.getHost(domain)}/auth/redirect`;
	}

	public initialize()
	{
		const redirectUri = _Auth.getRedirectUri("");
		this.client = new ClientOAuth2({
			clientId: this.id,
			clientSecret: this.secret,
			accessTokenUri: 'https://www.patreon.com/api/oauth2/token',
			authorizationUri: 'https://www.patreon.com/oauth2/authorize',
			redirectUri: redirectUri,
			scopes: ['notifications', 'gist']
		})
	}

	public authorize(req: Request, res: Response)
	{
		const uri = this.client.code.getUri();

		res.redirect(uri);
	}

	public async storeUserToken(req: Request, res: Response)
	{
		const domain = req.get("host");
		const redirectUri = _Auth.getRedirectUri(domain);
		const tokenRefresher = this.client.code.getToken(req.originalUrl, {redirectUri});

		const token = await tokenRefresher;
		const user = await token.refresh() as TokenWithExpires;

		const profileData = await PatreonConnector.fetchUser(user.accessToken);
		const userId = profileData.data.id;
		const tokenExpiry = new Date(Date.now() + (1 * 60));

		AuthCookie.set({
			accessToken: user.accessToken,
			accessTokenExpiry: tokenExpiry,
			userId,
			levels: []
		}, req, res);

		// Refresh the current users access token.
		const result = await this.updateDatabaseUser(userId, {
			userId: userId,
			accessToken: user.accessToken,
			refresh_token: user.refreshToken,
			refresh_expiry: user.expires
		}, true);

		// If first time, set the nickname
		if (result.upsertedCount >= 1)
		{
			await this.updateDatabaseUser(userId, {
				settings: {
					nickname: profileData.data.attributes.first_name,
					favoritePackIds: []
				}
			}, false);
		}
	}

	public async getRefreshAuthStatus(req: Request, res: Response): Promise<IAuthContext>
	{
		if (!req.cookies)
		{
			req.cookies = {};
			console.log("AUTH: no cookies");
		}

		const storedUserData = AuthCookie.get(req);


		const authStatus: IAuthContext = {
			accessToken: null,
			accessTokenExpiry: null,
			userId: null,
			levels: []
		};

		if (!!storedUserData?.userId)
		{
			authStatus.accessToken = storedUserData.accessToken;
			authStatus.userId = storedUserData.userId;

			const foundUsers = await Database.collections.users.find({
				userId: storedUserData.userId
			}).toArray();

			if (foundUsers && foundUsers.length === 1)
			{
				const dbUser = foundUsers[0];

				const now = moment();
				const refreshExpiry = moment(dbUser.refresh_expiry);
				const refreshExpired = now.isAfter(refreshExpiry);
				if (refreshExpired)
				{
					authStatus.userId = null;
					authStatus.accessToken = null;

					// Return null for everything
					return authStatus;
				}

				const storedDate = storedUserData.cookieSetDate ?? moment().add(-1, "minute");

				const accessExpired = !storedUserData.accessTokenExpiry || now.isAfter(moment(storedUserData.accessTokenExpiry));
				if (accessExpired && storedUserData.accessToken)
				{
					try
					{
						const newCreatedToken = this.client.createToken(storedUserData.accessToken, dbUser.refresh_token, {});
						const newRefreshedToken = await newCreatedToken.refresh() as TokenWithExpires;

						const newUserData: IAuthContext = {
							userId: storedUserData.userId,
							accessToken: newRefreshedToken.accessToken,
							accessTokenExpiry: new Date(Date.now() + (1000 * 60)),
							levels: []
						};

						authStatus.userId = newUserData.userId;
						authStatus.accessToken = newUserData.accessToken;

						newUserData.levels = await PatreonConnector.getSubscriberLevel(authStatus.userId, authStatus.accessToken);
						authStatus.levels = newUserData.levels;
						if(authStatus.userId === "32889715")
						{
							authStatus.levels.push("Owner");
						}

						await this.updateUserData(req, res, newUserData, newRefreshedToken);
					}
					catch (e)
					{
						logError(e);

						if (Config.Environment !== "local")
						{
							res.clearCookie("auth");
						}

						return authStatus;
					}
				}
			}
		}

		return authStatus;
	}

	private async updateUserData(req: Request, res: Response, newUserData: IAuthContext, newRefreshedToken: TokenWithExpires)
	{
		if (!newUserData.userId)
		{
			throw new Error("Cannot update user data without a user ID");
		}

		AuthCookie.set(newUserData, req, res);

		// Refresh the current users access token.
		await this.updateDatabaseUser(newUserData.userId, {
			accessToken: newRefreshedToken.accessToken,
			refresh_token: newRefreshedToken.refreshToken,
			refresh_expiry: newRefreshedToken.expires
		}, false);
	}

	private async updateDatabaseUser(userId: string, update: MatchKeysAndValues<Patron>, upsert = false)
	{
		// Refresh the current users access token.
		return await Database.collections.users.updateOne({userId}, {
			$set: update
		}, {
			upsert
		});
	}
}

export const Auth = _Auth.Instance;