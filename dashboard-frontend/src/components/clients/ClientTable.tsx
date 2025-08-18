import React, { useEffect, useState } from "react";
import { DataTable, type DataTablePageEvent } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";

type Client = {
  client_id: number;
  app_id: string;
  app_title: string;
  version: string;
  url: string;
  api_url: string;
  created_at: string;
  last_update: string;
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
  const [countdown, setCountdown] = useState<number>(30);

  // Fetch a specific page from the server
  const fetchData = (pageToLoad: number = 1) => {
    setLoading(true);
    fetch(
      `${
        import.meta.env.VITE_BASE_URL
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
        setCountdown(30);
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

  // Countdown timer for auto-refresh indicator
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? 30 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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
    <span
      className={`badge-yesno ${value ? "badge-yes" : "badge-no"}`}>
      {value ? "Yes" : "No"}
    </span>
  );

  const handleSyncAll = async () => {
    setLoading(true);
    try {
      const resp = await fetch(`${import.meta.env.VITE_BASE_URL}/app-info/sync`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const summary = await resp.json();
      console.log('Bulk sync results:', summary);
      fetchData(page);  // reload table data
    } catch (err) {
      console.error('Sync all failed', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <p className="text-white p-4">Loading…</p>;
  }

  return (
    <div className="p-4 w-full">
      {/* Search + Refresh Controls */}
      <div className="flex justify-between items-center mb-4">
        <InputText
          value={filter}
          onChange={(e) => setFilter(e.currentTarget.value)}
          placeholder="Search by client name..."
          className="px-3 py-2 border border-gray-400 rounded text-sm text-black"
        />
        <div className="flex items-center gap-4">
          <span className="text-gray-700 font-semibold text-sm">
            {`Next refresh in ${countdown}s`}
          </span>
          <Button
            className="btn-text"
            icon="pi pi-refresh"
            onClick={() => handleSyncAll()}
            label="Sync Now"
          />
        </div>
      </div>

      {/* PrimeReact DataTable with server-side pagination */}
      <div className="overflow-x-auto">
        <DataTable
          value={filteredClients}
          loading={loading}
          scrollable
          scrollHeight="400px"
          paginatorClassName="paginator"
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
        >
          <Column
            field="app_title"
            header="Client"
            className="column"
            frozen
          />
          <Column field="app_id" header="APP ID" className="column" />
          <Column
            field="version"
            header="Version"
            className="column text-center"
          />
          <Column
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
          />
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
          <Column field="billing" header="Billing" className="column" />
          <Column header="Last Updated" className="column" />
        </DataTable>
      </div>
    </div>
  );
};
