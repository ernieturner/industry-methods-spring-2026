import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./app/App";
import { applyTheme, getInitialTheme } from "./lib/theme";
import "./index.css";

const initialTheme = getInitialTheme();
applyTheme(initialTheme);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App initialTheme={initialTheme} />
    </BrowserRouter>
  </React.StrictMode>
);
