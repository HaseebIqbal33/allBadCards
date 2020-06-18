import { useHistory } from "react-router";
import { default as React, useState } from "react";
import {
  createStyles,
  IconButton,
  SwipeableDrawer,
  Typography,
} from "@material-ui/core";
import { FiMenu } from "react-icons/all";
import { colors } from "../colors";
import { NavButtons } from "./NavButtons";
import makeStyles from "@material-ui/core/styles/makeStyles";

const useStyles = makeStyles((theme) =>
  createStyles({
    drawer: {
      minWidth: "50vw",
      "& a": {
        display: "flex",
        justifyContent: "flex-start",
        marginTop: "0.5rem",
        marginBottom: "0.5rem",
      },
    },
  })
);

export const AppDrawer = () => {
  const history = useHistory();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const classes = useStyles();
  const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  history.listen(() => setDrawerOpen(false));

  return (
    <>
      <IconButton
        onClick={() => setDrawerOpen(true)}
        style={{ color: "white" }}
      >
        <FiMenu />
      </IconButton>
      <SwipeableDrawer
        disableBackdropTransition={!iOS}
        disableDiscovery={iOS}
        anchor={"left"}
        open={drawerOpen}
        onOpen={() => setDrawerOpen(true)}
        onClose={() => setDrawerOpen(false)}
        classes={{
          paper: classes.drawer,
        }}
      >
        <div style={{ minWidth: "50vw" }}>
          <Typography
            style={{
              textAlign: "center",
              padding: "1rem 0",
              background: colors.dark.main,
              color: colors.dark.contrastText,
            }}
          >
            KAFUCKLE
          </Typography>
          <NavButtons />
        </div>
      </SwipeableDrawer>
    </>
  );
};
