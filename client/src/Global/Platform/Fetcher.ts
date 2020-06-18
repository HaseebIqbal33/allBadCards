import {ErrorDataStore} from "../DataStore/ErrorDataStore";

export class Fetcher
{
	public static doGet<TData>(url: string)
	{
		return new Promise<TData>((resolve, reject) =>
		{
			fetch(url)
				.then(r =>
				{
					const jsonResponse = r.json() as Promise<TData>;

					if (r.ok)
					{
						jsonResponse
							.then((data: TData) => resolve(data))
							.catch(reject);
					}
					else
					{
						jsonResponse.then(reject);
					}
				})
				.catch(ErrorDataStore.add);
		});
	}

	public static async doPost<TData>(url: string, data: any)
	{
		return await fetch(url, {
			method: "POST",
			headers: {"Content-Type": "application/json"},
			body: JSON.stringify(data)
		})
			.then(async r =>
			{
				if (r.ok)
				{
					return r.json();
				}
				else
				{
					throw await r.json();
				}
			})
			.catch(ErrorDataStore.add) as Promise<TData>;
	}
}