import React from "react";
import {Typography} from "@material-ui/core";
import {makeStyles} from "@material-ui/core/styles";
import {GameDataStore} from "../../Global/DataStore/GameDataStore";
import {GameRoster} from "./Components/Gameplay/GameRoster";
import {CopyGameLink} from "../../UI/CopyGameLink";
import Divider from "@material-ui/core/Divider";
import {useDataStore} from "../../Global/Utils/HookUtils";
import {SocketDataStore} from "../../Global/DataStore/SocketDataStore";

interface IGamePreviewProps
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

const GamePreview: React.FC<IGamePreviewProps> = (props) =>
{
	const classes = useStyles();

	const gameData = useDataStore(GameDataStore);
	const socketData = useDataStore(SocketDataStore);

	if(props.id && !gameData.game && gameData.loaded && socketData.hasConnection)
	{
		return <Typography>No Game Found</Typography>;
	}

	const playerCount = Object.keys(gameData.game?.players ?? {}).length;
	const privacyLabel = gameData.ownerSettings?.public
		? <>PUBLIC</>
		: <>This game is <strong>private</strong>. You can make it public in Settings &raquo; General</>;

	return (
		<div style={{paddingTop: "2rem"}}>
			<Typography variant={"h4"}>Game</Typography>
			<Typography style={{}} variant={"caption"}>
				<em>{privacyLabel}</em>
			</Typography>
			<br/>
			<br/>
			<CopyGameLink />
			<Divider style={{margin: "3rem 0"}} />
			<Typography className={classes.playersLabel} variant={"h4"}>
				Players <span style={{fontSize: "1rem"}}>({playerCount} / {gameData.game?.settings.playerLimit} max)</span>
			</Typography>
			<GameRoster />
			{props.children}
		</div>
	);
};

export default GamePreview;