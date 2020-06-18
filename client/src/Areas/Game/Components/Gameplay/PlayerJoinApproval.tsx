import React from "react";
import {Button, ButtonGroup, Dialog, DialogContent, DialogTitle, List, ListItem, ListItemSecondaryAction, ListItemText, Typography} from "@material-ui/core";
import {useDataStore} from "@Global/Utils/HookUtils";
import {GameDataStore} from "@Global/DataStore/GameDataStore";
import {GamePlayer} from "@Global/Platform/Contract";
import {UserDataStore} from "@Global/DataStore/UserDataStore";
import {Platform} from "@Global/Platform/platform";

export const PlayerJoinApproval = () =>
{
	let open = false;
	const gameData = useDataStore(GameDataStore);
	const userData = useDataStore(UserDataStore);

	if (userData.playerGuid !== gameData.game?.ownerGuid)
	{
		return null;
	}

	const gameId = gameData.game?.id;
	if (!gameId)
	{
		return null;
	}

	const requiresApproval = gameData.game?.settings.requireJoinApproval;

	let playersRequiringApproval: GamePlayer[] = [];
	if (requiresApproval)
	{
		const pending = gameData.game?.pendingPlayers ?? {};
		const spectators = gameData.game?.spectators ?? {};
		const allPlayers = Object.values({...pending, ...spectators});
		playersRequiringApproval = allPlayers.filter(p => p.isApproved === null);
	}

	const setApproval = (targetGuid: string, approved: boolean) =>
	{
		Platform.setPlayerApproval(gameId!, targetGuid, approved);
	};

	return (
		<Dialog open={playersRequiringApproval.length > 0} onClose={() =>
		{
		}}>
			<DialogTitle>Join Requests</DialogTitle>
			<DialogContent>
				<Typography>The following players have requested to join this game:</Typography>
				<List>
					{playersRequiringApproval.map((player, i) => (
						<ListItem divider={i < playersRequiringApproval.length - 1}>
							<ListItemText>
								{unescape(player.nickname)}
							</ListItemText>
							<ListItemSecondaryAction>
								<ButtonGroup>
									<Button onClick={() => setApproval(player.guid, false)}>Deny</Button>
									<Button onClick={() => setApproval(player.guid, true)} color={"secondary"}>Approve</Button>
								</ButtonGroup>
							</ListItemSecondaryAction>
						</ListItem>
					))}
				</List>
			</DialogContent>
		</Dialog>
	);
};