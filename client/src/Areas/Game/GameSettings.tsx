import React, {useState} from "react";
import {DialogActions, ListItemAvatar, ListItemSecondaryAction, Typography} from "@material-ui/core";
import {useDataStore} from "@Global/Utils/HookUtils";
import {GameDataStore} from "@Global/DataStore/GameDataStore";
import Button from "@material-ui/core/Button";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import DialogContent from "@material-ui/core/DialogContent";
import {SettingsBlockGame} from "./Components/Settings/SettingsBlockGame";
import {GiCardPlay, MdEdit, MdSettings} from "react-icons/all";
import {SettingsBlockMainPacks} from "./Components/Settings/SettingsBlockMainPacks";
import IconButton from "@material-ui/core/IconButton";
import {SettingsBlockCustomPacks} from "./Components/Settings/SettingsBlockCustomPacks";
import Avatar from "@material-ui/core/Avatar";
import {UserDataStore} from "@Global/DataStore/UserDataStore";
import {SettingsBlockGeneral} from "./Components/Settings/SettingsBlockGeneral";
import {Link} from "react-router-dom";
import {SiteRoutes} from "@Global/Routes/Routes";
import {CloseableDialog} from "@UI/CloseableDialog";

export const GameSettings = () =>
{
	const userData = useDataStore(UserDataStore);
	const gameData = useDataStore(GameDataStore);
	const [gameSettingsVisible, setGameSettingsVisible] = useState(false);
	const [generalSettingsVisible, setGeneralSettingsVisible] = useState(false);
	const [mainPackSettingsVisible, setMainPackSettingsVisible] = useState(false);
	const [customPackSettingsVisible, setCustomPackSettingsVisible] = useState(false);
	const isOwner = userData.playerGuid === gameData.game?.ownerGuid;

	if(!isOwner)
	{
		return (
			<div>
				<Typography>Only the game owner can edit settings</Typography>
			</div>
		)
	}

	return (
		<div>
			<div style={{marginTop: "1rem"}}>
				<List>
					<ListItem>
						<ListItemAvatar>
							<Avatar>
								<MdSettings style={{color: "black"}}/>
							</Avatar>
						</ListItemAvatar>
						<ListItemText primary={"General"} secondary={"General settings"}/>
						<ListItemSecondaryAction style={{right: 0}}>
							<IconButton color={"secondary"} onClick={() => setGeneralSettingsVisible(true)}>
								<MdEdit/>
							</IconButton>
						</ListItemSecondaryAction>
					</ListItem>
					<ListItem>
						<ListItemAvatar>
							<Avatar>
								<GiCardPlay style={{color: "black"}}/>
							</Avatar>
						</ListItemAvatar>
						<ListItemText primary={"Gameplay"} secondary={"Change how the game is played"}/>
						<ListItemSecondaryAction style={{right: 0}}>
							<IconButton color={"secondary"} onClick={() => setGameSettingsVisible(true)}>
								<MdEdit/>
							</IconButton>
						</ListItemSecondaryAction>
					</ListItem>
					<ListItem>
						<ListItemAvatar>
							<Avatar>
								<strong style={{color: "black"}}>{(gameData.ownerSettings?.includedPacks.length ?? 0).toString()}</strong>
							</Avatar>
						</ListItemAvatar>
						<ListItemText primary={"Built-in Card Packs"} secondary={"Pick from built-in card packs for your game"}/>
						<ListItemSecondaryAction style={{right: 0}}>
							<IconButton color={"secondary"} onClick={() => setMainPackSettingsVisible(true)}>
								<MdEdit/>
							</IconButton>
						</ListItemSecondaryAction>
					</ListItem>
					<ListItem>
						<ListItemAvatar>
							<Avatar>
								<strong style={{color: "black"}}>{(gameData.ownerSettings?.includedCustomPackIds.length ?? 0).toString()}</strong>
							</Avatar>
						</ListItemAvatar>
						<ListItemText primary={"Custom Card Packs"} secondary={
							<span>
								Add custom card packs from our growing list of <Link to={SiteRoutes.PacksBrowser.resolve()}>Custom Packs</Link>.
							</span>
						}/>
						<ListItemSecondaryAction style={{right: 0}}>
							<IconButton color={"secondary"} onClick={() => setCustomPackSettingsVisible(true)}>
								<MdEdit/>
							</IconButton>
						</ListItemSecondaryAction>
					</ListItem>
				</List>
			</div>
			<CloseableDialog open={generalSettingsVisible} onClose={() => setGeneralSettingsVisible(false)} TitleProps={{children: "General"}}>
				<DialogContent dividers>
					<SettingsBlockGeneral/>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setGeneralSettingsVisible(false)} color="secondary">
						Save
					</Button>
				</DialogActions>
			</CloseableDialog>

			<CloseableDialog open={gameSettingsVisible} onClose={() => setGameSettingsVisible(false)} TitleProps={{children: "Game"}}>
				<DialogContent dividers>
					<SettingsBlockGame/>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setGameSettingsVisible(false)} color="secondary">
						Save
					</Button>
				</DialogActions>
			</CloseableDialog>

			<CloseableDialog open={mainPackSettingsVisible} onClose={() => setMainPackSettingsVisible(false)} maxWidth={"xl"} TitleProps={{children: "Built-in Card Packs"}}>
				<DialogContent dividers>
					<SettingsBlockMainPacks/>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setMainPackSettingsVisible(false)} color="secondary">
						Save
					</Button>
				</DialogActions>
			</CloseableDialog>

			<CloseableDialog open={customPackSettingsVisible} onClose={() => setCustomPackSettingsVisible(false)} maxWidth={"xl"} TitleProps={{children: "Custom Card Packs"}}>
				<DialogContent dividers>
					<SettingsBlockCustomPacks/>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setCustomPackSettingsVisible(false)} color="secondary">
						Save
					</Button>
				</DialogActions>
			</CloseableDialog>
		</div>
	);
};
