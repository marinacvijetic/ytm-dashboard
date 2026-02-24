import React, { useState } from "react";
import {
  MdAssessment,
  MdSettings,
  MdMenuOpen,
  // MdDashboard,
  MdApps,
  MdSmartToy,
} from "react-icons/md";
import { useLocation, useNavigate } from "react-router-dom";

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    // { icons: <MdDashboard size={25} />, label: "Dashboard", to: "/" },
    { icons: <MdApps size={25} />, label: "Dashboard", to: "/applications" },
    { icons: <MdAssessment size={25} />, label: "Statistics", to: "/statistics" },
    { icons: <MdSettings size={25} />, label: "Settings", to: "/settings" },
    {
      icons: <MdSmartToy size={25} />,
      label: "AI Agent",
      to: "https://ytm-ai-agent.youtestme.com/",
      external: true,
    },
  ];

  const [open, setOpen] = useState(true);

  const isItemActive = (to: string) => {
    if (to === "/") return location.pathname === "/";
    return location.pathname.startsWith(to);
  };

  return (
    <nav className={`sidebar ${open ? "is-open" : "is-collapsed"}`}>
      <div className="sidebar__brand">
        <img
          src={open ? "/logo-dashboard.png" : "/favicon.png"}
          alt="Logo"
          className="sidebar__logo"
        />
        <div>
          <MdMenuOpen
            size={28}
            className="sidebar__toggle"
            onClick={() => setOpen(!open)}
          />
        </div>
      </div>

      <ul className="sidebar__menu">
        {menuItems.map((item) => {
          const active = !item.external && isItemActive(item.to);

          return (
            <li
              key={item.to}
              onClick={() => {
                if (item.external) {
                  window.open(item.to, "_blank");
                } else {
                  navigate(item.to);
                }
              }}
              className={`sidebar__item ${active ? "is-active" : ""}`}
            >
              <div className="sidebar__icon">{item.icons}</div>
              <p className="sidebar__label">{item.label}</p>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
