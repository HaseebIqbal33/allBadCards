import * as crypto from "crypto";
import {loadFileAsJson} from "../../Utils/FileUtils";

export class AuthEncryption
{
	private readonly EncryptionKey: Buffer;
	private readonly EncryptionIv: Buffer;

	constructor()
	{
		const keys = loadFileAsJson("./config/keys.json")[0];

		this.EncryptionKey = new Buffer(keys.crypto.key32);
		this.EncryptionIv = new Buffer(keys.crypto.iv16);
	}

	public encrypt(o: string | object)
	{
		const text = typeof o === "string" ? o : JSON.stringify(o);
		let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(this.EncryptionKey), this.EncryptionIv);
		let encrypted = cipher.update(text);
		encrypted = Buffer.concat([encrypted, cipher.final()]);
		return encrypted.toString('hex');
	}

	public decrypt(text: string)
	{
		let encryptedText = Buffer.from(text, 'hex');
		let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(this.EncryptionKey), this.EncryptionIv);
		let decrypted = decipher.update(encryptedText);
		decrypted = Buffer.concat([decrypted, decipher.final()]);
		return decrypted.toString();
	}
}