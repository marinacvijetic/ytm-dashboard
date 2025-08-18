// import React, { useState } from "react";
// import { Link, useLocation } from "react-router-dom";
// import { Sidebar as PrimeSidebar } from "primereact/sidebar";
// import { Button } from "primereact/button";

// export const Sidebar: React.FC = () => {
//   const [visible, setVisible] = useState(false);
//   const { pathname } = useLocation();
//   const [sidebarOpen, setSidebarOpen] = useState(false);

//   return (
//     <div className="flex">
//       <PrimeSidebar className={`sidebar ${sidebarOpen ? "sidebar-open" : "sidebar-closed"} md:translate-x-0`} visible={visible} onHide={() => setVisible(false)}>
//         <img src="/logo.png" alt="YTM Logo" className="sidebar-logo" />
//         <h2>Centralized Dashboard</h2>
//         <nav>
//           <ul>
//             <li>
//               <Link to="/" className={pathname === "/" ? "active" : ""}>
//                 Dashboard
//               </Link>
//             </li>
//             <li>
//               <Link
//                 to="/applications"
//                 className={pathname === "/applications" ? "active" : ""}
//               >
//                 Applications
//               </Link>
//             </li>
//             <li>
//               <Link
//                 to="/billing"
//                 className={pathname === "/billing" ? "active" : ""}
//               >
//                 Billing
//               </Link>
//             </li>
//             <li>
//               <Link
//                 to="/settings"
//                 className={pathname === "/settings" ? "active" : ""}
//               >
//                 Settings
//               </Link>
//             </li>
//           </ul>
//         </nav>
//       </PrimeSidebar>
//       <Button className="btn-text" icon="pi pi-arrow-right" onClick={() => setVisible(true)} />
//     </div>
//   );
// };

import React, { useState } from "react"
import { MdAssessment, MdSettings } from "react-icons/md";
import { MdMenuOpen } from "react-icons/md"
import { MdDashboard } from "react-icons/md";
import { MdApps } from "react-icons/md";
import { useNavigate } from "react-router-dom";

export const Sidebar: React.FC = () => {

  const navigate = useNavigate();

  const menuItems = [
  {
    icons: <MdDashboard size={25} />,
    label: 'Dashboard',
    to: '/'
  },
  {
    icons: <MdApps size={25} />,
    label: 'Applications',
    to: '/applications'
  },
  {
    icons: <MdSettings size={25} />,
    label: 'Settings',
    to: '/settings'
  },
  {
  icons: <MdAssessment size={25} />,
  label: "Statistics",
  to: "/statistics"
},
]

  const [open, setOpen] = useState(true);

  return (
    <nav className={`h-screen bg-background3 p-3 flex flex-col duration-500 text-[#687C93] border-r border-gray-300
      ${open ? 'w-60' : 'w-17'}`}>
      <div className={`border-b border-gray-300  ${open ? 'px-3 py-2 h-25' : 'p-0 h-auto'} flex flex-col justify-between items-center transition-all`}>
        <img src={open ? '/logo-dashboard.png' : '/favicon.png'} alt="Logo" className={`${open ? 'w-50 transition-all' : 'w-70'} transition-all`}/>
        <div><MdMenuOpen size={28} className={`cursor-pointer transition-all duration-500 ${open ? 'ml-40' : 'rotate-180 duration-300'}`} onClick={() => setOpen(!open)}/></div>
      </div>

      {/*Body */}

      <ul>
        {
          menuItems.map((item) => {
            return(
              <li key={item.to} onClick={() => navigate(item.to)} className="px-2 py-3 hover:bg-[#2FABDF] hover:text-white hover:rounded-md mt-4 duration-300 cursor-pointer flex gap-2 items-center">
                <div>{item.icons}</div>
                <p className={`${!open && 'w-0 translate-x-24 '} duration-300 overflow-hidden font-semibold`}>{item.label}</p>
              </li>
            )
          })
        }
      </ul>
    </nav>
  )

}
