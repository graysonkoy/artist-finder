import { AppBar, Button, Link, makeStyles, Toolbar } from "@material-ui/core";
import { ReactElement, useContext } from "react";
import { useHistory } from "react-router-dom";
import AuthContext from "../../context/AuthContext";
import DarkModeToggler from "../DarkModeToggler/DarkModeToggler";

import "./Navbar.scss";

const useStyles = makeStyles((theme) => ({
	root: {
		flexGrow: 1,
	},
	title: {
		flexGrow: 1,
		textAlign: "left",
		color: "inherit",
	},
}));

const Navbar = (): ReactElement => {
	const classes = useStyles();

	const auth = useContext(AuthContext);
	const history = useHistory();

	return (
		<AppBar className="navbar" position="static">
			<Toolbar>
				<Link href="/" className={classes.title}>
					<div className="navbar-title">Artist Finder</div>
				</Link>
				<DarkModeToggler />
				{auth.spotifyIsLoggedIn() && (
					<Button
						variant="contained"
						color="secondary"
						onClick={(e) => history.push("/auth/logout")}
					>
						Log out of Spotify
					</Button>
				)}
			</Toolbar>
		</AppBar>
	);
};

export default Navbar;
