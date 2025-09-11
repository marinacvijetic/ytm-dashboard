import React, { useEffect, useState, useRef, type JSX } from "react";
import { DataTable } from "primereact/datatable";
import type { ColumnFilterElementTemplateOptions } from "primereact/column";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { useNavigate } from "react-router-dom";
import { fetchJson, HttpError } from "../../lib/fetchJson";
import { CLIENTS_ENDPOINT, SYNC_APP_INFO } from "../../utils/endpoints";
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
  status_flags?: StatusFlags;
  last_manual_sync_at?: string;
  last_appinfo_job_at?: string;
  last_stats_job_at?: string;
};


export const ClientTable: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const toast = useRef<Toast>(null);
  const navigate = useNavigate();
  const tooltipRef = useRef<Tooltip>(null);

  const OUTDATED_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24 hours
  const GRACE_MS = 60 * 60 * 1000; // 60 minutes
  const ROWS = 5;


  const fetchData = () => {
    setLoading(true);
    fetch(CLIENTS_ENDPOINT)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json: Client[]) => {
        const normalized = json.map((c) => ({
          ...c, last_update: c.last_update ? new Date(c.last_update) : null,
        }))
        
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
      toMs(row.last_update)
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

    const bubble = (bg: string, color: string) =>
      ({ background: bg, color } as React.CSSProperties);

    const Icon = ({
      icon,
      style,
      tip,
      testid,
    }: {
      icon: string;
      style: React.CSSProperties;
      tip: string;
      testid?: string;
    }) => (
      <span
        className="status-icon"
        style={style}
        data-pr-tooltip={tip}
        data-pr-position="top"
        aria-label={tip}
        data-testid={testid}
      >
        <i className={`pi ${icon}`} />
      </span>
    );

    const icons: JSX.Element[] = [];

    // Order: critical first → informational
    if (f.down)
      icons.push(
        <Icon
          key="down"
          icon="pi-times"
          style={bubble("#fee2e2", "#b91c1c")}
          tip="DOWN – Last reachability check failed within 24h"
          testid="icon-down"
        />
      );

    if (f.outdated)
      icons.push(
        <Icon
          key="outdated"
          icon="pi-clock"
          style={bubble("#fff1c5", "#b45309")}
          tip="OUTDATED – No fresh App Info in > 25h"
          testid="icon-outdated"
        />
      );

    if (f.appinfo_job_late)
      icons.push(
        <Icon
          key="ai-late"
          icon="pi-info-circle"
          style={bubble("#fef9c3", "#b45309")}
          tip="APP INFO LATE – Daily App Info job late or failing"
          testid="icon-ai-late"
        />
      );

    if (f.stats_job_late)
      icons.push(
        <Icon
          key="stats-late"
          icon="pi-chart-line"
          style={bubble("#fef9c3", "#b45309")}
          tip="STATS LATE – Weekly Stats job late or failing"
          testid="icon-stats-late"
        />
      );

    if (icons.length === 0) {
      icons.push(
        <Icon
          key="ok"
          icon="pi-check"
          style={bubble("#dcfce7", "#166534")}
          tip="HEALTHY – Reachable and up-to-date"
          testid="icon-healthy"
        />
      );
    }

    return <div className="flex items-center">{icons}</div>;
  };

  const lastUpdatedBody = (row: Client) => {
    const toMs = (d?: string | Date | null) => (d ? new Date(d as any).getTime() : 0);
    const ms = [
      row.last_manual_sync_at,
      row.last_appinfo_job_at,
      row.last_stats_job_at,
      row.last_update,
    ]
      .map(toMs)
      .filter(Boolean);

    const freshestMs = ms.length ? Math.max(...ms) : 0;
    const compact = freshestMs ? new Date(freshestMs).toLocaleString() : "";

    const fmt = (d?: string) =>
      d
        ? new Date(d).toLocaleString(undefined, {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })
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
      const data = await fetchJson<Partial<Client>>(
        `${SYNC_APP_INFO}${appId}`,
        { method: "GET", timeoutMs: 10000 }
      );

      // success -> update table row
      setClients((prev) =>
        prev.map((c) => (c.app_id === appId ? { ...c, ...data } : c))
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
            prev.map((c) => (c.app_id === appId ? { ...c, ...updated } : c))
          );
        }
      } else if (err instanceof Error) {
        message = err.message;
        setClients((prev) =>
          prev.map((c) =>
            c.app_id === appId ? { ...c, last_ping_successful: false } : c
          )
        );
      } else {
        setClients((prev) =>
          prev.map((c) =>
            c.app_id === appId ? { ...c, last_ping_successful: false } : c
          )
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

  return (
    <div className="p-4 w-full">
      <Toast ref={toast} />
      {/* Search + Refresh Controls */}
      <div className="table-toolbar">
        <Button onClick={handleRefesh} label="Refresh" text raised />
      </div>
      {/* PrimeReact DataTable with client-side pagination */}
      <div className="overflow-x-auto">
        <Tooltip
          ref={tooltipRef}
          target=".status-icon, .last-update-tooltip"
          showDelay={200}
          hideDelay={80}
        />{" "}
        <DataTable
          value={clients}
          filterDisplay="row"
          loading={loading}
          scrollable
          scrollHeight="600px"
          paginatorClassName="paginator"
          showGridlines
          paginator
          rows={ROWS}
          className="client-table"
          emptyMessage="No clients found"
          rowClassName={rowClassName}
        >
          <Column
            field="app_title"
            header="Client"
            frozen
            sortable
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
          <Column
            field="app_id"
            header="APP ID"
            sortable
            filter
            showFilterMenu={false}
            filterPlaceholder="Search APP ID"
          />
          <Column
            field="version"
            header="Version"
            bodyClassName="!text-center"
            headerClassName="!text-center"
          />
          <Column
            field="api_url"
            header="API URL"
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
            dataType="boolean"
            bodyClassName="!text-center"
            headerClassName="!text-center"
            filter
            showFilterMenu={false}
            filterMatchMode="equals"
            filterElement={(options: ColumnFilterElementTemplateOptions) => (
              <Dropdown
                value={options.value ?? null}
                options={[
                  { label: "Yes", value: true },
                  { label: "No", value: false },
                ]}
                onChange={(e) => options.filterApplyCallback?.(e.value)}
                showClear
                placeholder="Select"
              />
            )}
          />

          <Column
            field="proctorio"
            header="Proctorio"
            body={(row) => yesNoBadge(row.proctorio)}
            className="column"
            dataType="boolean"
            bodyClassName="!text-center"
            headerClassName="!text-center"
            filter
            showFilterMenu={false}
            filterMatchMode="equals"
            filterElement={(options: ColumnFilterElementTemplateOptions) => (
              <Dropdown
                value={options.value ?? null}
                options={[
                  { label: "Yes", value: true },
                  { label: "No", value: false },
                ]}
                onChange={(e) => options.filterApplyCallback?.(e.value)}
                showClear
                placeholder="Select"
              />
            )}
          />

          <Column
            field="superset_apache"
            header="Superset Apache"
            body={(row) => yesNoBadge(row.superset_apache)}
            dataType="boolean"
            bodyClassName="!text-center"
            headerClassName="!text-center"
            filter
            showFilterMenu={false}
            filterMatchMode="equals"
            filterElement={(options: ColumnFilterElementTemplateOptions) => (
              <Dropdown
                value={options.value ?? null}
                options={[
                  { label: "Yes", value: true },
                  { label: "No", value: false },
                ]}
                onChange={(e) => options.filterApplyCallback?.(e.value)}
                showClear
                placeholder="Select"
              />
            )}
          />
          <Column field="status" header="Status" body={statusBody} />
          <Column field="billing" header="Billing" />
          <Column
            field="last_update"
            header="Last Updated"
            dataType="date"
            bodyClassName="!text-center"
            headerClassName="!text-center"
            sortable
            filter
            showFilterMenu={false}
            filterMatchMode={FilterMatchMode.DATE_IS}
            body={lastUpdatedBody}
            filterElement={(options: ColumnFilterElementTemplateOptions) => (
              <Calendar
                value={options.value ?? null}
                onChange={(e) =>
                  options.filterApplyCallback?.(e.value as Date | null)
                }
                dateFormat="yy-mm-dd"
                readOnlyInput
                showIcon
                placeholder="Pick a date"
              />
            )}
          />
          <Column
            header="Actions"
            body={(row) => (
              <div className="table-actions">
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
