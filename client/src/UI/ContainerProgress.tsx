import * as React from "react";
import {PropagateLoader} from "react-spinners";

interface IContainerProgressProps
{
}

interface DefaultProps
{
	loading: boolean;
}

type Props = IContainerProgressProps & DefaultProps;
type State = IContainerProgressState;

interface IContainerProgressState
{
}

export class ContainerProgress extends React.Component<Props, State>
{
	constructor(props: Props)
	{
		super(props);

		this.state = {
		};
	}

	public static defaultProps = {
		loading: true
	};

	public componentDidMount(): void
	{
	}

	public render()
	{
		if(!this.props.loading)
		{
			return this.props.children;
		}

		return (
			<div style={{
				position: "fixed",
				zIndex: 99,
				top: 0,
				left: 0,
				right: 0,
				height: "100vh",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				pointerEvents: "none"
			}}>
				<PropagateLoader loading={true}/>
			</div>
		);
	}
}