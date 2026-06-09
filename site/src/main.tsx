import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./gf.css";
import "./site-overrides.css";

document.body.classList.add("app-ready");
if (window.localStorage?.getItem("isDarkTheme") === "true") {
  document.body.classList.add("gf-dark-theme");
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
