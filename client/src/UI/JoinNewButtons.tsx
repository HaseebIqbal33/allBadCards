import Button from "@material-ui/core/Button";
import {Link} from "react-router-dom";
import {FaArrowUp, FaPlus} from "react-icons/all";
import ButtonGroup from "@material-ui/core/ButtonGroup";
import * as React from "react";
import {useState} from "react";
import {useDataStore} from "../Global/Utils/HookUtils";
import {EnvDataStore} from "../Global/DataStore/EnvDataStore";
import {useMediaQuery} from "@material-ui/core";
import {LoadingButton} from "./LoadingButton";
import {SocketDataStore} from "../Global/DataStore/SocketDataStore";
import {Platform} from "../Global/Platform/platform";
import {GameDataStore} from "../Global/DataStore/GameDataStore";
import {UserDataStore} from "../Global/DataStore/UserDataStore";
import {useHistory} from "react-router";
import {SiteRoutes} from "../Global/Routes/Routes";
import {NicknameDialog} from "./NicknameDialog";

interface IJoinNewButtonsProps
{
	hideJoin?: boolean;
	hideNew?: boolean;
	fontSize?: string;
}

export const JoinNewButtons: React.FC<IJoinNewButtonsProps> = (props) =>
{
	const userData = useDataStore(UserDataStore);
	const envData = useDataStore(EnvDataStore);
	const history = useHistory();
	const familyMode = envData.site?.family;
	const mobile = useMediaQuery('(max-width:768px)');

	const [createLoading, setCreateLoading] = useState(false);
	const [nicknameDialogOpen, setNicknameDialogOpen] = useState(false);

	const createGame = async () =>
	{
		setCreateLoading(true);
		setNicknameDialogOpen(true);
	};

	const onNicknameClose = () =>
	{
		setCreateLoading(false);
		setNicknameDialogOpen(false);
	};

	const onNicknameConfirm = async (nickname: string) =>
	{
		SocketDataStore.clear();
		const game = await Platform.createGame(userData.playerGuid, nickname);
		setCreateLoading(false);
		GameDataStore.storeOwnedGames(game);
		history.push(SiteRoutes.Game.resolve({id: game.id}));
	};

	return (
		<>
			<ButtonGroup orientation={mobile ? "vertical" : "horizontal"}>
				{!familyMode && !props.hideJoin && (
					<Button
						variant="outlined"
						color="default"
						size="large"
						style={{
							fontSize: props.fontSize ?? "2rem"
						}}
						component={p => <Link to={"/games"} {...p} />}
						startIcon={<FaArrowUp/>}
					>
						Join Game
					</Button>
				)}
				{!props.hideNew && (
					<LoadingButton
						loading={createLoading}
						variant="contained"
						color="secondary"
						size="large"
						style={{
							fontSize: props.fontSize ?? "2rem"
						}}
						onClick={createGame}
						startIcon={<FaPlus/>}
					>
						New Game
					</LoadingButton>
				)}
			</ButtonGroup>

			<NicknameDialog
				open={nicknameDialogOpen}
				onClose={onNicknameClose}
				onConfirm={onNicknameConfirm}
				title={"Please enter your nickname:"}
			/>
		</>
	);
};