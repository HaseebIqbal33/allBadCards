import Grid from "@material-ui/core/Grid";
import {WhiteCard} from "@UI/WhiteCard";
import Button from "@material-ui/core/Button";
import * as React from "react";
import {useState} from "react";
import {GameDataStorePayload} from "@Global/DataStore/GameDataStore";
import {UserData} from "@Global/DataStore/UserDataStore";
import sanitize from "sanitize-html";
import {CardId} from "@Global/Platform/Contract";
import deepEqual from "deep-equal";
import {TextField} from "@material-ui/core";
import {CardPlayTimeRemaining} from "./CardPlayTimeRemaining";
import makeStyles from "@material-ui/core/styles/makeStyles";

interface Props
{
	gameData: GameDataStorePayload;
	userData: UserData;
	targetPicked: number;
	onPickUpdate: (cards: CardId[]) => void;
}

const useStyles = makeStyles(theme => ({
	input: {
		color: theme.palette.primary.dark,
		borderColor: theme.palette.primary.dark
	}
}));

export const WhiteCardHand: React.FC<Props> = (
	{
		userData,
		gameData,
		targetPicked,
		onPickUpdate
	}) =>
{
	const [pickedCards, setPickedCards] = useState<CardId[]>([]);

	const onPick = (id: CardId, content?: string) =>
	{
		const newCard = {...id};
		if (content)
		{
			newCard.customInput = content;
		}
		const newVal: CardId[] = [...pickedCards, newCard];
		setPickedCards(newVal);
		onPickUpdate(newVal);
	};

	const onUnpick = (id: CardId, content?: string) =>
	{
		const newCard = {...id};
		if (content)
		{
			newCard.customInput = content;
		}
		const newVal = pickedCards.filter(a => !deepEqual(a, newCard));
		setPickedCards(newVal);
		onPickUpdate(newVal);
	};

	if (!gameData.game)
	{
		return null;
	}

	const {
		players,
		roundCards,
		settings,
	} = gameData.game;

	const me = players[userData.playerGuid];

	if (!me)
	{
		return null;
	}

	const playerCardIds = me.whiteCards;

	const hasPlayed = userData.playerGuid in roundCards;

	let renderedCardIds = hasPlayed
		? []
		: playerCardIds;

	const renderedDefs = hasPlayed
		? gameData.roundCardDefs
		: gameData.playerCardDefs;

	const metPickTarget = targetPicked <= pickedCards.length;

	const renderedHand = renderedCardIds.map((cardId, i) =>
	{
		const pickedIndex = pickedCards.findIndex(c => deepEqual(c, cardId));
		const picked = pickedIndex > -1;

		return (
			<Grid item xs={12} sm={6} md={4} lg={3}>
				{cardId && (
					<WhiteCardOption
						targetPicked={targetPicked}
						cardBody={renderedDefs?.[cardId.packId]?.[cardId.cardIndex] ?? ""}
						cardId={cardId}
						hasPlayed={hasPlayed}
						metPickTarget={metPickTarget}
						onPick={onPick}
						onUnpick={onUnpick}
						picked={picked}
						pickedIndex={pickedIndex}
						isCustom={false}
					/>
				)}
			</Grid>
		);
	});

	const customCardId: CardId = {
		packId: "custom",
		cardIndex: 0
	};
	const customPickedIndex = pickedCards.findIndex(a => a.packId === customCardId.packId);

	return <>
		{!(me.guid in (gameData.game?.roundCards ?? {})) && (
			<>
				<CardPlayTimeRemaining gameData={gameData}/>
			</>
		)}
		<Grid container style={{justifyContent: "center", marginTop: "1rem"}} spacing={3}>
			{!hasPlayed && settings.allowCustoms && (
				<Grid item xs={12} sm={6} md={4} lg={3}>
					<WhiteCardOption
						targetPicked={targetPicked}
						cardBody={""}
						cardId={customCardId}
						hasPlayed={hasPlayed}
						metPickTarget={metPickTarget}
						onPick={onPick}
						onUnpick={onUnpick}
						picked={customPickedIndex > -1}
						pickedIndex={customPickedIndex}
						isCustom={true}
					/>
				</Grid>
			)}
			{renderedHand}
		</Grid>
	</>;
};

interface CardOptionProps
{
	cardId: CardId;
	metPickTarget: boolean;
	onPick: (cardId: CardId, input?: string) => void;
	onUnpick: (cardId: CardId, input?: string) => void;
	hasPlayed: boolean;
	picked: boolean;
	targetPicked: number;
	pickedIndex: number;
	cardBody: string;
	isCustom: boolean;
}

const WhiteCardOption: React.FC<CardOptionProps> = (
	{
		cardId,
		onPick,
		metPickTarget,
		hasPlayed,
		picked,
		targetPicked,
		pickedIndex,
		onUnpick,
		cardBody,
		isCustom
	}
) =>
{
	const [input, setInput] = useState<string | undefined>(undefined);

	const label = picked
		? targetPicked > 1
			? `Picked: ${pickedIndex + 1}`
			: "Picked"
		: "Pick";

	const classes = useStyles();

	return (
		<WhiteCard
			packId={cardId.packId}
			key={cardId.cardIndex + cardId.cardIndex}
			actions={!hasPlayed && (
				<>
					<Button
						variant={"contained"}
						color={"secondary"}
						disabled={metPickTarget || picked}
						onClick={() => onPick(cardId, input)}
					>
						{label}
					</Button>
					<Button
						variant={"contained"}
						color={"secondary"}
						disabled={!picked}
						onClick={() => onUnpick(cardId, input)}
					>
						Unpick
					</Button>
				</>
			)}
		>
			{isCustom ? (
				<TextField
					inputProps={{
						className: classes.input
					}}
					color={"primary"}
					placeholder={"Answer here"}
					fullWidth={true}
					multiline={true}
					value={input}
					variant={"outlined"}
					disabled={picked}
					onChange={e => setInput(e.currentTarget.value)}
				/>
			) : (
				<div dangerouslySetInnerHTML={{__html: sanitize(unescape(cardBody))}}/>
			)}
		</WhiteCard>
	);
};