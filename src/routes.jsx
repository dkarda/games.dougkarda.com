// src/routes.jsx
import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import Home from './pages/Home';
import Concentration from './pages/Concentration';
import ErrorBoundary from "./components/ErrorBoundary";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Home />, errorElement: <ErrorBoundary />},
      { path: "concentration", element: <Concentration />, errorElement: <ErrorBoundary />},
      { path: "*", element: <ErrorBoundary />, errorElement: <ErrorBoundary />},
    ],
  },
]);
