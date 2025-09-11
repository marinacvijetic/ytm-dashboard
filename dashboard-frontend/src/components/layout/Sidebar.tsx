import React, { useState } from "react";
import { MdAssessment, MdSettings, MdMenuOpen, MdDashboard, MdApps } from "react-icons/md";
import { useNavigate } from "react-router-dom";

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();

  const menuItems = [
    { icons: <MdDashboard size={25} />, label: "Dashboard", to: "/" },
    { icons: <MdApps size={25} />, label: "Applications", to: "/applications" },
    { icons: <MdSettings size={25} />, label: "Settings", to: "/settings" },
    { icons: <MdAssessment size={25} />, label: "Statistics", to: "/statistics" },
  ];

  const [open, setOpen] = useState(true);

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
        {menuItems.map((item) => (
          <li
            key={item.to}
            onClick={() => navigate(item.to)}
            className="sidebar__item"
          >
            <div className="sidebar__icon">{item.icons}</div>
            <p className="sidebar__label">{item.label}</p>
          </li>
        ))}
      </ul>
    </nav>
  );
};
