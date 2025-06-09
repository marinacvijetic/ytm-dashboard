import React, { useEffect, useState } from 'react';

export const DashboardPanel: React.FC = () => {
  const [stats, setStats] = useState({ apps: 0, services: 0, healthy: 0, unhealthy: 0 });

  useEffect(() => {
    fetch('http://localhost:3300/api/all-clients')
      .then(res => res.json())
      .then((data: any[]) => {
        const allServices = data.flatMap((app: any) => app.services);
        const healthy = allServices.filter((s: any) => s.status?.toLowerCase() === 'healthy').length;
        const unhealthy = allServices.length - healthy;
        setStats({
          apps: data.length,
          services: allServices.length,
          healthy,
          unhealthy
        });
      });
  }, []);

  return (
    <div>
      <h2>Dashboard Overview</h2>
      <div style={{ display: 'flex', gap: '20px' }}>
        <StatBox label="Applications" value={stats.apps} />
        <StatBox label="Services" value={stats.services} />
        <StatBox label="Healthy Services" value={stats.healthy} />
        <StatBox label="Unhealthy Services" value={stats.unhealthy} />
      </div>
    </div>
  );
};

const StatBox = ({ label, value }: { label: string, value: number }) => (
  <div style={{ background: '#242933', padding: '20px', borderRadius: '8px', flex: 1 }}>
    <h3>{label}</h3>
    <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{value}</p>
  </div>
);