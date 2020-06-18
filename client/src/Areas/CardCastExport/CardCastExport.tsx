import React, { useState } from "react";
import {
  Container,
  Dialog,
  DialogContent,
  Grid,
  List,
  ListItem,
  ListItemText,
  TextField,
} from "@material-ui/core";
import Button from "@material-ui/core/Button";
import { Platform } from "../../Global/Platform/platform";
import { ICardPackDefinition } from "../../Global/Platform/Contract";
import { PackCreatorDataStorePayload } from "@Global/DataStore/PackCreatorDataStore";

const exportToJson = (pack: ICardPackDefinition | null) => {
  const objectData: Partial<PackCreatorDataStorePayload> = {
    packName: pack?.pack?.name,
    whiteCards: pack?.white,
    blackCards: pack?.black?.map((b) => b.content ?? ""),
  };

  let filename = "export.json";
  let contentType = "application/json;charset=utf-8;";
  if (window.navigator && window.navigator.msSaveOrOpenBlob) {
    var blob = new Blob(
      [decodeURIComponent(encodeURI(JSON.stringify(objectData, null, 2)))],
      { type: contentType }
    );
    navigator.msSaveOrOpenBlob(blob, filename);
  } else {
    var a = document.createElement("a");
    a.download = filename;
    a.href =
      "data:" +
      contentType +
      "," +
      encodeURIComponent(JSON.stringify(objectData, null, 2));
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
};

const CardCastExport = () => {
  const [cardCastDeckCode, setCardCastDeckCode] = useState("");
  const [
    downloadablePack,
    setDownloadablePack,
  ] = useState<ICardPackDefinition | null>(null);
  const [foundCodeData, setFoundCodeData] = useState<
    ICardPackDefinition[] | null
  >(null);

  const onFindCardCastDeck = () => {
    Platform.getCardCastPackCached(cardCastDeckCode)
      .then((data) => {
        setFoundCodeData(data.packs);
        const matchedCode =
          data.packs.length === 1 && data.packs[0].pack.id === cardCastDeckCode;
        if (matchedCode) {
          setDownloadablePack(data.packs[0]);
        }
      })
      .catch((e) => alert("We could not find your card pack. Sorry!"));
  };

  const foundPacks = foundCodeData?.length ?? 0;

  return (
    <Container>
      <Grid container>
        <Grid item xs={12}>
          CardCast recently shut down. Fortunately, we have some decks cached in
          our data. If you (or anyone) ever played Kafcukle with your deck, we
          may have a copy.
          <br />
          <br />
          Enter your CardCast deck ID, or search for your pack name below:
          <br />
          <br />
          <TextField
            color={"secondary"}
            value={cardCastDeckCode}
            style={{ margin: "0 1rem 1rem 0", width: "20rem" }}
            size={"small"}
            onChange={(e) => setCardCastDeckCode(e.target.value)}
            id="outlined-basic"
            label="Search Pack Name or Code"
            variant="outlined"
          />
          <Button
            variant={"contained"}
            color={"secondary"}
            onClick={onFindCardCastDeck}
            disabled={cardCastDeckCode.length < 3}
          >
            Find Deck
          </Button>
        </Grid>
      </Grid>
      {foundPacks > 0 && !downloadablePack && (
        <CardList
          setDownloadablePack={setDownloadablePack}
          foundCodeData={foundCodeData}
        />
      )}
      <Dialog
        open={!!downloadablePack}
        onClose={() => setDownloadablePack(null)}
      >
        <DialogContent>
          We found your data!
          <br />
          <br />
          <Button
            variant={"contained"}
            onClick={() => exportToJson(downloadablePack)}
          >
            Download as JSON
          </Button>
        </DialogContent>
      </Dialog>
    </Container>
  );
};

const CardList: React.FC<{
  foundCodeData: ICardPackDefinition[] | null;
  setDownloadablePack: (pack: ICardPackDefinition) => void;
}> = React.memo(({ foundCodeData, setDownloadablePack }) => {
  return (
    <List>
      {foundCodeData?.map((pack) => (
        <ListItem button>
          <ListItemText
            onClick={() => {
              setDownloadablePack(pack);
            }}
            primary={pack.pack.name}
            secondary={pack.pack.id}
          />
        </ListItem>
      ))}
    </List>
  );
});

export default CardCastExport;
