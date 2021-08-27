import { Button } from "@material-ui/core";
import { ReactElement, useContext, useEffect } from "react";
import { Link, Redirect, useHistory, useLocation } from "react-router-dom";
import AuthContext from "../../context/AuthContext";

import "./AuthPages.scss";

export const AuthLogin = (): ReactElement => {
	const auth = useContext(AuthContext);

	window.location.href = auth.spotifyGetAuthUrl();

	return <div className="auth"></div>;
};

export const AuthRedirect = (): ReactElement => {
	const auth = useContext(AuthContext);
	const history = useHistory();

	const params = new URLSearchParams(useLocation().search);
	const code = params.get("code");

	useEffect(() => {
		auth.spotifyLogin(code);
		history.push("/");
	}, [code]);

	if (!code) {
		return (
			<div>
				<h2>Failed to authenticate Spotify</h2>
				<Link to="/">
					<Button variant="contained" color="primary">
						Go back
					</Button>
				</Link>
			</div>
		);
	}

	return <div className="auth">Redir</div>;
};

export const AuthLogout = (): ReactElement => {
	const auth = useContext(AuthContext);

	useEffect(() => {
		auth.spotifyLogout();
	}, []);

	return <Redirect to="/" />;
};
