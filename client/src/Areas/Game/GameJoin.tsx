import React, {useEffect, useState} from "react";
import {Typography} from "@material-ui/core";
import {makeStyles} from "@material-ui/core/styles";
import GamePreview from "./GamePreview";
import {Platform} from "../../Global/Platform/platform";
import {UserDataStore} from "../../Global/DataStore/UserDataStore";
import {GameDataStore} from "../../Global/DataStore/GameDataStore";
import {NicknameDialog} from "../../UI/NicknameDialog";
import {LoadingButton} from "../../UI/LoadingButton";
import {BrowserUtils} from "../../Global/Utils/BrowserUtils";

interface IGameJoinProps
{
	id: string;
}

const useStyles = makeStyles({
	playersLabel: {
		marginTop: "2rem"
	},
	gameId: {
		padding: "1rem 0"
	}
});

const GameJoin: React.FC<IGameJoinProps> = (props) =>
{
	const [userData, setUserData] = useState(UserDataStore.state);
	const [gameData, setGameData] = useState(GameDataStore.state);
	const [nicknameDialogOpen, setNicknameDialogOpen] = useState(false);
	const [specMode, setSpecMode] = useState(false);
	const [joinLoading, setJoinLoading] = useState(false);

	useEffect(() =>
	{
		UserDataStore.listen(setUserData);
		GameDataStore.listen(setGameData);
	});

	const onJoinClick = () =>
	{
		setJoinLoading(true);
		setSpecMode(false);
		setNicknameDialogOpen(true);
	};

	const onSpectate = () =>
	{
		setJoinLoading(true);
		setSpecMode(true);
		setNicknameDialogOpen(true);
	};

	const onNicknameClose = () =>
	{
		setJoinLoading(false);
		setNicknameDialogOpen(false);
	};

	const onConfirm = (nickname: string) =>
	{
		BrowserUtils.scrollToTop();

		Platform.joinGame(userData.playerGuid, props.id, nickname.substr(0, 25), specMode)
			.catch(e => alert(e))
			.finally(() => setJoinLoading(false));
	};

	const joined = userData.playerGuid in (gameData.game?.players ?? {})
		|| userData.playerGuid in (gameData.game?.spectators ?? {})
		|| userData.playerGuid in (gameData.game?.pendingPlayers ?? {});

	return (
		<GamePreview id={props.id}>
			{!joined && (
				<>
					<LoadingButton loading={joinLoading} variant={"contained"} color={"secondary"} onClick={onJoinClick}>
						Join
					</LoadingButton>

					<LoadingButton loading={joinLoading} variant={"contained"} color={"secondary"} onClick={onSpectate} style={{marginLeft: "1rem"}}>
						Spectate
					</LoadingButton>

					<NicknameDialog
						open={nicknameDialogOpen}
						onClose={onNicknameClose}
						onConfirm={onConfirm}
						title={"Please enter your nickname:"}
					/>
				</>
			)}

			{joined && (
				<>
					{gameData.game?.started ? (
						<Typography>Waiting for next round to start...</Typography>
					):(
						<Typography>Waiting for game to start...</Typography>
					)}
				</>
			)}
		</GamePreview>
	);
};

export default GameJoin;