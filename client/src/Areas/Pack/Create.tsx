import React, {useEffect, useState} from "react";
import {Button, ButtonGroup, DialogActions, DialogContent, Divider, FormControl, FormControlLabel, FormGroup, Grid, InputLabel, MenuItem, Select, Switch, TextField, Typography, useMediaQuery} from "@material-ui/core";
import makeStyles from "@material-ui/core/styles/makeStyles";
import {Alert, AlertTitle, Pagination} from "@material-ui/lab";
import {useDataStore} from "@Global/Utils/HookUtils";
import {PackCreatorDataStore} from "@Global/DataStore/PackCreatorDataStore";
import {AuthDataStore} from "@Global/DataStore/AuthDataStore";
import {Confirmation} from "@UI/Confirmation";
import {FaSave} from "react-icons/all";
import {useHistory, useParams} from "react-router";
import {SiteRoutes} from "@Global/Routes/Routes";
import {PackCategories} from "@Global/Platform/Contract";
import {ValuesOf} from "../../../../server/Engine/Games/Game/GameContract";
import {BrowserUtils} from "@Global/Utils/BrowserUtils";
import {ContainerProgress} from "@UI/ContainerProgress";
import {JsonUpload} from "./Create/JsonUpload";
import {EditableWhite} from "./Create/EditableWhite";
import {EditableBlack} from "./Create/EditableBlack";
import {CloseableDialog} from "@UI/CloseableDialog";
import Helmet from "react-helmet";
import {JsonExport} from "@Areas/Pack/Create/JsonExport";

const useStyles = makeStyles(theme => ({
	divider: {
		margin: "1rem 0"
	},
	blackInput: {
		color: theme.palette.secondary.contrastText
	},
	whiteInput: {
		color: theme.palette.primary.contrastText
	},
	section: {
		marginTop: "2rem"
	},
	filterSection: {
		margin: "2rem 0 -1rem"
	},
	blackCardTextField: {
		'& .MuiOutlinedInput-root': {
			'& fieldset': {
				borderColor: 'white',
			},
		},
	},
	whiteCardTextField: {
		'& .MuiOutlinedInput-root': {
			'& fieldset': {
				borderColor: 'black',
			},
		},
	},
	shortCard: {
		minHeight: "0",
		height: "100%"
	},
	confirmation: {
		display: "flex",
		flexDirection: "column",
		justifyContent: "center"
	}
}));

const perPage = 10;

const getRenderedCards = <T extends any>(cards: T[], page: number) =>
{
	const cardCount = cards.length;
	const pageCount = Math.ceil(cardCount / perPage);
	const sliceStart = (page - 1) * perPage;

	return {
		cards: cards?.slice(sliceStart, sliceStart + perPage),
		pageCount: Math.max(pageCount, 1)
	};
};

const Create = () =>
{
	const params = useParams<{ id?: string }>();
	const classes = useStyles();
	const authState = useDataStore(AuthDataStore);
	const packCreatorData = useDataStore(PackCreatorDataStore);
	const history = useHistory();
	const [loading, setLoading] = useState(false);

	const [whitePage, setWhitePage] = useState(1);
	const [blackPage, setBlackPage] = useState(1);
	const [showMassBlackEdit, setShowMassBlackEdit] = useState(false);
	const [showMassWhiteEdit, setShowMassWhiteEdit] = useState(false);
	const [filter, realSetFilter] = useState("");

	const setFilter = (value: string) => {
		realSetFilter(value);
		setWhitePage(1);
		setBlackPage(1);
	};

	const mobile = useMediaQuery('(max-width:768px)');

	useEffect(() =>
	{
		if (params.id)
		{
			setLoading(true);
			PackCreatorDataStore.hydrate(params.id)
				.finally(() =>
				{
					setLoading(false);
					setTimeout(() =>
					{
						BrowserUtils.scrollToTop();
					}, 250);
				});
		}
		else
		{
			PackCreatorDataStore.reset();
		}
	}, []);

	const canEdit = !packCreatorData.ownerId || authState.userId === packCreatorData.ownerId;

	const save = () =>
	{
		PackCreatorDataStore.save()
			.then(pack =>
			{
				if (!params.id)
				{
					history.push(SiteRoutes.PackCreate.resolve({
						id: pack.definition.pack.id
					}));
				}
			});
	};

	const filteredWhiteCards = packCreatorData.whiteCards.filter(c => c.match(filter));
	const filteredBlackCards = packCreatorData.blackCards.filter(c => c.match(filter));

	const whiteCardPage = getRenderedCards(filteredWhiteCards, whitePage);
	const blackCardPage = getRenderedCards(filteredBlackCards, blackPage);

	const addBlackCard = () =>
	{
		PackCreatorDataStore.addBlackCard();
		setBlackPage(blackCardPage.pageCount);
	};

	const addWhiteCard = () =>
	{
		PackCreatorDataStore.addWhiteCard();
		setWhitePage(whiteCardPage.pageCount);
	};

	const addMassBlack = (values: string[]) =>
	{
		PackCreatorDataStore.massAddBlackCards(values);
		setBlackPage(blackCardPage.pageCount);
		setShowMassBlackEdit(false);
	};

	const addMassWhite = (values: string[]) =>
	{
		PackCreatorDataStore.massAddWhiteCards(values);
		setBlackPage(blackCardPage.pageCount);
		setShowMassWhiteEdit(false);
	};

	const validityMessage = PackCreatorDataStore.getValidity();

	if (!authState.authorized && !params.id)
	{
		return (
			<Alert color={"error"}>
				<AlertTitle>Log In</AlertTitle>
				This page requires you to log in. You can log in at the top right corner.
			</Alert>
		);
	}

	if (loading)
	{
		return <ContainerProgress/>;
	}

	return (
		<Grid container spacing={3}>
			<Helmet>
				<title>{`${packCreatorData.packName} Custom Pack`}</title>
			</Helmet>
			<Grid item xs={12}>
				{canEdit ? (
					<TextField
						disabled={!canEdit}
						value={packCreatorData.packName}
						error={packCreatorData.packName.length < 3}
						helperText={packCreatorData.packName.length < 3 && "Name Required"}
						onChange={e => PackCreatorDataStore.setPackName(e.currentTarget.value)}
						variant={"outlined"}
						placeholder={"Pack Name"}
						InputProps={{
							color: "secondary"
						}}
						inputProps={{
							maxLength: 100
						}}
					/>
				) : (
					<Typography variant={"h2"}>{packCreatorData.packName}</Typography>
				)}
			</Grid>

			<Grid item md={9} xs={12}>
				<FormControl component="fieldset">
					<FormGroup>
						<FormControlLabel
							disabled={!canEdit}
							control={<Switch checked={packCreatorData.isNsfw} onChange={e => PackCreatorDataStore.setIsNsfw(e.target.checked)}/>}
							label="NSFW?"
						/>
						<FormControlLabel
							disabled={!canEdit}
							control={<Switch checked={packCreatorData.isPublic} onChange={e => PackCreatorDataStore.setIsPublic(e.target.checked)}/>}
							label="Make Public"
						/>

						<FormControl error={packCreatorData.categories.length === 0} style={{width: "20rem", marginTop: "1rem"}} variant="outlined" disabled={!canEdit}>
							<InputLabel id="input-categories">Select up to 3 categories</InputLabel>
							<Select
								labelId="input-categories"
								id="demo-simple-select-outlined"
								label="Select up to 3 categories"
								multiple
								value={packCreatorData.categories}
								MenuProps={{
									anchorOrigin: {
										vertical: "bottom",
										horizontal: "left"
									},
									getContentAnchorEl: null
								}}
								onChange={e => PackCreatorDataStore.setCategories(e.target.value as ValuesOf<typeof PackCategories>[])}
							>
								{PackCategories.map((cat) => (
									<MenuItem key={cat} value={cat}>
										{cat}
									</MenuItem>
								))}
							</Select>
						</FormControl>
					</FormGroup>
				</FormControl>
			</Grid>

			{canEdit && (
				<Grid item xs={12} md={3} style={{display: "flex", alignItems: "center", justifyContent: mobile ? "flex-start" : "flex-end"}}>
					<JsonExport/>
					<JsonUpload/>
				</Grid>
			)}
			<Grid item xs={12} className={classes.filterSection}>
				<Divider style={{marginBottom: "1rem"}}/>
				<TextField
					placeholder={"Filter Cards"}
					variant={"outlined"}
					onChange={e => setFilter(e.target.value)}
				/>
			</Grid>
			<Grid item xs={12} md={12} lg={6} className={classes.section}>
				<Typography variant={"h5"}>Prompts ({packCreatorData.blackCards?.length ?? 0})</Typography>
				<Divider className={classes.divider}/>
				<Grid container spacing={3} style={{marginBottom: "1rem"}}>
					<Grid item xs={12}>
						<Pagination count={blackCardPage.pageCount} page={blackPage} onChange={(_, page) => setBlackPage(page)}/>
					</Grid>

					{blackCardPage.cards.map((value, index) => (
						<EditableBlack
							key={index}
							value={value}
							index={index + ((blackPage - 1) * perPage)}
							canEdit={canEdit}
							focus={filter === "" && index === blackCardPage.cards.length - 1}
							onEdit={PackCreatorDataStore.editBlackCard}
							onRemove={PackCreatorDataStore.removeBlackCard}
						/>
					))}

					<Grid item xs={12}>
						<Pagination count={blackCardPage.pageCount} page={blackPage} onChange={(_, page) => setBlackPage(page)}/>
					</Grid>

				</Grid>
				{canEdit && (
					<>
						<ButtonGroup>
							<Button variant={"outlined"} color={"secondary"} onClick={() => setShowMassBlackEdit(true)}>
								Add Multiple
							</Button>
							<Button variant={"contained"} color={"secondary"} onClick={addBlackCard}>
								Add Card
							</Button>
						</ButtonGroup>
						<Alert color={"info"} style={{marginTop: "1rem"}}>
							<Typography variant={"subtitle2"}>Use _ to represent a blank</Typography>
						</Alert>
					</>
				)}
			</Grid>

			<Grid item xs={12} md={12} lg={6} className={classes.section}>
				<Typography variant={"h5"}>Responses ({packCreatorData.whiteCards?.length ?? 0})</Typography>
				<Divider className={classes.divider}/>
				<Grid container spacing={3} style={{marginBottom: "1rem"}}>
					<Grid item xs={12}>
						<Pagination count={whiteCardPage.pageCount} page={whitePage} onChange={(_, page) => setWhitePage(page)}/>
					</Grid>

					{whiteCardPage.cards.map((value, index) => (
						<EditableWhite
							key={index}
							value={value}
							index={index + ((whitePage - 1) * perPage)}
							canEdit={canEdit}
							focus={filter === "" && index === whiteCardPage.cards.length - 1}
							onEdit={PackCreatorDataStore.editWhiteCard}
							onRemove={PackCreatorDataStore.removeWhiteCard}
						/>
					))}

					<Grid item xs={12}>
						<Pagination count={whiteCardPage.pageCount} page={whitePage} onChange={(_, page) => setWhitePage(page)}/>
					</Grid>
				</Grid>
				{canEdit && (
					<ButtonGroup>
						<Button variant={"outlined"} color={"secondary"} onClick={() => setShowMassWhiteEdit(true)}>
							Add Multiple
						</Button>
						<Button variant={"contained"} color={"secondary"} onClick={addWhiteCard}>
							Add Card
						</Button>
					</ButtonGroup>
				)}
			</Grid>

			{canEdit && (
				<Confirmation>
					<div className={classes.confirmation}>
						{validityMessage ? (
							<Alert color={"error"}>
								<AlertTitle>Cannot Save</AlertTitle>
								{validityMessage}
							</Alert>
						) : (
							<Button
								size={"large"}
								color={"secondary"}
								variant={"contained"}
								startIcon={<FaSave/>}
								disabled={!!validityMessage || !packCreatorData.isEdited}
								onClick={save}
							>
								Save
							</Button>
						)}
					</div>
				</Confirmation>
			)}

			<CloseableDialog open={showMassWhiteEdit} onClose={() => setShowMassWhiteEdit(false)} TitleProps={{children: "Add Multiple Prompts"}} fullWidth={true} maxWidth={"md"}>
				<MassEditor onComplete={addMassWhite} onClose={() => setShowMassWhiteEdit(false)}/>
			</CloseableDialog>

			<CloseableDialog open={showMassBlackEdit} onClose={() => setShowMassBlackEdit(false)} TitleProps={{children: "Add Multiple Responses"}} fullWidth={true} maxWidth={"md"}>
				<MassEditor onComplete={addMassBlack} onClose={() => setShowMassBlackEdit(false)}/>
			</CloseableDialog>
		</Grid>
	);
};

interface MassEditorProps
{
	onComplete: (values: string[]) => void;
	onClose: () => void;
}

const MassEditor: React.FC<MassEditorProps> = (props) =>
{
	const [value, setValue] = useState("");
	const lines = value.split("\n")
		.map(c => c.trim())
		.filter(c => !!c);

	return (
		<>
			<DialogContent dividers>
				<Typography>Add one card per line. Cards added: {lines.length}</Typography>
				<textarea value={value} onChange={e => setValue(e.target.value)} style={{
					width: "100%",
					height: "40rem",
					maxHeight: "50vh"
				}}/>
			</DialogContent>
			<DialogActions>
				<Button onClick={props.onClose}>Cancel</Button>
				<Button onClick={() => props.onComplete(lines)}>Add</Button>
			</DialogActions>
		</>
	);
};

export default Create;