import React, { ReactElement } from "react";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import { MessageStore } from "./context/MessageContext";
import { ApiStore } from "./context/ApiContext";
import { AuthStore } from "./context/AuthContext";
import { ThemeStore } from "./context/ThemeContext";
import { AuthLogin, AuthRedirect, AuthLogout } from "./pages/Auth/AuthPages";
import Navbar from "./components/Navbar/Navbar";
import MessageBar from "./components/MessageBar/MessageBar";
import ArtistFinder from "./pages/ArtistFinder/ArtistFinder";

import "modern-normalize/modern-normalize.css";

import "./styles/variables.scss";
import "./App.scss";

const App = (): ReactElement => {
	return (
		<div className="App">
			<Router>
				<ThemeStore>
					<MessageStore>
						<ApiStore>
							<AuthStore>
								<Navbar />

								<main>
									<Switch>
										<Route exact path="/" component={ArtistFinder} />
										<Route exact path="/auth/login" component={AuthLogin} />
										<Route
											exact
											path="/auth/redirect"
											component={AuthRedirect}
										/>
										<Route exact path="/auth/logout" component={AuthLogout} />
									</Switch>
								</main>

								<MessageBar />
							</AuthStore>
						</ApiStore>
					</MessageStore>
				</ThemeStore>
			</Router>
		</div>
	);
};

export default App;
