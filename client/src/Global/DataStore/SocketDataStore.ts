import {DataStore} from "./DataStore";
import {GamePayload} from "../Platform/platform";
import {ChatPayload} from "../Platform/Contract";
import {UserDataStore} from "./UserDataStore";
import {GameDataStore} from "./GameDataStore";
import {ChatDataStore} from "./ChatDataStore";
import Visibility from "visibilityjs";

export interface SocketDataStorePayload
{
	updateType: "game" | "chat";
	hasConnection: boolean;
	lostConnection: boolean;
	gamePayload: GamePayload | null;
	chatPayload: ChatPayload | null;
}

let manualClose = false;
let connectionOpen = false;

class _SocketDataStore extends DataStore<SocketDataStorePayload>
{
	private ws: WebSocket | null = null;
	private disconnectTimerId = 0;

	public static Instance = new _SocketDataStore({
		updateType: "game",
		lostConnection: false,
		hasConnection: false,
		chatPayload: null,
		gamePayload: null
	});

	public initialize()
	{
		if (this.ws)
		{
			this.ws.close();
			manualClose = true;
		}

		const isLocal = !!location.hostname.match("local");
		const protocol = location.protocol === "http:" ? "ws:" : "wss:";
		const url = isLocal
			? `ws://${location.hostname}:8080`
			: `${protocol}//${location.hostname}`;

		this.ws = new WebSocket(url);

		this.ws.onopen = (e) =>
		{
			manualClose = false;
			connectionOpen = true;
			console.log(e);
			this.ws?.send(JSON.stringify({
				user: UserDataStore.state,
				gameId: GameDataStore.state.game?.id ?? "-1"
			}));

			this.update({
				hasConnection: true,
				lostConnection: false
			});
		};

		this.ws.onmessage = (e) =>
		{
			const parsed = JSON.parse(e.data);
			if ("game" in parsed)
			{
				const data = JSON.parse(e.data) as { game: GamePayload };
				this.update({
					updateType: "game",
					gamePayload: data.game
				});
			}
			else if ("chat" in parsed)
			{
				const data = JSON.parse(e.data) as { chat: ChatPayload };
				this.update({
					updateType: "chat",
					chatPayload: data.chat
				});
			}
		};

		this.ws.onclose = () =>
		{
			connectionOpen = false;
			if (!manualClose)
			{
				this.retry();
			}
		};

		// On visibility change...
		Visibility.change(data =>
		{
			// Check if hidden. If so, start a timer to disconnect
			if (Visibility.hidden() && connectionOpen)
			{
				clearTimeout(this.disconnectTimerId);
				this.disconnectTimerId = window.setTimeout(() =>
				{
					connectionOpen = false;
					manualClose = true;
					this.ws?.close();
				}, 60000);
			}
			else if (!Visibility.hidden())
			{
				clearTimeout(this.disconnectTimerId);
				if (!connectionOpen)
				{
					this.initialize();
				}
			}
		});
	}

	public reconnect()
	{
		this.retry(5);
	}

	public clear()
	{
		this.ws?.close();
		this.update({
			chatPayload: null,
			gamePayload: null,
			updateType: "chat"
		});
		GameDataStore.clear();
		ChatDataStore.clear();
	}

	private retry(count = 0)
	{
		if (count > 2)
		{
			this.update({
				hasConnection: false
			});
		}

		console.log("Lost server connection. Retrying...", count);

		this.initialize();

		setTimeout(() =>
		{
			if (!connectionOpen)
			{
				if (count < 5)
				{
					this.retry(count + 1);
				}
				else
				{
					this.update({
						lostConnection: true
					});
				}
			}
		}, 2000);
	}
}

export const SocketDataStore = _SocketDataStore.Instance;