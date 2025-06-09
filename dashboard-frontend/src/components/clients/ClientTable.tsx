import React, { useEffect, useState } from "react";
import "../../styles/table.css";
import "../../styles/buttons.css";
import { ServiceDetails } from "../services/ServiceDetails";

type Service = {
  service_id: number;
  service_name: string;
  ip_address: string;
  status: string;
  last_heartbeat: string;
  is_main: boolean;
  melody?: string;
  system_info?: JSON;
};

type Client = {
  client_id: number;
  app_id: string;
  app_name: string;
  version: string;
  url: string;
  created_at: string;
  last_update: string;
  services: Service[];
};

// This is the shape of the paginated response from the backend
type PaginatedResponse = {
  data: Client[];
  page: number;
  totalPages: number;
  totalCount: number;
};

export const ClientTable: React.FC = () => {
  // Table data and loading state
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter (search) state
  const [filter, setFilter] = useState("");

  // Last updated and countdown state
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(30);

  // Which service’s details modal is open
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Helper function for opening ServiceDetails modal
  const openServiceDetails = (client: Client) => {
  setSelectedClient(client);
  };
  // Pagination state:
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(6); // always show 10 rows/page

  // Loads page from the server, then updates clients, totalPages etc
  const fetchData = (_pageToLoad: number = 1) => {
    setLoading(true);
    fetch(`http://localhost:3300/api/clients?page=${page}&limit=${limit}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status} - ${res.statusText}`);
        }
        return res.json();
      })
      .then((json: PaginatedResponse) => {
        setClients(json.data);
        setTotalPages(json.totalPages);
        setLoading(false);
        setCountdown(30); // reset countdown after every successfull fetch
        setLastUpdated(new Date());
      })
      .catch((err) => {
        console.error("Error fetching clients:", err);
        setLoading(false);
      });
  };

  // Initial load and autorefresh every 30s
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [page]); // Re-run any time page changes

  //Filter by app_name
  const filteredClients = clients.filter((client) =>
    client.app_name?.toLowerCase().includes(filter.toLowerCase())
  );

  //Call your PUT /setMain endpoint
  const handleSetMain = async (clientId: Number, serviceId: Number) => {
    await fetch(
      `http://localhost:3300/api/clients/${clientId}/services/${serviceId}/setMain`,
      { method: "PUT" }
    );
    fetchData();
  };

  // Countdown timer effect (runs every 1 sec)
  useEffect(() => {
    // If lastUpdated is null, don’t start countdown yet
    if (!lastUpdated) return;

    // Decrement every second
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // When it hits 0, next fetch will also reset countdown to 30.
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [lastUpdated]);
  // Re‐run this effect whenever `lastUpdated` is reset

  // Handlers for pagination buttons
  const goToPrevPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };
  const goToNextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };

  if (loading) return <p style={{ color: "#fff" }}>Loading…</p>;

  return (
    <div className="table-container">
      {/* SEARCH + REFRESH */}
      <div className="table-header">
        <input
          type="text"
          placeholder="Search app name..."
          className="search-bar"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <div className="refresh-wrapper">
          <span className="last-updated">
            Last updated: {lastUpdated?.toLocaleTimeString() || "—"}
          </span>
          <span className="countdown">
            {lastUpdated ? `Next refresh in ${countdown}s` : ""}
          </span>
          <button className="btn-refresh" onClick={() => fetchData(page)}>
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="table-wrapper">
        <table className="standard-table">
          <thead>
            <tr>
              <th>App Name</th>
              <th>Version</th>
              <th>URL</th>
              <th>Main Service</th>
              <th>Status</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.map((client) => {
              // Compute the main service for this client:
              const mainService = client.services.find((s) => s.is_main) ||
                client.services[0] || {
                  service_name: "No services",
                  status: "—",
                  service_id: 0,
                };

              return (
                <React.Fragment key={client.client_id}>
                  <tr className="clickable-row">
                    <td>{client.app_name}</td>
                    <td>{client.version}</td>
                    <td>
                      <a
                        href={client.url}
                        target="_blank"
                        rel="noreferrer"
                        className="url-link"
                      >
                        {client.url}
                      </a>
                    </td>

                    {/* Main service*/}
                    <td>
                      {mainService ? mainService.service_name : "—"}
                    </td>

                    {/* Status badge */}
                    <td>
                      {!client.services || client.services.length === 0 ? (
                        <span className="status-badge status-neutral">No services</span>
                      ) : mainService ? (
                      <span className={`status-badge ${mainService.status.toLowerCase() === "healthy" ? "status-healthy" : "status-unhealthy"}`}>
                       {mainService.status}
                      </span>
                      ) : ( 
                      <span className="status-badge status-neutral">No services</span>
                      )}
                    </td>

                    {/* “Details” column, button view which opens ServiceDetails modal */}
                    <td>
                      <button
                        className="btn-refresh"
                        onClick={(e) => {
                          e.stopPropagation();
                          openServiceDetails(client);
                        }}
                      >
                        ℹ️ View
                      </button>
                    </td>
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Render the ServiceDetails modal when selectedClient != null */}
      {selectedClient && (
        <ServiceDetails
          client={selectedClient}
          onClose={() => setSelectedClient(null)}
          onChangeMain={handleSetMain}
        />
      )}

      <div className="pagination-controls">
        <button
          className="btn-page"
          onClick={goToPrevPage}
          disabled={page <= 1}
        >
          ← Prev
        </button>

        <span className="page-info">
          Page {page} of {totalPages}
        </span>

        <button
          className="btn-page"
          onClick={goToNextPage}
          disabled={page >= totalPages}
        >
          Next →
        </button>
      </div>
    </div>
  );
};

// return (
//   <div className="table-container">
//     <div className="table-header">
//       <input
//         type="text"
//         placeholder="Search app name..."
//         className="search-bar"
//         value={filter}
//         onChange={(e) => setFilter(e.target.value)}
//       />

//       <div className="refresh-wrapper">
//         <span className="last-updated">
//           Last updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : "—"}
//         </span>
//         <button className="btn-refresh" onClick={fetchData}>
//           🔄 Refresh
//         </button>
//       </div>
//     </div>

//     <div className="table-wrapper">
//       <table className="standard-table">
//         <thead>
//           <tr>
//             <th>App Name</th>
//             <th>Version</th>
//             <th>URL</th>
//             <th>Main Service (click to switch)</th>
//             <th>Status</th>
//           </tr>
//         </thead>
//         <tbody>
//           {filteredClients.map((client) => {
//             const main =
//               client.services.find((s) => s.is_main) || client.services[0] || {
//                 service_name: "Service",
//                 status: "Status",
//                 service_id: 0,
//               };

//             return (
//               <tr key={client.client_id}>
//                 <td>{client.app_name}</td>
//                 <td>{client.version}</td>
//                 <td>
//                   <a href={client.url} target="_blank" rel="noreferrer">
//                     {client.url}
//                   </a>
//                 </td>

//                 {/* Main service name + dropdown to switch */}
//                 <td>
//                   <details>
//                     <summary className="service-main-summary">
//                       {main.service_name}
//                     </summary>
//                     <select
//                       className="service-select"
//                       value={main.service_id}
//                       onChange={(e) =>
//                         handleSetMain(
//                           client.client_id,
//                           Number(e.target.value)
//                         )
//                       }
//                     >
//                       {client.services.map((s) => (
//                         <option key={s.service_id} value={s.service_id}>
//                           {s.service_name} ({s.ip_address})
//                         </option>
//                       ))}
//                     </select>
//                   </details>
//                 </td>

//                 {/* Display the status badge */}
//                 <td>
//                   <span
//                     className={`status-badge ${
//                       main.status.toLowerCase() === "healthy"
//                         ? "status-healthy"
//                         : "status-unhealthy"
//                     }`}
//                   >
//                     {main.status}
//                   </span>
//                 </td>
//               </tr>
//             );
//           })}
//         </tbody>
//       </table>
//     </div>
//   </div>
// );
