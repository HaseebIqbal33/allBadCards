import pathToRegexp, {PathFunction} from "path-to-regexp";

export class SiteRoute<T extends object = {}>
{
	private compiler: PathFunction<T>;

	constructor(private readonly baseRoute: string, private readonly defaults?: Partial<T>)
	{
		this.compiler = pathToRegexp.compile(baseRoute)
	}

	public get path()
	{
		return this.baseRoute;
	}

	public resolve(params?: T)
	{
		const paramsWithDefaults = {...this.defaults, ...params} as T;
		return this.compiler(paramsWithDefaults);
	}
}

export class SiteRoutes
{
	public static Home = new SiteRoute("/");
	public static CardCastExport = new SiteRoute("/cardcast-export");
	public static PacksBrowser = new SiteRoute("/packs");
	public static MyPacks = new SiteRoute("/packs/mine");
	public static PackCreate = new SiteRoute<{ id?: string }>("/pack/detail/:id?");
	public static Games = new SiteRoute("/games");
	public static Game = new SiteRoute<{ id: string, throwaway?: string }>("/game/:id/:throwaway?");
	public static Settings = new SiteRoute("/user/settings");
}