import React, { useEffect, useState, useMemo, useRef } from "react";
import { DataTable, type DataTablePageEvent } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Checkbox } from "primereact/checkbox";
import { useSearchParams } from "react-router-dom";
import { MdAssessment } from "react-icons/md";
import {
  STATISTICS_ENDPOINT,
  STATISTICS_APPS,
  EVENTS_ENDPOINT,
} from "../../utils/endpoints";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";

export type StatisticsLog = {
  id: string;
  app_id: string;
  recorded_at: Date;
  user_cnt?: number;
  active_users?: number;
  locked_users?: number;
  suspended_users?: number;
  pending_users?: number;
  inactive_users?: number;
  user_group_cnt?: number;
  root_user_group_cnt?: number;
  avg_users_per_group?: number;
  admin_cnt?: number;
  proctor_cnt?: number;
  instructor_cnt?: number;
  student_cnt?: number;
  custom_role_cnt?: number;
  all_pools?: number;
  all_root_pools?: number;
  all_pools_with_questions?: number;
  total_questions?: number;
  avg_questions_in_pools?: number;
  single_choice_questions?: number;
  multiple_choice_questions?: number;
  essay_questions?: number;
  true_false_questions?: number;
  matrix_questions?: number;
  matching_questions?: number;
  fill_in_blanks_questions?: number;
  ordering_questions?: number;
  hotspot_questions?: number;
  accounting_questions?: number;
  open_ended_questions?: number;
  def_correctincorrect_scoring?: number;
  by_answer_weight_scoring?: number;
  manual_scoring?: number;
  by_combination_scoring?: number;
  by_rules_scoring?: number;
  custom_question_properties?: number;
  default_tests?: number;
  only_tests_with_sections?: number;
  all_manual_tests?: number;
  all_generated_tests?: number;
  generated_by_category_tests?: number;
  avg_test_versions_root_tests?: number;
  max_test_versions_root_tests?: number;
  avg_test_versions_root_sec?: number;
  max_test_versions_root_sec?: number;
  test_templates?: number;
  limited_time_tests?: number;
  unlimited_time_tests?: number;
  duration_per_question_tests?: number;
  duration_per_quiz_tests?: number;
  deadline_per_quiz_tests?: number;
  test_one_page?: number;
  test_page_per_question?: number;
  after_test_report?: number;
  after_grading_report?: number;
  after_verification_report?: number;
  on_manager_approval_report?: number;
  realtime_grading?: number;
  score_details?: number;
  only_score?: number;
  test_certificates?: number;
  surveys?: number;
  self_enrollment_global?: number;
  session_user_groups?: number;
  session_training?: number;
  proctoredu?: number;
  proctorio?: number;
  favorite_reports?: number;
  scheduled_reports?: number;
  training_courses?: number;
  pinned_courses?: number;
  avg_steps_per_training?: number;
  avg_tests_per_training?: number;
  enabled_email_notifications?: number;
  disabled_email_notifications?: number;
  enabled_app_notifications?: number;
  disabled_app_notifications?: number;
  language_bundles?: number;
  users_logged_all_time?: number;
  users_logged_last_month?: number;
  users_created_last_month?: number;
  qpools_created_last_month?: number;
  questions_in_qpools_last_month?: number;
  attempts_last_month?: number;
  total_attempts?: number;
  test_attempts_last_month?: number;
  total_test_attempts?: number;
  survey_attempts_last_month?: number;
  total_survey_attempts?: number;
  max_concurrent_users_ever?: number;
  max_concurrent_users_last_mont?: number;
  failed_logins_last_month?: number;
  failed_emails?: number;
  unfinished_attempts?: number;
  unfinished_disconnected_attemp?: number;
  unfinished_in_progress_attemp?: number;
  unfinished_avb_continue_attemp?: number;
  unfinished_suspended_attemp?: number;
  has_state_defined?: number;
  has_country_defined?: number;
};

type AppInfo = { app_id: string; app_title: string | null };

type PaginatedResponse = {
  data: StatisticsLog[];
  page: number;
  totalPages: number;
  totalCount: number;
};

// format local date (no UTC shift)
function toYMDLocal(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export const StatisticsInfo: React.FC = () => {
  const [stats, setStats] = useState<StatisticsLog[]>([]);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [searchParams, setSearchParams] = useSearchParams();
  const initialAppId = searchParams.get("appId") ?? "";
  const [apps, setApps] = useState<AppInfo[]>([]);
  const [selectedApp, setSelectedApp] = useState<string>(initialAppId);

  // filters dialog state
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [filterFrom, setFilterFrom] = useState<Date | null>(null);
  const [filterTo, setFilterTo] = useState<Date | null>(null);
  const [tempFilterFrom, setTempFilterFrom] = useState<Date | null>(null);
  const [tempFilterTo, setTempFilterTo] = useState<Date | null>(null);

  const selectedAppRef = useRef(selectedApp);
  useEffect(() => {
    selectedAppRef.current = selectedApp;
  }, [selectedApp]);
  const filterFromRef = useRef(filterFrom);
  useEffect(() => {
    filterFromRef.current = filterFrom;
  }, [filterFrom]);
  const filterToRef = useRef(filterTo);
  useEffect(() => {
    filterToRef.current = filterTo;
  }, [filterTo]);
  const pageRef = useRef(page);
  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  // columns chooser
  const allColumns = [
    {
      field: "recorded_at",
      header: "Recorded At",
      style: { minWidth: 140 },
      body: (row: StatisticsLog) =>
        new Intl.DateTimeFormat("en-US", {
          year: "numeric",
          month: "short",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        }).format(new Date(row.recorded_at)),
    },
    { field: "user_cnt", header: "User Count", className: "text-right" },
    { field: "active_users", header: "Active Users", className: "text-right" },
    { field: "locked_users", header: "Locked Users", className: "text-right" },
    {
      field: "suspended_users",
      header: "Suspended Users",
      className: "text-right",
    },
    {
      field: "pending_users",
      header: "Pending Users",
      className: "text-right",
    },
    {
      field: "inactive_users",
      header: "Inactive Users",
      className: "text-right",
    },
    { field: "user_group_cnt", header: "User Groups", className: "text-right" },
    {
      field: "root_user_group_cnt",
      header: "Root User Groups",
      className: "text-right",
    },
    {
      field: "avg_users_per_group",
      header: "Avg Users/Group",
      className: "text-right",
    },
    { field: "admin_cnt", header: "Admins", className: "text-right" },
    { field: "proctor_cnt", header: "Proctors", className: "text-right" },
    { field: "instructor_cnt", header: "Instructors", className: "text-right" },
    { field: "student_cnt", header: "Students", className: "text-right" },
    {
      field: "custom_role_cnt",
      header: "Custom Roles",
      className: "text-right",
    },
    { field: "all_pools", header: "All Pools", className: "text-right" },
    {
      field: "all_root_pools",
      header: "All Root Pools",
      className: "text-right",
    },
    {
      field: "all_pools_with_questions",
      header: "Pools with Questions",
      className: "text-right",
    },
    {
      field: "total_questions",
      header: "Total Questions",
      className: "text-right",
    },
    {
      field: "avg_questions_in_pools",
      header: "Avg Questions/Pool",
      className: "text-right",
    },
    {
      field: "single_choice_questions",
      header: "Single Choice Qs",
      className: "text-right",
    },
    {
      field: "multiple_choice_questions",
      header: "Multiple Choice Qs",
      className: "text-right",
    },
    { field: "essay_questions", header: "Essay Qs", className: "text-right" },
    {
      field: "true_false_questions",
      header: "True/False Qs",
      className: "text-right",
    },
    { field: "matrix_questions", header: "Matrix Qs", className: "text-right" },
    {
      field: "matching_questions",
      header: "Matching Qs",
      className: "text-right",
    },
    {
      field: "fill_in_blanks_questions",
      header: "Fill in Blanks Qs",
      className: "text-right",
    },
    {
      field: "ordering_questions",
      header: "Ordering Qs",
      className: "text-right",
    },
    {
      field: "hotspot_questions",
      header: "Hotspot Qs",
      className: "text-right",
    },
    {
      field: "accounting_questions",
      header: "Accounting Qs",
      className: "text-right",
    },
    {
      field: "open_ended_questions",
      header: "Open Ended Qs",
      className: "text-right",
    },
    {
      field: "def_correctincorrect_scoring",
      header: "Def Correct/Incorrect Scoring",
      className: "text-right",
    },
    {
      field: "by_answer_weight_scoring",
      header: "By Answer Weight Scoring",
      className: "text-right",
    },
    {
      field: "manual_scoring",
      header: "Manual Scoring",
      className: "text-right",
    },
    {
      field: "by_combination_scoring",
      header: "By Combination Scoring",
      className: "text-right",
    },
    {
      field: "by_rules_scoring",
      header: "By Rules Scoring",
      className: "text-right",
    },
    {
      field: "custom_question_properties",
      header: "Custom Q Properties",
      className: "text-right",
    },
    {
      field: "default_tests",
      header: "Default Tests",
      className: "text-right",
    },
    {
      field: "only_tests_with_sections",
      header: "Tests with Sections",
      className: "text-right",
    },
    {
      field: "all_manual_tests",
      header: "Manual Tests",
      className: "text-right",
    },
    {
      field: "all_generated_tests",
      header: "Generated Tests",
      className: "text-right",
    },
    {
      field: "generated_by_category_tests",
      header: "Gen. by Category Tests",
      className: "text-right",
    },
    {
      field: "avg_test_versions_root_tests",
      header: "Avg Test Versions (Root)",
      className: "text-right",
    },
    {
      field: "max_test_versions_root_tests",
      header: "Max Test Versions (Root)",
      className: "text-right",
    },
    {
      field: "avg_test_versions_root_sec",
      header: "Avg Test Versions (Sec)",
      className: "text-right",
    },
    {
      field: "max_test_versions_root_sec",
      header: "Max Test Versions (Sec)",
      className: "text-right",
    },
    {
      field: "test_templates",
      header: "Test Templates",
      className: "text-right",
    },
    {
      field: "limited_time_tests",
      header: "Limited Time Tests",
      className: "text-right",
    },
    {
      field: "unlimited_time_tests",
      header: "Unlimited Time Tests",
      className: "text-right",
    },
    {
      field: "duration_per_question_tests",
      header: "Duration/Question Tests",
      className: "text-right",
    },
    {
      field: "duration_per_quiz_tests",
      header: "Duration/Quiz Tests",
      className: "text-right",
    },
    {
      field: "deadline_per_quiz_tests",
      header: "Deadline/Quiz Tests",
      className: "text-right",
    },
    {
      field: "test_one_page",
      header: "Test One Page",
      className: "text-right",
    },
    {
      field: "test_page_per_question",
      header: "Test Page/Question",
      className: "text-right",
    },
    {
      field: "after_test_report",
      header: "After Test Report",
      className: "text-right",
    },
    {
      field: "after_grading_report",
      header: "After Grading Report",
      className: "text-right",
    },
    {
      field: "after_verification_report",
      header: "After Verification Report",
      className: "text-right",
    },
    {
      field: "on_manager_approval_report",
      header: "On Manager Approval Report",
      className: "text-right",
    },
    {
      field: "realtime_grading",
      header: "Realtime Grading",
      className: "text-right",
    },
    {
      field: "score_details",
      header: "Score Details",
      className: "text-right",
    },
    { field: "only_score", header: "Only Score", className: "text-right" },
    {
      field: "test_certificates",
      header: "Test Certificates",
      className: "text-right",
    },
    { field: "surveys", header: "Surveys", className: "text-right" },
    {
      field: "self_enrollment_global",
      header: "Self Enrollment Global",
      className: "text-right",
    },
    {
      field: "session_user_groups",
      header: "Session User Groups",
      className: "text-right",
    },
    {
      field: "session_training",
      header: "Session Training",
      className: "text-right",
    },
    { field: "proctoredu", header: "ProctorEdu", className: "text-right" },
    { field: "proctorio", header: "Proctorio", className: "text-right" },
    {
      field: "favorite_reports",
      header: "Favorite Reports",
      className: "text-right",
    },
    {
      field: "scheduled_reports",
      header: "Scheduled Reports",
      className: "text-right",
    },
    {
      field: "training_courses",
      header: "Training Courses",
      className: "text-right",
    },
    {
      field: "pinned_courses",
      header: "Pinned Courses",
      className: "text-right",
    },
    {
      field: "avg_steps_per_training",
      header: "Avg Steps/Training",
      className: "text-right",
    },
    {
      field: "avg_tests_per_training",
      header: "Avg Tests/Training",
      className: "text-right",
    },
    {
      field: "enabled_email_notifications",
      header: "Enabled Email Notif.",
      className: "text-right",
    },
    {
      field: "disabled_email_notifications",
      header: "Disabled Email Notif.",
      className: "text-right",
    },
    {
      field: "enabled_app_notifications",
      header: "Enabled App Notif.",
      className: "text-right",
    },
    {
      field: "disabled_app_notifications",
      header: "Disabled App Notif.",
      className: "text-right",
    },
    {
      field: "language_bundles",
      header: "Language Bundles",
      className: "text-right",
    },
    {
      field: "users_logged_all_time",
      header: "Users Logged All Time",
      className: "text-right",
    },
    {
      field: "users_logged_last_month",
      header: "Users Logged Last Month",
      className: "text-right",
    },
    {
      field: "users_created_last_month",
      header: "Users Created Last Month",
      className: "text-right",
    },
    {
      field: "qpools_created_last_month",
      header: "QPools Created Last Month",
      className: "text-right",
    },
    {
      field: "questions_in_qpools_last_month",
      header: "Questions in QPools Last Month",
      className: "text-right",
    },
    {
      field: "attempts_last_month",
      header: "Attempts Last Month",
      className: "text-right",
    },
    {
      field: "total_attempts",
      header: "Total Attempts",
      className: "text-right",
    },
    {
      field: "test_attempts_last_month",
      header: "Test Attempts Last Month",
      className: "text-right",
    },
    {
      field: "total_test_attempts",
      header: "Total Test Attempts",
      className: "text-right",
    },
    {
      field: "survey_attempts_last_month",
      header: "Survey Attempts Last Month",
      className: "text-right",
    },
    {
      field: "total_survey_attempts",
      header: "Total Survey Attempts",
      className: "text-right",
    },
    {
      field: "max_concurrent_users_ever",
      header: "Max Concurrent Users Ever",
      className: "text-right",
    },
    {
      field: "max_concurrent_users_last_mont",
      header: "Max Concurrent Users Last Month",
      className: "text-right",
    },
    {
      field: "failed_logins_last_month",
      header: "Failed Logins Last Month",
      className: "text-right",
    },
    {
      field: "failed_emails",
      header: "Failed Emails",
      className: "text-right",
    },
    {
      field: "unfinished_attempts",
      header: "Unfinished Attempts",
      className: "text-right",
    },
    {
      field: "unfinished_disconnected_attemp",
      header: "Unfinished Disconnected Attempts",
      className: "text-right",
    },
    {
      field: "unfinished_in_progress_attemp",
      header: "Unfinished In Progress Attempts",
      className: "text-right",
    },
    {
      field: "unfinished_avb_continue_attemp",
      header: "Unfinished AVB Continue Attempts",
      className: "text-right",
    },
    {
      field: "unfinished_suspended_attemp",
      header: "Unfinished Suspended Attempts",
      className: "text-right",
    },
    {
      field: "has_state_defined",
      header: "Has State Defined",
      className: "text-right",
    },
    {
      field: "has_country_defined",
      header: "Has Country Defined",
      className: "text-right",
    },
  ];
  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    allColumns.map((c) => c.field),
  );
  const [showColumnDialog, setShowColumnDialog] = useState(false);
  const [columnSearch, setColumnSearch] = useState("");

  const appOptions = useMemo(
    () =>
      apps.map((app) => ({
        label: app.app_title ? `${app.app_title} (${app.app_id})` : app.app_id,
        value: app.app_id,
        app_title: app.app_title ?? "",
        app_id: app.app_id,
      })),
    [apps],
  );

  // load apps on mount
  useEffect(() => {
    fetchApps();
  }, []);

  // refetch when app or filters or page change
  useEffect(() => {
    if (selectedApp) {
      fetchData(page, selectedApp, filterFrom, filterTo);
      setSearchParams(selectedApp ? { appId: selectedApp } : {});
    } else {
      setStats([]);
      setTotalCount(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, selectedApp, filterFrom, filterTo]);

  const fetchApps = () => {
    setLoading(true);
    fetch(`${STATISTICS_APPS}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json: AppInfo[]) => {
        setApps(json);
        if (!initialAppId && json.length) {
          setSelectedApp(json[0].app_id);
          setSearchParams({ appId: json[0].app_id });
        } else if (initialAppId) {
          setSelectedApp(initialAppId);
        }
      })
      .catch((err) => console.error("Failed to fetch applications", err))
      .finally(() => setLoading(false));
  };

  const fetchData = async (
    pageToLoad: number = 1,
    appId = "",
    from: Date | null = null,
    to: Date | null = null,
    limitToLoad: number = 10,
  ) => {
    if (!appId) return;
    setLoading(true);
    try {
      // normalize range (swap if needed)
      let fromD = from,
        toD = to;
      if (fromD && toD && fromD > toD) {
        [fromD, toD] = [toD, fromD];
      }

      let q = appId ? `&appId=${encodeURIComponent(appId)}` : "";
      if (fromD) q += `&from=${toYMDLocal(fromD)}`;
      if (toD) q += `&to=${toYMDLocal(toD)}`;

      const res = await fetch(
        `${STATISTICS_ENDPOINT}?page=${pageToLoad}&limit=${limitToLoad}${q}`,
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: PaginatedResponse = await res.json();
      setStats(json.data);
      setTotalPages(json.totalPages);
      setTotalCount(json.totalCount);
    } catch (err) {
      console.error("Failed to fetch statistics", err);
      setStats([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchDataRef = useRef(fetchData);
  useEffect(() => {
    fetchDataRef.current = fetchData;
  }, [fetchData]);

  useEffect(() => {
    const eventSource = new EventSource(EVENTS_ENDPOINT);
    const handler = (ev: MessageEvent) => {
      const data = JSON.parse(ev.data);
      if (data.app_id === selectedAppRef.current) {
        fetchDataRef.current(
          pageRef.current,
          selectedAppRef.current,
          filterFromRef.current,
          filterToRef.current,
        );
      }
    };
    eventSource.addEventListener("stats_update", handler);
    return () => {
      eventSource.removeEventListener("stats_update", handler);
      eventSource.close();
    };
  }, []);

  const onPage = (e: DataTablePageEvent) => {
    setPage((e.page ?? 0) + 1);
    if (typeof e.rows === "number") setLimit(e.rows);
  };

  // action buttons (left paginator slot)
  // const chooseColumnsButton = (
  //   <div className="flex gap-2">
  //     <Button
  //       label="Choose Columns"
  //       icon="pi pi-sliders-h"
  //       onClick={() => setShowColumnDialog(true)}
  //       className="mb-2"
  //     />
  //     <Button
  //       label="Filters"
  //       icon="pi pi-filter"
  //       onClick={() => {
  //         setTempFilterFrom(filterFrom);
  //         setTempFilterTo(filterTo);
  //         setShowFilterDialog(true);
  //       }}
  //       className="mb-2"
  //     />
  //   </div>
  // );

  const chooseColumnsButton = (
    <Button
      icon="pi pi-sliders-h"
      onClick={() => setShowColumnDialog(true)}
      className="btn-outline"
    />
  );

  return (
    <div className="p-4 w-full">
      <div className="page-badge">Statistics</div>
      <div className="page-header">
        <div className="page-title">
          <MdAssessment size={22} aria-hidden="true" />
          <span>Statistic records overview</span>
        </div>
        <div className="page-subtitle">
          View and filter statistic records for a desired client application.
          Choose columns, set date range filters, and refresh to load the latest
          data.
        </div>
      </div>

      <section className="page-card page-card--table">
        <div className="page-card__header">
          <div className="page-card__header-left">
            <i className="pi pi-table" />
            <span>Show statistic records for desired client: </span>
            <Dropdown
              value={selectedApp}
              options={appOptions}
              onChange={(e) => {
                setSelectedApp(e.value);
                setPage(1);
              }}
              placeholder="Select application..."
              className="stats-app-select"
              filter
              filterBy="label,app_title,app_id"
              filterPlaceholder="Search by name or ID"
              filterMatchMode="contains"
            />
          </div>

          <div className="stats-header-right">
            <Button
              label="Refresh"
              className="btn-refresh"
              onClick={() =>
                fetchData(page, selectedApp, filterFrom, filterTo, limit)
              }
            />

            <Button
              label="Filters"
              icon="pi pi-filter"
              className="btn-outline"
              onClick={() => {
                setTempFilterFrom(filterFrom);
                setTempFilterTo(filterTo);
                setShowFilterDialog(true);
              }}
            />
          </div>
        </div>
        <div className="page-card__body">
          <div className="overflow-x-auto">
            <DataTable
              value={stats}
              lazy
              loading={loading}
              className="client-table"
              paginator
              showGridlines
              paginatorClassName="paginator"
              rows={limit}
              rowsPerPageOptions={[10, 20, 50]}
              first={(page - 1) * limit}
              totalRecords={totalCount}
              onPage={onPage}
              emptyMessage="No available statistic logs"
              paginatorLeft={chooseColumnsButton}
              currentPageReportTemplate="Rows: {totalRecords}"
              paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown CurrentPageReport"
            >
              {allColumns
                .filter((col) => visibleColumns.includes(col.field))
                .map((col) => (
                  <Column
                    key={col.field}
                    field={col.field}
                    header={col.header}
                    className={col.className}
                    style={col.style}
                    body={col.body}
                  />
                ))}
            </DataTable>
          </div>
        </div>
      </section>

      {/* Choose Columns */}
      <Dialog
        header="Choose Columns"
        visible={showColumnDialog}
        className="ytm-dialog"
        modal
        draggable={false}
        resizable={false}
        style={{ width: "44rem", maxWidth: "92vw" }}
        onHide={() => setShowColumnDialog(false)}
        footer={
          <div className="flex justify-center gap-3">
            <Button
              label="Close"
              className="btn-refresh"
              onClick={() => setShowColumnDialog(false)}
            />
          </div>
        }
      >
        <input
          value={columnSearch}
          onChange={(e) => setColumnSearch(e.target.value)}
          placeholder="Search columns..."
          className="ytm-dialog__input mb-4"
        />

        <div className="ytm-dialog__scroll grid grid-cols-2 md:grid-cols-3 gap-3">
          {allColumns
            .filter((c) =>
              c.header.toLowerCase().includes(columnSearch.toLowerCase()),
            )
            .map((col) => (
              <div key={col.field} className="flex items-center gap-2">
                <Checkbox
                  inputId={col.field}
                  checked={visibleColumns.includes(col.field)}
                  onChange={(e) => {
                    if (e.checked)
                      setVisibleColumns([...visibleColumns, col.field]);
                    else
                      setVisibleColumns(
                        visibleColumns.filter((f) => f !== col.field),
                      );
                  }}
                />
                <label htmlFor={col.field} className="text-gray-700">
                  {col.header}
                </label>
              </div>
            ))}
        </div>
      </Dialog>

      {/* Set Filters */}
      <Dialog
        header="Set Filters"
        visible={showFilterDialog}
        className="ytm-dialog"
        modal
        draggable={false}
        resizable={false}
        style={{ width: "28rem", maxWidth: "92vw" }}
        onHide={() => setShowFilterDialog(false)}
        footer={
          <div className="flex justify-center gap-3">
            <Button
              label="Apply"
              className="btn-refresh"
              onClick={() => {
                setFilterFrom(tempFilterFrom);
                setFilterTo(tempFilterTo);
                setShowFilterDialog(false);
                setPage(1);
                fetchData(1, selectedApp, tempFilterFrom, tempFilterTo);
              }}
            />

            <Button
              label="Clear"
              className="btn-outline"
              onClick={() => {
                setFilterFrom(null);
                setFilterTo(null);
                setShowFilterDialog(false);
                setPage(1);
                fetchData(1, selectedApp, null, null);
              }}
            />

            <Button
              label="Cancel"
              className="btn-outline"
              onClick={() => setShowFilterDialog(false)}
            />
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="block mb-2 text-gray-700 font-medium">From</label>
            <Calendar
              value={tempFilterFrom}
              onChange={(e) => setTempFilterFrom(e.value as Date | null)}
              dateFormat="yy-mm-dd"
              readOnlyInput
              showIcon
              placeholder="From date"
              className="w-full"
            />
          </div>

          <div>
            <label className="block mb-2 text-gray-700 font-medium">To</label>
            <Calendar
              value={tempFilterTo}
              onChange={(e) => setTempFilterTo(e.value as Date | null)}
              dateFormat="yy-mm-dd"
              readOnlyInput
              showIcon
              placeholder="To date"
              className="w-full"
            />
          </div>

          <div className="flex justify-center">
            <Button
              label="Last 7 Days"
              icon="pi pi-calendar"
              className="btn-outline"
              onClick={() => {
                const today = new Date();
                const weekAgo = new Date();
                weekAgo.setDate(today.getDate() - 6);
                setTempFilterFrom(weekAgo);
                setTempFilterTo(today);
              }}
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
};
