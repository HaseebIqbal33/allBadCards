import fetch from "cross-fetch";
import deepExtend from "deep-extend";

export class Fetcher
{
	public static doGet<TData>(url: string, options?: RequestInit)
	{
		return new Promise<TData>((resolve, reject) =>
		{
			fetch(url, options)
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
				.catch(reject);
		});
	}

	public static async doPost<TData>(url: string, data: any, options?: RequestInit)
	{
		return new Promise<TData>((resolve, reject) =>
		{
			const opts: RequestInit = deepExtend((options ?? {}), {
				method: "POST",
				headers: {"Content-Type": "application/json"},
				body: JSON.stringify(data)
			});

			fetch(url, opts)
				.then(async r =>
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
				.catch(reject);
		});
	}
}