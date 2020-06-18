import {DataStore} from "./DataStore";

export interface IErrorDataStorePayload
{
	errors: Error[];
}

class _ErrorDataStore extends DataStore<IErrorDataStorePayload>
{
	public static Instance = new _ErrorDataStore({
		errors: []
	});

	public add = (error: Error) =>
	{
		console.error(error);
		this.update({
			errors: [...this.state.errors, error]
		});
	}

	public clear = () =>
	{
		this.update({
			errors: []
		});
	}
}

export const ErrorDataStore = _ErrorDataStore.Instance;