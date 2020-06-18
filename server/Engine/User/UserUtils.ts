import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import {IPlayer} from "../Games/Game/GameContract";

class _UserUtils
{
	public static Instance = new _UserUtils();

	private salt: string;

	constructor()
	{
		const keysFile = fs.readFileSync(path.resolve(process.cwd(), "./config/keys.json"), "utf8");
		const keys = JSON.parse(keysFile)[0];

		this.salt = keys.userSecretSalt;
	}

	public generateSecret(userId: string)
	{
		const secret = this.sha512(userId, this.salt);

		return secret;
	}

	public validateUserId(userId: string, secret: string)
	{
		const validSecret = this.generateSecret(userId);

		return validSecret === secret;
	}

	public validateUser(user: IPlayer)
	{
		if(!user.guid || !user.secret)
		{
			return false;
		}

		return this.validateUserId(user.guid, user.secret);
	}

	private sha512 = (userId: string, salt: string) =>
	{
		const hash = crypto.createHmac('sha512', salt);
		/** Hashing algorithm sha512 */
		hash.update(userId);

		return hash.digest('hex');
	};
}

export const UserUtils = _UserUtils.Instance;