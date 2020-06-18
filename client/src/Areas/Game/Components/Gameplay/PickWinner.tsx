import Grid from "@material-ui/core/Grid";
import Divider from "@material-ui/core/Divider";
import * as React from "react";
import { useState } from "react";
import { useDataStore } from "../../../../Global/Utils/HookUtils";
import { GameDataStore } from "../../../../Global/DataStore/GameDataStore";
import { WhiteCard } from "../../../../UI/WhiteCard";
import { UserDataStore } from "../../../../Global/DataStore/UserDataStore";
import sanitize from "sanitize-html";
import { LoadingButton } from "../../../../UI/LoadingButton";
import { CardId } from "../../../../Global/Platform/Contract";
import { cardDefsLoaded } from "../../../../Global/Utils/GameUtils";

export interface IPickWinnerProps {
  children?: undefined;
  canPick: boolean;
  timeToPick: boolean;
  revealMode: boolean;
  hasWinner: boolean;
  onPickWinner?: (winnerGuid: string) => Promise<any>;
}

export const PickWinner: React.FC<IPickWinnerProps> = ({
  onPickWinner,
  canPick,
  timeToPick,
  hasWinner,
  revealMode,
}) => {
  const gameData = useDataStore(GameDataStore);
  const userData = useDataStore(UserDataStore);
  const [pickWinnerLoading, setPickWinnerLoading] = useState(false);

  const me =
    gameData.game?.players?.[userData.playerGuid] ??
    gameData.game?.spectators?.[userData.playerGuid];

  const defsLoaded = cardDefsLoaded(gameData);

  if (!me || !gameData.game || !defsLoaded) {
    return null;
  }

  const pickWinner = (winnerGuid: string) => {
    if (onPickWinner) {
      setPickWinnerLoading(true);

      onPickWinner(winnerGuid).finally(() => setPickWinnerLoading(false));
    }
  };

  const { roundCards, playerOrder, chooserGuid } = gameData.game;

  const roundCardsDefined = roundCards ?? {};
  const roundCardKeys = playerOrder.filter((a) => a !== chooserGuid);
  const roundCardValues = roundCardKeys.map((playerGuid) =>
    (roundCardsDefined[playerGuid] as CardId[])?.map(
      (cardId) =>
        cardId.customInput ??
        gameData.roundCardDefs?.[cardId.packId]?.[cardId.cardIndex]
    )
  );

  return (
    <>
      {timeToPick && !revealMode && !hasWinner && (
        <>
          <Grid container spacing={2} style={{ justifyContent: "center" }}>
            {roundCardKeys.map((playerGuid, i) => (
              <Grid item xs={12} sm={6} md={4} lg={3}>
                <WhiteCard
                  actions={
                    canPick && (
                      <LoadingButton
                        loading={pickWinnerLoading}
                        variant={"contained"}
                        color={"secondary"}
                        onClick={() => pickWinner(playerGuid)}
                      >
                        Pick Winner
                      </LoadingButton>
                    )
                  }
                >
                  {roundCardValues[i]?.map(
                    (card) =>
                      card && (
                        <>
                          <div
                            dangerouslySetInnerHTML={{
                              __html: sanitize(unescape(card)),
                            }}
                          />
                          <Divider style={{ margin: "1rem 0" }} />
                        </>
                      )
                  )}
                </WhiteCard>
              </Grid>
            ))}
          </Grid>
          <Divider style={{ margin: "1rem 0" }} />
        </>
      )}
    </>
  );
};
