import { ReactElement } from "react";
import { CircularProgress } from "@material-ui/core";

import "./Loader.scss";

const Loader = (): ReactElement => {
	return (
		<div className="loader">
			<CircularProgress />
		</div>
	);
};

export default Loader;
