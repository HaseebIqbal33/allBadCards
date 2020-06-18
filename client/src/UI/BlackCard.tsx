import * as React from "react";
import { useState } from "react";
import { Card, CardActions } from "@material-ui/core";
import CardContent from "@material-ui/core/CardContent";
import Typography from "@material-ui/core/Typography";
import sanitize from "sanitize-html";
import { GameDataStore } from "../Global/DataStore/GameDataStore";
import makeStyles from "@material-ui/core/styles/makeStyles";
import classNames from "classnames";
import { colors } from "../colors";

interface IBlackCardProps {
  children?: React.ReactNode;
  className?: string;
  packId?: string;
  actions?: React.ReactNode;
}

interface DefaultProps {}

type Props = IBlackCardProps & DefaultProps;
type State = IBlackCardState;

interface IBlackCardState {
  elevation: number;
}

const useStyles = makeStyles((theme) => ({
  card: {
    minHeight: "20vh",
    cursor: "default",
    backgroundColor: colors.dark.custom,
    display: "flex",
    flexDirection: "column",
  },
}));

export const BlackCard: React.FC<Props> = (props) => {
  const [elevation, setElevation] = useState(2);

  const onMouseEnter = () => {
    setElevation(10);
  };

  const onMouseLeave = () => {
    setElevation(2);
  };

  let children: React.ReactNode | string = props.children;

  if (typeof props.children === "string") {
    const replaceUnderscores =
      props.children?.replace(/(_){1,}\1/g, "_").replace(/_/g, "_________") ??
      "";
    children = sanitize(replaceUnderscores);
  }

  const packId = props.packId;
  let pack;
  if (packId) {
    pack = GameDataStore.state.loadedPacks.find((p) => p.packId === packId);
  }

  const classes = useStyles();

  return (
    <Card
      className={classNames(classes.card, props.className)}
      elevation={elevation}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <CardContent style={{ flex: 1 }}>
        {pack && (
          <Typography
            variant={"caption"}
            style={{
              color: "white",
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
        {typeof props.children === "string" ? (
          <Typography variant={"h6"} style={{ color: "white" }}>
            <span dangerouslySetInnerHTML={{ __html: children as string }} />
          </Typography>
        ) : (
          children
        )}
      </CardContent>
      {props.actions ? (
        <CardActions>{props.actions}</CardActions>
      ) : (
        <CardActions>
          <Typography
            variant={"caption"}
            style={{ color: "white", display: "flex", alignContent: "center" }}
          >
            <img
              src={"/logo-tiny-inverted.png"}
              width={18}
              style={{
                marginRight: "0.5rem",
                height: "auto",
                width: 18,
                maxHeight: 18,
              }}
            />{" "}
            kafuckle
          </Typography>
        </CardActions>
      )}
    </Card>
  );
};
