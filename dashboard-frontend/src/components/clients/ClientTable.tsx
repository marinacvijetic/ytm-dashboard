import React, { useEffect, useState, useRef, type JSX } from "react";
import { DataTable } from "primereact/datatable";
import type { ColumnFilterElementTemplateOptions } from "primereact/column";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { Checkbox } from "primereact/checkbox";
import { useNavigate } from "react-router-dom";
import { fetchJson, HttpError } from "../../lib/fetchJson";
import { MdApps } from "react-icons/md";
import {
  CLIENTS_ENDPOINT,
  SYNC_APP_INFO,
  EVENTS_ENDPOINT,
} from "../../utils/endpoints";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { Tooltip } from "primereact/tooltip";
import { FilterMatchMode } from "primereact/api";

type StatusFlags = {
  down: boolean;
  outdated: boolean;
  appinfo_job_late: boolean;
  stats_job_late: boolean;
};

type Client = {
  client_id: number;
  app_id: string;
  app_title: string;
  version: string;
  url: string;
  api_url: string;
  created_at: string;
  last_update: string | Date | null;
  last_ping_successful: boolean;
  is_active: boolean;
  proctor_edu: boolean;
  proctorio: boolean;
  superset_apache: boolean;
  rest_api: boolean;
  ecommerce: boolean;
  sso: boolean;
  open_ai: boolean;
  green_house: boolean;
  lti: boolean;
  billing_enabled: boolean;
  billing_remaining_credit: string | number | null;
  billing_currency?: string | null;
  status_flags?: StatusFlags;
  last_manual_sync_at?: string;
  last_appinfo_job_at?: string;
  last_stats_job_at?: string;
};

const CLIENT_TABLE_COLUMNS: { key: string; label: string }[] = [
  { key: "app_id", label: "Application ID" },
  { key: "app_title", label: "Client Name" },
  { key: "url", label: "Application URL" },
  { key: "version", label: "Version" },
  { key: "proctor_edu", label: "Proctor Edu" },
  { key: "proctorio", label: "Proctorio" },
  { key: "superset_apache", label: "Superset Apache" },
  { key: "last_update", label: "Last updated" },
  { key: "status", label: "Status" },
  { key: "billing", label: "Remaining Credit" },
  { key: "rest_api", label: "REST API" },
  { key: "ecommerce", label: "E-commerce" },
  { key: "sso", label: "SSO" },
  { key: "lti", label: "LTI" },
  { key: "green_house", label: "GreenHouse" },
  { key: "open_ai", label: "OpenAi" },
  { key: "actions", label: "Actions" },
];

export const ClientTable: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const toast = useRef<Toast>(null);
  const navigate = useNavigate();
  const tooltipRef = useRef<Tooltip>(null);

  const OUTDATED_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24 hours
  const GRACE_MS = 60 * 60 * 1000; // 60 minutes
  const ROWS = 5;

  // --- Choose Columns (added)
  const [showColumnDialog, setShowColumnDialog] = useState(false);
  const [columnSearch, setColumnSearch] = useState("");
  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    CLIENT_TABLE_COLUMNS.map((c) => c.key),
  );

  const chooseColumnsButton = (
    <Button
      icon="pi pi-sliders-h"
      onClick={() => setShowColumnDialog(true)}
      className="btn-outline"
    />
  );
  // --- Choose Columns (added)

  const fetchData = () => {
    setLoading(true);
    fetch(CLIENTS_ENDPOINT)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json: Client[]) => {
        const normalized = json.map((c) => ({
          ...c,
          last_update: c.last_update ? new Date(c.last_update) : null,
        }));

        setClients(normalized);
      })
      .catch((err) => {
        console.error("Failed to fetch clients", err);
      })
      .finally(() => setLoading(false));
  };

  // Load data whenever page changes
  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const eventSource = new EventSource(EVENTS_ENDPOINT);
    eventSource.addEventListener("client_update", (ev) => {
      const data: Client = JSON.parse((ev as MessageEvent).data);
      const normalized = {
        ...data,
        last_update: data.last_update ? new Date(data.last_update) : null,
      };
      setClients((prev) => {
        const idx = prev.findIndex((c) => c.app_id === normalized.app_id);
        if (idx === -1) return [...prev, normalized];
        const next = [...prev];
        next[idx] = { ...next[idx], ...normalized };
        return next;
      });
    });
    return () => eventSource.close();
  }, []);

  useEffect(() => {
    tooltipRef.current?.updateTargetEvents();
  }, [clients]);

  // Render a badge for boolean values
  const yesNoBadge = (value: boolean) => (
    <span className={`badge-yesno ${value ? "badge-yes" : "badge-no"}`}>
      {value ? "Yes" : "No"}
    </span>
  );

  const isOutdated = (row: Client) => {
    const toMs = (d?: string | Date | null) => (d ? new Date(d).getTime() : 0);

    const freshestCore = Math.max(
      toMs(row.last_manual_sync_at),
      toMs(row.last_appinfo_job_at),
      toMs(row.last_update),
    );

    if (!freshestCore) return false;

    const diff = Date.now() - freshestCore;
    return diff > OUTDATED_THRESHOLD_MS + GRACE_MS; // 24h + 1h grace = 25h
  };

  const statusBody = (row: Client) => {
    const f = row.status_flags ?? {
      down: row.last_ping_successful === false,
      outdated: isOutdated(row),
      appinfo_job_late: false,
      stats_job_late: false,
    };

    const severity = f.down
      ? "danger"
      : f.outdated || f.appinfo_job_late || f.stats_job_late
        ? "warning"
        : "success";

    const Icon = ({
      icon,
      color,
      tip,
      testid,
    }: {
      icon: string;
      color: string;
      tip: string;
      testid?: string;
    }) => (
      <span
        className="status-pill__icon"
        style={{ color }}
        data-pr-tooltip={tip}
        data-pr-position="top"
        aria-label={tip}
        data-testid={testid}
      >
        <i className={`pi ${icon}`} />
      </span>
    );

    const icons: JSX.Element[] = [];

    if (f.down)
      icons.push(
        <Icon
          key="down"
          icon="pi-times"
          color="#b91c1c"
          tip="DOWN – Last reachability check failed within 24h"
          testid="icon-down"
        />,
      );

    if (f.outdated)
      icons.push(
        <Icon
          key="outdated"
          icon="pi-clock"
          color="#b45309"
          tip="OUTDATED – No fresh App Info in > 25h"
          testid="icon-outdated"
        />,
      );

    if (f.appinfo_job_late)
      icons.push(
        <Icon
          key="ai-late"
          icon="pi-info-circle"
          color="#b45309"
          tip="APP INFO LATE – Daily App Info job late or failing"
          testid="icon-ai-late"
        />,
      );

    if (f.stats_job_late)
      icons.push(
        <Icon
          key="stats-late"
          icon="pi-chart-line"
          color="#b45309"
          tip="STATS LATE – Weekly Stats job late or failing"
          testid="icon-stats-late"
        />,
      );

    if (icons.length === 0) {
      icons.push(
        <Icon
          key="ok"
          icon="pi-check"
          color="#166534"
          tip="HEALTHY – Reachable and up-to-date"
          testid="icon-healthy"
        />,
      );
    }

    return (
      <div className={`status-pill status-pill--${severity}`}>{icons}</div>
    );
  };

  const formatAmountWithCurrency = (
    amount: string | number | null | undefined,
    currency?: string | null,
  ) => {
    if (amount === null || amount === undefined || amount === "")
      return "not available";

    const num = typeof amount === "string" ? Number(amount) : amount;
    if (!Number.isFinite(num)) return String(amount);

    const formatted = num.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    return currency ? `${formatted} ${currency}` : formatted;
  };

  const lastUpdatedBody = (row: Client) => {
    const toMs = (d?: string | Date | null) => (d ? new Date(d).getTime() : 0);

    const ms = [
      row.last_manual_sync_at,
      row.last_appinfo_job_at,
      row.last_stats_job_at,
      row.last_update,
    ]
      .map(toMs)
      .filter(Boolean);

    const freshestMs = ms.length ? Math.max(...ms) : 0;

    const compact = freshestMs
      ? new Intl.DateTimeFormat("en-US", {
          year: "numeric",
          month: "short", // "Oct"
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true, // Use 12-hour format
        }).format(new Date(freshestMs))
      : "—";

    const fmt = (d?: string) =>
      d
        ? new Intl.DateTimeFormat("en-US", {
            year: "numeric",
            month: "short",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
          }).format(new Date(d))
        : "—";

    const tip = [
      `Manual update: ${fmt(row.last_manual_sync_at)}`,
      `App Info job: ${fmt(row.last_appinfo_job_at)}`,
      `Stats job: ${fmt(row.last_stats_job_at)}`,
    ].join("\n");

    return (
      <span
        className="last-update-tooltip"
        data-pr-tooltip={tip}
        data-pr-position="top"
      >
        {compact}
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
    fetchData();
  };

  const handleSync = async (appId: string) => {
    try {
      const data = await fetchJson<Partial<Client>>(`${SYNC_APP_INFO}${appId}`, {
        method: "GET",
        timeoutMs: 10000,
      });

      // success -> update table row
      setClients((prev) =>
        prev.map((c) => (c.app_id === appId ? { ...c, ...data } : c)),
      );

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
        if (body && typeof body === "object" && "client" in body) {
          const updated = (body as { client: Partial<Client> }).client;
          setClients((prev) =>
            prev.map((c) => (c.app_id === appId ? { ...c, ...updated } : c)),
          );
        }
      } else if (err instanceof Error) {
        message = err.message;
        setClients((prev) =>
          prev.map((c) =>
            c.app_id === appId ? { ...c, last_ping_successful: false } : c,
          ),
        );
      } else {
        setClients((prev) =>
          prev.map((c) =>
            c.app_id === appId ? { ...c, last_ping_successful: false } : c,
          ),
        );
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

  const textSearchFilter = (options: ColumnFilterElementTemplateOptions) => (
    <div className="filter-search">
      <i className="pi pi-search filter-search__icon" aria-hidden="true" />
      <input
        type="text"
        value={String(options.value ?? "")}
        onChange={(e) => options.filterApplyCallback?.(e.target.value)}
        placeholder="Search"
        className="filter-search__input"
      />
    </div>
  );

  return (
    <div className="p-4 w-full">
      <Toast ref={toast} />

      <div className="page-badge">Dashboard</div>

      <div className="page-header">
        <div className="page-title">
          <MdApps size={22} aria-hidden="true" />
          <span>Client Application Overview</span>
        </div>
        <div className="page-subtitle">
          View and manage client applications and their current versions in one
          place. Track deployment status, updates, and version history across
          all clients.
        </div>
      </div>

      <section className="page-card page-card--table">
        <div className="page-card__header">
          <div className="page-card__header-left">
            <i className="pi pi-table" />
            <span>Applications</span>
          </div>

          <Button
            onClick={handleRefesh}
            label="Refresh"
            className="btn-refresh"
          />
        </div>
        <div className="page-card__body">
          <div className="overflow-x-auto">
            <Tooltip
              ref={tooltipRef}
              target=".status-icon, .last-update-tooltip"
              showDelay={200}
              hideDelay={80}
            />

            <DataTable
              value={clients}
              filterDisplay="row"
              loading={loading}
              scrollable
              scrollHeight="600px"
              paginatorClassName="paginator"
              showGridlines
              paginator
              paginatorLeft={chooseColumnsButton}
              rows={ROWS}
              className="client-table"
              emptyMessage="No clients found"
              rowClassName={rowClassName}
            >
              {visibleColumns.includes("app_id") && (
                <Column
                  field="app_id"
                  header="Application ID"
                  sortable
                  filter
                  showFilterMenu={false}
                  filterPlaceholder="Search"
                  filterMatchMode={FilterMatchMode.CONTAINS}
                  filterElement={textSearchFilter}
                  headerClassName="!text-center"
                  bodyClassName="!text-left"
                  style={{ width: "8rem" }}
                />
              )}

              {visibleColumns.includes("app_title") && (
                <Column
                  field="app_title"
                  header="Client Name"
                  sortable
                  filter
                  showFilterMenu={false}
                  filterPlaceholder="Search"
                  filterMatchMode={FilterMatchMode.CONTAINS}
                  filterElement={textSearchFilter}
                  headerClassName="!text-center"
                  bodyClassName="td-left"
                  style={{ minWidth: "14rem" }}
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
              )}

              {visibleColumns.includes("url") && (
                <Column
                  field="url"
                  header="Application URL"
                  sortable
                  filter
                  showFilterMenu={false}
                  filterPlaceholder="Search"
                  filterMatchMode={FilterMatchMode.CONTAINS}
                  filterElement={textSearchFilter}
                  headerClassName="!text-center"
                  bodyClassName="td-left"
                  style={{ minWidth: "18rem" }}
                  body={(row) => (
                    <a
                      href={row.url}
                      target="_blank"
                      rel="noreferrer"
                      title={row.url}
                      className="url"
                    >
                      {row.url}
                    </a>
                  )}
                />
              )}

              {visibleColumns.includes("version") && (
                <Column
                  field="version"
                  header="Version"
                  headerClassName="!text-center"
                  bodyClassName="!text-center"
                  style={{ minWidth: "10rem" }}
                />
              )}

              {visibleColumns.includes("proctor_edu") && (
                <Column
                  field="proctor_edu"
                  header="Proctor Edu"
                  body={(row) => yesNoBadge(row.proctor_edu)}
                  dataType="boolean"
                  headerClassName="!text-center"
                  bodyClassName="!text-center"
                  filter
                  showFilterMenu={false}
                  filterMatchMode="equals"
                  filterElement={(
                    options: ColumnFilterElementTemplateOptions,
                  ) => (
                    <Dropdown
                      value={options.value ?? null}
                      options={[
                        { label: "Yes", value: true },
                        { label: "No", value: false },
                      ]}
                      onChange={(e) => options.filterApplyCallback?.(e.value)}
                      placeholder="Select one"
                    />
                  )}
                />
              )}

              {visibleColumns.includes("proctorio") && (
                <Column
                  field="proctorio"
                  header="Proctorio"
                  body={(row) => yesNoBadge(row.proctorio)}
                  dataType="boolean"
                  headerClassName="!text-center"
                  bodyClassName="!text-center"
                  filter
                  showFilterMenu={false}
                  filterMatchMode="equals"
                  filterElement={(
                    options: ColumnFilterElementTemplateOptions,
                  ) => (
                    <Dropdown
                      value={options.value ?? null}
                      options={[
                        { label: "Yes", value: true },
                        { label: "No", value: false },
                      ]}
                      onChange={(e) => options.filterApplyCallback?.(e.value)}
                      showClear={false}
                      placeholder="Select one"
                    />
                  )}
                />
              )}

              {visibleColumns.includes("superset_apache") && (
                <Column
                  field="superset_apache"
                  header="Superset Apache"
                  body={(row) => yesNoBadge(row.superset_apache)}
                  dataType="boolean"
                  headerClassName="!text-center"
                  bodyClassName="!text-center"
                  filter
                  showFilterMenu={false}
                  filterMatchMode="equals"
                  filterElement={(
                    options: ColumnFilterElementTemplateOptions,
                  ) => (
                    <Dropdown
                      value={options.value ?? null}
                      options={[
                        { label: "Yes", value: true },
                        { label: "No", value: false },
                      ]}
                      onChange={(e) => options.filterApplyCallback?.(e.value)}
                      showClear={false}
                      placeholder="Select one"
                    />
                  )}
                />
              )}

              {visibleColumns.includes("last_update") && (
                <Column
                  field="last_update"
                  header="Last updated"
                  dataType="date"
                  headerClassName="!text-center"
                  bodyClassName="!text-center"
                  sortable
                  filter
                  style={{ minWidth: "15rem" }}
                  showFilterMenu={false}
                  filterMatchMode={FilterMatchMode.DATE_IS}
                  body={lastUpdatedBody}
                  filterElement={(
                    options: ColumnFilterElementTemplateOptions,
                  ) => (
                    <Calendar
                      value={options.value ?? null}
                      onChange={(e) =>
                        options.filterApplyCallback?.(e.value as Date | null)
                      }
                      dateFormat="yy-mm-dd"
                      readOnlyInput
                      showIcon
                      placeholder="Pick a date"
                      className="table-filter-full"
                    />
                  )}
                />
              )}

              {visibleColumns.includes("status") && (
                <Column
                  field="status"
                  header="Status"
                  body={statusBody}
                  headerClassName="!text-center"
                  bodyClassName="!text-center"
                />
              )}

              {visibleColumns.includes("billing") && (
                <Column
                  header="Remaining Credit"
                  headerClassName="!text-center"
                  bodyClassName="!text-center"
                  style={{ minWidth: "12rem" }}
                  body={(row: Client) => {
                    if (!row.billing_enabled) return "not in use";

                    const val = row.billing_remaining_credit;

                    if (val === null || val === undefined || val === "")
                      return "not available";

                    const num = typeof val === "number" ? val : Number(val);

                    if (Number.isNaN(num)) return "not available";

                    // optional: pretty formatting
                    return formatAmountWithCurrency(
                      row.billing_remaining_credit,
                      row.billing_currency,
                    );
                  }}
                />
              )}

              {visibleColumns.includes("rest_api") && (
                <Column
                  field="rest_api"
                  header="REST API"
                  body={(row) => yesNoBadge(row.rest_api)}
                  dataType="boolean"
                  headerClassName="!text-center"
                  bodyClassName="!text-center"
                  filter
                  showFilterMenu={false}
                  filterMatchMode="equals"
                  filterElement={(
                    options: ColumnFilterElementTemplateOptions,
                  ) => (
                    <Dropdown
                      value={options.value ?? null}
                      options={[
                        { label: "Yes", value: true },
                        { label: "No", value: false },
                      ]}
                      onChange={(e) => options.filterApplyCallback?.(e.value)}
                      showClear={false}
                      placeholder="Select one"
                    />
                  )}
                />
              )}

              {visibleColumns.includes("ecommerce") && (
                <Column
                  field="ecommerce"
                  header="E-commerce"
                  body={(row) => yesNoBadge(row.ecommerce)}
                  dataType="boolean"
                  headerClassName="!text-center"
                  bodyClassName="!text-center"
                  filter
                  showFilterMenu={false}
                  filterMatchMode="equals"
                  filterElement={(
                    options: ColumnFilterElementTemplateOptions,
                  ) => (
                    <Dropdown
                      value={options.value ?? null}
                      options={[
                        { label: "Yes", value: true },
                        { label: "No", value: false },
                      ]}
                      onChange={(e) => options.filterApplyCallback?.(e.value)}
                      showClear={false}
                      placeholder="Select one"
                    />
                  )}
                />
              )}

              {visibleColumns.includes("sso") && (
                <Column
                  field="sso"
                  header="SSO"
                  body={(row) => yesNoBadge(row.sso)}
                  dataType="boolean"
                  headerClassName="!text-center"
                  bodyClassName="!text-center"
                  filter
                  showFilterMenu={false}
                  filterMatchMode="equals"
                  filterElement={(
                    options: ColumnFilterElementTemplateOptions,
                  ) => (
                    <Dropdown
                      value={options.value ?? null}
                      options={[
                        { label: "Yes", value: true },
                        { label: "No", value: false },
                      ]}
                      onChange={(e) => options.filterApplyCallback?.(e.value)}
                      showClear={false}
                      placeholder="Select one"
                    />
                  )}
                />
              )}

              {visibleColumns.includes("lti") && (
                <Column
                  field="lti"
                  header="LTI"
                  body={(row) => yesNoBadge(row.lti)}
                  dataType="boolean"
                  headerClassName="!text-center"
                  bodyClassName="!text-center"
                  filter
                  showFilterMenu={false}
                  filterMatchMode="equals"
                  filterElement={(
                    options: ColumnFilterElementTemplateOptions,
                  ) => (
                    <Dropdown
                      value={options.value ?? null}
                      options={[
                        { label: "Yes", value: true },
                        { label: "No", value: false },
                      ]}
                      onChange={(e) => options.filterApplyCallback?.(e.value)}
                      showClear={false}
                      placeholder="Select one"
                    />
                  )}
                />
              )}

              {visibleColumns.includes("green_house") && (
                <Column
                  field="green_house"
                  header="GreenHouse"
                  body={(row) => yesNoBadge(row.green_house)}
                  dataType="boolean"
                  headerClassName="!text-center"
                  bodyClassName="!text-center"
                  filter
                  showFilterMenu={false}
                  filterMatchMode="equals"
                  filterElement={(
                    options: ColumnFilterElementTemplateOptions,
                  ) => (
                    <Dropdown
                      value={options.value ?? null}
                      options={[
                        { label: "Yes", value: true },
                        { label: "No", value: false },
                      ]}
                      onChange={(e) => options.filterApplyCallback?.(e.value)}
                      showClear={false}
                      placeholder="Select one"
                    />
                  )}
                />
              )}

              {visibleColumns.includes("open_ai") && (
                <Column
                  field="open_ai"
                  header="OpenAi"
                  body={(row) => yesNoBadge(row.open_ai)}
                  dataType="boolean"
                  headerClassName="!text-center"
                  bodyClassName="!text-center"
                  filter
                  showFilterMenu={false}
                  filterMatchMode="equals"
                  filterElement={(
                    options: ColumnFilterElementTemplateOptions,
                  ) => (
                    <Dropdown
                      value={options.value ?? null}
                      options={[
                        { label: "Yes", value: true },
                        { label: "No", value: false },
                      ]}
                      onChange={(e) => options.filterApplyCallback?.(e.value)}
                      showClear={false}
                      placeholder="Select one"
                    />
                  )}
                />
              )}

              {visibleColumns.includes("actions") && (
                <Column
                  header="Actions"
                  headerClassName="!text-center"
                  bodyClassName="!text-center"
                  body={(row) => (
                    <div className="table-actions">
                      <button
                        onClick={() => handleSync(row.app_id)}
                        className="action-btn"
                        title="Update"
                        aria-label="Update"
                      >
                        <i className="pi pi-refresh" />
                      </button>
                      <button
                        onClick={() => navigate(`/statistics?appId=${row.app_id}`)}
                        className="action-btn"
                        title="Statistic"
                        aria-label="Statistic"
                      >
                        <i className="pi pi-chart-bar" />
                      </button>
                    </div>
                  )}
                />
              )}
            </DataTable>
          </div>
        </div>
      </section>

      {/* Choose Columns */}
      <Dialog
        header="Choose Columns"
        visible={showColumnDialog}
        style={{ width: "44rem", maxWidth: "90vw" }}
        onHide={() => setShowColumnDialog(false)}
        className="ytm-dialog"
        footer={
          <div className="flex justify-center">
            <Button
              label="Close"
              className="btn-refresh"
              onClick={() => setShowColumnDialog(false)}
              autoFocus
            />
          </div>
        }
      >
        <input
          value={columnSearch}
          onChange={(e) => setColumnSearch(e.target.value)}
          placeholder="Search columns..."
          className="mb-5 w-full border px-2 py-1 rounded"
        />

        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-96 overflow-y-auto mt-4">
          {CLIENT_TABLE_COLUMNS.filter((c) =>
            c.label.toLowerCase().includes(columnSearch.toLowerCase()),
          ).map((col) => (
            <div key={col.key} className="flex items-center gap-2">
              <Checkbox
                inputId={col.key}
                checked={visibleColumns.includes(col.key)}
                onChange={(e) => {
                  if (e.checked)
                    setVisibleColumns([...visibleColumns, col.key]);
                  else
                    setVisibleColumns(
                      visibleColumns.filter((k) => k !== col.key),
                    );
                }}
              />
              <label htmlFor={col.key}>{col.label}</label>
            </div>
          ))}
        </div>
      </Dialog>
    </div>
  );
};