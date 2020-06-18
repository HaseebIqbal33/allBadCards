import {GameChat} from "./GameChat";
import {Drawer, useMediaQuery} from "@material-ui/core";
import React from "react";
import makeStyles from "@material-ui/core/styles/makeStyles";
import {ChatDataStore} from "../../../../Global/DataStore/ChatDataStore";
import {useDataStore} from "../../../../Global/Utils/HookUtils";

interface Props
{
}

const useStyles = makeStyles({
	root: {
		overflow: "hidden"
	},
	paper: {
		paddingTop: 64,
		overflow: "hidden",
		width: 320,
	}
});

export const ChatSidebar: React.FC<Props> = () =>
{
	const classes = useStyles();
	const tablet = useMediaQuery('(max-width:1200px)');
	const chatData = useDataStore(ChatDataStore);

	if(tablet)
	{
		return null;
	}

	const chatDrawerOpen = chatData.sidebarOpen;

	return (
		<Drawer
			classes={classes}
			style={{flex: chatDrawerOpen ? 1 : 0, overflow: "hidden"}}
			variant="persistent"
			anchor="right"
			open={chatDrawerOpen}
		>
			<GameChat/>
		</Drawer>
	);
};