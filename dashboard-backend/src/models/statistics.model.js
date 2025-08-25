
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * @param {Object} data         — camelCase payload from controller
 * @param {string|number|Date} data.recordedAt
 * @param {string} data.appId
 * @param {number} data.userCnt

 * @param {number} data.hasCountryDefined
 */
exports.createStatisticsLog = async (data) => {
  try {
    return await prisma.statistics_log.create({
      data: {
        id:                      data.id,
        recorded_at:             new Date(data.recordedAt),
        app_id:                  data.appId,
        user_cnt:                data.userCnt,
        active_users:            data.activeUsers,
        locked_users:            data.lockedUsers,
        suspended_users:         data.suspendedUsers,
        pending_users:           data.pendingUsers,
        inactive_users:          data.inactiveUsers,
        user_group_cnt:          data.userGroupCnt,
        root_user_group_cnt:     data.rootUserGroupCnt,
        avg_users_per_group:     data.avgUsersPerGroup,
        admin_cnt:               data.adminCnt,
        proctor_cnt:             data.proctorCnt,
        instructor_cnt:          data.instructorCnt,
        student_cnt:             data.studentCnt,
        custom_role_cnt:         data.customRoleCnt,
        all_pools:               data.allPools,
        all_root_pools:          data.allRootPools,
        all_pools_with_questions:data.allPoolsWithQuestions,
        total_questions:         data.totalQuestions,
        avg_questions_in_pools:  data.avgQuestionsInPools,
        single_choice_questions: data.singleChoiceQuestions,
        multiple_choice_questions:data.multipleChoiceQuestions,
        essay_questions:         data.essayQuestions,
        true_false_questions:    data.trueFalseQuestions,
        matrix_questions:        data.matrixQuestions,
        matching_questions:      data.matchingQuestions,
        fill_in_blanks_questions:data.fillInBlanksQuestions,
        ordering_questions:      data.orderingQuestions,
        hotspot_questions:       data.hotspotQuestions,
        open_ended_questions:    data.openEndedQuestions,
        accounting_questions:      data.accountingQuestions,
        def_correctincorrect_scoring:   data.defCorrectincorrectScoring,
        by_answer_weight_scoring:        data.byAnswerWeightScoring,
        manual_scoring:                 data.manualScoring,
        by_combination_scoring:         data.byCombinationScoring,
        by_rules_scoring:               data.byRulesScoring,
        custom_question_properties:     data.customQuestionProperties,
        default_tests:                  data.defaultTests,
        only_tests_with_sections:       data.onlyTestsWithSections,
        all_manual_tests:               data.allManualTests,
        all_generated_tests:            data.allGeneratedTests,
        generated_by_category_tests:    data.generatedByCategoryTests,
        avg_test_versions_root_tests:   data.avgTestVersionsRootTests,
        max_test_versions_root_tests:   data.maxTestVersionsRootTests,
        avg_test_versions_root_sec:     data.avgTestVersionsRootSec,
        max_test_versions_root_sec:     data.maxTestVersionsRootSec,
        test_templates:                 data.testTemplates,
        limited_time_tests:             data.limitedTimeTests,
        unlimited_time_tests:           data.unlimitedTimeTests,
        duration_per_question_tests:    data.durationPerQuestionTests,
        duration_per_quiz_tests:        data.durationPerQuizTests,
        deadline_per_quiz_tests:        data.deadlinePerQuizTests,
        test_one_page:                  data.testOnePage,
        test_page_per_question:         data.testPagePerQuestion,
        after_test_report:              data.afterTestReport,
        after_grading_report:           data.afterGradingReport,
        after_verification_report:      data.afterVerificationReport,
        on_manager_approval_report:     data.onManagerApprovalReport,
        realtime_grading:               data.realtimeGrading,
        score_details:                  data.scoreDetails,
        only_score:                     data.onlyScore,
        test_certificates:              data.testCertificates,
        surveys:                        data.surveys,
        self_enrollment_global:         data.selfEnrollmentGlobal,
        session_user_groups:            data.sessionUserGroups,
        session_training:               data.sessionTraining,
        proctoredu:                     data.proctoredu,
        proctorio:                      data.proctorio,
        favorite_reports:               data.favoriteReports,
        scheduled_reports:              data.scheduledReports,
        training_courses:               data.trainingCourses,
        pinned_courses:                 data.pinnedCourses,
        avg_steps_per_training:         data.avgStepsPerTraining,
        avg_tests_per_training:         data.avgTestsPerTraining,
        enabled_email_notifications:    data.enabledEmailNotifications,
        disabled_email_notifications:   data.disabledEmailNotifications,
        enabled_app_notifications:      data.enabledAppNotifications,
        disabled_app_notifications:     data.disabledAppNotifications,
        language_bundles:               data.languageBundles,
        users_logged_all_time:          data.usersLoggedAllTime,
        users_logged_last_month:        data.usersLoggedLastMonth,
        users_created_last_month:       data.usersCreatedLastMonth,
        qpools_created_last_month:      data.qpoolsCreatedLastMonth,
        questions_in_qpools_last_month: data.questionsInQpoolsLastMonth,
        attempts_last_month:            data.attemptsLastMonth,
        total_attempts:                 data.totalAttempts,
        test_attempts_last_month:       data.testAttemptsLastMonth,
        total_test_attempts:            data.totalTestAttempts,
        survey_attempts_last_month:     data.surveyAttemptsLastMonth,
        total_survey_attempts:          data.totalSurveyAttempts,
        max_concurrent_users_ever:      data.maxConcurrentUsersEver,
        max_concurrent_users_last_mont: data.maxConcurrentUsersLastMont,
        failed_logins_last_month:       data.failedLoginsLastMonth,
        failed_emails:                  data.failedEmails,
        unfinished_attempts:            data.unfinishedAttempts,
        unfinished_disconnected_attemp: data.unfinishedDisconnectedAttemp,
        unfinished_in_progress_attemp:  data.unfinishedInProgressAttemp,
        unfinished_avb_continue_attemp: data.unfinishedAvbContinueAttemp,
        unfinished_suspended_attemp:    data.unfinishedSuspendedAttemp,
        has_state_defined:              data.hasStateDefined,
        has_country_defined:            data.hasCountryDefined,
      },
    });
  } catch (e) {
    console.error('Create StatisticsLog Error:', e);
    throw e;
  }
};

exports.countLogs = async (appId) => {
  try {
    return await prisma.statistics_log.count({
      where: appId ? { app_id: appId } : undefined,
    });
  } catch (err) {
    console.error("[statistics.model] countLogs error:", err);
    throw err;
  }
};

exports.findLogsPage = async (skip, take, appId) => {
  try {
    const logs = await prisma.statistics_log.findMany({
      where: appId ? { app_id: appId } : undefined,
      skip: skip,
      take: take,
      orderBy: { recorded_at: 'desc' },
    });

    // Map into the exact shape your front‐end expects:
    return logs;
  } catch (err) {
    console.error("[statistics.model] findLogsPage error:", err);
    throw err;
  }
};

exports.findDistinctAppIds = async () => {
  try {
    const apps = await prisma.statistics_log.findMany({
      distinct: ['app_id'],
      select: {app_id: true},
    });
    
    return apps.map((a) => a.app_id);
    return appIds.map(entry => entry.app_id);
  } catch (err) {
    console.error("[statistics.model] findDistinctAppIds error:", err);
    throw err;
  }
};

exports.findLatestLogByAppId = async (appId) => {
  try {
    return await prisma.statistics_log.findFirst({
      where: { app_id: appId },
      orderBy: { recorded_at: 'desc' },
    });
  } catch (err) {
    console.error("[statistics.model] findLatestLogByAppId error:", err);
    throw err;
  }
};