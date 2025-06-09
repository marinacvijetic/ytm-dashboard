import React from "react";
import { Sidebar } from "./Sidebar";
import "../../styles/layout.css"

export const Layout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <div className="app-layout">
    <Sidebar />
    <main className="main-content">
      {children}
    </main>
  </div>
);
