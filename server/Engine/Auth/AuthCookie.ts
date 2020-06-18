import {IAuthContext} from "./UserContract";
import {Request, Response} from "express";
import {AuthEncryption} from "./AuthEncryption";

export class AuthCookie
{
	private static Encryption = new AuthEncryption();
	private static AuthCookieName = "auth";
	public static DefaultAuthContext: IAuthContext = {
		levels: [],
		userId: null,
		accessToken: null,
		accessTokenExpiry: null
	};

	public static set(userData: IAuthContext, req: Request, res: Response)
	{
		const encrypted = AuthCookie.encodeUserInfo(userData);

		const domain = req.get("host");

		res.cookie(AuthCookie.AuthCookieName, encrypted, {
			expires: new Date(Date.now() + (1000 * 60 * 60 * 24 * 30)),
			httpOnly: false,
			domain: domain.split(":")[0]
		});
	}

	public static get(req: Request)
	{
		const authCookie = req.cookies[AuthCookie.AuthCookieName];
		if (authCookie)
		{
			return AuthCookie.decodeUserInfo(authCookie);
		}

		return AuthCookie.DefaultAuthContext;
	}

	public static clear(req: Request, res: Response)
	{
		const domain = req.get("host");

		res.clearCookie(AuthCookie.AuthCookieName, {
			domain: domain.split(":")[0]
		});
	}

	private static encodeUserInfo(userData: IAuthContext): string
	{
		return this.Encryption.encrypt(JSON.stringify(userData));
	}

	private static decodeUserInfo(encoded: string): IAuthContext
	{
		const decrypted = this.Encryption.decrypt(encoded);

		return JSON.parse(decrypted) as IAuthContext;
	}
}