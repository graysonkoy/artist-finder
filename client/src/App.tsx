import { ReactElement } from "react";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import { AuthStore } from "./context/AuthContext";
import { ThemeStore } from "./context/ThemeContext";
import { AuthLogin, AuthRedirect, AuthLogout } from "./pages/Auth/AuthPages";
import HomePage from "./pages/Home/HomePage";

import "modern-normalize/modern-normalize.css";
import "./styles/variables.scss";
import "./App.scss";

const App = (): ReactElement => {
  return (
    <div className="App">
      <Router>
        <ThemeStore>
          <AuthStore>
            <Switch>
              <Route exact path="/" component={HomePage} />
              <Route exact path="/auth/login" component={AuthLogin} />
              <Route exact path="/auth/redirect" component={AuthRedirect} />
              <Route exact path="/auth/logout" component={AuthLogout} />
            </Switch>
          </AuthStore>
        </ThemeStore>
      </Router>
    </div>
  );
};

export default App;
