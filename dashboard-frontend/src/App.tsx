import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { ClientTable } from './components/clients/ClientTable';
import { StatisticsInfo } from './components/statistics/StatisticsInfo';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<ClientTable />} />
          <Route path="/applications" element={<ClientTable />} />
          <Route path="/statistics" element={<StatisticsInfo />} />
          <Route path="/settings" element={<div>Settings (Coming soon)</div>} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;