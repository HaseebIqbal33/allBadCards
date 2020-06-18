import {Alert} from "@material-ui/lab";
import {Typography, useMediaQuery} from "@material-ui/core";
import {ShowWinner} from "./ShowWinner";
import {ErrorBoundary} from "../../../../App/ErrorBoundary";
import {GamePlayWhite} from "../../GamePlayWhite";
import {GamePlayBlack} from "../../GamePlayBlack";
import {GamePlaySpectate} from "../../GamePlaySpectate";
import React, {useEffect} from "react";
import {useDataStore} from "../../../../Global/Utils/HookUtils";
import {GameDataStore} from "../../../../Global/DataStore/GameDataStore";
import {UserDataStore} from "../../../../Global/DataStore/UserDataStore";
import GameStart from "../../GameStart";
import GameJoin from "../../GameJoin";
import moment from "moment";
import {ChatDataStore} from "../../../../Global/DataStore/ChatDataStore";
import {useHistory, useParams} from "react-router";
import {SiteRoutes} from "../../../../Global/Routes/Routes";
import {getTrueRoundsToWin} from "../../../../Global/Utils/GameUtils";
import {ClientGameItem} from "../../../../Global/Platform/Contract";

interface Props
{
	gameId: string;
}

export const GameInner: React.FC<Props> = (
	{
		gameId,
	}
) =>
{
	const gameData = useDataStore(GameDataStore);
	const userData = useDataStore(UserDataStore);
	const chatData = useDataStore(ChatDataStore);
	const params = useParams<{ throwaway?: string }>();
	const history = useHistory();

	const {
		dateCreated,
		started,
		chooserGuid,
		ownerGuid,
		spectators,
		pendingPlayers,
		players,
		settings,
		kickedPlayers
	} = gameData.game ?? {};

	const {
		playerGuid
	} = userData;

	const iWasKicked = !!kickedPlayers?.[playerGuid];
	const amInGame = playerGuid in (players ?? {});

	useEffect(() =>
	{
		const playMode = params.throwaway !== "play" && started && !iWasKicked && amInGame;
		const notPlayMode = iWasKicked && params.throwaway === "play";
		if (playMode)
		{
			history.push(SiteRoutes.Game.resolve({
				id: gameId,
				throwaway: "play"
			}))
		}

		if(notPlayMode)
		{
			history.push(SiteRoutes.Game.resolve({
				id: gameId,
				throwaway: "kicked"
			}));
		}
	}, [started, iWasKicked, amInGame]);

	const isOwner = ownerGuid === userData.playerGuid;
	const isChooser = playerGuid === chooserGuid;
	const amSpectating = playerGuid in {...(spectators ?? {}), ...(pendingPlayers ?? {})};

	const playerGuids = Object.keys(players ?? {});
	const roundsToWin = getTrueRoundsToWin(gameData.game as ClientGameItem);
	const winnerGuid = playerGuids.find(pg => (players?.[pg].wins ?? 0) >= roundsToWin);

	const inviteLink = (settings?.inviteLink?.length ?? 0) > 25
		? `${settings?.inviteLink?.substr(0, 25)}...`
		: settings?.inviteLink;

	const meKicked = kickedPlayers?.[playerGuid];

	const tablet = useMediaQuery('(max-width:1200px)');
	const canChat = (amInGame || amSpectating) && moment(dateCreated).isAfter(moment(new Date(1589260798170)));
	const chatBarExpanded = chatData.sidebarOpen && !tablet && canChat;

	return (
		<div style={{maxWidth: chatBarExpanded ? "calc(100% - 320px)" : "100%"}}>
			<div style={{minHeight: "70vh"}}>
				{iWasKicked && (
					<Alert variant={"filled"} severity={"error"}>
						<Typography>
							{meKicked?.kickedForTimeout ? "You were kicked for being idle. You may rejoin this game any time!" : "You left or were kicked from this game"}
						</Typography>
					</Alert>
				)}
				{!winnerGuid && settings?.inviteLink && (
					<Typography variant={"caption"}>
						Chat/Video Invite: <a href={settings.inviteLink} target={"_blank"} rel={"nofollow noreferrer"}>{inviteLink}</a>
					</Typography>
				)}
				{winnerGuid && (
					<ShowWinner/>
				)}
				{!winnerGuid && (
					<ErrorBoundary>
						{(!started || !(amInGame || amSpectating)) && (
							<BeforeGame gameId={gameId} isOwner={isOwner}/>
						)}

						{started && amInGame && !isChooser && (
							<GamePlayWhite/>
						)}

						{started && amInGame && isChooser && (
							<GamePlayBlack/>
						)}

						{started && amSpectating && (
							<GamePlaySpectate/>
						)}
					</ErrorBoundary>
				)}
			</div>
		</div>
	);
};

interface BeforeGameProps
{
	isOwner: boolean;
	gameId: string;
}

const BeforeGame: React.FC<BeforeGameProps> = (props) =>
{
	return (
		<>
			{props.isOwner && (
				<GameStart id={props.gameId}/>
			)}

			{!props.isOwner && (
				<GameJoin id={props.gameId}/>
			)}
		</>
	);
};