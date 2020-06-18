import * as React from "react";
import makeStyles from "@material-ui/core/styles/makeStyles";
import {Container, Paper, useMediaQuery} from "@material-ui/core";
import {ChatDataStore} from "../Global/DataStore/ChatDataStore";
import {useDataStore} from "../Global/Utils/HookUtils";
import {useHistory} from "react-router";

const useStyles = makeStyles({
	container: {
		position: "fixed",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		bottom: 0,
		left: 0,
		width: "100%",
		zIndex: 99
	},
	inner: {
		boxSizing:"border-box",
		display: "flex",
		width: "100%",
		background: "white",
		justifyContent: "center",
		padding: "1rem 0",
		boxShadow: "0 -15px 10px -15px rgba(0,0,0,1)"
	}
});

export const Confirmation: React.FC = (props) =>
{
	const history = useHistory();
	const chatData = useDataStore(ChatDataStore);
	const classes = useStyles();
	const chatDrawerOpen = chatData.sidebarOpen;
	const tablet = useMediaQuery('(max-width:1200px)');
	const isGamePage = history.location.pathname.startsWith("/game/");

	return (
		<Paper className={classes.container} style={{maxWidth: (isGamePage && chatDrawerOpen && !tablet) ? "calc(100% - 320px)" : "100%"}}>
			<Container maxWidth={"xl"} style={{padding :0}}>
				<div className={classes.inner}>
					{props.children}
				</div>
			</Container>
		</Paper>
	);
};