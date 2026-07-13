import { authRoles } from "src/app/auth";
import AgentesSignInPage from "./AgentesSignInPage";

const AgentesSignInConfig = {
  settings: {
    layout: {
      config: {
        navbar: {
          display: false,
        },
        toolbar: {
          display: false,
        },
        footer: {
          display: false,
        },
        leftSidePanel: {
          display: false,
        },
        rightSidePanel: {
          display: false,
        },
      },
    },
  },
  auth: authRoles.onlyGuest,
  routes: [
    {
      path: "agentes/sign-in",
      element: <AgentesSignInPage />,
    },
  ],
};

export default AgentesSignInConfig;