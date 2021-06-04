import RouteMap from "./Routes";
import {
  BrowserRouter as Router,
  Route,
  Switch,
  Redirect,
} from "react-router-dom";

import { APP_NAME } from "./constants";
import { Container, Nav } from "./components";

import "./App.css";

const App: React.FC = () => (
  <Router>
    <Container>
      <Nav />
      <Switch>
        {Object.keys(RouteMap).map((k, i) => (
          <Route key={`${APP_NAME}-${i}`} path={k} exact>
            {RouteMap[k]}
          </Route>
        ))}
        <Redirect from="/" to="/Hello" />
      </Switch>
    </Container>
  </Router>
);

export default App;
