import {GameDataStore} from "@Global/DataStore/GameDataStore";
import {useDataStore} from "@Global/Utils/HookUtils";
import React, {ChangeEvent, useEffect, useRef, useState} from "react";
import {Button, CardActions, CardContent, Dialog, DialogActions, DialogContent, TextField, Tooltip, Typography} from "@material-ui/core";
import {Platform} from "@Global/Platform/platform";
import {UserDataStore} from "@Global/DataStore/UserDataStore";
import classNames from "classnames";
import makeStyles from "@material-ui/core/styles/makeStyles";
import Linkify from "linkifyjs/react";
import {ChatDataStore} from "@Global/DataStore/ChatDataStore";
import {colors} from "../../../../colors";
import Filter from "bad-words";

const filter = new Filter({
	placeHolder: "❗"
});

const useStyles = makeStyles(theme => ({
	cardContent: {
		flex: "1 0",
		justifyContent: "flex-end",
		display: "flex",
		flexDirection: "column",
		overflowY: "auto",
		overflowX: "hidden",
		"&::-webkit-scrollbar": {
			display: "none"
		},
		width: "calc(100% + 30px)",
		paddingRight: 50
	},
	chatWrap: {
		display: "flex",
		flexDirection: "column",
		height: "100%",
	},
	chatMessage: {
		width: "80%",
		margin: "0.5rem 0",
		alignSelf: "flex-end",
		"& a": {
			color: theme.palette.secondary.contrastText
		}
	},
	messageText: {
		borderRadius: "5px",
		backgroundColor: theme.palette.secondary.main,
		color: theme.palette.secondary.contrastText,
		padding: "0.5rem",
		wordBreak: "break-word"
	},
	theirs: {
		backgroundColor: colors.light.dark,
		color: colors.light.contrastText,
	},
	theirsWrapper: {
		alignSelf: "flex-start"
	},
	cardActions: {
		padding: 0
	},
	sendButton: {
		margin: "0 !important",
		height: "100%",
		borderRadius: 0
	}
}));

export const GameChat = () =>
{
	const userData = useDataStore(UserDataStore);
	const gameData = useDataStore(GameDataStore);
	const chatData = useDataStore(ChatDataStore, () =>
	{
		if (cardContentRef.current)
		{
			const el = cardContentRef.current as HTMLDivElement;
			el.scrollTop = el.scrollHeight + el.clientHeight;
		}
	});
	const [pendingMessage, setPendingMessage] = useState("");
	const [sendEnabled, setSendEnabled] = useState(true);

	const inputRef = useRef<HTMLInputElement>();
	const cardContentRef = useRef<HTMLDivElement>() as React.MutableRefObject<HTMLDivElement>;

	useEffect(() => inputRef.current?.focus());

	const send = () =>
	{
		if (!sendEnabled)
		{
			return;
		}

		setSendEnabled(false);
		setTimeout(() => setSendEnabled(true), 3000);
		if (gameData.game?.id && pendingMessage.trim().length > 0)
		{
			Platform.sendChat(userData.playerGuid, gameData.game?.id, pendingMessage)
				.then(() => setPendingMessage(""))
		}
	};

	const getPlayer = (playerGuid: string) => gameData.game?.players?.[playerGuid] ?? gameData.game?.pendingPlayers?.[playerGuid] ?? gameData.game?.spectators?.[playerGuid];
	const getNickname = (playerGuid: string) => getPlayer(playerGuid)?.nickname ?? "Spectator";
	const me = userData.playerGuid;
	const classes = useStyles();
	const thisGameChat = chatData.chat[gameData.game?.id ?? ""] ?? [];
	const noMessages = !thisGameChat || thisGameChat.length === 0;

	return (
		<>
			<CardContent className={classes.cardContent} ref={cardContentRef}>
				<div className={classes.chatWrap}>
					{noMessages && (
						<div style={{textAlign: "center", opacity: 0.5}}>You all are horrible, this game is horrible, let's make chat nice.</div>
					)}
					{thisGameChat?.map((chatPayload, i) => (
						<ChatMessage
							playerGuid={chatPayload.playerGuid}
							isSelf={chatPayload.playerGuid === me}
							nickname={getNickname(chatPayload.playerGuid)}
							message={unescape(chatPayload.message)}
							isConsecutive={thisGameChat?.[i + 1]?.playerGuid === chatPayload.playerGuid}
						/>
					))}
				</div>
			</CardContent>
			<CardActions classes={{
				root: classes.cardActions
			}}>
				<TextField
					style={{flex: "1 0"}}
					ref={inputRef as any}
					value={pendingMessage}
					variant={"outlined"}
					multiline
					disabled={!sendEnabled}
					InputProps={{
						style: {
							borderRadius: 0
						}
					}}
					inputProps={{
						maxLength: 500,
						onKeyDown: (e) =>
						{
							if (e.which === 13 && !e.shiftKey)
							{
								send();
								e.preventDefault();
							}
						}
					}}
					onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setPendingMessage(e.currentTarget.value)}
					color={"secondary"}
				/>
				<Button disabled={!sendEnabled} color={"secondary"} onClick={send} variant={"contained"} className={classes.sendButton}>Send</Button>
			</CardActions>
		</>
	);
};

interface MessageProps
{
	isSelf: boolean;
	nickname: string;
	message: string;
	playerGuid: string;
	isConsecutive: boolean;
}

const ChatMessage: React.FC<MessageProps> = (props) =>
{
	const classes = useStyles();

	const isProfane = filter.isProfane(props.message);
	const [showMuteConfirm, setShowMuteConfirm] = useState(false);

	const mutePerson = () =>
	{
		if (!props.isSelf)
		{
			localStorage.setItem("muted:" + props.playerGuid, "true");
		}
		setShowMuteConfirm(false);
	};

	if (localStorage.getItem("muted:" + props.playerGuid) === "true")
	{
		return null;
	}

	return (
		<>
			<div className={classNames(classes.chatMessage, {
				[classes.theirsWrapper]: !props.isSelf
			})}>
				<div className={classNames(classes.messageText, {
					[classes.theirs]: !props.isSelf
				})}>
					<Linkify options={{target: "_blank"}}>
						{props.message}
					</Linkify>
					{isProfane && !props.isSelf && (
						<Typography variant={"caption"} style={{fontSize: "0.7rem", color: colors.secondary.contrastText, opacity: 0.75, fontStyle: "italic", display: "block"}}>
							{unescape(props.nickname)} said something rude. Click their name to mute them.
						</Typography>
					)}
				</div>
				{!props.isConsecutive && (
					<Tooltip title={"Click to mute (cannot be undone)"}>
						<div style={{cursor: "pointer", opacity: 0.5, marginTop: 3}} onClick={() => !props.isSelf && setShowMuteConfirm(true)}>{unescape(props.nickname)}</div>
					</Tooltip>
				)}
			</div>
			<Dialog open={showMuteConfirm} onClose={() => setShowMuteConfirm(false)}>
				<DialogContent>
					Are you sure you want to mute this person?
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setShowMuteConfirm(false)}>Cancel</Button>
					<Button onClick={() => mutePerson()}>Confirm</Button>
				</DialogActions>
			</Dialog>
		</>
	);
};