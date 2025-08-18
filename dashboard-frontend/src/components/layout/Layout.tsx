import { Sidebar } from "./Sidebar";
// import "../../styles/layout.css";

export const Layout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {

  return (
    <div className="flex w-screen min-h-screen bg-background1">
      <Sidebar />
      <main className="main-content flex-1 overflow-auto p-4">{children}</main>
    </div>
  );
};
//   <div className="app-layout bg-background1">
//     <Sidebar/>
//     <main className="main-content">
//       {children}
//     </main>
//   </div>
// );
