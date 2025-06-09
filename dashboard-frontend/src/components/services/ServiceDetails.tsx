import React, { useEffect, useState }  from "react";
import "../../styles/serviceDetails.css";
import "../../styles/buttons.css";

type Service = {
  service_id:   number;
  service_name: string;
  ip_address:   string;
  status:       string;
  last_heartbeat: string;
  is_main:      boolean;
  melody?:      string;
  system_info?: any;
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

type Props = {
  client: Client;
  onClose: () => void;
  onChangeMain:(clientId: number, serviceId: number) => void;
};

export const ServiceDetails: React.FC<Props> = ({ client, onClose, onChangeMain }) => {
  // If no client is selected, don't render anuthing
  if(!client) return null;

  // Derive the currently-selected "mainServiceId" from client.services
  const currentMain = client.services.find((s) => s.is_main) || null;
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(
    currentMain ? currentMain.service_id : null
  );

  // Optional: If your parent can update "is_main" in the background, sync up:
  useEffect(() => {
    const mainService = client.services.find((s) => s.is_main);
    setSelectedServiceId(mainService?.service_id || null);
  }, [client.services]);

  const handleDropDownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = Number(e.target.value);
    setSelectedServiceId(newId);
  }

  const handleSave = () => {
    if(client && selectedServiceId != null) {
      onChangeMain(client.client_id, selectedServiceId);
    }

    onClose();
  }
  

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2>Service Details for {client.app_name}</h2>
          <button className="modal-close-btn" onClick={onClose}>
            x
          </button>
        </div>
        <div className="modal-body">
          {/* List out extended metadata for each service in client.services*/}
          {client.services.length === 0 ? (
            <p>This application has no registered services.</p>
          ) : (
            <>
            <p>
              <strong>Main Service:</strong> {" "}
              {currentMain ? currentMain.service_name : "None"}
            </p>
            <div className="modal-form-group">
              <label htmlFor="main-service-dropdown">
                Change Main Service:
              </label>
              <select 
              id="main-service-dropdown"
              value={selectedServiceId || 0}
              onChange={handleDropDownChange}
              className="service-select"
              >
                {client.services.map((s) => (
                  <option key={s.service_id} value={s.service_id}>
                    {s.service_name} ({s.ip_address}) - {s.status}
                  </option>
                ))}
              </select>
            </div>

            <hr />

            <h3>Extended Metadata</h3>
            <ul className="service-list">
              {client.services.map((s) => (
                <li key={s.service_id} className="service-detail-row">
                  <p>
                    <strong>Name:</strong> {s.service_name}
                  </p>
                  <p>
                    <strong>IP Address:</strong> {s.ip_address}
                  </p>
                  <p>
                    <strong>Status: </strong> {" "}
                    <span
                    className={`status-badge ${
                      s.status.toLowerCase() === "healthy"
                      ? "status-healthy"
                      : "status-unhealthy"
                    }`}
                    >
                      {s.status}
                    </span>
                  </p>
                  <p>
                    <strong>Last Heartbeat:</strong> {s.last_heartbeat}
                  </p>
                  <p>
                    <strong>Melody:</strong> {s.melody || "No Info"}
                  </p>
                  <p>
                    <strong>System Info:</strong> {" "}
                    {s.system_info
                    ? JSON.stringify(s.system_info)
                    : "No Info"}
                  </p>
                </li>
              ))}
            </ul>
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          {client.services.length > 0 && (
            <button className="btn-primary" onClick={handleSave}>
              Save Main Service
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

