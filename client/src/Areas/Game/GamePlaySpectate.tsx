import * as React from "react";
import {GameDataStore, GameDataStorePayload} from "../../Global/DataStore/GameDataStore";
import {UserData, UserDataStore} from "../../Global/DataStore/UserDataStore";
import Grid from "@material-ui/core/Grid";
import {BlackCard} from "../../UI/BlackCard";
import Divider from "@material-ui/core/Divider";
import {Typography} from "@material-ui/core";
import {RevealWhites} from "./Components/Gameplay/RevealWhites";
import {ShowWinner} from "./Components/Gameplay/ShowWinner";
import {PickWinner} from "./Components/Gameplay/PickWinner";
import {PlayersRemaining} from "./Components/Gameplay/PlayersRemaining";
import {Alert, AlertTitle} from "@material-ui/lab";
import {cardDefsLoaded} from "../../Global/Utils/GameUtils";

interface IGamePlaySpectateProps
{
}

interface DefaultProps
{
}

type Props = IGamePlaySpectateProps & DefaultProps;
type State = IGamePlaySpectateState;

interface IGamePlaySpectateState
{
	gameData: GameDataStorePayload;
	userData: UserData;
}

export class GamePlaySpectate extends React.Component<Props, State>
{
	constructor(props: Props)
	{
		super(props);

		this.state = {
			gameData: GameDataStore.state,
			userData: UserDataStore.state,
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

	private onSelect = (winningPlayerGuid: string) =>
	{
		GameDataStore.chooseWinner(this.state.userData.playerGuid, winningPlayerGuid);
	};

	private onClickStartRound = () =>
	{
		GameDataStore.startRound(this.state.userData.playerGuid);
	};

	public render()
	{
		const {
			gameData,
		} = this.state;

		const me = gameData.game?.spectators?.[this.state.userData.playerGuid] ?? gameData.game?.pendingPlayers?.[this.state.userData.playerGuid];

		const defsLoaded = cardDefsLoaded(gameData);

		if (!me || !gameData.game || !defsLoaded)
		{
			return null;
		}

		const {
			players,
			chooserGuid,
			roundCards,
			roundStarted
		} = gameData.game;

		const roundCardKeys = Object.keys(roundCards ?? {});

		const remainingPlayerGuids = Object.keys(players ?? {})
			.filter(pg => !(pg in (roundCards ?? {})) && pg !== chooserGuid);

		const remainingPlayers = remainingPlayerGuids.map(pg => unescape(players?.[pg]?.nickname));

		const revealedIndex = this.state.gameData.game?.revealIndex ?? 0;
		const timeToPick = remainingPlayers.length === 0;
		const revealMode = timeToPick && revealedIndex < roundCardKeys.length;

		const hasWinner = !!gameData.game?.lastWinner;
		const isPending = this.state.userData.playerGuid in gameData.game.pendingPlayers;

		return (
			<>
				<div>
					<PlayersRemaining/>
				</div>
				{isPending && (
					<div>
						<Alert severity="info" style={{marginTop: "1rem"}}>
							<AlertTitle>Waiting for next round...</AlertTitle>
							You have joined, but the round already started. You will be added to the game when this round is complete.
						</Alert>
					</div>
				)}
				<Divider style={{margin: "1rem 0"}}/>
				<Grid container spacing={2} style={{justifyContent: "center"}}>
					{(roundStarted && !hasWinner) && (
						<Grid item xs={12} sm={6} md={4} lg={3}>
							<BlackCard packId={gameData.game?.blackCard.packId}>
								{gameData.blackCardDef?.content}
							</BlackCard>
						</Grid>
					)}
					{!roundStarted && (
						<Typography>Waiting for the round to start...</Typography>
					)}
					<RevealWhites canReveal={false}/>
					<ShowWinner/>
				</Grid>
				<PickWinner
					canPick={false}
					hasWinner={hasWinner}
					revealMode={revealMode}
					timeToPick={timeToPick}
				/>
			</>
		);
	}
}