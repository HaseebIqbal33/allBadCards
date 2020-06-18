import {Config} from "../../../config/config";
import WebSocket from "ws";
import * as http from "http";
import {ChatPayload, GameItem, GamePayload} from "../Games/Game/GameContract";
import {serverGameToClientGame} from "../../Utils/GameUtils";
import {GameMessage} from "./Messages/GameMessage";
import {ArrayUtils} from "../../Utils/ArrayUtils";
import {ChatMessage} from "./Messages/ChatMessage";
import {GameManager} from "../Games/Game/GameManager";
import {logMessage} from "../../logger";

interface IWSMessage
{
	user: {
		playerGuid: string;
	};
	gameId: string;
}

export class GameSockets
{
	private kickTimeouts: { [gameColonPlayerId: string]: NodeJS.Timeout } = {};

	private wss: WebSocket.Server;

	private playerGuidToSocketIds: { [playerGuid: string]: string[] } = {};
	private gameIdToSocketIds: { [gameid: string]: string[] } = {};
	private socketIdToGameIds: { [socketId: string]: string[] } = {};

	constructor(server: http.Server, port?: number)
	{
		this.wss = new WebSocket.Server({
			server,
			port,
			perMessageDeflate: true
		});

		this.addListeners();
	}

	private addListeners()
	{
		this.wss.on("connection", (ws, req) =>
		{
			const id = req.headers['sec-websocket-key'] as string | undefined;
			if (id)
			{
				(ws as any)["id"] = id;
				ws.on("message", (message) =>
				{
					const data = JSON.parse(message as string) as IWSMessage;

					if (data.user)
					{
						const socketIdsForPlayer = this.playerGuidToSocketIds[data.user.playerGuid] ?? [];
						const gameIdsForSocketId = this.socketIdToGameIds[id] ?? [];

						this.playerGuidToSocketIds[data.user.playerGuid] = [id, ...socketIdsForPlayer];
						this.socketIdToGameIds[id] = [data.gameId, ...gameIdsForSocketId];

						// Prevent kicks if it's just a refresh
						gameIdsForSocketId.forEach(gameId => {
							clearTimeout(this.kickTimeouts[`${gameId}:${data.user.playerGuid}`]);
						});

						// Prevent kicks if it's just a refresh
						clearTimeout(this.kickTimeouts[`${data.gameId}:${data.user.playerGuid}`]);
					}

					const socketIdsForGame = this.gameIdToSocketIds[data.gameId] ?? [];
					this.gameIdToSocketIds[data.gameId] = [id, ...socketIdsForGame];
				});

				ws.on("close", () =>
				{
					const matchingPlayerGuid = Object.keys(this.playerGuidToSocketIds)
						.find(playerGuid => this.playerGuidToSocketIds[playerGuid].includes(id));

					if (matchingPlayerGuid)
					{
						const gameIdsForSocket = this.socketIdToGameIds[id];

						const socketIdsForPlayer = this.playerGuidToSocketIds[matchingPlayerGuid];

						// Remove this socket ID for this player
						this.playerGuidToSocketIds[matchingPlayerGuid] = socketIdsForPlayer.filter(a => a !== id);

						gameIdsForSocket.forEach(gameId =>
						{
							// Kick player ten seconds after leaving
							this.kickTimeouts[`${gameId}:${matchingPlayerGuid}`] = setTimeout(() =>
							{
								GameManager.kickPlayer(
									gameId,
									matchingPlayerGuid,
									{
										secret: "",
										guid: matchingPlayerGuid
									},
									true,
									true)
									.then(() =>
									{
										logMessage(`Kicked player ${matchingPlayerGuid} from game ${gameId} after they went idle.`)
									});
							}, 60000);
						});

						// Remove this one
						delete this.socketIdToGameIds[id];
					}
				});
			}
		});
	}

	public updateGames(game: GameItem)
	{
		const clientGame = serverGameToClientGame(game);

		const playerGuids = Object.keys({
			...game.players,
			...game.pendingPlayers,
			...game.spectators,
			...game.kickedPlayers
		});

		// Get every socket that needs updating
		const playerSocketListsForGame = playerGuids.map(pg => this.playerGuidToSocketIds[pg]);
		const allPlayerSocketIdsForGame = ArrayUtils.flatten<string>(playerSocketListsForGame);

		this.gameIdToSocketIds[game.id] = allPlayerSocketIdsForGame;

		const gameWithVersion: GamePayload = {
			...clientGame,
			buildVersion: Config.Version
		};

		this.sendPayloadToMatching(GameMessage.send(gameWithVersion), allPlayerSocketIdsForGame);
	}

	public updateChats(chatPayload: ChatPayload)
	{
		// Get every socket that needs updating
		const allPlayerSocketIdsForGame = Array.from(new Set(this.gameIdToSocketIds[chatPayload.gameId]));

		this.sendPayloadToMatching(ChatMessage.send(chatPayload), allPlayerSocketIdsForGame);
	}

	private sendPayloadToMatching(payload: string, socketIds: string[])
	{
		this.wss.clients.forEach(ws =>
		{
			const socketId = (ws as any).id;
			if (socketIds.includes(socketId))
			{
				ws.send(payload);
			}
		});
	}
}