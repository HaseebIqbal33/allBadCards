import {DataStore} from "./DataStore";

export interface PreferencesPayload
{
	muted: boolean;
	darkMode: boolean;
}
const lsKey = "muted";
class _PreferencesDataStore extends DataStore<PreferencesPayload>
{
	public static Instance = new _PreferencesDataStore();

	constructor()
	{
		let initial = {
			muted: false,
			darkMode: false
		};
		const stringVal = localStorage.getItem(lsKey);
		if(stringVal)
		{
			initial = JSON.parse(stringVal);
		}

		super(initial);
	}

	protected update(data: Partial<PreferencesPayload>)
	{
		super.update(data);

		localStorage.setItem(lsKey, JSON.stringify(this.state));
	}

	public setMute(muted: boolean)
	{
		this.update({
			muted
		});
	}

	public setDarkMode(darkMode: boolean)
	{
		this.update({
			darkMode
		});
	}
}

export const PreferencesDataStore = _PreferencesDataStore.Instance;