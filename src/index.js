import React from "react";
import ReactDOM from "react-dom";
import { HashRouter as Router, Route, Switch } from "react-router-dom";

import AnnotationForm from "./pages/form";
import AnnotationResult from "./pages/result";
import PageNotFound from "./pages/page-not-found";

import "antd/dist/antd.min.css";
import "./style.css";
import TabbedViz from "./components/tabs";

function App(props) {
  return (
    <Router>
      <Switch>
        <Route path="/" exact component={AnnotationForm} />
        <Route path="/result/:id" component={AnnotationResult} />
        <Route path="/visualizer/:id" component={TabbedViz}/>
        <Route component={PageNotFound} />
      </Switch>
    </Router>
  );
}

ReactDOM.render(<App />, document.getElementById("app"));
