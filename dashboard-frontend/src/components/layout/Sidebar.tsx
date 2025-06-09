import React from "react";
import { Link, useLocation } from "react-router-dom";
import "../../styles/Sidebar.css";

export const Sidebar: React.FC = () => {

  const { pathname } = useLocation();

  return (
  <div className="sidebar">
    <div className="sidebar-header">
      <img src="/logo.png" alt="YTM Logo" className="sidebar-logo" />
      <h2 className="sidebar-line">Centralized Dashboard</h2>
    </div>
    <nav>
      <ul>
        <li>
          <Link to="/" className={pathname === "/" ? "active" : ""}>Dashboard</Link>
        </li>
        <li>
          <Link to="/applications" className={pathname === "/applications" ? "active" : ""}>Applications</Link>
        </li>
        <li>
          <Link to="/billing" className={pathname === "/billing" ? "active" : ""}>Billing</Link>
        </li>
        <li>
          <Link to="/settings" className={pathname === "/settings" ? "active" : ""}>Settings</Link>
        </li>
      </ul>
    </nav>
  </div>
  );
};
