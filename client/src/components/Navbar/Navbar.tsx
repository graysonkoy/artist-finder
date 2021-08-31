import React, { AppBar, Button, Link, Toolbar } from "@material-ui/core";
import { ReactElement, useContext } from "react";
import { useHistory } from "react-router-dom";
import AuthContext from "../../context/AuthContext";
import DarkModeToggler from "../DarkModeToggler/DarkModeToggler";

import "./Navbar.scss";

const Navbar = (): ReactElement => {
	const auth = useContext(AuthContext);
	const history = useHistory();

	return (
		<AppBar className="navbar" position="static">
			<Toolbar>
				<Link href="/">
					<div className="navbar-title">Artist Finder</div>
				</Link>

				<div style={{ flexGrow: 1 }}></div>

				<DarkModeToggler />

				{auth.spotifyIsLoggedIn() && (
					<Button
						variant="contained"
						color="secondary"
						onClick={() => history.push("/auth/logout")}
					>
						Log out of Spotify
					</Button>
				)}
			</Toolbar>
		</AppBar>
	);
};

export default Navbar;
