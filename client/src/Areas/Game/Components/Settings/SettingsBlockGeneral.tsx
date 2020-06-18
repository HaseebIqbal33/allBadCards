import React, {ChangeEvent, useState} from "react";
import {GameDataStore, GameDataStorePayload} from "../../../../Global/DataStore/GameDataStore";
import FormControl from "@material-ui/core/FormControl";
import Divider from "@material-ui/core/Divider";
import {ListItemSecondaryAction, TextField, Typography} from "@material-ui/core";
import {useDataStore} from "../../../../Global/Utils/HookUtils";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import Switch from "@material-ui/core/Switch";
import List from "@material-ui/core/List";

const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;

export const SettingsBlockGeneral: React.FC = () =>
{
	const gameData = useDataStore(GameDataStore);

	return (
		<List style={{paddingBottom: "1rem"}}>
			<MakePrivate gameData={gameData} />

			<Divider style={{margin: "0 0 1rem 0"}}/>
			<UrlField gameData={gameData}/>

			<Divider style={{margin: "0 0 1rem 0"}}/>
			<RequireJoinApproval gameData={gameData} />
		</List>
	);
};


interface IGameDataProps
{
	gameData: GameDataStorePayload;
}

let timeout = 0;
const UrlField: React.FC<IGameDataProps> = ({
	                                            gameData
                                            }) =>
{
	const [url, setUrl] = useState(gameData.ownerSettings.inviteLink ?? "");
	const [invalid, setInvalid] = useState(false);

	const setOuter = (value: string) =>
	{
		setUrl(value);

		clearTimeout(timeout);
		timeout = window.setTimeout(() =>
		{
			const invalid = value.length > 0 && !value.match(urlRegex);
			setInvalid(invalid);
			if (!invalid)
			{
				GameDataStore.setInviteLink(value);
			}
		}, 500);
	};

	return (
		<ListItem>
			<FormControl component="fieldset" style={{width: "100%"}}>
				<Typography>Chat / Video invite URL</Typography>
				<Typography style={{marginBottom: "0.5rem"}} variant={"caption"}>Allow players to easily join your video chat by adding an invite URL</Typography>
				<TextField color={"secondary"} value={url} label="URL" variant="outlined" onChange={(e) => setOuter(e.target.value)} error={invalid}/>
			</FormControl>
		</ListItem>
	);
};

const MakePrivate: React.FC<IGameDataProps> = (
	{
		gameData
	}
) =>
{
	const onChange = (e: ChangeEvent<{}>, v: boolean) =>
	{
		GameDataStore.setGamePublic(v);
	};

	return (
		<FormControl component="fieldset" style={{width: "100%"}}>
			<ListItem>
				<ListItemText primary={"Make Public"} secondary={`When enabled, this game will be visible and joinable by anybody from the game list page.`}/>
				<ListItemSecondaryAction>
					<Switch
						edge="end"
						color={"secondary"}
						onChange={onChange}
						name={"isPublic"}
						checked={gameData.ownerSettings.public}
					/>
				</ListItemSecondaryAction>
			</ListItem>
		</FormControl>
	);
};

const RequireJoinApproval: React.FC<IGameDataProps> = (
	{
		gameData
	}
) =>
{
	const onChange = (e: ChangeEvent<{}>, v: boolean) =>
	{
		GameDataStore.setRequireJoinApproval(v);
	};

	return (
		<FormControl component="fieldset" style={{width: "100%"}}>
			<ListItem>
				<ListItemText primary={"Require Approval to Join"} secondary={`When enabled, any player joining must be approved by the game owner to join.`}/>
				<ListItemSecondaryAction>
					<Switch
						edge="end"
						color={"secondary"}
						onChange={onChange}
						name={"isPublic"}
						checked={gameData.ownerSettings.requireJoinApproval}
					/>
				</ListItemSecondaryAction>
			</ListItem>
		</FormControl>
	);
};