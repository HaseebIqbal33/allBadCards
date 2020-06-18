import {ButtonGroup, colors, ListItem, ListItemText, Typography, useMediaQuery} from "@material-ui/core";
import React, {useEffect, useState} from "react";
import Button from "@material-ui/core/Button";
import {Twemoji} from "react-emoji-render";
import {Platform} from "@Global/Platform/platform";
import List from "@material-ui/core/List";
import {FaDollarSign, FaPaypal, RiExternalLinkLine} from "react-icons/all";
import {makeStyles} from "@material-ui/styles";
import {EnvDataStore} from "@Global/DataStore/EnvDataStore";
import {useDataStore} from "@Global/Utils/HookUtils";

const useStyles = makeStyles({
	link: {
		textDecoration: 'none'
	}
});

export const Support = () =>
{
	const classes = useStyles();
	const [randomThankYou, setRandomThankYou] = useState(0);
	const envData = useDataStore(EnvDataStore);

	useEffect(() =>
	{
		setRandomThankYou(Math.random());
		Platform.trackEvent("saw-support-message");
	}, []);

	if (!envData.site.base)
	{
		return null;
	}

	const thankYous = [
		<>
			<div>
				<a href={"http://patreon.com/allbadcards"} target={"_blank"} rel={"noreferrer nofollow"}>
					<img src={"/become_a_patron_button.png"}/>
				</a>
			</div>
			<div>
				- OR -
			</div>
		</>,
		<Button
			variant={"contained"}
			color={"secondary"}
			style={{color: "white", textDecoration: "none", marginTop: "1rem", backgroundColor: "#058dc7"}}
			startIcon={<Twemoji text={"☕"}/>}
			onClick={() => Platform.trackEvent("support-link-click", "bmac-coffee")}
			href="https://www.buymeacoffee.com/allbadcards" target="_blank"
		>
			Buy me a coffee
		</Button>,
	];

	const which = Math.floor(randomThankYou * thankYous.length);
	const thankYouButton = thankYous[which];

	const mobile = useMediaQuery('(max-width:768px)');

	return (
		<div style={{
			marginTop: "3rem",
			marginBottom: "8rem",
			textAlign: "center"
		}}>
			<Typography variant={"h5"}>Did you enjoy the game? One dude made this site and it runs on donations!</Typography>
			<Typography style={{marginTop: "1rem"}}>
				{thankYouButton}
				<List>
					<ListItem>
						<ListItemText style={{textAlign: "center"}} primary={<>
							<ButtonGroup orientation={mobile ? "vertical" : "horizontal"}>
								<Button style={{background: colors.blue.A100}} startIcon={<img width={18} src={"https://cdn1.venmo.com/marketing/images/branding/venmo-icon.svg"}/>} endIcon={<RiExternalLinkLine/>} variant={"contained"} size={"large"} className={classes.link} href={"https://venmo.com/allbadcards"} target={"_blank"}>
									venmo
								</Button>
								<Button style={{background: colors.orange.A100}} startIcon={<FaPaypal/>} endIcon={<RiExternalLinkLine/>} variant={"contained"} size={"large"} className={classes.link} href={"https://paypal.me/jakelauer"} target={"_blank"}>
									paypal
								</Button>
								<Button  style={{background: colors.green.A100}} startIcon={<FaDollarSign />} endIcon={<RiExternalLinkLine/>} variant={"contained"} size={"large"} className={classes.link} href={"https://cash.app/$allbadcards"} target={"_blank"}>
									cashapp
								</Button>
							</ButtonGroup>
						</>}/>
					</ListItem>
				</List>
			</Typography>
		</div>
	);
};
