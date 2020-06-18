import * as React from "react";
import Grid from "@material-ui/core/Grid";
import {WhiteCard} from "../../../../UI/WhiteCard";
import Divider from "@material-ui/core/Divider";
import {GameDataStore, GameDataStorePayload} from "../../../../Global/DataStore/GameDataStore";
import {UserData, UserDataStore} from "../../../../Global/DataStore/UserDataStore";
import sanitize from "sanitize-html";
import {LoadingButton} from "../../../../UI/LoadingButton";
import {Typography} from "@material-ui/core";
import {CardId} from "../../../../Global/Platform/Contract";

interface IRevealWhitesProps
{
	canReveal: boolean;
}

interface DefaultProps
{
}

type Props = IRevealWhitesProps & DefaultProps;
type State = IRevealWhitesState;

interface IRevealWhitesState
{
	gameData: GameDataStorePayload;
	userData: UserData;
	revealLoading: boolean;
}

export class RevealWhites extends React.Component <Props, State>
{
	constructor(props: Props)
	{
		super(props);

		this.state = {
			gameData: GameDataStore.state,
			userData: UserDataStore.state,
			revealLoading: false
		};
	}

	public componentDidMount(): void
	{
		GameDataStore.listen(data => this.setState({
			gameData: data
		}));

		UserDataStore.listen(data => this.setState({
			userData: data
		}));
	}

	private onReveal = () =>
	{
		this.setState({
			revealLoading: true
		});

		GameDataStore.revealNext(this.state.userData.playerGuid)
			.finally(() => this.setState({
				revealLoading: false
			}));
	};

	public render()
	{
		const {
			gameData,
			revealLoading
		} = this.state;

		if (!gameData.game)
		{
			return null;
		}

		const game = gameData.game;
		const {
			roundCards,
			revealIndex,
			playerOrder: ogPlayerOrder,
			chooserGuid,
			players
		} = game;

		const playerOrder = ogPlayerOrder ?? Object.keys(players);
		const roundPlayerOrder = playerOrder.filter(a => a !== chooserGuid);
		const roundCardKeys = Object.keys(roundCards ?? {});
		const roundPlayers = Object.keys(roundCards ?? {});
		const remainingPlayerGuids = Object.keys(players ?? {})
			.filter(pg => !(pg in (roundCards ?? {})) && pg !== chooserGuid);
		const remainingPlayers = remainingPlayerGuids.map(pg => unescape(players?.[pg]?.nickname));
		const realRevealIndex = revealIndex ?? -1;
		const revealedIndex = realRevealIndex % roundPlayers.length;
		const playerGuidAtIndex = roundPlayerOrder[isNaN(revealedIndex) ? 0 : revealedIndex];
		const cardsIdsRevealed = roundCards?.[playerGuidAtIndex] ?? [];
		const cardsRevealed = (cardsIdsRevealed as CardId[]).map(cid =>
			gameData.roundCardDefs?.[cid.packId]?.[cid.cardIndex] ?? cid.customInput
		);
		const timeToPick = remainingPlayers.length === 0;
		const revealMode = timeToPick && realRevealIndex < roundCardKeys.length;

		if (!revealMode)
		{
			return null;
		}

		const totalCardLength = roundCardKeys.length;
		const lastCard = realRevealIndex === totalCardLength - 1;
		const label = lastCard ? "See All Cards" : "Next";
		const canSeeReveal = this.props.canReveal || !game.settings.hideDuringReveal;

		return (
			<Grid item xs={12} sm={6} md={4} lg={3}>
				{(realRevealIndex >= 0 && canSeeReveal) && (
					<>
						<WhiteCard key={revealedIndex} style={{marginBottom: "0.5rem"}}>
							{cardsRevealed.map(card => card && (
								<>
									<div dangerouslySetInnerHTML={{__html: sanitize(unescape(card))}}/>
									<Divider style={{margin: "1rem 0"}}/>
								</>
							))}
							{this.props.canReveal && (
								<LoadingButton loading={revealLoading} color={"secondary"} variant={"contained"} onClick={this.onReveal}>
									{label}
								</LoadingButton>
							)}
						</WhiteCard>
					</>
				)}
				{realRevealIndex > -1 && (
					<Typography>Revealed: {realRevealIndex + 1} / {totalCardLength}</Typography>
				)}
				{realRevealIndex === -1 && this.props.canReveal && (
					<LoadingButton loading={revealLoading} color={"secondary"} variant={"contained"} onClick={this.onReveal}>
						Show me the cards!
					</LoadingButton>
				)}
			</Grid>
		);
	}
}