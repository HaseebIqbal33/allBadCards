import React, { ChangeEvent, useState } from "react";
import {
  GameDataStore,
  GameDataStorePayload,
} from "../../../../Global/DataStore/GameDataStore";
import FormControl from "@material-ui/core/FormControl";
import Divider from "@material-ui/core/Divider";
import {
  Checkbox,
  ListItemSecondaryAction,
  Slider,
  TextField,
  Typography,
} from "@material-ui/core";
import { useDataStore } from "../../../../Global/Utils/HookUtils";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import Switch from "@material-ui/core/Switch";
import List from "@material-ui/core/List";
import makeStyles from "@material-ui/core/styles/makeStyles";
import { getTrueRoundsToWin } from "../../../../Global/Utils/GameUtils";
import { ClientGameItem } from "../../../../Global/Platform/Contract";

const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;

const useStyles = makeStyles((theme) => ({
  sliderText: {
    "& span span span": {
      color: `${theme.palette.secondary.contrastText} !important`,
    },
  },
}));

export const SettingsBlockGame: React.FC = () => {
  const gameData = useDataStore(GameDataStore);

  return (
    <List style={{ paddingBottom: "1rem" }}>
      <AllowCustoms gameData={gameData} />

      <Divider style={{ margin: "0 0 1rem 0" }} />
      <WinnerBecomesCzar gameData={gameData} />

      <Divider style={{ margin: "0 0 1rem 0" }} />
      <HideDuringReveal gameData={gameData} />

      <Divider style={{ margin: "0 0 1rem 0" }} />
      <SkipReveal gameData={gameData} />

      <Divider style={{ margin: "0 0 1rem 0" }} />
      <RoundTimeout gameData={gameData} />

      <Divider style={{ margin: "0 0 1rem 0" }} />
      <RoundsRequiredField gameData={gameData} />

      <Divider style={{ margin: "0 0 1rem 0" }} />
      <PlayerLimitField gameData={gameData} />
    </List>
  );
};

interface IGameDataProps {
  gameData: GameDataStorePayload;
}

const AllowCustoms: React.FC<IGameDataProps> = ({ gameData }) => {
  const onChange = (e: ChangeEvent<{}>, v: boolean) => {
    GameDataStore.setAllowCustoms(v);
  };

  return (
    <FormControl component="fieldset" style={{ width: "100%" }}>
      <ListItem>
        <ListItemText
          primary={"Allow write-ins"}
          secondary={`When enabled, everyone will have one card that can be used as a write-in card for every hand.`}
        />
        <ListItemSecondaryAction>
          <Switch
            edge="end"
            color={"secondary"}
            onChange={onChange}
            name={"isPublic"}
            checked={gameData.ownerSettings.allowCustoms}
          />
        </ListItemSecondaryAction>
      </ListItem>
    </FormControl>
  );
};

let timeout = 0;
const UrlField: React.FC<IGameDataProps> = ({ gameData }) => {
  const [url, setUrl] = useState(gameData.ownerSettings.inviteLink ?? "");
  const [invalid, setInvalid] = useState(false);

  const setOuter = (value: string) => {
    setUrl(value);

    clearTimeout(timeout);
    timeout = window.setTimeout(() => {
      const invalid = value.length > 0 && !value.match(urlRegex);
      setInvalid(invalid);
      if (!invalid) {
        GameDataStore.setInviteLink(value);
      }
    }, 500);
  };

  return (
    <ListItem>
      <FormControl component="fieldset" style={{ width: "100%" }}>
        <Typography>Chat / Video invite URL</Typography>
        <Typography style={{ marginBottom: "0.5rem" }} variant={"caption"}>
          Allow players to easily join your video chat by adding an invite URL
        </Typography>
        <TextField
          value={url}
          label="URL"
          variant="outlined"
          onChange={(e) => setOuter(e.target.value)}
          error={invalid}
        />
      </FormControl>
    </ListItem>
  );
};

const MakePrivate: React.FC<IGameDataProps> = ({ gameData }) => {
  const onChange = (e: ChangeEvent<{}>, v: boolean) => {
    GameDataStore.setGamePublic(v);
  };

  return (
    <FormControl component="fieldset" style={{ width: "100%" }}>
      <ListItem>
        <ListItemText
          primary={"Make Public"}
          secondary={`When enabled, this game will be visible and joinable by anybody from the game list page.`}
        />
        <ListItemSecondaryAction>
          <Switch
            edge="end"
            color={"secondary"}
            onChange={onChange}
            name={"isPublic"}
            checked={gameData.ownerSettings.public}
          />
        </ListItemSecondaryAction>
      </ListItem>
    </FormControl>
  );
};

let sliderTimeout = 0;
const RoundsRequiredField: React.FC<IGameDataProps> = ({ gameData }) => {
  const numberToUse = getTrueRoundsToWin(gameData.game as ClientGameItem);

  const onChange = (e: ChangeEvent<{}>, v: number | number[]) => {
    clearTimeout(sliderTimeout);
    sliderTimeout = window.setTimeout(() => {
      GameDataStore.setRequiredRounds(v as number);
    }, 500);
  };

  const onUseSuggestedChange = (e: ChangeEvent<{}>, v: boolean) => {
    GameDataStore.setRequiredRounds(v ? undefined : numberToUse);
  };

  const classes = useStyles();

  const { roundsToWin, suggestedRoundsToWin } = gameData.game?.settings ?? {};

  return (
    <ListItem>
      <FormControl component="fieldset" style={{ width: "100%" }}>
        <Typography>
          Rounds required to win: {roundsToWin ?? suggestedRoundsToWin}
        </Typography>
        <Typography style={{ marginBottom: "0.5rem" }} variant={"caption"}>
          The game will end if a player wins this many rounds
        </Typography>
        <ListItem>
          <ListItemText
            primary={"Use Suggested"}
            secondary={`Use the suggested number of rounds to win (${suggestedRoundsToWin}).`}
          />
          <ListItemSecondaryAction>
            <Switch
              edge="end"
              color={"secondary"}
              onChange={onUseSuggestedChange}
              name={"winnerBecomesCzar"}
              checked={gameData.ownerSettings.roundsToWin === undefined}
            />
          </ListItemSecondaryAction>
        </ListItem>
        {gameData.ownerSettings.roundsToWin !== undefined && (
          <Slider
            defaultValue={gameData.ownerSettings?.roundsToWin}
            onChange={onChange}
            aria-labelledby="discrete-slider"
            classes={{
              thumb: classes.sliderText,
            }}
            valueLabelDisplay="auto"
            color={"secondary"}
            step={1}
            marks
            min={1}
            max={25}
            disabled={gameData.ownerSettings.roundsToWin === undefined}
          />
        )}
      </FormControl>
    </ListItem>
  );
};

const PlayerLimitField: React.FC<IGameDataProps> = ({ gameData }) => {
  const onChange = (e: ChangeEvent<{}>, v: number | number[]) => {
    clearTimeout(sliderTimeout);
    sliderTimeout = window.setTimeout(() => {
      GameDataStore.setPlayerLimit(v as number);
    }, 500);
  };

  const classes = useStyles();

  return (
    <ListItem>
      <FormControl component="fieldset" style={{ width: "100%" }}>
        <Typography>
          Player limit: {gameData.ownerSettings?.playerLimit}
        </Typography>
        <Typography style={{ marginBottom: "0.5rem" }} variant={"caption"}>
          The maximum number of players for this game
        </Typography>
        <Slider
          defaultValue={gameData.ownerSettings.playerLimit}
          onChange={onChange}
          aria-labelledby="discrete-slider"
          classes={{
            thumb: classes.sliderText,
          }}
          valueLabelDisplay="auto"
          color={"secondary"}
          step={1}
          marks
          min={3}
          max={50}
        />
      </FormControl>
    </ListItem>
  );
};

const WinnerBecomesCzar: React.FC<IGameDataProps> = ({ gameData }) => {
  const onChange = (e: ChangeEvent<{}>, v: boolean) => {
    GameDataStore.setWinnerBecomesCzar(v);
  };

  return (
    <FormControl component="fieldset" style={{ width: "100%" }}>
      <ListItem>
        <ListItemText
          primary={"Winner Becomes Card Captain"}
          secondary={`Make the winner of the last round become the Card Captain for the next round.`}
        />
        <ListItemSecondaryAction>
          <Switch
            edge="end"
            color={"secondary"}
            onChange={onChange}
            name={"winnerBecomesCzar"}
            checked={gameData.ownerSettings.winnerBecomesCzar}
          />
        </ListItemSecondaryAction>
      </ListItem>
    </FormControl>
  );
};

const HideDuringReveal: React.FC<IGameDataProps> = ({ gameData }) => {
  const onChange = (e: ChangeEvent<{}>, v: boolean) => {
    GameDataStore.setHideDuringReveal(v);
  };

  return (
    <FormControl component="fieldset" style={{ width: "100%" }}>
      <ListItem>
        <ListItemText
          primary={"Hide Cards During Reveal"}
          secondary={`While revealing white cards each round, don't show them to the rest of players.`}
        />
        <ListItemSecondaryAction>
          <Switch
            edge="end"
            color={"secondary"}
            onChange={onChange}
            name={"hideDuringReveal"}
            checked={gameData.ownerSettings.hideDuringReveal}
          />
        </ListItemSecondaryAction>
      </ListItem>
    </FormControl>
  );
};

const SkipReveal: React.FC<IGameDataProps> = ({ gameData }) => {
  const onChange = (e: ChangeEvent<{}>, v: boolean) => {
    GameDataStore.setSkipReveal(v);
  };

  return (
    <FormControl component="fieldset" style={{ width: "100%" }}>
      <ListItem>
        <ListItemText
          primary={"Skip Reveal"}
          secondary={`Skip right to picking a winner without reading each white card.`}
        />
        <ListItemSecondaryAction>
          <Switch
            edge="end"
            color={"secondary"}
            onChange={onChange}
            name={"hideDuringReveal"}
            checked={gameData.ownerSettings.skipReveal}
          />
        </ListItemSecondaryAction>
      </ListItem>
    </FormControl>
  );
};

const RoundTimeout: React.FC<IGameDataProps> = ({ gameData }) => {
  const onChange = (e: ChangeEvent<{}>, v: number | number[]) => {
    clearTimeout(sliderTimeout);
    sliderTimeout = window.setTimeout(() => {
      GameDataStore.setRoundTimeout(v as number);
    }, 500);
  };

  const toggle = (e: ChangeEvent<HTMLInputElement>) => {
    GameDataStore.setRoundTimeout(e.currentTarget.checked ? 60 : null);
  };

  const classes = useStyles();

  const timeoutLabel =
    gameData.ownerSettings.roundTimeoutSeconds !== null
      ? `${gameData.ownerSettings?.roundTimeoutSeconds} seconds`
      : "Disabled";

  return (
    <ListItem>
      <FormControl component="fieldset" style={{ width: "100%" }}>
        <Typography>Round Timeout: {timeoutLabel}</Typography>
        <Typography style={{ marginBottom: "0.5rem" }} variant={"caption"}>
          After this long, anyone who has not chosen a card will have one played
          at random automatically.
        </Typography>

        <div style={{ display: "flex", alignItems: "center" }}>
          <Checkbox
            checked={gameData.ownerSettings.roundTimeoutSeconds !== null}
            onChange={toggle}
          />
          <Slider
            defaultValue={gameData.ownerSettings.roundTimeoutSeconds ?? 60}
            disabled={gameData.ownerSettings.roundTimeoutSeconds === null}
            classes={{
              thumb: classes.sliderText,
            }}
            valueLabelDisplay="auto"
            onChange={onChange}
            color={"secondary"}
            step={5}
            min={15}
            max={90}
          />
        </div>
      </FormControl>
    </ListItem>
  );
};
