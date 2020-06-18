import React from 'react';
import "./base.scss";
import ReactDOM from 'react-dom';
import * as serviceWorker from './serviceWorker';
import App from "./App/App";
import {BrowserRouter} from "react-router-dom";
import createMuiTheme from "@material-ui/core/styles/createMuiTheme";
import {MuiThemeProvider} from "@material-ui/core";
import ReactGA from "react-ga";
import CssBaseline from "@material-ui/core/CssBaseline";
import {useDataStore} from "./Global/Utils/HookUtils";
import {PreferencesDataStore} from "./Global/DataStore/PreferencesDataStore";
import {colors} from "./colors";

require('es6-promise').polyfill();
const promiseFinally = require('promise.prototype.finally');
promiseFinally.shim();

const lightTheme = createMuiTheme({
	palette: {
		primary: {
			...colors.light
		},
		secondary: {
			...colors.secondary
		},
		type: "light",
	},
	overrides: {
		MuiListItem: {
			secondaryAction: {
				paddingRight: 84
			}
		}
	}
});

const darkTheme = createMuiTheme({
	palette: {
		primary: {
			...colors.dark
		},
		secondary: {
			...colors.secondary
		},
		type: "dark",
	},
	overrides: {
		MuiListItem: {
			secondaryAction: {
				paddingRight: 84
			}
		}
	}
});

ReactGA.initialize('UA-23730353-5', {
	debug: location.hostname.includes("local") || location.hostname.includes("beta")
});
ReactGA.pageview(window.location.pathname + window.location.search);

const ThemeWrapper: React.FC = (props) => {
	const preferences = useDataStore(PreferencesDataStore);

	return (
		<MuiThemeProvider theme={preferences.darkMode ? darkTheme : lightTheme}>
			{props.children}
		</MuiThemeProvider>
	);
};

ReactDOM.render(
	<BrowserRouter>
		<ThemeWrapper>
			<CssBaseline/>
			<App/>
		</ThemeWrapper>
	</BrowserRouter>
	, document.getElementById('root'));


// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();