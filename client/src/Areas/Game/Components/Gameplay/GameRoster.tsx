import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import Divider from "@material-ui/core/Divider";
import React, {useState} from "react";
import {GameDataStore, GameDataStorePayload} from "@Global/DataStore/GameDataStore";
import {Dialog, DialogActions, DialogContent, DialogTitle, ListItemSecondaryAction} from "@material-ui/core";
import Button from "@material-ui/core/Button";
import {createStyles} from "@material-ui/styles";
import {UserDataStore} from "@Global/DataStore/UserDataStore";
import {Platform} from "@Global/Platform/platform";
import ListItemAvatar from "@material-ui/core/ListItemAvatar";
import Avatar from "@material-ui/core/Avatar";
import Typography from "@material-ui/core/Typography";
import Tooltip from "@material-ui/core/Tooltip";
import {GamePayload, GamePlayer} from "@Global/Platform/Contract";
import makeStyles from "@material-ui/core/styles/makeStyles";
import {useDataStore} from "@Global/Utils/HookUtils";
import {SocketDataStore} from "@Global/DataStore/SocketDataStore";
import {UserFlair} from "../Users/UserFlair";
import {getTrueRoundsToWin} from "@Global/Utils/GameUtils";

const useStyles = makeStyles(theme => createStyles({
	iconButton: {
		minWidth: 0,
		fontSize: "1.5rem",
	},
	avatarText: {
		color: theme.palette.secondary.contrastText
	}
}));

const getGamePlayer = (game: GamePayload | undefined, guid: string) =>
{
	return game?.players[guid] ?? game?.pendingPlayers[guid] ?? game?.spectators[guid];
};

export const GameRoster = () =>
{
	const socketData = useDataStore(SocketDataStore);
	const gameData = useDataStore(GameDataStore);
	const userData = useDataStore(UserDataStore);
	const [kickCandidate, setKickCandidate] = useState<string | null>(null);

	if (!gameData.game || !gameData.loaded || !socketData.hasConnection)
	{
		return null;
	}

	const game = gameData.game;
	const gameId = gameData.game.id;

	const onClickKick = (playerGuid: string) =>
	{
		setKickCandidate(playerGuid);
	};

	const onKickConfirm = () =>
	{
		if (kickCandidate)
		{
			setKickCandidate(null);
			Platform.removePlayer(gameId, kickCandidate, userData.playerGuid)
				.catch(e => console.error(e));
		}
	};

	const playerGuids = Object.keys({...game.players, ...game.pendingPlayers});
	const sortedPlayerGuids = [...playerGuids].sort((a, b) =>
		(getGamePlayer(game, b)?.wins ?? 0) - (getGamePlayer(game, a)?.wins ?? 0));
	const spectatorGuids = Object.keys(game.spectators);

	const isOwner = gameData.game?.ownerGuid === userData.playerGuid;
	const playerCount = playerGuids.length;

	return (
		<div style={{width: "75vw", maxWidth: 500}}>
			<List style={{marginBottom: "1em"}}>
				<Divider/>
				<ListItemText primary={`${getTrueRoundsToWin(gameData.game)} Rounds Required to Win`} secondary={` (modifiable in Gameplay Settings)`}/>
			</List>
			<List>
				{sortedPlayerGuids.map(pg =>
				{
					const player = getGamePlayer(game, pg);
					const isSelf = pg === userData.playerGuid;

					if (!player)
					{
						return null;
					}

					return (
						<RosterPlayer
							gameData={gameData}
							isSelf={isSelf}
							isOwner={isOwner}
							onClickKick={onClickKick}
							player={player}
							playerCount={playerCount}
						/>
					)
				})}
			</List>

			<Typography style={{margin: "1rem 0 0"}} variant={"h6"}>
				Spectators
			</Typography>

			<List>
				{spectatorGuids.map(pg =>
				{
					const player = getGamePlayer(game, pg);
					const isSelf = pg === userData.playerGuid;

					if (!player)
					{
						return null;
					}

					return (
						<RosterPlayer
							gameData={gameData}
							isSelf={isSelf}
							isOwner={isOwner}
							onClickKick={onClickKick}
							player={player}
							playerCount={9999}
						/>
					)
				})}
			</List>

			<Dialog open={!!kickCandidate} onClose={() => setKickCandidate(null)}>
				<DialogTitle>Confirm</DialogTitle>
				{!!kickCandidate && (
					<DialogContent>
						Are you sure you want to remove {unescape(gameData.game?.players?.[kickCandidate]?.nickname)} from this game?
					</DialogContent>
				)}
				<DialogActions>
					<Button variant={"contained"} color={"secondary"} onClick={onKickConfirm}>Kick em!</Button>
				</DialogActions>
			</Dialog>
		</div>
	);
};

interface RosterPlayer
{
	gameData: GameDataStorePayload;
	player: GamePlayer;
	isOwner: boolean;
	isSelf: boolean;
	playerCount: number;
	onClickKick: (guid: string) => void;
}

const RosterPlayer: React.FC<RosterPlayer> = (
	{
		gameData,
		player,
		isOwner,
		isSelf,
		onClickKick,
		playerCount
	}
) =>
{
	const classes = useStyles();
	const game = gameData.game;
	if(!game)
	{
		return null;
	}

	return (
		<React.Fragment key={player.guid}>
			<ListItem>
				{game.started && (
					<ListItemAvatar>
						<Avatar>
							<strong className={classes.avatarText}>{player?.wins}</strong>
						</Avatar>
					</ListItemAvatar>
				)}
				<ListItemText>
					<UserFlair player={player}/>
					{unescape(player.nickname ?? "Spectator")}
					{player.guid === gameData.game?.ownerGuid && <>
                        <span> (Owner)</span>
                    </>}
					{player.guid in (gameData.game?.pendingPlayers ?? {}) && <>
                        <span> (Waiting for next round)</span>
                    </>}
				</ListItemText>

				{(isOwner || isSelf) && playerCount > 1 && (
					<ListItemSecondaryAction>
						<Tooltip title={`Remove this player`} aria-label={`Remove this player`} arrow>
							<Button size={"large"} onClick={() => onClickKick(player.guid)}>
								{isSelf ? "Leave Game" : "Remove"}
							</Button>
						</Tooltip>
					</ListItemSecondaryAction>
				)}
			</ListItem>
			<Divider/>
		</React.Fragment>
	);
};