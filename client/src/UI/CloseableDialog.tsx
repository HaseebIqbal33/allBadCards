import withStyles from "@material-ui/core/styles/withStyles";
import {createStyles} from "@material-ui/styles";
import {Dialog, DialogTitleProps, IconButton, Theme, Typography} from "@material-ui/core";
import MuiDialogTitle from '@material-ui/core/DialogTitle';
import * as React from "react";
import {IoMdClose} from "react-icons/all";
import {DialogProps} from "@material-ui/core/Dialog/Dialog";
import {ModalProps} from "@material-ui/core/Modal";

const styles = (theme: Theme) =>
	createStyles({
		root: {
			margin: 0,
			padding: theme.spacing(2),
			display: "flex"
		},
		closeButton: {
			position: 'absolute',
			right: theme.spacing(1),
			top: theme.spacing(1),
			color: theme.palette.grey[500],
		},
	});

interface CustomDialogTitleProps extends DialogTitleProps
{
	onClose?: ModalProps['onClose'];
}

const DialogTitle = withStyles(styles)((props: CustomDialogTitleProps) =>
{
	const {children, classes, onClose, ...other} = props;

	return (
		<MuiDialogTitle disableTypography className={classes?.root} {...other}>
			<Typography variant="h6">{children}</Typography>
			{onClose ? (
				<IconButton aria-label="close" className={(classes as any)?.closeButton} onClick={onClose as any}>
					<IoMdClose/>
				</IconButton>
			) : null}
		</MuiDialogTitle>
	);
});

export interface CloseableDialogProps extends DialogProps
{
	TitleProps?: CustomDialogTitleProps;
}

export const CloseableDialog: React.FC<CloseableDialogProps> = (props) =>
{
	const {
		children,
		TitleProps,
		onClose,
		...rest
	} = props;

	const {
		onClose: _,
		...restTitle
	} = TitleProps ?? {};

	return (
		<Dialog {...rest} onClose={onClose}>
			<DialogTitle {...restTitle} onClose={onClose} />
			{children}
		</Dialog>
	);
}