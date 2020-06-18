import * as React from "react";
import {
  GameDataStore,
  GameDataStorePayload,
} from "../../Global/DataStore/GameDataStore";
import { UserData, UserDataStore } from "../../Global/DataStore/UserDataStore";
import Grid from "@material-ui/core/Grid";
import { BlackCard } from "../../UI/BlackCard";
import Divider from "@material-ui/core/Divider";
import { Typography } from "@material-ui/core";
import { RevealWhites } from "./Components/Gameplay/RevealWhites";
import { ShowWinner } from "./Components/Gameplay/ShowWinner";
import { PickWinner } from "./Components/Gameplay/PickWinner";
import { LoadingButton } from "../../UI/LoadingButton";
import { PlayersRemaining } from "./Components/Gameplay/PlayersRemaining";
import { CardPlayTimeRemaining } from "./Components/Gameplay/CardPlayTimeRemaining";
import { ContainerProgress } from "../../UI/ContainerProgress";
import { cardDefsLoaded } from "../../Global/Utils/GameUtils";

interface IGamePlayBlackProps {}

interface DefaultProps {}

type Props = IGamePlayBlackProps & DefaultProps;
type State = IGamePlayBlackState;

interface IGamePlayBlackState {
  gameData: GameDataStorePayload;
  userData: UserData;
  buttonLoading: boolean;
}

export class GamePlayBlack extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      gameData: GameDataStore.state,
      userData: UserDataStore.state,
      buttonLoading: false,
    };
  }

  public componentDidMount(): void {
    GameDataStore.listen((data) =>
      this.setState({
        gameData: data,
      })
    );

    UserDataStore.listen((data) =>
      this.setState({
        userData: data,
      })
    );
  }

  private onSelect = (winningPlayerGuid: string) => {
    return GameDataStore.chooseWinner(
      this.state.userData.playerGuid,
      winningPlayerGuid
    );
  };

  private onClickStartRound = () => {
    this.setState({
      buttonLoading: true,
    });

    GameDataStore.startRound(this.state.userData.playerGuid).finally(() =>
      this.setState({
        buttonLoading: false,
      })
    );
  };

  private onClickSkipBlack = () => {
    this.setState({
      buttonLoading: true,
    });

    GameDataStore.skipBlack(this.state.userData.playerGuid).finally(() =>
      this.setState({
        buttonLoading: false,
      })
    );
  };

  public render() {
    const { gameData, buttonLoading } = this.state;

    const me = gameData.game?.players?.[this.state.userData.playerGuid];

    const defsLoaded = cardDefsLoaded(gameData);

    if (!me || !gameData.game || !defsLoaded) {
      return <ContainerProgress />;
    }

    const { players, chooserGuid, roundCards, roundStarted } = gameData.game;

    const roundCardKeys = Object.keys(roundCards ?? {});

    const remainingPlayerGuids = Object.keys(players ?? {}).filter(
      (pg) => !(pg in (roundCards ?? {})) && pg !== chooserGuid
    );

    const remainingPlayers = remainingPlayerGuids.map((pg) =>
      unescape(players?.[pg]?.nickname)
    );

    const revealedIndex = this.state.gameData.game?.revealIndex ?? 0;
    const timeToPick = remainingPlayers.length === 0;
    const revealMode = timeToPick && revealedIndex < roundCardKeys.length;
    const hasWinner = !!gameData.game?.lastWinner;

    return (
      <>
        <div>
          <PlayersRemaining />
        </div>
        <Divider style={{ margin: "1rem 0" }} />
        {!roundStarted && (
          <Typography style={{ marginBottom: "1rem", textAlign: "center" }}>
            <strong>You are the Card Captain!</strong>
            <br />
            Read the card aloud, then click Start The Round. Once everyone
            plays, you will choose your favorite!
          </Typography>
        )}
        {!timeToPick && roundStarted && (
          <CardPlayTimeRemaining gameData={gameData} />
        )}
        <Grid
          container
          spacing={2}
          style={{ justifyContent: "center", marginTop: "1rem" }}
        >
          {!hasWinner && (
            <Grid item xs={12} sm={6} md={4} lg={3}>
              <BlackCard packId={gameData.game?.blackCard.packId}>
                {gameData.blackCardDef?.content}
              </BlackCard>
            </Grid>
          )}
          <RevealWhites canReveal={true} />
          <ShowWinner />
        </Grid>
        {!roundStarted && (
          <div style={{ marginTop: "1rem", textAlign: "center" }}>
            <LoadingButton
              loading={buttonLoading}
              color={"secondary"}
              variant={"outlined"}
              onClick={this.onClickSkipBlack}
            >
              Skip Card
            </LoadingButton>
            <LoadingButton
              loading={buttonLoading}
              color={"secondary"}
              variant={"contained"}
              onClick={this.onClickStartRound}
              style={{ marginLeft: "1rem" }}
            >
              Start the round!
            </LoadingButton>
          </div>
        )}
        <PickWinner
          canPick={true}
          hasWinner={hasWinner}
          onPickWinner={this.onSelect}
          revealMode={revealMode}
          timeToPick={timeToPick}
        />
      </>
    );
  }
}
