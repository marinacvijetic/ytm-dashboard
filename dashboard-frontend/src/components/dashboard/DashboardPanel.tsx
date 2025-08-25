import React, { useEffect, useState } from "react";
import { Card } from "primereact/card";
export const DashboardPanel: React.FC = () => {
  const [stats, setStats] = useState({ apps: 0 });

  useEffect(() => {
    fetch(`${import.meta.env.VITE_BASE_URL}/all-clients`)
      .then((res) => res.json())
      .then((data: unknown[]) => {
        setStats({
          apps: data.length,
        });
      });
  }, []);

  return (
    <div className="p-6">
      <h2>Dashboard Overview</h2>
      <div className="flex place-self-center-safe">
        <StatBox label="Applications" value={stats.apps} />
      </div>
    </div>
  );
};

const StatBox = ({ label, value }: { label: string; value: number }) => (
  <Card className="card-dashboard">

      <h3 className="text-lg font-medium text-gray-700 mb-2">{label}</h3>
      <p className="text-4xl font-semibold text-gray-700 text-center mt-7">
        {value}
      </p>

  </Card>
);
