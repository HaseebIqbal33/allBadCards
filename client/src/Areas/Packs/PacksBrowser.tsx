import React, {useEffect, useState} from "react";
import {Button, createStyles, Divider, FormControl, FormControlLabel, FormGroup, Grid, InputLabel, MenuItem, Select, Switch, TextField, Typography} from "@material-ui/core";
import {Pagination} from "@material-ui/lab";
import {Platform} from "../../Global/Platform/platform";
import {ICustomPackSearchResult, PackCategories, PackSearchSort} from "../../Global/Platform/Contract";
import {ErrorDataStore} from "../../Global/DataStore/ErrorDataStore";
import makeStyles from "@material-ui/core/styles/makeStyles";
import {PackSummary} from "./PackSummary";
import {ValuesOf} from "../../../../server/Engine/Games/Game/GameContract";
import {useDataStore} from "../../Global/Utils/HookUtils";
import {AuthDataStore} from "../../Global/DataStore/AuthDataStore";
import {EnvDataStore} from "../../Global/DataStore/EnvDataStore";
import {SiteRoutes} from "../../Global/Routes/Routes";
import {Link} from "react-router-dom";
import Helmet from "react-helmet";

const useStyles = makeStyles(theme => createStyles({
	cardContainer: {
		padding: "1rem 0",
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

interface IPacksBrowserProps
{
}

const PacksBrowser: React.FC<IPacksBrowserProps> = (props) =>
{
	const [currentPage, setCurrentPage] = useState(0);
	const [searchedPacks, setSearchedPacks] = useState<ICustomPackSearchResult | null>(null);

	const [searchCategory, setSearchCategory] = useState<ValuesOf<typeof PackCategories> | undefined>(undefined);
	const [sort, setSort] = useState<PackSearchSort>("favorites");
	const authData = useDataStore(AuthDataStore);
	const envData = useDataStore(EnvDataStore);
	const [searchText, setSearchText] = useState("");
	const [searchNsfw, setSearchNsfw] = useState(!!envData.site.base);
	useEffect(() =>
	{
		searchPacks(0);
	}, [searchText, searchNsfw, searchCategory, sort]);

	const searchPacks = (page = 0) =>
	{
		window.clearTimeout(searchTimer);

		searchTimer = window.setTimeout(() =>
		{
			Platform.searchPacks({
				nsfw: searchNsfw,
				category: searchCategory ?? undefined,
				search: searchText,
				sort
			}, page)
				.then(data =>
				{
					setSearchedPacks(data.result);
				})
				.catch(ErrorDataStore.add);
		}, 250);
	};

	const handleChange = (event: React.ChangeEvent<unknown>, value: number) =>
	{
		setCurrentPage(value - 1);
		searchPacks(value - 1);
	};

	const classes = useStyles();

	const packCount = searchedPacks?.packs?.length ?? 0;
	const pageCount = packCount >= 8 ? currentPage + 8 : currentPage + 1;

	return (
		<div>
			<Helmet>
				<title>Custom Card Packs</title>
			</Helmet>
			<Typography variant={"h6"}>
				Want to create your own pack?
				<br/>
				<Button component={p => <Link {...p} to={SiteRoutes.MyPacks.resolve()}/>} color={"secondary"} variant={"contained"}>
					Create a Pack
				</Button>
			</Typography>
			<Divider style={{margin: "1rem 0"}}/>
			<Typography variant={"h5"}>
				Search Custom Packs
			</Typography>
			<Typography variant={"subtitle2"}>
				Save a pack to make it easier to add to new games!
			</Typography>
			<Grid container>
				<FormControl component="fieldset" style={{width: "100%"}}>
					<FormGroup classes={{
						root: classes.searchForm
					}}>

						<Grid item xs={12} md={3}>
							<FormControl style={{width: "90%", marginRight: "1rem"}} variant="outlined">
								<TextField
									value={searchText}
									variant="outlined"
									placeholder={"Search"}
									onChange={e => setSearchText(e.target.value)}
									color={"secondary"}
								/>
							</FormControl>
						</Grid>

						<Grid item xs={12} md={3}>
							<FormControl style={{width: "90%", margin: "1rem 1rem 1rem 0"}} variant="outlined">
								<InputLabel id="input-categories">Search Category</InputLabel>
								<Select
									labelId="input-categories"
									id="demo-simple-select-outlined"
									label="Category"
									value={searchCategory}
									MenuProps={{
										anchorOrigin: {
											vertical: "bottom",
											horizontal: "left"
										},
										getContentAnchorEl: null
									}}
									onChange={e => setSearchCategory(e.target.value as ValuesOf<typeof PackCategories>)}
								>
									{PackCategories.map((cat) => (
										<MenuItem key={cat} value={cat}>
											{cat}
										</MenuItem>
									))}
								</Select>
							</FormControl>
						</Grid>

						<Grid item xs={12} md={3}>
							<FormControl style={{width: "90%", margin: "1rem 1rem 1rem 0"}} variant="outlined">
								<InputLabel id="input-categories">Sort</InputLabel>
								<Select
									labelId="input-categories"
									id="demo-simple-select-outlined"
									label="Sort"
									value={sort}
									MenuProps={{
										anchorOrigin: {
											vertical: "bottom",
											horizontal: "left"
										},
										getContentAnchorEl: null
									}}
									onChange={e => setSort(e.target.value as PackSearchSort)}
								>
									<MenuItem value={"favorites"}>
										Most Popular
									</MenuItem>
									<MenuItem value={"largest"}>
										Most Cards
									</MenuItem>

									<MenuItem value={"newest"}>
										Newest
									</MenuItem>
								</Select>
							</FormControl>
						</Grid>

						<Grid item xs={12} md={3}>
							<FormControlLabel
								control={<Switch checked={searchNsfw} onChange={e => setSearchNsfw(e.target.checked)}/>}
								disabled={!envData.site?.base}
								label="NSFW"
							/>
						</Grid>
					</FormGroup>
				</FormControl>
			</Grid>
			<Pagination page={currentPage + 1} count={pageCount} onChange={handleChange} style={{marginTop: "3rem"}}/>
			<Grid container spacing={2} className={classes.cardContainer}>
				{searchedPacks?.packs?.map(pack =>
				{
					const faved = !!searchedPacks.userFavorites[pack.id];
					return (
						<Grid item xs={12} sm={6} md={4} lg={3}>
							<PackSummary
								authed={authData.authorized}
								canEdit={pack.owner === authData.userId}
								pack={pack}
								favorited={faved}/>
						</Grid>
					);
				})}

				{(!searchedPacks?.packs?.length) ? (
					<Typography style={{padding: "3rem 1rem"}} variant={"h5"}>No results.</Typography>
				) : undefined}
			</Grid>
			<Pagination page={currentPage + 1} count={pageCount} onChange={handleChange}/>
		</div>
	);
};

export default PacksBrowser;