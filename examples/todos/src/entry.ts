import * as ReactDOM from "react-dom";
import * as React from "react";
import {Application} from "./components/main";

const container = document.createElement("div");
document.body.appendChild(container);

ReactDOM.render(React.createElement(Application), container);