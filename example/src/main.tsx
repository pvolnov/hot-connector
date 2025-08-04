import React from "react";
import ReactDOM from "react-dom/client";

import { ExampleNEAR } from "./App";
import { MultichainExample } from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ExampleNEAR />
    <MultichainExample />
  </React.StrictMode>
);
