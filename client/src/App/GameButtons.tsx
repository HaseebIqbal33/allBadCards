import {useDataStore} from "../Global/Utils/HookUtils";
import {PreferencesDataStore} from "../Global/DataStore/PreferencesDataStore";
import {SocketDataStore} from "../Global/DataStore/SocketDataStore";
import {default as React, useState} from "react";
import {Button, createStyles, Dialog, DialogActions, DialogContent, DialogTitle, Tooltip} from "@material-ui/core";
import {FaClipboardList, IoMdVolumeHigh, IoMdVolumeOff, MdSettings} from "react-icons/all";
import {GameRoster} from "../Areas/Game/Components/Gameplay/GameRoster";
import {GameSettings} from "@Areas/Game/GameSettings";
import makeStyles from "@material-ui/core/styles/makeStyles";
import {GameDataStore} from "../Global/DataStore/GameDataStore";
import {UserDataStore} from "../Global/DataStore/UserDataStore";
import {CloseableDialog} from "@UI/CloseableDialog";

const useStyles = makeStyles(theme => createStyles({
	settingsButton: {
		minWidth: 0,
		fontSize: "1.5rem",
	},
	firstButton: {
		minWidth: 0,
		marginLeft: "auto",
		fontSize: "1.5rem"
	},
	rosterButton: {
		minWidth: 0,
		fontSize: "1.5rem"
	},
}));

export const AppBarGameButtons = () =>
{
	const preferences = useDataStore(PreferencesDataStore);
	const socketData = useDataStore(SocketDataStore);
	const gameData = useDataStore(GameDataStore);
	const userData = useDataStore(UserDataStore);

	const classes = useStyles();
	const [rosterOpen, setRosterOpen] = useState(false);
	const [settingsOpen, setSettingsOpen] = useState(false);

	const muteLabel = preferences.muted ? "Unmute" : "Mute";

	const buttonColor = preferences.darkMode ? "secondary" : "primary";

	return (
		<>
			<Tooltip title={`${muteLabel} game sounds`} arrow>
				<Button color={buttonColor} aria-label={"Share"} className={classes.firstButton} size={"large"} onClick={() => PreferencesDataStore.setMute(!preferences.muted)}>
					{preferences.muted && (
						<IoMdVolumeOff/>
					)}
					{!preferences.muted && (
						<IoMdVolumeHigh/>
					)}
				</Button>
			</Tooltip>
			<Tooltip title={"Scoreboard"} arrow>
				<Button color={buttonColor} aria-label={"Scoreboard"} className={classes.rosterButton} size={"large"} onClick={() => setRosterOpen(true)}>
					<FaClipboardList/>
				</Button>
			</Tooltip>
			{gameData.game?.ownerGuid === userData.playerGuid && (
				<Tooltip title={"Game settings"} arrow>
					<Button color={buttonColor} aria-label={"Settings"} className={classes.settingsButton} size={"large"} onClick={() => setSettingsOpen(true)}>
						<MdSettings/>
					</Button>
				</Tooltip>
			)}
			<Dialog open={rosterOpen} onClose={() => setRosterOpen(false)}>
				<DialogTitle id="form-dialog-title">Game Roster</DialogTitle>
				<DialogContent>
					<GameRoster/>
				</DialogContent>
			</Dialog>
			<CloseableDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} TitleProps={{children: "Settings"}}>
				<DialogContent dividers>
					<GameSettings/>
				</DialogContent>
			</CloseableDialog>
			<Dialog open={socketData.lostConnection} onClose={() =>
			{
			}}>
				<DialogTitle id="form-dialog-title">Lost Connection</DialogTitle>
				<DialogContent>
					You have lost your connection to the server. Please check your connection, or retry. The most common reason for this to happen is switching tabs or leaving your browser for a while.
					<br/>
					<br/>
					If this behavior continues, please <a target={"_blank"} href={"https://github.com/jakelauer/allbadcards/issues/new?assignees=jakelauer&labels=bug&template=bug_report.md"}>click here</a> to report it.
				</DialogContent>
				<DialogActions>
					<Button color={"secondary"} variant={"outlined"} onClick={() => location.reload()}>Retry</Button>
				</DialogActions>
			</Dialog>
		</>
	);
};