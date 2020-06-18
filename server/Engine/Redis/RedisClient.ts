import {Config} from "../../../config/config";
import {loadFileAsJson} from "../../Utils/FileUtils";
import {AbortError, ClientOpts, createClient, RedisClient, RetryStrategy} from "redis";
import {logError, logMessage, logWarning} from "../../logger";

export class RedisConnector
{
	private redisReconnectInterval: NodeJS.Timeout | null = null;
	private readonly host: string;
	private readonly port: number;
	private readonly authKey: string;
	public client: RedisClient;

	constructor(private clientOpts?: ClientOpts)
	{
		const keys = loadFileAsJson("./config/keys.json")[0];
		this.host = keys.redis.host[Config.Environment];
		this.port = keys.redis.port;
		this.authKey = keys.redis.key;
	}

	public initialize()
	{
		this.client = createClient({
			...this.clientOpts,
			host: this.host,
			port: this.port,
			auth_pass: this.authKey,
			retry_strategy: this.retry_strategy
		});

		this.client.on("error", this.onError);
		this.client.on("connect", () => {
			this.redisReconnectInterval && clearInterval(this.redisReconnectInterval);
			logMessage("Redis client successfully connected");
		});
	}

	private retry_strategy: RetryStrategy = (options) =>
	{
		if (options.error && options.error.code === "ECONNREFUSED")
		{
			// End reconnecting on a specific error and flush all commands with
			// a individual error
			return new Error("The server refused the connection");
		}
		if (options.total_retry_time > 1000 * 60 * 60)
		{
			// End reconnecting after a specific timeout and flush all commands
			// with a individual error
			return new Error("Retry time exhausted");
		}
		if (options.attempt > 10)
		{
			// End reconnecting with built in error
			return new Error("Too many retries");
		}
		// reconnect after
		return Math.min(options.attempt * 100, 3000);
	};

	private onError = (error: any) =>
	{
		if (error instanceof AbortError)
		{
			this.redisReconnectInterval && clearInterval(this.redisReconnectInterval);
			this.redisReconnectInterval = setInterval(() =>
			{
				logWarning("Attempting to reconnect to Redis...");
				this.initialize();
			}, 10000);
		}
		logError(`Error from pub/sub: `, error);
	};

	public static create(options?: ClientOpts)
	{
		logMessage("Creating RedisClient");
		const instance = new RedisConnector(options);
		instance.initialize();

		return instance;
	}
}