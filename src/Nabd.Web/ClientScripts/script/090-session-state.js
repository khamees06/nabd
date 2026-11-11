    const PROTECTED_VIEWS = new Set(['home', 'sim', 'debrief', 'coach', 'profile', 'university', 'observe', 'nurse', 'resp', 'er']);
    // The site now offers the emergency room, the respiratory room and the coach. These views stay in
    // the page (the app still writes into them) but can no longer be opened: they lead home.
    // phase8 2026-11-07: 'university' is open again (academic portal for the professor/advisor and students).
    const REMOVED_VIEWS = new Set(['observe', 'nurse', 'resp', 'coach', 'sim']);
    const STORAGE_KEYS = {
      ACTIVE_USER_ID: 'nabd_v2_active_user_id',
      ACCOUNTS_MAP: 'nabd_v2_accounts_map',
      CUSTOM_CASES: 'nabd_v2_custom_cases',
      SCRATCHPADS: 'nabd_v2_scratchpads',
      ACTIVE_SIM: 'nabd_v2_active_sim_meta',
      PROF_COHORT: 'nabd_v2_prof_cohort'
    };

    let authState = {
      isAuthenticated: false,
      user: null
    };

    let currentView = 'index';
    let selectedDeptFilter = 'all';
    let selectedWorkupCategory = 'all';
    let isEmergencyRandomMode = false;
    let activeCaseId = 'case_cardio_dm';
    let hasCompletedSessionInRun = false;
    let simToolsOpenOnDesktop = true;

    let simState = {
      caseData: null,
      startTimeMs: 0,
      emotion: 'worried',
      vitalsMeasured: false,
      vitalsTimestamp: null,
      askedQuestionsLog: [], // Array of { id, label, timestamp, reason }
      askedIds: new Set(),
      requestedWorkups: [], // Array of { id, title, timestamp, resultTitle, resultText, isViolation, isExpected }
      safetyMistakes: [],
      submittedDiagnosis: '',
      submittedSummary: '',
      unjustifiedWorkups: [],
      submittedHandover: '',
      submittedRecipient: 'doctor',
      sbarSubmitted: false,
      sessionCompleted: false
    };

