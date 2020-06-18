export abstract class SocketMessage<T>
{
	constructor(private readonly name: string, private readonly data: T)
	{
	}

	public get payload()
	{
		const payload = {
			[this.name]: this.data
		};

		return JSON.stringify(payload);
	}
}

export const createSocketMessageClass = <T>(name: string) => class extends SocketMessage<T>
{
	constructor(data: T)
	{
		super(name, data);
	}

	public static send<M extends SocketMessage<T>>(this: new (data: T) => M, data: T)
	{
		return (new this(data)).payload;
	}
};