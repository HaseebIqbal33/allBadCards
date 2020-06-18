import Divider from "@material-ui/core/Divider";
import ButtonGroup from "@material-ui/core/ButtonGroup";
import Button from "@material-ui/core/Button";
import {
  DialogContent,
  ListItemSecondaryAction,
  Typography,
} from "@material-ui/core";
import React, { useState } from "react";
import { useDataStore } from "../../../../Global/Utils/HookUtils";
import { GameDataStore } from "../../../../Global/DataStore/GameDataStore";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import List from "@material-ui/core/List";
import Switch from "@material-ui/core/Switch";
import { FaQuestionCircle } from "react-icons/all";
import { CloseableDialog } from "../../../../UI/CloseableDialog";

export const SettingsBlockMainPacks = () => {
  const [expDialogOpen, setExpDialogOpen] = useState(false);
  const gameData = useDataStore(GameDataStore);

  const onPacksChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newPacks = event.target.checked
      ? [...gameData.ownerSettings.includedPacks, event.target.name]
      : gameData.ownerSettings.includedPacks.filter(
          (a) => a !== event.target.name
        );
    GameDataStore.setIncludedPacks(newPacks);
  };

  const selectDefault = () => {
    GameDataStore.setIncludedPacks(
      GameDataStore.getDefaultPacks(gameData.loadedPacks)
    );
  };

  const selectAll = () => {
    GameDataStore.setIncludedPacks(gameData.loadedPacks?.map((p) => p.packId));
  };

  const selectNone = () => {
    GameDataStore.setIncludedPacks([]);
  };

  const mobile = useMediaQuery("(max-width:768px)");

  return (
    <>
      <Button
        startIcon={<FaQuestionCircle />}
        variant={"outlined"}
        onClick={() => setExpDialogOpen(true)}
      >
        Looking for the official packs?
      </Button>

      <Divider style={{ margin: "1rem 0" }} />
      <div>
        <ButtonGroup orientation={mobile ? "vertical" : "horizontal"}>
          <Button onClick={selectAll}>All</Button>
          <Button onClick={selectNone}>None</Button>
          <Button onClick={selectDefault}>Suggested</Button>
        </ButtonGroup>
        <Typography style={{ padding: "1rem 0" }}>
          <strong>{gameData.ownerSettings.includedPacks?.length ?? 0}</strong>{" "}
          packs selected
        </Typography>
      </div>
      <List>
        {gameData.loadedPacks?.map((pack) => (
          <>
            <ListItem>
              <ListItemText
                primary={pack.name}
                secondary={`${pack.quantity.black} black cards, ${pack.quantity.white} white cards`}
              />
              <ListItemSecondaryAction>
                <Switch
                  edge="end"
                  color={"secondary"}
                  onChange={onPacksChange}
                  name={pack.packId}
                  checked={
                    gameData.ownerSettings.includedPacks.indexOf(pack.packId) >
                    -1
                  }
                />
              </ListItemSecondaryAction>
            </ListItem>
          </>
        ))}
      </List>
      <CloseableDialog
        open={expDialogOpen}
        onClose={() => setExpDialogOpen(false)}
        TitleProps={{ children: ":(" }}
      >
        <DialogContent dividers>
          In response to a legal request, Official Packs are no longer available
          on Kafcukle. Due to the nature of the license for those cards, we
          cannot provide them while also requesting donations to keep the site
          running.
          <br />
          <br />
          Sorry about that!
        </DialogContent>
      </CloseableDialog>
    </>
  );
};
