import Chip from "@material-ui/core/Chip";
import { AiFillCrown } from "react-icons/all";
import { ClockLoader } from "react-spinners";
import { Typography } from "@material-ui/core";
import * as React from "react";
import { useDataStore } from "../../../../Global/Utils/HookUtils";
import { GameDataStore } from "../../../../Global/DataStore/GameDataStore";
import { UserDataStore } from "../../../../Global/DataStore/UserDataStore";
import { UserFlair } from "../Users/UserFlair";

export const PlayersRemaining = () => {
  const gameData = useDataStore(GameDataStore);
  const userData = useDataStore(UserDataStore);

  if (!gameData.game) {
    return null;
  }

  const { players, roundCards, chooserGuid, roundStarted } = gameData.game;

  const remainingPlayerGuids = Object.keys(players ?? {}).filter(
    (pg) => !(pg in (roundCards ?? {})) && pg !== chooserGuid
  );

  const remainingPlayers = remainingPlayerGuids.map((pg) => players?.[pg]);
  const chooserIsMe = userData.playerGuid === chooserGuid;
  const chooserPlayer = players?.[chooserGuid!];
  const chooser = chooserIsMe
    ? "You!"
    : unescape(players?.[chooserGuid!]?.nickname);

  const hasWinner = !!gameData.game?.lastWinner;

  return (
    <>
      <Chip
        color={"secondary"}
        style={{ marginBottom: 3, paddingLeft: 8 }}
        icon={<AiFillCrown />}
        label={
          <>
            <UserFlair player={chooserPlayer} />
            {chooser}
          </>
        }
      />
      {roundStarted &&
        remainingPlayers.map((player) => (
          <Chip
            style={{ marginLeft: 3, marginBottom: 3, paddingLeft: 8 }}
            avatar={<ClockLoader size={15} />}
            label={
              <>
                <UserFlair player={player} />
                {unescape(player?.nickname)}
              </>
            }
          />
        ))}
      {!hasWinner && remainingPlayers.length === 0 && (
        <Typography variant={"body1"} style={{ marginTop: "0.5rem" }}>
          {`Waiting for ${unescape(
            players?.[chooserGuid ?? ""]?.nickname
          )} to pick the winner.`}
        </Typography>
      )}
    </>
  );
};
