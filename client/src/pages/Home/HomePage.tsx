import { Button } from "@material-ui/core";
import { ReactElement, useContext } from "react";
import { Link } from "react-router-dom";
import AuthContext from "../../context/AuthContext";
import ArtistFinder from "../ArtistFinder/ArtistFinder";

const HomePage = (): ReactElement => {
	const auth = useContext(AuthContext);

	return (
		<div className="auth">
			<ArtistFinder />
		</div>
	);
};

export default HomePage;
