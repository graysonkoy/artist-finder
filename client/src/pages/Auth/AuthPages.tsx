import { Button } from "@material-ui/core";
import { ReactElement, useContext, useEffect, useState } from "react";
import { Link, Redirect, useHistory, useLocation } from "react-router-dom";
import AuthContext from "../../context/AuthContext";

import "./AuthPages.scss";

export const AuthLogin = (): ReactElement => {
	const auth = useContext(AuthContext);

	window.location.href = auth.spotifyGetAuthUrl();

	return <div className="auth"></div>;
};

export const AuthRedirect = (): ReactElement => {
	const [loggingIn, setLoggingIn] = useState(true);

	const auth = useContext(AuthContext);
	const history = useHistory();

	const params = new URLSearchParams(useLocation().search);
	const code = params.get("code");

	useEffect(() => {
		setLoggingIn(true);

		if (code) {
			auth.spotifyLogin(code).then(() => history.push("/"));
		}

		setLoggingIn(false);
	}, [code]);

	return (
		<div className="auth">
			{loggingIn ? (
				<h2>Logging in to Spotify...</h2>
			) : !code ? (
				<h2>Failed to authenticate Spotify</h2>
			) : (
				<h2>Logged in, redirecting...</h2>
			)}

			<Link to="/">
				<Button variant="contained" color="primary">
					Go back
				</Button>
			</Link>
		</div>
	);
};

export const AuthLogout = (): ReactElement => {
	const auth = useContext(AuthContext);

	useEffect(() => {
		auth.spotifyLogout();
	}, []);

	return <Redirect to="/" />;
};
