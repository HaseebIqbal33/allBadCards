import {DataStore} from "./DataStore";
import {ChatPayload} from "../Platform/Contract";
import {SocketDataStore} from "./SocketDataStore";
import deepEqual from "deep-equal";

export interface ChatDataStorePayload
{
	sidebarOpen: boolean;
	chat: { [gameId: string]: ChatPayload[] };
	unseenChatMessages: number;
	newMessages: boolean;
}

class _ChatDataStore extends DataStore<ChatDataStorePayload>
{
	private initialized = false;
	private destroyer: (() => void) | null = null;

	public static Instance = new _ChatDataStore({
		chat: {},
		unseenChatMessages: 0,
		newMessages: false,
		sidebarOpen: true,
	});

	public initialize()
	{
		if (this.initialized)
		{
			return;
		}

		this.initialized = true;

		this.destroyer = SocketDataStore.listen(data =>
		{
			if (data.updateType === "chat" && data.chatPayload)
			{
				const gameId = data.chatPayload.gameId;
				let newChat = {...this.state.chat};
				if(!(gameId in newChat))
				{
					newChat[gameId] = [];
				}

				const thisGameChat = newChat[gameId];
				const lastMessageSame = deepEqual(thisGameChat[thisGameChat.length - 1], data.chatPayload);

				newChat[gameId] = [...newChat[gameId], data.chatPayload];

				this.update({
					chat: newChat,
					unseenChatMessages: this.state.unseenChatMessages + (lastMessageSame ? 0 : 1)
				});
			}
		}, undefined, false);
	}

	public acknowledge()
	{
		this.update({
			unseenChatMessages: 0
		});
	}

	public clear()
	{
		this.destroyer?.();
		this.initialized = false;
		this.update({
			chat: {},
			newMessages: false,
			unseenChatMessages: 0
		})
	}
}

export const ChatDataStore = _ChatDataStore.Instance;