export interface Patron
{
	userId: string
	settings: PatronSettings;
	accessToken: string;
	accessTokenExpiry: Date;
	refresh_token: string;
	refresh_expiry: Date;
}

export interface PatronSettings
{
	nickname: string;
	favoritePackIds: string[];
}

export interface IAuthContext
{
	userId: string | null;
	accessToken: string | null;
	accessTokenExpiry: Date | null;
	cookieSetDate?: Date;
	levels: string[]
}