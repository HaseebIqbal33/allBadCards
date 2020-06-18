import {DataStore} from "./DataStore";
import moment from "moment";

interface EnvSite
{
	family: boolean;
	base: boolean;
}

export interface EnvDataStorePayload
{
	site: EnvSite;
	seenLiteMessage: boolean;
}

class _EnvDataStore extends DataStore<EnvDataStorePayload>
{
	private static seenLiteMessageLsKey = "lite:msgSeen";

	public static Instance = new _EnvDataStore({
		site: _EnvDataStore.getSite(),
		seenLiteMessage: _EnvDataStore.getSeenLiteMessage()
	});

	private static getSite(): EnvSite
	{
		const url = location.hostname;
		const isFamily = url.startsWith("not");

		return {
			base: !isFamily,
			family: isFamily,
		};
	}

	private static getSeenLiteMessage()
	{
		const storedString = localStorage.getItem(_EnvDataStore.seenLiteMessageLsKey);
		if (!storedString)
		{
			return false;
		}

		try
		{
			const date = moment(storedString);
			const olderThanWeek = date.isBefore(
				moment().add(-1, "week")
			);

			return !olderThanWeek;

		}
		catch (e)
		{
			return false;
		}
	}

	public setSeenLiteMessage()
	{
		localStorage.setItem(_EnvDataStore.seenLiteMessageLsKey, JSON.stringify(new Date()));

		this.update({
			seenLiteMessage: true
		});
	}
}

export const EnvDataStore = _EnvDataStore.Instance;