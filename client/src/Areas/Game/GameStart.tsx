import React, {useState} from "react";
import GamePreview from "./GamePreview";
import {Platform} from "../../Global/Platform/platform";
import {UserDataStore} from "../../Global/DataStore/UserDataStore";
import {GameDataStore} from "../../Global/DataStore/GameDataStore";
import Typography from "@material-ui/core/Typography";
import {GameSettings} from "./GameSettings";
import Divider from "@material-ui/core/Divider";
import {LoadingButton} from "../../UI/LoadingButton";
import {MdAdd} from "react-icons/all";
import {useDataStore} from "../../Global/Utils/HookUtils";
import {Tooltip} from "@material-ui/core";
import {BrowserUtils} from "../../Global/Utils/BrowserUtils";

interface IGameStartProps
{
	id: string;
}

const GameStart: React.FC<IGameStartProps> = (props) =>
{
	const gameData = useDataStore(GameDataStore);
	const userData = useDataStore(UserDataStore);
	const [startLoading, setStartLoading] = useState(false);
	const [randomPlayerLoading, setRandomPlayerLoading] = useState(false);

	const onClickStart = () =>
	{
		setStartLoading(true);

		BrowserUtils.scrollToTop();

		Platform.startGame(
			UserDataStore.state.playerGuid,
			props.id,
			gameData.ownerSettings)
			.catch(e => console.error(e))
			.finally(() => setStartLoading(false));
	};

	const onClickAddRandom = () =>
	{
		setRandomPlayerLoading(true);
		GameDataStore.addRandomPlayer(userData.playerGuid)
			.finally(() => setRandomPlayerLoading(false));
	};

	const players = gameData.game?.players ?? {};
	const playerGuids = Object.keys(gameData.game?.players ?? {});
	const randomPlayers = playerGuids.filter(pg => players[pg]?.isRandom) ?? [];
	const canAddRandom = randomPlayers.length < 10;
	const selectedPacks = [...gameData.ownerSettings.includedPacks, ...gameData.ownerSettings.includedCustomPackIds];
	const canStart = selectedPacks.length > 0;

	return (
		<GamePreview id={props.id}>
			<Tooltip placement={"top"} arrow title={canStart ? "Start the game!" : "You must have packs selected to play."} >
				<span>
					<LoadingButton loading={startLoading} variant={"contained"} color={"secondary"} onClick={onClickStart}
					               disabled={!canStart} style={{pointerEvents: "auto"}}>
						Start
					</LoadingButton>
				</span>
			</Tooltip>
			<Tooltip placement={"top"} arrow title={"A fake player! If he wins, everyone else feels shame. Add up to 10."}>
				<span>
					<LoadingButton
						loading={startLoading || randomPlayerLoading}
						startIcon={<MdAdd/>}
						variant={"contained"}
						color={"secondary"}
						onClick={onClickAddRandom}
						style={{marginLeft: "1rem"}}
						disabled={!canAddRandom}>
						AI Player
					</LoadingButton>
				</span>
			</Tooltip>
			<Divider style={{margin: "3rem 0"}}/>
			<Typography variant={"h4"}>Settings</Typography>
			<GameSettings/>
		</GamePreview>
	);
};

export default GameStart;