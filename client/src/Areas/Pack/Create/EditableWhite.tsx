import React, {useEffect} from "react";
import {Button, Chip, Grid, TextField} from "@material-ui/core";
import {WhiteCard} from "../../../UI/WhiteCard";
import makeStyles from "@material-ui/core/styles/makeStyles";
import {IEditableCard} from "./CardContract";

const useStyles = makeStyles(theme => ({
	whiteInput: {
		color: theme.palette.primary.contrastText
	},
	whiteCardTextField: {
		marginTop: "0.5rem",
		'& .MuiOutlinedInput-root': {
			'& fieldset': {
				borderColor: 'black',
			},
		},
	},
	shortCard: {
		minHeight: "0",
		height: "100%"
	}
}));

export const EditableWhite: React.FC<IEditableCard> = React.memo((props) =>
{
	const classes = useStyles();

	const inputRef = React.useRef<HTMLInputElement>();

	useEffect(() =>
	{
		if (props.focus)
		{
			setTimeout(() =>
			{
				inputRef?.current?.focus();
			}, 200);
		}
	}, []);

	return (
		<Grid item xs={12} md={6}>
			<WhiteCard className={classes.shortCard} actions={props.canEdit && (
				<Button onClick={() => props.onRemove(props.index)} style={{color: "black"}}>Remove</Button>
			)}>
				<Chip size={"small"} label={`ID: ${props.index + 1}`} />
				<TextField
					variant={"outlined"}
					value={props.value}
					fullWidth
					multiline
					inputRef={inputRef}
					disabled={!props.canEdit}
					classes={{
						root: classes.whiteCardTextField
					}}
					inputProps={{
						className: classes.whiteInput,
						style: {
							color: "black"
						}
					}}
					onChange={e => props.onEdit(props.index, e.currentTarget.value)}
				/>
			</WhiteCard>
		</Grid>
	)
});