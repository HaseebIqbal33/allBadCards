import React, {useEffect, useState} from "react";
import {Button} from "@material-ui/core";
import {ButtonTypeMap} from "@material-ui/core/Button/Button";
import {DefaultComponentProps, OverrideProps} from "@material-ui/core/OverridableComponent";
import {ExtendButtonBaseTypeMap} from "@material-ui/core/ButtonBase/ButtonBase";
import CircularProgress from "@material-ui/core/CircularProgress";

interface ILoadingButtonProps
{
	loading: boolean;
}

type LoadingButtonTypeMap = ButtonTypeMap<ILoadingButtonProps>;

type LoadingButtonProps = OverrideProps<ExtendButtonBaseTypeMap<LoadingButtonTypeMap>, 'a'> & DefaultComponentProps<LoadingButtonTypeMap>;

export const LoadingButton = React.forwardRef<typeof Button, LoadingButtonProps>((props, ref) =>
{
	const {
		children,
		startIcon,
		loading,
		disabled,
		...rest
	} = props;

	useEffect(() =>
	{
		if (isLoading && !loading && !timeoutId)
		{
			setTimeoutId(
				window.setTimeout(() =>
				{
					setLoading(false);
					setTimeoutId(null);
				}, 250)
			);
		}
		else
		{
			setLoading(loading);
		}
	}, [loading]);

	const [timeoutId, setTimeoutId] = useState<null | number>(null);
	const [isLoading, setLoading] = useState(loading);
	const disabledFixed = disabled || isLoading;
	const fixedStartIcon = isLoading ? <CircularProgress size={14}/> : startIcon;

	return (
		<Button {...rest} startIcon={fixedStartIcon} disabled={disabledFixed}>
			{children}
		</Button>
	);
});