import React, { ReactElement, useContext, useEffect, useState } from "react";
import { Link, Redirect, useHistory, useLocation } from "react-router-dom";
import { Button } from "@material-ui/core";
import AuthContext from "../../context/AuthContext";

import "./AuthPages.scss";
import Loader from "../../components/Loader/Loader";

export const AuthLogin = (): ReactElement => {
	const [error, setError] = useState(false);

	const auth = useContext(AuthContext);

	useEffect(() => {
		setError(false);

		auth
			.spotifyGetAuthUrl()
			.then((url) => (location.href = url))
			.catch(() => setError(true));
	}, []);

	return (
		<div className="auth">
			{!error ? (
				<Loader message="Logging in to Spotify..." />
			) : (
				<h2>Failed to log in, please try again later</h2>
			)}

			<Link to="/">
				<Button variant="contained" color="primary">
					Go back
				</Button>
			</Link>
		</div>
	);
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
				<Loader message="Logging in to Spotify..." />
			) : code ? (
				<Loader message="Logged in, redirecting..." />
			) : (
				<h2>Failed to authenticate Spotify</h2>
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
