import {Badge, Dialog, DialogContent, useMediaQuery} from "@material-ui/core";
import React, {useState} from "react";
import Fab from "@material-ui/core/Fab";
import {FiMessageCircle} from "react-icons/all";
import makeStyles from "@material-ui/core/styles/makeStyles";
import {GameChat} from "./GameChat";
import {useDataStore} from "../../../../Global/Utils/HookUtils";
import {ChatDataStore} from "../../../../Global/DataStore/ChatDataStore";

interface IGameChatProps
{
	showChat: boolean;
}

const useStyles = makeStyles({
	root: {
		overflowX: "hidden"
	},
	dialogContent: {
		overflowX: "hidden",
		height: "100%"
	},
	dialogContainer: {
		alignItems: "flex-end",
		justifyContent: "flex-end",
		height: "100%"
	}
});

export const GameChatFab: React.FC<IGameChatProps> = (props) =>
{
	const classes = useStyles();
	const [dialogOpen, setDialogOpen] = useState(false);
	const tablet = useMediaQuery('(max-width:1200px)');
	const chatData = useDataStore(ChatDataStore);

	const openDialog = () => {
		setDialogOpen(true);
		ChatDataStore.acknowledge();
	};

	if(dialogOpen && chatData.unseenChatMessages > 0)
	{
		ChatDataStore.acknowledge();
	}

	if (!tablet)
	{
		return null;
	}

	return (
		<>
			{(props.showChat) && (
				<Fab variant="extended"
				     color="secondary"
				     aria-label="add"
				     onClick={openDialog}
				     style={{position: "fixed", bottom: 15, right: 15, zIndex: 15}}>
					<Badge badgeContent={chatData.unseenChatMessages} color="primary">
						<FiMessageCircle style={{marginRight: "1rem", fontSize: "1.5rem"}}/> Chat
					</Badge>
				</Fab>
			)}
			<Dialog open={dialogOpen} maxWidth={"xl"} fullWidth={true} classes={{
				root: classes.root,
				paper: classes.dialogContent,
				container: classes.dialogContainer,
			}} onClose={() => setDialogOpen(false)} style={{bottom: 15}}>
				<DialogContent style={{overflowX: "hidden", display: "flex", flexDirection: "column"}}>
					<GameChat/>
				</DialogContent>
			</Dialog>
		</>
	);
};