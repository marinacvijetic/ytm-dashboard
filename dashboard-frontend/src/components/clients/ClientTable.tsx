import React, { useEffect, useState, useRef } from "react";
import { DataTable, type DataTablePageEvent } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { useNavigate } from "react-router-dom";
import { fetchJson, HttpError } from "../../lib/fetchJson";

type Client = {
  client_id: number;
  app_id: string;
  app_title: string;
  version: string;
  url: string;
  api_url: string;
  created_at: string;
  last_update: string;
  last_ping_successful: boolean;
  is_active: boolean;
  proctor_edu: boolean;
  proctorio: boolean;
  superset_apache: boolean;
};

type PaginatedResponse = {
  data: Client[];
  page: number;
  totalPages: number;
  totalCount: number;
};

export const ClientTable: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1); // 1-based
  const [limit] = useState<number>(6); // rows per page
  const [, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [filter, setFilter] = useState<string>("");
  const toast = useRef<Toast>(null);
  const navigate = useNavigate();

  const OUTDATED_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24 hours
  const GRACE_MS = 60 * 60 * 1000; // 60 minutes
  // Fetch a specific page from the server
  const fetchData = (pageToLoad: number = 1) => {
    setLoading(true);
    fetch(
      `${
        import.meta.env.VITE_BACKEND_HOST
      }/clients?page=${pageToLoad}&limit=${limit}`
    )
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json: PaginatedResponse) => {
        setClients(json.data);
        setTotalPages(json.totalPages);
        setTotalCount(json.totalCount);
      })
      .catch((err) => {
        console.error("Failed to fetch clients", err);
      })
      .finally(() => setLoading(false));
  };

  // Load data whenever `page` changes
  useEffect(() => {
    fetchData(page);
  }, [page]);

  // Handler for DataTable pagination event
  const onPage = (e: DataTablePageEvent) => {
    // e.page is zero-based, so add 1
    setPage(e.page! + 1);
  };

  // Client-side filter on the currently loaded page
  const filteredClients = clients.filter((c) =>
    c.app_title.toLowerCase().includes(filter.toLowerCase())
  );

  // Render a badge for boolean values
  const yesNoBadge = (value: boolean) => (
    <span className={`badge-yesno ${value ? "badge-yes" : "badge-no"}`}>
      {value ? "Yes" : "No"}
    </span>
  );

  const isOutdated = (row: Client) => {
    if (!row.last_update) return false;
    const diff = Date.now() - new Date(row.last_update).getTime();
    return diff > OUTDATED_THRESHOLD_MS + GRACE_MS;
  };

  const statusBody = (row: Client) => {
    const outdated = isOutdated(row);
    let text = "";
    let color = "";
    let tooltip = "";
    if (!row.last_ping_successful) {
      text = "Application Down";
      color = "text-red-600";
      tooltip = "Last ping failed";
    } else if (outdated) {
      text = "Outdated";
      color = "text-yellow-600";
      tooltip = "No update in over 24h";
    } else if (row.is_active) {
      text = "Active";
      color = "text-green-600";
    }
    return (
      <span className={color} title={tooltip}>
        {text}
      </span>
    );
  };

  const rowClassName = (row: Client) => {
    const outdated = isOutdated(row);
    return {
      "client-down": !row.last_ping_successful,
      "client-outdated": row.last_ping_successful && outdated,
    };
  };

  const handleRefesh = async () => {
    fetchData(page);
  };

  const handleSync = async (appId: string) => {
  try {
    const data = await fetchJson<Partial<Client>>(`${import.meta.env.VITE_BACKEND_HOST}/app-info/sync/${appId}`, { method: "GET", timeoutMs: 10000 });

    // success -> update table row
    setClients((prev) => prev.map((c) => (c.app_id === appId ? { ...c, ...data } : c)));

    toast.current?.show({
      severity: "success",
      summary: "Sync Successful",
      detail: `${data.app_title || appId} synced successfully.`,
      life: 3000,
    });
  } catch (err: unknown) {
    console.error(`Sync failed for ${appId}`, err);
    let message = "Sync failed";
    if (err instanceof HttpError) {
      message = err.message;
      const body = err.body as unknown;
      if(body && typeof body === 'object' && 'client' in body){
        const updated = (body as { client: Partial<Client>}).client;
        setClients((prev) => prev.map((c) => (c.app_id === appId ? { ...c, ...updated } : c)));
      }
    } else if (err instanceof Error) {
      message = err.message;
      setClients((prev) => prev.map((c) => (c.app_id === appId ? { ...c, last_ping_successful: false } : c)));
    } else {
      setClients((prev) => prev.map((c) => (c.app_id === appId ? { ...c, last_ping_successful: false } : c)));
    }
    toast.current?.show({
      severity: "error",
      summary: "Sync failed",
      detail: message,
      life: 6000,
    });
  } 
};

  if (loading) {
    return <p className="text-white p-4">Loading…</p>;
  }

  return (
    <div className="p-4 w-full">
      <Toast ref={toast} />
      {/* Search + Refresh Controls */}
      <div className="flex justify-between items-center mb-4">
        <InputText
          value={filter}
          onChange={(e) => setFilter(e.currentTarget.value)}
          placeholder="Search by client name..."
          className="px-3 py-2 border border-gray-400 rounded text-sm text-black"
        />
        <div className="flex items-center gap-4">
          <Button
            className="btn-text"
            onClick={handleRefesh}
            label="Refresh"
            text-raised
          />
        </div>
      </div>

      {/* PrimeReact DataTable with server-side pagination */}
      <div className="overflow-x-auto">
        <DataTable
          value={filteredClients}
          lazy
          loading={loading}
          scrollable
          scrollHeight="400px"
          paginatorClassName="paginator"
          showGridlines
          paginator
          rows={limit}
          first={(page - 1) * limit}
          totalRecords={totalCount}
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink PageDropdown RowsPerPageDropdown"
          onPage={onPage}
          className="client-table"
          emptyMessage="No clients found"
          globalFilterFields={["app_title"]}
          globalFilter={filter}
          rowClassName={rowClassName}
        >
          <Column 
          field="app_title" 
          header="Client" 
          className="column" 
          frozen 
          body={(row) => (
            <a
            href={row.url}
            target="_blank"
            rel="noreferrer"
            title={row.url}
            className="url"
            >
              {row.app_title}
            </a>
          )}
          />
          <Column field="app_id" header="APP ID" className="column" />
          <Column
            field="version"
            header="Version"
            className="column text-center"
          />
          {/* <Column
            field="url"
            header="URL"
            className="column"
            body={(row) => (
              <a
                href={row.url}
                target="_blank"
                rel="noreferrer"
                className="url"
              >
                {row.url}
              </a>
            )}
          /> */}
          <Column
            field="api_url"
            header="API URL"
            className="column"
            body={(row) => (
              <a
                href={row.api_url}
                target="_blank"
                rel="noreferrer"
                className="url"
              >
                {row.api_url}
              </a>
            )}
          />
          <Column
            field="proctor_edu"
            header="Proctor Edu"
            body={(row) => yesNoBadge(row.proctor_edu)}
            className="column text-center"
          />
          <Column
            field="proctorio"
            header="Proctorio"
            body={(row) => yesNoBadge(row.proctorio)}
            className="column text-center"
          />
          <Column
            field="superset_apache"
            header="Superset Apache"
            body={(row) => yesNoBadge(row.superset_apache)}
            className="column text-center"
          />
          <Column
            field="status"
            header="Status"
            className="column text-center"
            body={statusBody}
          />
          <Column field="billing" header="Billing" className="column" />
          <Column
            field="last_update"
            header="Last Updated"
            className="column"
            body={(row) => (
              <span>
                {row.last_update
                  ? new Date(row.last_update).toLocaleString(undefined, {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : ""}
              </span>
            )}
          />
          <Column
            header="Actions"
            className="column text-center"
            body={(row) => (
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => handleSync(row.app_id)}
                  className="update-button"
                  title="Update"
                  aria-label="Update"
                >
                  <i className="pi pi-refresh" />
                </button>
                <button
                  onClick={() => navigate(`/statistics?appId=${row.app_id}`)}
                  className="stats-button"
                  title="Statistic"
                  aria-label="Statistic"
                >
                  <i className="pi pi-chart-bar" />
                </button>
              </div>
            )}
          />
        </DataTable>
      </div>
    </div>
  );
};
