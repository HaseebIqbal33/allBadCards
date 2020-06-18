import React from "react";
import {Chip, Divider, List, ListItem, ListItemText, Typography} from "@material-ui/core";
import {useDataStore} from "../../Global/Utils/HookUtils";
import {AuthDataStore} from "../../Global/DataStore/AuthDataStore";

const Settings: React.FC = () =>
{
	const authData = useDataStore(AuthDataStore);

	return (
		<div>
			<Typography variant={"h3"} style={{marginBottom: "2rem"}}>
				Settings
			</Typography>
			<List>
				<ListItem>
					<ListItemText
						primary={"Backer Level"}
						secondary={<>
							{authData.levels?.reverse().map(level => (
								<Chip label={level} style={{marginRight: 5}}/>
							))}
						</>
						}
					/>
				</ListItem>
				<Divider/>
				<ListItem>
					<ListItemText
						primary={"More Coming Soon!"}
						secondary={"Seriously"}
					/>
				</ListItem>
			</List>
		</div>
	);
};

export default Settings;