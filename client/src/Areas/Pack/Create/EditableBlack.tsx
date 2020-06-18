import React, {useEffect, useState} from "react";
import {Button, Chip, Grid, TextField} from "@material-ui/core";
import {BlackCard} from "../../../UI/BlackCard";
import makeStyles from "@material-ui/core/styles/makeStyles";
import {IEditableCard} from "./CardContract";

const useStyles = makeStyles(theme => ({
	blackInput: {
		color: theme.palette.secondary.contrastText
	},
	blackCardTextField: {
		marginTop: "0.5rem",
		'& .MuiOutlinedInput-root': {
			'& fieldset': {
				borderColor: 'white',
			},
		},
	},
	shortCard: {
		minHeight: "0",
		height: "100%"
	},
}));

export const EditableBlack: React.FC<IEditableCard> = React.memo((props) =>
{
	const classes = useStyles();

	const [error, setError] = useState("");
	const inputRef = React.useRef<HTMLInputElement>();

	useEffect(() =>
	{
		onEdit(props.value);

		if (props.focus)
		{
			setTimeout(() =>
			{
				inputRef?.current?.focus();
			}, 200);
		}
	}, []);

	const updateError = (errorVal: string) =>
	{
		setError(errorVal);
	};

	const onEdit = (value: string) =>
	{
		props.onEdit(props.index, value);

		const underscores = value.match(/_/g) ?? [];
		if (underscores.length > 3)
		{
			updateError("You can use a maximum of 3 blanks");
		}
		else
		{
			updateError("");
		}
	};

	return (
		<Grid item xs={12} md={6}>
			<BlackCard className={classes.shortCard} actions={props.canEdit && (
				<Button onClick={() => props.onRemove(props.index)} style={{color: "white"}}>Remove</Button>
			)}>
				<Chip size={"small"} label={`ID: ${props.index + 1}`} />
				<TextField
					variant={"outlined"}
					value={props.value}
					error={!!error}
					helperText={error}
					disabled={!props.canEdit}
					fullWidth
					multiline
					inputRef={inputRef}
					classes={{
						root: classes.blackCardTextField
					}}
					inputProps={{
						className: classes.blackInput,
						style: {
							color: "white"
						}
					}}
					onChange={e => onEdit(e.currentTarget.value)}
				/>
			</BlackCard>
		</Grid>
	)
});