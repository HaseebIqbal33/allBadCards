import {useDataStore} from "../Global/Utils/HookUtils";
import {ErrorDataStore} from "../Global/DataStore/ErrorDataStore";
import {CloseableDialog} from "../UI/CloseableDialog";
import {DialogContent, List, ListItem, ListItemText} from "@material-ui/core";
import * as React from "react";

export const ErrorModal = () =>
{
	const errorData = useDataStore(ErrorDataStore);
	const errors = errorData.errors ?? [];

	return (
		<CloseableDialog open={errors.length > 0} onClose={() => ErrorDataStore.clear()} TitleProps={{children: "Error Encountered"}}>
			<DialogContent style={{display: "flex", flexDirection: "column", alignItems: "center"}}>
				<List style={{minWidth: "20rem"}}>
					{errors.map(e => (
						<ListItem>
							<ListItemText>
								{e.message}
							</ListItemText>
						</ListItem>
					))}
				</List>
			</DialogContent>
		</CloseableDialog>
	);
};