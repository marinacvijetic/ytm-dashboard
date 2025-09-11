import { Sidebar } from "./Sidebar";

export const Layout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">{children}</main>
    </div>
  );
};
