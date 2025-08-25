import React, { useEffect, useState } from "react";
import { DataTable, type DataTablePageEvent } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { useSearchParams } from "react-router-dom";

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

type PaginatedResponse = {
    data: StatisticsLog[];
    page: number;
    totalPages: number;
    totalCount: number;
}

export const StatisticsInfo: React.FC = () => {
  const [stats, setStats] = useState<StatisticsLog[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [filter, setFilter] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(6);
  const [, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [searchParams] = useSearchParams();
  const appId = searchParams.get("appId") ?? undefined;

  useEffect(() => {
    fetchData(page);
  }, [page, appId]);

  const fetchData = async (pageToLoad: number=1) => {
    setLoading(true);
    fetch(`${
        import.meta.env.VITE_BASE_URL
      }/statistics?page=${pageToLoad}&limit=${limit}${appId ? `&appId=${appId}` : ""}`
    ).then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
    }).then((json: PaginatedResponse) => {
      setStats(json.data);
      setTotalPages(json.totalPages);
      setTotalCount(json.totalCount);
    }).catch((err) => {
        console.error("Failed to fetch statistics", err);
    })
    .finally(() => setLoading(false));
  };

  const onPage = (e: DataTablePageEvent) => {
    setPage(e.page! + 1);
  };

const filteredStats = filter
  ? stats.filter((record) =>
      new Date(record.recorded_at)
        .toLocaleString()
        .toLowerCase()
        .includes(filter.toLowerCase())
    )
  : stats;

  return (
    <div className="p-4 w-full">
      <div className="flex justify-between items-center mb-4">
        <InputText
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Search by date..."
          className="px-3 py-2 border border-gray-400 rounded text-sm text-black"
        />
        <div className="flex gap-2 items-center">
          <Button label="Refresh" icon="pi pi-refresh" onClick={() => fetchData(page)} />
        </div>
      </div>

      <div className="overflow-x-auto">
        <h2 className="p-0.5">Statistic records for {appId}</h2>
        <DataTable
          value={filteredStats}
          lazy
          loading={loading}
          className="client-table"
          paginator
          showGridlines
          paginatorClassName="paginator"
          rows={limit}
          first={(page - 1) * limit}
          totalRecords={totalCount}
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink PageDropdown RowsPerPageDropdown"
          onPage={onPage}
          globalFilterFields={["recorded_at"]}
          globalFilter={filter}
          emptyMessage="No available statistic logs"
        >
          <Column
            field="recorded_at"
            header="Recorded At"
            className="column"
            style={{ minWidth: 140 }}
            body={(row) => new Date(row.recorded_at).toLocaleString()}
          />
          <Column field="user_cnt" header="User Count" className="column text-right" />
          <Column field="active_users" header="Active Users" className="column text-right" />
          <Column field="locked_users" header="Locked Users" className="column text-right" />
          <Column field="suspended_users" header="Suspended Users" className="column text-right" />
          <Column field="pending_users" header="Pending Users" className="column text-right" />
          <Column field="inactive_users" header="Inactive Users" className="column text-right" />
          <Column field="user_group_cnt" header="User Groups" className="column text-right" />
          <Column field="root_user_group_cnt" header="Root User Groups" className="column text-right" />
          <Column field="avg_users_per_group" header="Avg Users/Group" className="column text-right" />
          <Column field="admin_cnt" header="Admins" className="column text-right" />
          <Column field="proctor_cnt" header="Proctors" className="column text-right" />
          <Column field="instructor_cnt" header="Instructors" className="column text-right" />
          <Column field="student_cnt" header="Students" className="column text-right" />
          <Column field="custom_role_cnt" header="Custom Roles" className="column text-right" />
          <Column field="all_pools" header="All Pools" className="column text-right" />
          <Column field="all_root_pools" header="All Root Pools" className="column text-right" />
          <Column field="all_pools_with_questions" header="Pools with Questions" className="column text-right" />
          <Column field="total_questions" header="Total Questions" className="column text-right" />
          <Column field="avg_questions_in_pools" header="Avg Questions/Pool" className="column text-right" />
          <Column field="single_choice_questions" header="Single Choice Qs" className="column text-right" />
          <Column field="multiple_choice_questions" header="Multiple Choice Qs" className="column text-right" />
          <Column field="essay_questions" header="Essay Qs" className="column text-right" />
          <Column field="true_false_questions" header="True/False Qs" className="column text-right" />
          <Column field="matrix_questions" header="Matrix Qs" className="column text-right" />
          <Column field="matching_questions" header="Matching Qs" className="column text-right" />
          <Column field="fill_in_blanks_questions" header="Fill in Blanks Qs" className="column text-right" />
          <Column field="ordering_questions" header="Ordering Qs" className="column text-right" />
          <Column field="hotspot_questions" header="Hotspot Qs" className="column text-right" />
          <Column field="accounting_questions" header="Accounting Qs" className="column text-right" />
          <Column field="open_ended_questions" header="Open Ended Qs" className="column text-right" />
          <Column field="def_correctincorrect_scoring" header="Def Correct/Incorrect Scoring" className="column text-right" />
          <Column field="by_answer_weight_scoring" header="By Answer Weight Scoring" className="column text-right" />
          <Column field="manual_scoring" header="Manual Scoring" className="column text-right" />
          <Column field="by_combination_scoring" header="By Combination Scoring" className="column text-right" />
          <Column field="by_rules_scoring" header="By Rules Scoring" className="column text-right" />
          <Column field="custom_question_properties" header="Custom Q Properties" className="column text-right" />
          <Column field="default_tests" header="Default Tests" className="column text-right" />
          <Column field="only_tests_with_sections" header="Tests with Sections" className="column text-right" />
          <Column field="all_manual_tests" header="Manual Tests" className="column text-right" />
          <Column field="all_generated_tests" header="Generated Tests" className="column text-right" />
          <Column field="generated_by_category_tests" header="Gen. by Category Tests" className="column text-right" />
          <Column field="avg_test_versions_root_tests" header="Avg Test Versions (Root)" className="column text-right" />
          <Column field="max_test_versions_root_tests" header="Max Test Versions (Root)" className="column text-right" />
          <Column field="avg_test_versions_root_sec" header="Avg Test Versions (Sec)" className="column text-right" />
          <Column field="max_test_versions_root_sec" header="Max Test Versions (Sec)" className="column text-right" />
          <Column field="test_templates" header="Test Templates" className="column text-right" />
          <Column field="limited_time_tests" header="Limited Time Tests" className="column text-right" />
          <Column field="unlimited_time_tests" header="Unlimited Time Tests" className="column text-right" />
          <Column field="duration_per_question_tests" header="Duration/Question Tests" className="column text-right" />
          <Column field="duration_per_quiz_tests" header="Duration/Quiz Tests" className="column text-right" />
          <Column field="deadline_per_quiz_tests" header="Deadline/Quiz Tests" className="column text-right" />
          <Column field="test_one_page" header="Test One Page" className="column text-right" />
          <Column field="test_page_per_question" header="Test Page/Question" className="column text-right" />
          <Column field="after_test_report" header="After Test Report" className="column text-right" />
          <Column field="after_grading_report" header="After Grading Report" className="column text-right" />
          <Column field="after_verification_report" header="After Verification Report" className="column text-right" />
          <Column field="on_manager_approval_report" header="On Manager Approval Report" className="column text-right" />
          <Column field="realtime_grading" header="Realtime Grading" className="column text-right" />
          <Column field="score_details" header="Score Details" className="column text-right" />
          <Column field="only_score" header="Only Score" className="column text-right" />
          <Column field="test_certificates" header="Test Certificates" className="column text-right" />
          <Column field="surveys" header="Surveys" className="column text-right" />
          <Column field="self_enrollment_global" header="Self Enrollment Global" className="column text-right" />
          <Column field="session_user_groups" header="Session User Groups" className="column text-right" />
          <Column field="session_training" header="Session Training" className="column text-right" />
          <Column field="proctoredu" header="ProctorEdu" className="column text-right" />
          <Column field="proctorio" header="Proctorio" className="column text-right" />
          <Column field="favorite_reports" header="Favorite Reports" className="column text-right" />
          <Column field="scheduled_reports" header="Scheduled Reports" className="column text-right" />
          <Column field="training_courses" header="Training Courses" className="column text-right" />
          <Column field="pinned_courses" header="Pinned Courses" className="column text-right" />
          <Column field="avg_steps_per_training" header="Avg Steps/Training" className="column text-right" />
          <Column field="avg_tests_per_training" header="Avg Tests/Training" className="column text-right" />
          <Column field="enabled_email_notifications" header="Enabled Email Notif." className="column text-right" />
          <Column field="disabled_email_notifications" header="Disabled Email Notif." className="column text-right" />
          <Column field="enabled_app_notifications" header="Enabled App Notif." className="column text-right" />
          <Column field="disabled_app_notifications" header="Disabled App Notif." className="column text-right" />
          <Column field="language_bundles" header="Language Bundles" className="column text-right" />
          <Column field="users_logged_all_time" header="Users Logged All Time" className="column text-right" />
          <Column field="users_logged_last_month" header="Users Logged Last Month" className="column text-right" />
          <Column field="users_created_last_month" header="Users Created Last Month" className="column text-right" />
          <Column field="qpools_created_last_month" header="QPools Created Last Month" className="column text-right" />
          <Column field="questions_in_qpools_last_month" header="Questions in QPools Last Month" className="column text-right" />
          <Column field="attempts_last_month" header="Attempts Last Month" className="column text-right" />
          <Column field="total_attempts" header="Total Attempts" className="column text-right" />
          <Column field="test_attempts_last_month" header="Test Attempts Last Month" className="column text-right" />
          <Column field="total_test_attempts" header="Total Test Attempts" className="column text-right" />
          <Column field="survey_attempts_last_month" header="Survey Attempts Last Month" className="column text-right" />
          <Column field="total_survey_attempts" header="Total Survey Attempts" className="column text-right" />
          <Column field="max_concurrent_users_ever" header="Max Concurrent Users Ever" className="column text-right" />
          <Column field="max_concurrent_users_last_mont" header="Max Concurrent Users Last Month" className="column text-right" />
          <Column field="failed_logins_last_month" header="Failed Logins Last Month" className="column text-right" />
          <Column field="failed_emails" header="Failed Emails" className="column text-right" />
          <Column field="unfinished_attempts" header="Unfinished Attempts" className="column text-right" />
          <Column field="unfinished_disconnected_attemp" header="Unfinished Disconnected Attempts" className="column text-right" />
          <Column field="unfinished_in_progress_attemp" header="Unfinished In Progress Attempts" className="column text-right" />
          <Column field="unfinished_avb_continue_attemp" header="Unfinished AVB Continue Attempts" className="column text-right" />
          <Column field="unfinished_suspended_attemp" header="Unfinished Suspended Attempts" className="column text-right" />
          <Column field="has_state_defined" header="Has State Defined" className="column text-right" />
          <Column field="has_country_defined" header="Has Country Defined" className="column text-right" />
        </DataTable>
      </div>
    </div>
  );
};


