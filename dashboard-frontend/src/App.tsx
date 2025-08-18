import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { DashboardPanel } from './components/dashboard/DashboardPanel';
import { ClientTable } from './components/clients/ClientTable';
import { StatisticsInfo } from './components/statistics/StatisticsInfo';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<DashboardPanel />} />
          <Route path="/applications" element={<ClientTable />} />
          <Route path="/settings" element={<div>Settings (Coming soon)</div>} />
          <Route path="/statistics" element={<StatisticsInfo />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;