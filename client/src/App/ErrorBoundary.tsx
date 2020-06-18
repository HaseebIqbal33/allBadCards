import * as React from "react";
import {RouteComponentProps, withRouter} from "react-router";
import {Button} from "@material-ui/core";
import {GameDataStore} from "../Global/DataStore/GameDataStore";
import {UserDataStore} from "../Global/DataStore/UserDataStore";
import Typography from "@material-ui/core/Typography";
import {ClientGameItem} from "../Global/Platform/Contract";

interface IErrorBoundaryProps
{
}

interface DefaultProps
{
}

type Props = IErrorBoundaryProps & DefaultProps;
type State = IErrorBoundaryState;

interface IErrorBoundaryState
{
	hasError: boolean;
	error: Error | null;
	errorInfo: React.ErrorInfo | null;
}

/** This class exists to handle error cases more gracefully than having the app just disappear.
 *  * If a child component errors out, it will display a message with error details */
class ErrorBoundaryInternal extends React.Component<RouteComponentProps<{}>, IErrorBoundaryState>
{
	private static EmailLineBreak = "%0D%0A";

	constructor(props: RouteComponentProps<{}>)
	{
		super(props);

		this.state = {
			hasError: false,
			error: null,
			errorInfo: null,
		};
	}

	public componentDidCatch(error: Error, errorInfo: React.ErrorInfo)
	{
		this.setState({hasError: true, error, errorInfo});

		console.error(error, errorInfo);

		// When the error shows up, we still want people to be able to navigate after it.
		// So, we will listen to one history change and remove the error state at that point.
		const unregisterCallback = this.props.history.listen((location) =>
		{
			unregisterCallback();

			this.setState({
				hasError: false,
				error: null,
				errorInfo: null
			});
		});
	}

	private generateReportLines(joinWith: string)
	{
		let gameData = {...GameDataStore.state.game ?? {}} as Partial<ClientGameItem>;
		delete gameData.settings;
		delete gameData.spectators;

		Object.keys(gameData?.players ?? {}).forEach(pg =>
		{
			delete gameData.players?.[pg]?.whiteCards;
		});

		return [
			`Error: ${this.state.error?.message}`,
			`URL: ${location.href}`,
			`Stack: ${this.state.error?.stack}`,
			`Timestamp: ${(new Date()).toISOString()}`,
			`Browser: ${navigator.userAgent}`,
			`Platform: ${navigator.platform}`,
			`UserInfo: ${JSON.stringify(UserDataStore.state)}`
		].join(joinWith);
	}

	private openEmail = () =>
	{
		window.location.href = (`mailto:allbadcards@gmail.com?subject=AllBadCards%20Error&body=${this.generateReportLines(ErrorBoundaryInternal.EmailLineBreak)}`);
		return;
	};

	public render()
	{
		if (this.state.hasError)
		{
			const chunkError = !!this.state.error?.message.match(/loading chunk/gi);

			const desc = (
				<div>
					<div>
						<br/>
						<Button variant={"contained"} color={"secondary"} style={{color: "white"}} onClick={this.openEmail}>
							Please click here to send an error report
						</Button>
					</div>
					<pre style={{fontSize: "11px", marginTop: "3rem"}}>
						{this.generateReportLines("\n")}
					</pre>
				</div>
			);

			return <div>
				{chunkError && (
					<div style={{textAlign: "center", margin: "3rem auto 0", maxWidth: "45rem"}}>
						<Typography variant={"h5"}>You have an old version. Refresh!</Typography>
						<Typography style={{marginTop: "2rem"}} variant={"body1"}>
							It looks like the version your browser is running has been updated. You can start using the new version by refreshing.
						</Typography>
					</div>
				)}
				{!chunkError && (
					<>
						<Typography variant={"h3"}>Uh oh, something went wrong!</Typography>
						<Typography>{desc}</Typography>
					</>
				)}
			</div>;
		}

		return this.props.children;
	}
}

export const ErrorBoundary = withRouter(ErrorBoundaryInternal);