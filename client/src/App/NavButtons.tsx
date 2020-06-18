import {
  Button,
  createStyles,
  DialogActions,
  DialogContent,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  useMediaQuery,
} from "@material-ui/core";
import { Link } from "react-router-dom";
import { FaHome, FaUser, GiCardPlay, GiCardRandom } from "react-icons/all";
import { SiteRoutes } from "../Global/Routes/Routes";
import * as React from "react";
import { useState } from "react";
import makeStyles from "@material-ui/core/styles/makeStyles";
import { EnvDataStore } from "../Global/DataStore/EnvDataStore";
import { useDataStore } from "../Global/Utils/HookUtils";
import { AuthDataStore } from "../Global/DataStore/AuthDataStore";
import { useHistory } from "react-router";
import { CloseableDialog } from "../UI/CloseableDialog";
import { getPatreonUrl } from "../Global/Utils/UserUtils";

const useStyles = makeStyles((theme) =>
  createStyles({
    appBarButton: {
      marginLeft: "0.5rem",
    },
    appBarButtonRight: {
      marginRight: "0.5rem",
    },
  })
);

export const NavButtons = () => {
  const envData = useDataStore(EnvDataStore);

  return (
    <>
      <NavButton to={"/"} icon={<FaHome />}>
        Home
      </NavButton>
      {envData.site.base && (
        <NavButton to={SiteRoutes.Games.resolve()} icon={<GiCardPlay />}>
          Games
        </NavButton>
      )}
      <NavButton to={SiteRoutes.PacksBrowser.resolve()} icon={<GiCardRandom />}>
        Card Packs
      </NavButton>
    </>
  );
};

const NavButton: React.FC<{ to: string; icon: React.ReactNode }> = (props) => {
  const classes = useStyles();

  return (
    <Button
      size={"large"}
      className={classes.appBarButton}
      color="inherit"
      component={(p) => <Link {...p} to={props.to} />}
      startIcon={props.icon}
    >
      {props.children}
    </Button>
  );
};

export const AppBarLeftButtons: React.FC = (props) => {
  const mobile = useMediaQuery("(max-width:768px)");
  if (mobile) {
    return null;
  }

  return (
    <div style={{ marginLeft: "2rem", marginRight: "auto" }}>
      <NavButtons />
    </div>
  );
};

export const AppBarRightButtons = () => {
  const authData = useDataStore(AuthDataStore);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [logInDialogVisible, setLogInDialogVisible] = useState(false);
  const history = useHistory();

  const logOut = () => {
    AuthDataStore.logOut();
  };

  const openMenu = (element: HTMLElement) => {
    setAnchorEl(element);
    setUserMenuOpen(true);
  };

  history.listen(() => {
    setUserMenuOpen(false);
  });

  const classes = useStyles();

  return (
    <div>
      {/* {authData.authorized ? ( */}
      <>
        <IconButton
          aria-label={"User Page"}
          className={classes.appBarButtonRight}
          color="inherit"
          onClick={(e) => openMenu(e.currentTarget)}
        >
          <FaUser />
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          keepMounted
          open={userMenuOpen}
          getContentAnchorEl={null}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "left",
          }}
          onClose={() => setUserMenuOpen(false)}
        >
          <MenuItem
            component={(p) => <Link {...p} to={SiteRoutes.MyPacks.resolve()} />}
          >
            My Card Packs
          </MenuItem>
          <MenuItem
            component={(p) => (
              <Link {...p} to={SiteRoutes.Settings.resolve()} />
            )}
          >
            Settings
          </MenuItem>
          <MenuItem onClick={logOut}>Log Out</MenuItem>
        </Menu>
      </>
      {/* ) : (
         <Button */}
      {/* //     className={classes.appBarButtonRight}
      //     color="inherit"
      //     onClick={() => setLogInDialogVisible(true)}
      //   >
      //     Log In
      //   </Button>
      // )} */}
      <CloseableDialog
        open={logInDialogVisible}
        onClose={() => setLogInDialogVisible(false)}
        TitleProps={{ children: "Log In" }}
      >
        <DialogContent dividers>
          <Typography variant={"h6"}>
            Kafcukle uses Patreon for authentication.
          </Typography>
          <br />
          <br />
          <Typography>
            You <strong>do not</strong> need to be a Patreon supporter to log
            in.
          </Typography>
          <br />
          <Typography>
            Patrons may receive extra benefits, but all users can log in!
          </Typography>
          <br />
        </DialogContent>
        <DialogActions>
          <Button
            href={getPatreonUrl(history.location.pathname)}
            variant={"contained"}
            color={"secondary"}
            style={{ margin: "auto", background: "#E64413" }}
            size={"large"}
          >
            Log In with Patreon
          </Button>
        </DialogActions>
      </CloseableDialog>
    </div>
  );
};
