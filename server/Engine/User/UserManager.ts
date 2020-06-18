import {IPlayer} from "../Games/Game/GameContract";
import {UserUtils} from "./UserUtils";
import {Request} from "express";
import {Database} from "../../DB/Database";
import {PatronSettings} from "../Auth/UserContract";
import {AuthCookie} from "../Auth/AuthCookie";

class _UserManager
{
	public static Instance = new _UserManager();

	public validateUser(user: IPlayer, throwOnError = true)
	{
		const valid = UserUtils.validateUser(user);
		if (!valid && throwOnError)
		{
			throw new Error("There's a problem with your session. Refresh and try again.");
		}

		return valid;
	}

	public async saveSettings(req: Request)
	{
		const storedUserData = AuthCookie.get(req);
		if (storedUserData && storedUserData.accessToken)
		{
			// Refresh the current users access token.
			await Database.collections.users.updateOne({id: storedUserData.userId, accessToken: storedUserData.accessToken}, {
				$set: {
					settings: req.body as PatronSettings
				}
			}, {upsert: false});
		}
	}

	public async getSettings(req: Request)
	{
		const storedUserData = AuthCookie.get(req);
		if (storedUserData)
		{
			const foundUsers = await Database.collections.users.find({
				id: storedUserData.userId
			}).toArray();

			if (foundUsers && foundUsers.length === 1)
			{
				return foundUsers[0].settings;
			}
		}

		return null;
	}
}

export const UserManager = _UserManager.Instance;
