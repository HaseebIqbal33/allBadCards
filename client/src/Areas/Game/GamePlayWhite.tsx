import * as React from "react";
import {
  GameDataStore,
  GameDataStorePayload,
} from "../../Global/DataStore/GameDataStore";
import { UserData, UserDataStore } from "../../Global/DataStore/UserDataStore";
import Grid from "@material-ui/core/Grid";
import { BlackCard } from "../../UI/BlackCard";
import Divider from "@material-ui/core/Divider";
import { DialogActions, DialogTitle, Typography } from "@material-ui/core";
import { RevealWhites } from "./Components/Gameplay/RevealWhites";
import { ShowWinner } from "./Components/Gameplay/ShowWinner";
import { Confirmation } from "../../UI/Confirmation";
import { WhiteCardHand } from "./Components/Gameplay/WhiteCardHand";
import Tooltip from "@material-ui/core/Tooltip";
import { PickWinner } from "./Components/Gameplay/PickWinner";
import { LoadingButton } from "../../UI/LoadingButton";
import { CardId } from "../../Global/Platform/Contract";
import { BrowserUtils } from "../../Global/Utils/BrowserUtils";
import { PlayersRemaining } from "./Components/Gameplay/PlayersRemaining";
import Dialog from "@material-ui/core/Dialog";
import DialogContent from "@material-ui/core/DialogContent";
import Button from "@material-ui/core/Button";
import { Instructions } from "./Components/Gameplay/Instructions";

interface IGamePlayWhiteProps {}

interface DefaultProps {}

type Props = IGamePlayWhiteProps & DefaultProps;
type State = IGamePlayWhiteState;

interface IGamePlayWhiteState {
  gameData: GameDataStorePayload;
  userData: UserData;
  didForfeit: boolean;
  pickedCards: CardId[];
  pickedCardsCustom: string[];
  canUseMyCardsSuck: boolean;
  suckButtonLoading: boolean;
  playButtonLoading: boolean;
  cardsSuckVisible: boolean;
}

export class GamePlayWhite extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      gameData: GameDataStore.state,
      userData: UserDataStore.state,
      suckButtonLoading: false,
      playButtonLoading: false,
      pickedCards: [],
      pickedCardsCustom: [],
      cardsSuckVisible: false,
      didForfeit: false,
      canUseMyCardsSuck: this.determineCanUseMyCardsSuck(
        GameDataStore.state.game?.roundIndex ?? 0,
        GameDataStore.state.game?.id
      ),
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

  public componentDidUpdate(
    prevProps: Readonly<Props>,
    prevState: Readonly<State>,
    snapshot?: any
  ): void {
    const prevRoundIndex = prevState.gameData.game?.roundIndex;
    const currentRoundIndex = this.state.gameData.game?.roundIndex ?? 0;

    if (prevRoundIndex !== currentRoundIndex) {
      this.setState({
        pickedCards: [],
        didForfeit: false,
      });

      const canUseMyCardsSuck = this.determineCanUseMyCardsSuck(
        currentRoundIndex,
        this.state.gameData.game?.id
      );

      this.setState({
        canUseMyCardsSuck,
      });
    }
  }

  private determineCanUseMyCardsSuck(
    currentRoundIndex: number,
    gameId: string | undefined
  ) {
    if (!gameId) {
      return false;
    }

    let lastUsedCardsSuckIndex = parseInt(
      localStorage.getItem(this.getCardsSuckLsKey(gameId)) ?? "-99"
    );

    if (
      this.state?.gameData?.game &&
      (this.state.gameData?.game?.roundIndex ?? 0 < lastUsedCardsSuckIndex)
    ) {
      lastUsedCardsSuckIndex = 0;
      this.setCardsSuckUsedRound(gameId, -1);
    }

    const diff = currentRoundIndex - lastUsedCardsSuckIndex;

    return diff >= 5;
  }

  private onCommit = () => {
    const hasSelected =
      this.state.userData.playerGuid in
      (this.state.gameData.game?.roundCards ?? {});
    if (hasSelected) {
      return;
    }

    this.setState({
      playButtonLoading: true,
    });

    GameDataStore.playWhiteCards(
      this.state.pickedCards,
      this.state.userData.playerGuid
    ).finally(() =>
      this.setState({
        playButtonLoading: false,
      })
    );

    BrowserUtils.scrollToTop();
  };

  private onPickUpdate = (pickedCards: CardId[]) => {
    this.setState({
      pickedCards,
    });
  };

  private getCardsSuckLsKey(gameId: string) {
    return `cards-suck-last-round-index:${gameId}`;
  }

  private setCardsSuckUsedRound(gameId: string, roundIndex?: number) {
    localStorage.setItem(
      this.getCardsSuckLsKey(gameId),
      String(roundIndex ?? 0)
    );
  }

  private showForfeitConfirm = () => {
    this.setState({
      cardsSuckVisible: true,
    });
  };

  private hideForfeitConfirm = () => {
    this.setState({
      cardsSuckVisible: false,
    });
  };

  private onForfeit = () => {
    this.hideForfeitConfirm();

    this.setState({
      didForfeit: true,
      suckButtonLoading: true,
    });

    const gameId = this.state.gameData.game?.id;

    if (gameId) {
      this.setCardsSuckUsedRound(gameId, this.state.gameData.game?.roundIndex);
    }

    let targetPicked = this.state.gameData.blackCardDef?.pick ?? 1;
    GameDataStore.forfeit(this.state.userData.playerGuid, targetPicked).finally(
      () =>
        this.setState({
          suckButtonLoading: false,
        })
    );

    BrowserUtils.scrollToTop();
  };

  public render() {
    const {
      userData,
      gameData,
      canUseMyCardsSuck,
      didForfeit,
      pickedCards,
      pickedCardsCustom,
      playButtonLoading,
      suckButtonLoading,
    } = this.state;

    if (!gameData.game) {
      return null;
    }

    const { players, roundCards, chooserGuid, roundStarted } = gameData.game;

    const remainingPlayerGuids = Object.keys(players ?? {}).filter(
      (pg) => !(pg in (roundCards ?? {})) && pg !== chooserGuid
    );

    const remainingPlayers = remainingPlayerGuids.map((pg) =>
      unescape(players?.[pg]?.nickname)
    );

    const hasPlayed = userData.playerGuid in roundCards;
    const hasWinner = !!gameData.game?.lastWinner;

    let targetPicked = gameData.blackCardDef?.pick ?? 1;

    const roundCardKeys = Object.keys(roundCards ?? {});
    const revealedIndex = this.state.gameData.game?.revealIndex ?? 0;
    const metPickTarget =
      targetPicked <= pickedCards.length ||
      targetPicked <= pickedCardsCustom.length;
    const timeToPick = remainingPlayers.length === 0;
    const revealMode = timeToPick && revealedIndex < roundCardKeys.length;
    let czar = "the Card Captain";
    if (chooserGuid) {
      czar = unescape(gameData.game.players[chooserGuid].nickname);
    }

    return (
      <div style={{ paddingBottom: "4rem" }}>
        <PlayersRemaining />
        <Divider style={{ margin: "1rem 0" }} />
        <Grid container spacing={2} style={{ justifyContent: "center" }}>
          {roundStarted && !hasWinner && (
            <Grid item xs={12} sm={6} md={4} lg={3}>
              <BlackCard packId={gameData.game?.blackCard.packId}>
                {gameData.blackCardDef?.content}
              </BlackCard>
            </Grid>
          )}
          {!roundStarted && (
            <Typography>Waiting for {czar} to start the round...</Typography>
          )}
          <RevealWhites canReveal={false} />
          <ShowWinner />
        </Grid>
        <Divider style={{ margin: "1rem 0" }} />
        <Instructions />
        {!hasWinner && roundStarted && !revealMode && (
          <Grid container spacing={2}>
            <WhiteCardHand
              gameData={gameData}
              userData={userData}
              targetPicked={targetPicked}
              onPickUpdate={this.onPickUpdate}
            />
            {!hasPlayed && !didForfeit && !revealMode && (
              <Grid
                item
                xs={12}
                style={{
                  display: "flex",
                  justifyContent: "center",
                  padding: "4rem 0 2rem",
                }}
              >
                <Tooltip
                  enterTouchDelay={0}
                  enterDelay={0}
                  title={
                    canUseMyCardsSuck
                      ? "Forfeit round and get new cards?"
                      : "You can only do this every 5 rounds"
                  }
                  arrow
                >
                  <div>
                    <LoadingButton
                      loading={suckButtonLoading}
                      size={"large"}
                      variant={"contained"}
                      color={"secondary"}
                      disabled={
                        hasPlayed ||
                        revealMode ||
                        !roundStarted ||
                        !canUseMyCardsSuck
                      }
                      onClick={this.showForfeitConfirm}
                      style={{
                        marginLeft: "0.5rem",
                      }}
                    >
                      My cards suck
                    </LoadingButton>
                  </div>
                </Tooltip>
              </Grid>
            )}
          </Grid>
        )}

        <PickWinner
          canPick={false}
          hasWinner={hasWinner}
          revealMode={revealMode}
          timeToPick={timeToPick}
        />

        {!hasPlayed && !didForfeit && !revealMode && metPickTarget && (
          <Confirmation>
            <LoadingButton
              loading={playButtonLoading}
              size={"large"}
              variant={"contained"}
              color={"secondary"}
              onClick={this.onCommit}
            >
              Play
            </LoadingButton>
          </Confirmation>
        )}
        <Dialog
          open={this.state.cardsSuckVisible}
          onClose={() => this.setState({ cardsSuckVisible: false })}
          maxWidth={"sm"}
        >
          <DialogTitle>Are you sure?</DialogTitle>
          <DialogContent>
            <Typography>
              You could still win this round, but we'll automatically play a
              random selection from your hand, then give you new cards. Do you
              really want to do that?
            </Typography>
          </DialogContent>
          <Divider />
          <DialogActions>
            <Button
              onClick={this.hideForfeitConfirm}
              color="secondary"
              variant={"outlined"}
            >
              Cancel
            </Button>
            <Button
              onClick={this.onForfeit}
              color="secondary"
              variant={"contained"}
            >
              Confirm
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    );
  }
}
