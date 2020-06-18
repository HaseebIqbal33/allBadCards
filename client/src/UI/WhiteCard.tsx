import * as React from "react";
import { Card } from "@material-ui/core";
import CardContent from "@material-ui/core/CardContent";
import Typography from "@material-ui/core/Typography";
import CardActions from "@material-ui/core/CardActions";
import makeStyles from "@material-ui/core/styles/makeStyles";
import { GameDataStore } from "../Global/DataStore/GameDataStore";
import classNames from "classnames";
import { PreferencesDataStore } from "../Global/DataStore/PreferencesDataStore";
import { colors } from "../colors";

interface IWhiteCardProps {
  onSelect?: () => void;
  actions?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  packId?: string;
  parentCols?: number;
}

const useStyles = makeStyles((theme) => ({
  card: {
    backgroundColor: PreferencesDataStore.state.darkMode ? "#EEE" : "#fee214",
    display: "flex",
    flexDirection: "column",
    minHeight: "20vh",
    color: colors.light.contrastText,
  },
}));

export const WhiteCard: React.FC<IWhiteCardProps> = (props) => {
  const { onSelect, children, actions, style } = props;

  const classes = useStyles();

  const packId = props.packId;
  let pack;
  if (packId) {
    pack = GameDataStore.state.loadedPacks.find((p) => p.packId === packId);
  }

  return (
    <Card
      className={classNames(classes.card, props.className)}
      onClick={onSelect}
      elevation={5}
      style={style}
    >
      <CardContent style={{ flex: "1" }}>
        {pack && (
          <Typography
            variant={"caption"}
            style={{
              letterSpacing: "normal",
              opacity: 0.5,
              fontSize: "0.75em",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            <em>{pack.name}</em>
          </Typography>
        )}
        <Typography variant={"h6"}>{children}</Typography>
      </CardContent>
      {actions && <CardActions>{actions}</CardActions>}
    </Card>
  );
};
