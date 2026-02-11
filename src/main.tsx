// src/main.tsx

import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./api/queryClient";
// import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { SocketProvider } from "./context/SocketContext";
import "./styles/globals.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <QueryClientProvider client={queryClient}>
      <SocketProvider>
        <App />
      </SocketProvider>
      {/* <ReactQueryDevtools initialIsOpen={false} /> */}
    </QueryClientProvider>
  </AuthProvider>,
);
