import React, {useEffect, useState} from "react";
import {Button, createStyles, Grid, Typography} from "@material-ui/core";
import {Platform} from "../../Global/Platform/platform";
import {ICustomPackSearchResult} from "../../Global/Platform/Contract";
import {FaPlus} from "react-icons/all";
import {ErrorDataStore} from "../../Global/DataStore/ErrorDataStore";
import {Link} from "react-router-dom";
import makeStyles from "@material-ui/core/styles/makeStyles";
import {SiteRoutes} from "../../Global/Routes/Routes";
import {PackSummary} from "./PackSummary";
import {useDataStore} from "../../Global/Utils/HookUtils";
import {AuthDataStore} from "../../Global/DataStore/AuthDataStore";
import {Alert, AlertTitle} from "@material-ui/lab";

const useStyles = makeStyles(theme => createStyles({
	cardContainer: {
		padding: "1rem 0",
		minHeight: "50vh"
	},
	avatar: {
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		width: "2rem",
		height: "2rem",
		marginRight: "0.5rem",
		background: theme.palette.secondary.main
	},
	avatarText: {
		color: theme.palette.secondary.contrastText,
		fontSize: "0.75rem"
	},
	cardListItem: {
		display: "flex",
		padding: "0.5rem 0",
		alignItems: "center"
	},
	actions: {
		justifyContent: "flex-end"
	},
	searchForm: {
		flexDirection: "initial",
		alignItems: "center",
		marginTop: "2rem"
	}
}));

let searchTimer = 0;

const MyPacks = () =>
{
	const [myPacks, setMyPacks] = useState<ICustomPackSearchResult | null>(null);
	const authData = useDataStore(AuthDataStore);

	useEffect(() =>
	{
		if (authData.authorized)
		{
			Platform.getMyPacks()
				.then(data =>
				{
					setMyPacks(data.result);
				})
				.catch(ErrorDataStore.add);
		}
	}, []);

	if(!authData.authorized)
	{
		return (
			<Alert color={"error"}>
				<AlertTitle>Log In Required</AlertTitle>
				This page requires you to log in. You can log in at the top right corner.
			</Alert>
		);
	}

	return (
		<div>
			<Typography variant={"h5"}>
				My Card Packs
			</Typography>
			<Grid container spacing={3} style={{padding: "2rem 0"}}>
				{myPacks?.packs?.map(pack => (
					<Grid item xs={12} sm={6} md={4} lg={3}>
						<PackSummary
							authed={authData.authorized}
							canEdit={pack.owner === authData.userId}
							pack={pack}
							favorited={myPacks.userFavorites[pack.definition.pack.id]}/>
					</Grid>
				))}
			</Grid>
			<div style={{padding: "1rem 0"}}>
				<Button startIcon={<FaPlus/>} size={"large"} style={{fontSize: "1.25rem"}} color={"secondary"} variant={"contained"} component={p => <Link {...p} to={SiteRoutes.PackCreate.resolve()}/>}>
					New Custom Pack
				</Button>
			</div>
		</div>
	);
};

export default MyPacks;