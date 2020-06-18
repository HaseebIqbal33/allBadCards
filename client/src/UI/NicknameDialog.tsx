import * as React from "react";
import {DialogTitle} from "@material-ui/core";
import Dialog from "@material-ui/core/Dialog";
import DialogContent from "@material-ui/core/DialogContent";
import TextField from "@material-ui/core/TextField";
import DialogActions from "@material-ui/core/DialogActions";
import Button from "@material-ui/core/Button";

interface INicknameDialogProps
{
	open: boolean;
	onClose: () => void;
	onConfirm: (nickname: string) => void;
	title: React.ReactNode;
}

interface DefaultProps
{
}

type Props = INicknameDialogProps & DefaultProps;
type State = INicknameDialogState;

interface INicknameDialogState
{
	nickname: string;
}

export class NicknameDialog extends React.Component<Props, State>
{
	constructor(props: Props)
	{
		super(props);

		this.state = {
			nickname: ""
		};
	}

	private onChange = (e: React.ChangeEvent<HTMLInputElement>) =>
	{
		this.setState({
			nickname: e.currentTarget.value
		})
	};

	private onConfirm = () =>
	{
		if(this.state.nickname.trim().length > 0)
		{
			this.props.onConfirm(this.state.nickname);
			this.props.onClose();
		}
	};

	private onEnter = (e: React.KeyboardEvent) => {
		if(e.which === 13)
		{
			this.onConfirm();
		}
	};

	public render()
	{
		const {
			onClose,
			open,
			title,
			children
		} = this.props;

		return (
			<Dialog open={open} onClose={onClose}>
				<DialogTitle id="form-dialog-title">{title}</DialogTitle>
				<DialogContent>
					<TextField
						autoFocus
						margin="dense"
						id="name"
						label="Nickname"
						type="nickname"
						color={"secondary"}
						onChange={this.onChange}
						onKeyPress={this.onEnter}
						inputProps={{
							maxLength: 50
						}}
						fullWidth
					/>
				</DialogContent>
				<DialogActions>
					<Button onClick={this.onConfirm} color="secondary" variant={"contained"}>
						Confirm
					</Button>
				</DialogActions>
			</Dialog>
		);
	}
}