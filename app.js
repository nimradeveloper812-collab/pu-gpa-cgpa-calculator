/**
 * University of the Punjab (PU) GPA & CGPA Calculator
 * Compliant with Punjab University Examination Regulations & Grading System
 * Features dedicated Semester GPA Card & Cumulative CGPA Card, responsive course cards, and live persistence.
 */

// --- PU Official Grading Scale ---
const PU_GRADE_SCALE = [
  { min: 85, max: 100, grade: 'A',  gp: 4.00, css: 'badge-a' },
  { min: 80, max: 84.999, grade: 'A-', gp: 3.70, css: 'badge-a' },
  { min: 75, max: 79.999, grade: 'B+', gp: 3.30, css: 'badge-b' },
  { min: 70, max: 74.999, grade: 'B',  gp: 3.00, css: 'badge-b' },
  { min: 65, max: 69.999, grade: 'B-', gp: 2.70, css: 'badge-b' },
  { min: 61, max: 64.999, grade: 'C+', gp: 2.30, css: 'badge-c' },
  { min: 58, max: 60.999, grade: 'C',  gp: 2.00, css: 'badge-c' },
  { min: 55, max: 57.999, grade: 'C-', gp: 1.70, css: 'badge-c' },
  { min: 50, max: 54.999, grade: 'D',  gp: 1.00, css: 'badge-d' },
  { min: 0,  max: 49.999, grade: 'F',  gp: 0.00, css: 'badge-f' }
];

const GRADE_TO_GP_MAP = {
  'A':  { gp: 4.00, defaultMarks: 85, css: 'badge-a' },
  'A-': { gp: 3.70, defaultMarks: 80, css: 'badge-a' },
  'B+': { gp: 3.30, defaultMarks: 75, css: 'badge-b' },
  'B':  { gp: 3.00, defaultMarks: 70, css: 'badge-b' },
  'B-': { gp: 2.70, defaultMarks: 65, css: 'badge-b' },
  'C+': { gp: 2.30, defaultMarks: 61, css: 'badge-c' },
  'C':  { gp: 2.00, defaultMarks: 58, css: 'badge-c' },
  'C-': { gp: 1.70, defaultMarks: 55, css: 'badge-c' },
  'D':  { gp: 1.00, defaultMarks: 50, css: 'badge-d' },
  'F':  { gp: 0.00, defaultMarks: 0,  css: 'badge-f' }
};

const STORAGE_KEY = 'PU_GPA_CALCULATOR_DATA_V2';
const TOTAL_SEMESTERS = 8;
const DEFAULT_COURSES_PER_SEM = 5;

// Global State
let appState = {
  activeTab: 1, // 1 to 8
  viewMode: 'tabs', // 'tabs' or 'all'
  semesters: []
};

// Target course reference for Component Calculator
let activeComponentTarget = null; // { semIdx, courseIdx }

// ==========================================================================
// Initialization & State Management
// ==========================================================================

function initApp() {
  loadStateFromStorage();
  renderSemesters();
  renderSemesterPills();
  renderCgpaSemChips();
  updateAllCalculations();
  attachEventListeners();

  // Show welcome modal on first visit (unless user chose "don't show again")
  const hasSeenWelcome = localStorage.getItem('PU_WELCOME_SEEN');
  const modalWelcome = document.getElementById('modalWelcome');
  if (!hasSeenWelcome && modalWelcome) {
    // Small delay so the page renders first
    setTimeout(() => modalWelcome.classList.add('active'), 600);
  }

  // Restore quickstart banner hidden state
  const quickstartBanner = document.getElementById('quickstartBanner');
  if (quickstartBanner && localStorage.getItem('PU_QUICKSTART_HIDDEN')) {
    quickstartBanner.classList.add('hidden');
  }
}

function getDefaultSemester(semNum) {
  const courses = [];
  for (let i = 1; i <= DEFAULT_COURSES_PER_SEM; i++) {
    courses.push({
      code: '',
      credits: 3,
      mode: 'marks', // 'marks' or 'grade'
      rawMarks: '',
      grade: 'A',
      gp: 4.00
    });
  }
  return {
    semNumber: semNum,
    included: semNum === 1, // default include sem 1
    courses: courses
  };
}

function loadStateFromStorage() {
  // Always start with a clean blank slate.
  // Data is NOT auto-restored on page load — user must re-enter marks each session.
  // This prevents old PU Example data or previous sessions from auto-filling.
  appState.semesters = [];
  for (let s = 1; s <= TOTAL_SEMESTERS; s++) {
    appState.semesters.push(getDefaultSemester(s));
  }
}

function saveStateToStorage() {
  // No-op: data is not persisted between sessions.
  // Each page load starts fresh to avoid stale/example data appearing.
}

// ==========================================================================
// PU Official Calculations Engine
// ==========================================================================

/**
 * PU Ceiling Rule:
 * "A fraction of marks in a course is to be counted as '1' mark e.g. 64.1 or 64.9 is to be shown as 65."
 */
function roundPUMarks(raw) {
  if (raw === '' || raw === null || raw === undefined) return null;
  const num = parseFloat(raw);
  if (isNaN(num)) return null;
  if (num <= 0) return 0;
  return Math.min(100, Math.ceil(num));
}

function getGradeDataFromMarks(roundedMarks) {
  if (roundedMarks === null || isNaN(roundedMarks)) {
    return { grade: '-', gp: 0.0, css: '' };
  }
  for (const entry of PU_GRADE_SCALE) {
    if (roundedMarks >= entry.min) {
      return { grade: entry.grade, gp: entry.gp, css: entry.css };
    }
  }
  return { grade: 'F', gp: 0.00, css: 'badge-f' };
}

/**
 * Calculate stats for a single semester
 */
function calculateSemesterStats(semester) {
  let totalCredits = 0;
  let totalWeightedGP = 0;
  let totalWeightedMarks = 0;
  let evaluatedCourses = 0;
  let fCount = 0;
  let dCount = 0;

  semester.courses.forEach(course => {
    const credits = parseFloat(course.credits) || 0;
    if (credits <= 0) return;

    let gp = 0;
    let marks = 0;

    if (course.mode === 'marks') {
      const rounded = roundPUMarks(course.rawMarks);
      if (rounded !== null) {
        evaluatedCourses++;
        const gradeInfo = getGradeDataFromMarks(rounded);
        gp = gradeInfo.gp;
        marks = rounded;
        if (gradeInfo.grade === 'F') fCount++;
        if (gradeInfo.grade === 'D') dCount++;

        totalCredits += credits;
        totalWeightedGP += (credits * gp);
        totalWeightedMarks += (credits * marks);
      }
    } else {
      if (course.grade && GRADE_TO_GP_MAP[course.grade]) {
        evaluatedCourses++;
        const gradeInfo = GRADE_TO_GP_MAP[course.grade];
        gp = gradeInfo.gp;
        marks = gradeInfo.defaultMarks;
        if (course.grade === 'F') fCount++;
        if (course.grade === 'D') dCount++;

        totalCredits += credits;
        totalWeightedGP += (credits * gp);
        totalWeightedMarks += (credits * marks);
      }
    }
  });

  const gpa = totalCredits > 0 ? (totalWeightedGP / totalCredits) : 0;
  const opm = totalCredits > 0 ? (totalWeightedMarks / totalCredits) : 0;

  return {
    totalCredits,
    totalWeightedGP,
    totalWeightedMarks,
    gpa,
    opm,
    evaluatedCourses,
    fCount,
    dCount
  };
}

/**
 * PU Academic Standing Logic (Sections 12 & 13)
 */
function getAcademicStanding(semNumber, semesterGPA, cumulativeCGPA, totalCreditsEvaluated, probationsBefore = 0) {
  if (totalCreditsEvaluated === 0) {
    return {
      status: 'pending',
      badgeText: 'Ready for input',
      badgeClass: '',
      detailText: 'Enter course marks or grades to compute promotion status.'
    };
  }

  // 1st Semester rules (Section 12.1)
  if (semNumber === 1) {
    if (semesterGPA >= 2.00) {
      return {
        status: 'promoted',
        badgeText: 'Promoted (Good Standing)',
        badgeClass: 'status-promoted',
        detailText: 'Clear for promotion to Semester 2 (GPA ≥ 2.00).'
      };
    } else if (semesterGPA >= 1.50) {
      return {
        status: 'probation',
        badgeText: 'Promoted on 1st Probation',
        badgeClass: 'status-probation',
        detailText: 'Warning: 1.50 ≤ GPA < 2.00. Must achieve ≥ 2.00 CGPA in next semester.'
      };
    } else {
      return {
        status: 'dropped',
        badgeText: 'Dropped from Rolls',
        badgeClass: 'status-drop',
        detailText: 'Section 12.2: GPA < 1.50 in 1st semester. Automatically dropped.'
      };
    }
  }

  // 2nd Semester onwards rules (Section 12.2 & Section 13)
  if (cumulativeCGPA >= 2.00) {
    if (semNumber === 8) {
      return {
        status: 'degree',
        badgeText: 'Degree Requirements Met',
        badgeClass: 'status-degree',
        detailText: 'CGPA ≥ 2.00. Meets requirement for degree award!'
      };
    }
    return {
      status: 'promoted',
      badgeText: 'Promoted (Good Standing)',
      badgeClass: 'status-promoted',
      detailText: `CGPA ≥ 2.00 (${cumulativeCGPA.toFixed(2)}). Promoted to next semester.`
    };
  } else if (cumulativeCGPA >= 1.70) {
    const probationNum = probationsBefore + 1;
    if (probationNum > 2) {
      return {
        status: 'dropped',
        badgeText: 'Dropped from Rolls',
        badgeClass: 'status-drop',
        detailText: 'Section 13: Exceeded maximum 2 probations without achieving 2.00 CGPA.'
      };
    } else if (probationNum === 2) {
      return {
        status: 'probation',
        badgeText: '2nd Probation (Last Chance)',
        badgeClass: 'status-probation',
        detailText: 'Caution: 2nd and last probation allowed. Must reach ≥ 2.00 CGPA next semester.'
      };
    } else {
      return {
        status: 'probation',
        badgeText: 'Promoted on 1st Probation',
        badgeClass: 'status-probation',
        detailText: '1.70 ≤ CGPA < 2.00. Promoted on probation. Max 2 probations allowed.'
      };
    }
  } else {
    return {
      status: 'dropped',
      badgeText: 'Dropped from Rolls',
      badgeClass: 'status-drop',
      detailText: 'Section 12.2: CGPA < 1.70. Automatically dropped from rolls.'
    };
  }
}

// ==========================================================================
// Rendering: Semesters, Courses, & Navigation
// ==========================================================================

function renderSemesterPills() {
  const pillsContainer = document.getElementById('semesterPills');
  if (!pillsContainer) return;

  pillsContainer.innerHTML = '';
  appState.semesters.forEach((sem, idx) => {
    const semNum = idx + 1;
    const stats = calculateSemesterStats(sem);

    const btn = document.createElement('button');
    btn.className = `sem-pill-btn ${appState.activeTab === semNum ? 'active' : ''}`;
    btn.setAttribute('data-sem', semNum);

    btn.innerHTML = `
      <span>Sem ${semNum}</span>
      <span class="sem-pill-gpa">${stats.evaluatedCourses > 0 ? stats.gpa.toFixed(2) : '-'}</span>
    `;

    btn.addEventListener('click', () => {
      setActiveTab(semNum);
    });

    pillsContainer.appendChild(btn);
  });
}

function renderCgpaSemChips() {
  const container = document.getElementById('cgpaSemChips');
  if (!container) return;

  container.innerHTML = '';
  appState.semesters.forEach((sem, idx) => {
    const semNum = idx + 1;
    const chip = document.createElement('label');
    chip.className = `sem-chip ${sem.included ? 'active' : ''}`;
    chip.innerHTML = `
      <input type="checkbox" data-sem-idx="${idx}" ${sem.included ? 'checked' : ''}>
      <span>Sem ${semNum}</span>
      ${sem.included ? '<i class="fa-solid fa-check" style="font-size:0.65rem;"></i>' : ''}
    `;

    chip.addEventListener('click', (e) => {
      e.preventDefault();
      sem.included = !sem.included;
      saveStateToStorage();
      renderCgpaSemChips();
      syncSemesterCardCheckboxes();
      updateAllCalculations();
    });

    container.appendChild(chip);
  });
}

function syncSemesterCardCheckboxes() {
  appState.semesters.forEach((sem, idx) => {
    const cardChk = document.getElementById(`semIncludeCheck_${idx}`);
    if (cardChk) {
      cardChk.checked = sem.included;
    }
  });
}

function setActiveTab(semNum) {
  appState.activeTab = semNum;
  renderSemesterPills();

  if (appState.viewMode === 'tabs') {
    appState.semesters.forEach((_, idx) => {
      const card = document.getElementById(`semesterCard_${idx}`);
      if (card) {
        card.style.display = (idx + 1 === semNum) ? 'block' : 'none';
      }
    });
  }

  // Immediately refresh the hero GPA card to reflect this active semester
  updateAllCalculations();
}

function renderSemesters() {
  const container = document.getElementById('semestersContainer');
  if (!container) return;

  container.innerHTML = '';

  appState.semesters.forEach((sem, semIdx) => {
    const semNum = semIdx + 1;
    const card = document.createElement('div');
    card.className = 'semester-card';
    card.id = `semesterCard_${semIdx}`;

    if (appState.viewMode === 'tabs' && semNum !== appState.activeTab) {
      card.style.display = 'none';
    }

    card.innerHTML = `
      <div class="semester-header">
        <div class="sem-title-group">
          <label class="sem-include-label" title="Check to include this semester in overall CGPA">
            <input type="checkbox" class="sem-include-check" id="semIncludeCheck_${semIdx}" ${sem.included ? 'checked' : ''}>
            <span>Include in CGPA</span>
          </label>
          <h3 class="sem-heading">Semester ${semNum} Courses</h3>
        </div>
        <div class="sem-quick-metrics">
          <div class="metric-pill">
            <span>GPA:</span> <strong id="semGPA_${semIdx}">0.00</strong>
          </div>
          <div class="metric-pill">
            <span>OPM:</span> <strong id="semOPM_${semIdx}">0.00%</strong>
          </div>
          <div class="metric-pill">
            <span>Credits:</span> <strong id="semCredits_${semIdx}">0</strong>
          </div>
        </div>
      </div>

      <div class="courses-wrapper">
        <div class="course-grid-header">
          <div>Course Title / Code (Optional)</div>
          <div>Credits</div>
          <div>Marks / Grade Entry</div>
          <div style="text-align: center;">PU Marks</div>
          <div style="text-align: center;">Grade</div>
          <div style="text-align: center;">GP</div>
          <div style="text-align: center;">Points</div>
          <div style="text-align: center;">Del</div>
        </div>
        <div class="courses-list" id="courseList_${semIdx}">
          <!-- Courses rendered dynamically -->
        </div>
      </div>

      <div class="semester-footer">
        <div class="sem-actions">
          <button class="btn-add-course" id="btnAddCourse_${semIdx}">
            <i class="fa-solid fa-plus"></i> Add Course
          </button>
          <button class="btn-sm" id="btnClearSem_${semIdx}" title="Clear all grades in this semester">
            <i class="fa-solid fa-eraser"></i> Clear
          </button>
        </div>
        <div class="sem-summary-stats">
          <div class="sem-summary-item">Courses: <strong id="semCoursesCount_${semIdx}">0</strong></div>
          <div class="sem-summary-item">Total Points: <strong id="semTotalGP_${semIdx}">0.00</strong></div>
          <div class="sem-summary-item">Standing: <span id="semStatusSummary_${semIdx}">Pending</span></div>
        </div>
      </div>
    `;

    container.appendChild(card);
    renderCoursesForSemester(semIdx);

    // Event listeners
    const semChk = card.querySelector(`#semIncludeCheck_${semIdx}`);
    semChk.addEventListener('change', () => {
      sem.included = semChk.checked;
      saveStateToStorage();
      renderCgpaSemChips();
      renderSemesterPills();
      updateAllCalculations();
    });

    const btnAddCourse = card.querySelector(`#btnAddCourse_${semIdx}`);
    btnAddCourse.addEventListener('click', () => {
      sem.courses.push({
        code: '',
        credits: 3,
        mode: 'marks',
        rawMarks: '',
        grade: 'A',
        gp: 4.00
      });
      saveStateToStorage();
      renderCoursesForSemester(semIdx);
      updateAllCalculations();
    });

    const btnClearSem = card.querySelector(`#btnClearSem_${semIdx}`);
    btnClearSem.addEventListener('click', () => {
      if (confirm(`Clear all entered marks/grades for Semester ${semNum}?`)) {
        sem.courses.forEach(c => {
          c.rawMarks = '';
          c.code = '';
        });
        saveStateToStorage();
        renderCoursesForSemester(semIdx);
        updateAllCalculations();
      }
    });
  });
}

function renderCoursesForSemester(semIdx) {
  const container = document.getElementById(`courseList_${semIdx}`);
  if (!container) return;

  const sem = appState.semesters[semIdx];
  container.innerHTML = '';

  sem.courses.forEach((course, courseIdx) => {
    const row = document.createElement('div');
    row.className = 'course-row';
    row.id = `courseRow_${semIdx}_${courseIdx}`;

    const credits = parseFloat(course.credits) || 0;
    const roundedMarks = roundPUMarks(course.rawMarks);
    let gradeData;
    let effectiveMarks = 0;

    if (course.mode === 'marks') {
      gradeData = getGradeDataFromMarks(roundedMarks);
      effectiveMarks = roundedMarks !== null ? roundedMarks : '-';
    } else {
      gradeData = GRADE_TO_GP_MAP[course.grade] || { gp: 0.0, defaultMarks: 0, css: 'badge-f' };
      gradeData.grade = course.grade;
      effectiveMarks = gradeData.defaultMarks;
    }

    const gp = roundedMarks !== null || course.mode === 'grade' ? gradeData.gp : 0;
    const weightedGP = (credits * gp).toFixed(2);

    let repeatBadge = '';
    if (gradeData.grade === 'F') {
      repeatBadge = '<span class="badge-repeat-req" title="F grade mandatory repeat">Repeat (F)</span>';
    } else if (gradeData.grade === 'D') {
      repeatBadge = '<span class="badge-imp-req" title="D grade repeat if CGPA < 2.00">Improve (&lt;2.0)</span>';
    }

    // Modern hybrid layout: Desktop grid cells + Mobile layout wrapper
    row.innerHTML = `
      <!-- Desktop Column 1 / Mobile Top -->
      <div class="col-course-title">
        <input type="text" class="input-course-code" placeholder="Course ${courseIdx + 1} (Optional)" value="${course.code || ''}">
      </div>

      <!-- Desktop Column 2 / Mobile Credits -->
      <div class="col-course-credits">
        <select class="select-credits">
          <option value="1" ${credits === 1 ? 'selected' : ''}>1 CH</option>
          <option value="2" ${credits === 2 ? 'selected' : ''}>2 CH</option>
          <option value="3" ${credits === 3 ? 'selected' : ''}>3 CH</option>
          <option value="4" ${credits === 4 ? 'selected' : ''}>4 CH</option>
          <option value="5" ${credits === 5 ? 'selected' : ''}>5 CH</option>
          <option value="6" ${credits === 6 ? 'selected' : ''}>6 CH</option>
        </select>
      </div>

      <!-- Desktop Column 3 / Mobile Marks/Grade Entry -->
      <div class="col-course-entry">
        ${course.mode === 'marks' ? `
          <div class="input-marks-container">
            <input type="number" step="0.1" min="0" max="100" class="input-marks" placeholder="0 - 100" value="${course.rawMarks}">
            <button class="btn-open-comp" title="Open Mid/Assignment/Final Marks Calculator" data-sem="${semIdx}" data-course="${courseIdx}">
              <i class="fa-solid fa-calculator"></i>
            </button>
          </div>
          <span class="input-mode-toggle" data-action="switch-to-grade">Or select Grade</span>
        ` : `
          <div class="input-marks-container">
            <select class="select-grade">
              <option value="A" ${course.grade === 'A' ? 'selected' : ''}>A (85%+, 4.00)</option>
              <option value="A-" ${course.grade === 'A-' ? 'selected' : ''}>A- (80-84%, 3.70)</option>
              <option value="B+" ${course.grade === 'B+' ? 'selected' : ''}>B+ (75-79%, 3.30)</option>
              <option value="B" ${course.grade === 'B' ? 'selected' : ''}>B (70-74%, 3.00)</option>
              <option value="B-" ${course.grade === 'B-' ? 'selected' : ''}>B- (65-69%, 2.70)</option>
              <option value="C+" ${course.grade === 'C+' ? 'selected' : ''}>C+ (61-64%, 2.30)</option>
              <option value="C" ${course.grade === 'C' ? 'selected' : ''}>C (58-60%, 2.00)</option>
              <option value="C-" ${course.grade === 'C-' ? 'selected' : ''}>C- (55-57%, 1.70)</option>
              <option value="D" ${course.grade === 'D' ? 'selected' : ''}>D (50-54%, 1.00)</option>
              <option value="F" ${course.grade === 'F' ? 'selected' : ''}>F (&lt;50%, 0.00)</option>
            </select>
          </div>
          <span class="input-mode-toggle" data-action="switch-to-marks">Or enter Marks</span>
        `}
      </div>

      <!-- Desktop Column 4: PU Marks -->
      <div class="rounded-marks-cell" id="cellMarks_${semIdx}_${courseIdx}">
        ${course.rawMarks !== '' || course.mode === 'grade' ? effectiveMarks : '-'}
      </div>

      <!-- Desktop Column 5: Grade -->
      <div style="text-align: center;">
        <span class="badge-grade ${gradeData.css || ''}" id="cellGrade_${semIdx}_${courseIdx}">
          ${course.rawMarks !== '' || course.mode === 'grade' ? gradeData.grade : '-'}
        </span>
        <div id="cellRepeat_${semIdx}_${courseIdx}">${repeatBadge}</div>
      </div>

      <!-- Desktop Column 6: GP -->
      <div class="gp-cell" id="cellGP_${semIdx}_${courseIdx}">
        ${course.rawMarks !== '' || course.mode === 'grade' ? gp.toFixed(2) : '-'}
      </div>

      <!-- Desktop Column 7: Weighted GP -->
      <div class="weighted-gp-cell" id="cellWeightedGP_${semIdx}_${courseIdx}">
        ${course.rawMarks !== '' || course.mode === 'grade' ? weightedGP : '-'}
      </div>

      <!-- Desktop Column 8: Action -->
      <div style="text-align: center;">
        <button class="btn-remove-course" title="Remove Course" data-sem="${semIdx}" data-course="${courseIdx}">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </div>
    `;

    // Event Listeners
    const codeInput = row.querySelector('.input-course-code');
    codeInput.addEventListener('input', (e) => {
      course.code = e.target.value;
      saveStateToStorage();
    });

    const creditSelect = row.querySelector('.select-credits');
    creditSelect.addEventListener('change', (e) => {
      course.credits = parseFloat(e.target.value);
      saveStateToStorage();
      updateAllCalculations();
      renderCoursesForSemester(semIdx);
    });

    if (course.mode === 'marks') {
      const marksInput = row.querySelector('.input-marks');
      marksInput.addEventListener('input', (e) => {
        course.rawMarks = e.target.value;
        saveStateToStorage();
        updateRowDisplay(semIdx, courseIdx);
        updateAllCalculations();
      });

      const btnComp = row.querySelector('.btn-open-comp');
      btnComp.addEventListener('click', () => {
        openComponentModal(semIdx, courseIdx);
      });

      const switchToggle = row.querySelector('[data-action="switch-to-grade"]');
      switchToggle.addEventListener('click', () => {
        course.mode = 'grade';
        saveStateToStorage();
        renderCoursesForSemester(semIdx);
        updateAllCalculations();
      });
    } else {
      const gradeSelect = row.querySelector('.select-grade');
      gradeSelect.addEventListener('change', (e) => {
        course.grade = e.target.value;
        course.gp = GRADE_TO_GP_MAP[course.grade].gp;
        saveStateToStorage();
        updateRowDisplay(semIdx, courseIdx);
        updateAllCalculations();
      });

      const switchToggle = row.querySelector('[data-action="switch-to-marks"]');
      switchToggle.addEventListener('click', () => {
        course.mode = 'marks';
        saveStateToStorage();
        renderCoursesForSemester(semIdx);
        updateAllCalculations();
      });
    }

    const btnRemove = row.querySelector('.btn-remove-course');
    btnRemove.addEventListener('click', () => {
      if (sem.courses.length <= 1) {
        alert('A semester must have at least one course.');
        return;
      }
      sem.courses.splice(courseIdx, 1);
      saveStateToStorage();
      renderCoursesForSemester(semIdx);
      updateAllCalculations();
    });

    container.appendChild(row);
  });
}

function updateRowDisplay(semIdx, courseIdx) {
  const course = appState.semesters[semIdx].courses[courseIdx];
  const credits = parseFloat(course.credits) || 0;
  const roundedMarks = roundPUMarks(course.rawMarks);

  let gradeData;
  let effectiveMarks = 0;

  if (course.mode === 'marks') {
    gradeData = getGradeDataFromMarks(roundedMarks);
    effectiveMarks = roundedMarks !== null ? roundedMarks : '-';
  } else {
    gradeData = GRADE_TO_GP_MAP[course.grade] || { gp: 0.0, defaultMarks: 0, css: 'badge-f' };
    gradeData.grade = course.grade;
    effectiveMarks = gradeData.defaultMarks;
  }

  const gp = roundedMarks !== null || course.mode === 'grade' ? gradeData.gp : 0;
  const weightedGP = (credits * gp).toFixed(2);

  const cellMarks = document.getElementById(`cellMarks_${semIdx}_${courseIdx}`);
  const cellGrade = document.getElementById(`cellGrade_${semIdx}_${courseIdx}`);
  const cellGP = document.getElementById(`cellGP_${semIdx}_${courseIdx}`);
  const cellWeightedGP = document.getElementById(`cellWeightedGP_${semIdx}_${courseIdx}`);
  const cellRepeat = document.getElementById(`cellRepeat_${semIdx}_${courseIdx}`);

  if (cellMarks) cellMarks.textContent = (course.rawMarks !== '' || course.mode === 'grade') ? effectiveMarks : '-';
  if (cellGrade) {
    cellGrade.textContent = (course.rawMarks !== '' || course.mode === 'grade') ? gradeData.grade : '-';
    cellGrade.className = `badge-grade ${gradeData.css || ''}`;
  }
  if (cellGP) cellGP.textContent = (course.rawMarks !== '' || course.mode === 'grade') ? gp.toFixed(2) : '-';
  if (cellWeightedGP) cellWeightedGP.textContent = (course.rawMarks !== '' || course.mode === 'grade') ? weightedGP : '-';
  
  if (cellRepeat) {
    if (gradeData.grade === 'F') {
      cellRepeat.innerHTML = '<span class="badge-repeat-req">Repeat (F)</span>';
    } else if (gradeData.grade === 'D') {
      cellRepeat.innerHTML = '<span class="badge-imp-req">Improve (&lt;2.0)</span>';
    } else {
      cellRepeat.innerHTML = '';
    }
  }
}

// ==========================================================================
// Full Cumulative & Semester Calculations
// ==========================================================================

function updateAllCalculations() {
  let overallCredits = 0;
  let overallWeightedGP = 0;
  let overallWeightedMarks = 0;
  let activeSemesterCount = 0;
  let cumulativeProbationCount = 0;

  // Active semester for Hero GPA Card
  const activeSemIdx = appState.activeTab - 1;
  let activeSemStats = null;

  // Compute stats for each semester
  appState.semesters.forEach((sem, idx) => {
    const semNum = idx + 1;
    const stats = calculateSemesterStats(sem);

    if (idx === activeSemIdx) {
      activeSemStats = stats;
    }

    const semGPAEl = document.getElementById(`semGPA_${idx}`);
    const semOPMEl = document.getElementById(`semOPM_${idx}`);
    const semCreditsEl = document.getElementById(`semCredits_${idx}`);
    const semCoursesCountEl = document.getElementById(`semCoursesCount_${idx}`);
    const semTotalGPEl = document.getElementById(`semTotalGP_${idx}`);
    const semStatusSummaryEl = document.getElementById(`semStatusSummary_${idx}`);

    if (semGPAEl) semGPAEl.textContent = stats.evaluatedCourses > 0 ? stats.gpa.toFixed(2) : '0.00';
    if (semOPMEl) semOPMEl.textContent = stats.evaluatedCourses > 0 ? stats.opm.toFixed(2) + '%' : '0.00%';
    if (semCreditsEl) semCreditsEl.textContent = stats.totalCredits;
    if (semCoursesCountEl) semCoursesCountEl.textContent = sem.courses.length;
    if (semTotalGPEl) semTotalGPEl.textContent = stats.totalWeightedGP.toFixed(2);

    // Standing for this semester
    const semStanding = getAcademicStanding(semNum, stats.gpa, stats.gpa, stats.totalCredits, cumulativeProbationCount);
    if (stats.evaluatedCourses > 0 && stats.gpa < 2.00 && stats.gpa >= 1.50) {
      cumulativeProbationCount++;
    }

    if (semStatusSummaryEl) {
      if (stats.fCount > 0) {
        semStatusSummaryEl.innerHTML = `<span style="color:#b91c1c; font-weight:800;">${stats.fCount} Fail(s)</span>`;
      } else if (stats.evaluatedCourses > 0) {
        semStatusSummaryEl.innerHTML = semStanding.badgeText;
      } else {
        semStatusSummaryEl.textContent = 'Pending';
      }
    }

    // Cumulative summation for checked semesters
    if (sem.included && stats.totalCredits > 0) {
      activeSemesterCount++;
      overallCredits += stats.totalCredits;
      overallWeightedGP += stats.totalWeightedGP;
      overallWeightedMarks += stats.totalWeightedMarks;
    }
  });

  // --- UPDATE CARD 1: SEMESTER GPA CARD ---
  const heroSemTitle = document.getElementById('heroSemTitle');
  const heroSemGPA = document.getElementById('heroSemGPA');
  const heroSemOPM = document.getElementById('heroSemOPM');
  const heroSemCredits = document.getElementById('heroSemCredits');
  const heroSemTotalGP = document.getElementById('heroSemTotalGP');
  const heroSemCourses = document.getElementById('heroSemCourses');
  const heroSemStandingBadge = document.getElementById('heroSemStandingBadge');
  const heroSemStandingText = document.getElementById('heroSemStandingText');
  const heroSemStandingDetail = document.getElementById('heroSemStandingDetail');

  if (heroSemTitle) heroSemTitle.textContent = `Semester ${appState.activeTab}`;

  if (activeSemStats) {
    if (heroSemGPA) heroSemGPA.textContent = activeSemStats.evaluatedCourses > 0 ? activeSemStats.gpa.toFixed(2) : '0.00';
    if (heroSemOPM) heroSemOPM.textContent = activeSemStats.evaluatedCourses > 0 ? activeSemStats.opm.toFixed(2) + '%' : '0.00%';
    if (heroSemCredits) heroSemCredits.textContent = `${activeSemStats.totalCredits} CH`;
    if (heroSemTotalGP) heroSemTotalGP.textContent = activeSemStats.totalWeightedGP.toFixed(2);
    if (heroSemCourses) heroSemCourses.textContent = `${activeSemStats.evaluatedCourses} / ${appState.semesters[activeSemIdx].courses.length}`;

    const activeStanding = getAcademicStanding(
      appState.activeTab,
      activeSemStats.gpa,
      activeSemStats.gpa,
      activeSemStats.totalCredits
    );

    if (heroSemStandingBadge && heroSemStandingText) {
      if (activeSemStats.evaluatedCourses === 0) {
        heroSemStandingBadge.className = 'sem-standing-badge';
        heroSemStandingBadge.innerHTML = '<i class="fa-solid fa-circle-info"></i> Ready';
      } else {
        heroSemStandingBadge.className = `sem-standing-badge ${activeStanding.badgeClass}`;
        heroSemStandingBadge.innerHTML = `<i class="fa-solid fa-circle-check"></i> ${activeStanding.badgeText}`;
      }
    }

    if (heroSemStandingDetail) {
      if (activeSemStats.fCount > 0) {
        heroSemStandingDetail.innerHTML = `<strong style="color:#b91c1c;">Mandatory Repeat:</strong> ${activeSemStats.fCount} course(s) with 'F' grade must be repeated with immediate junior session.`;
      } else {
        heroSemStandingDetail.textContent = activeStanding.detailText;
      }
    }
  }

  // --- UPDATE CARD 2: CUMULATIVE CGPA CARD ---
  const finalCGPA = overallCredits > 0 ? (overallWeightedGP / overallCredits) : 0.00;
  const finalOPM = overallCredits > 0 ? (overallWeightedMarks / overallCredits) : 0.00;

  const displayCGPA = document.getElementById('displayCGPA');
  const displayOPM = document.getElementById('displayOPM');
  const displayTotalCredits = document.getElementById('displayTotalCredits');
  const activeSemesterCountText = document.getElementById('activeSemesterCountText');
  const cgpaBarFill = document.getElementById('cgpaBarFill');
  const displayStandingText = document.getElementById('displayStandingText');

  if (displayCGPA) displayCGPA.textContent = finalCGPA.toFixed(2);
  if (displayOPM) displayOPM.textContent = finalOPM.toFixed(2) + '%';
  if (displayTotalCredits) displayTotalCredits.textContent = `${overallCredits} CH`;
  if (activeSemesterCountText) {
    activeSemesterCountText.textContent = `${activeSemesterCount} Semester${activeSemesterCount === 1 ? '' : 's'} Included`;
  }

  if (cgpaBarFill) {
    const pct = Math.min(100, Math.max(0, (finalCGPA / 4.00) * 100));
    cgpaBarFill.style.width = `${pct}%`;
  }

  // Cumulative Academic Standing
  const overallStanding = getAcademicStanding(
    activeSemesterCount || 1,
    finalCGPA,
    finalCGPA,
    overallCredits,
    Math.max(0, cumulativeProbationCount - 1)
  );

  if (displayStandingText) {
    if (overallCredits === 0) {
      displayStandingText.textContent = 'Ready for input';
    } else {
      displayStandingText.textContent = overallStanding.badgeText;
    }
  }

  renderSemesterPills();
}

// ==========================================================================
// Event Listeners & Modals
// ==========================================================================

function attachEventListeners() {
  // View Toggle buttons
  const btnViewTabs = document.getElementById('btnViewTabs');
  const btnViewAll = document.getElementById('btnViewAll');
  if (btnViewTabs && btnViewAll) {
    btnViewTabs.addEventListener('click', () => {
      appState.viewMode = 'tabs';
      btnViewTabs.classList.add('active');
      btnViewAll.classList.remove('active');
      setActiveTab(appState.activeTab);
    });

    btnViewAll.addEventListener('click', () => {
      appState.viewMode = 'all';
      btnViewAll.classList.add('active');
      btnViewTabs.classList.remove('active');
      appState.semesters.forEach((_, idx) => {
        const card = document.getElementById(`semesterCard_${idx}`);
        if (card) card.style.display = 'block';
      });
    });
  }

  // Quick Select Semesters in CGPA Card
  const btnSelectAll = document.getElementById('btnSelectAllSemesters');
  if (btnSelectAll) {
    btnSelectAll.addEventListener('click', () => {
      appState.semesters.forEach(s => s.included = true);
      saveStateToStorage();
      renderCgpaSemChips();
      syncSemesterCardCheckboxes();
      renderSemesterPills();
      updateAllCalculations();
    });
  }

  const btnClearSelected = document.getElementById('btnClearSelectedSemesters');
  if (btnClearSelected) {
    btnClearSelected.addEventListener('click', () => {
      appState.semesters.forEach(s => s.included = false);
      saveStateToStorage();
      renderCgpaSemChips();
      syncSemesterCardCheckboxes();
      renderSemesterPills();
      updateAllCalculations();
    });
  }

  // PU Rules Modal
  const btnRulesModal = document.getElementById('btnRulesModal');
  const modalRules = document.getElementById('modalRules');
  const btnCloseRulesModal = document.getElementById('btnCloseRulesModal');
  const btnUnderstandRules = document.getElementById('btnUnderstandRules');

  if (btnRulesModal && modalRules) {
    btnRulesModal.addEventListener('click', () => modalRules.classList.add('active'));
    if (btnCloseRulesModal) btnCloseRulesModal.addEventListener('click', () => modalRules.classList.remove('active'));
    if (btnUnderstandRules) btnUnderstandRules.addEventListener('click', () => modalRules.classList.remove('active'));
    modalRules.addEventListener('click', (e) => {
      if (e.target === modalRules) modalRules.classList.remove('active');
    });
  }

  // Load PU Official Example
  const btnLoadExample = document.getElementById('btnLoadExample');
  if (btnLoadExample) {
    btnLoadExample.addEventListener('click', () => {
      if (confirm('Load official Punjab University statute example (Semesters 1 & 2)? Current inputs will be replaced.')) {
        loadPUOfficialExample();
      }
    });
  }

  // Reset All
  const btnResetAll = document.getElementById('btnResetAll');
  if (btnResetAll) {
    btnResetAll.addEventListener('click', () => {
      if (confirm('Are you sure you want to reset all semesters? All entered marks will be cleared.')) {
        localStorage.removeItem(STORAGE_KEY);
        loadStateFromStorage();
        renderSemesters();
        renderSemesterPills();
        renderCgpaSemChips();
        updateAllCalculations();
      }
    });
  }

  // Print Report
  const btnPrintReport = document.getElementById('btnPrintReport');
  if (btnPrintReport) {
    btnPrintReport.addEventListener('click', () => {
      prepareAndTriggerPrint();
    });
  }

  // Component Calculator Modal
  const modalComp = document.getElementById('modalComponentHelper');
  const btnCloseComp = document.getElementById('btnCloseComponentModal');
  const btnCancelComp = document.getElementById('btnCancelComponent');
  const btnApplyComp = document.getElementById('btnApplyComponent');

  const compMid = document.getElementById('compMidMarks');
  const compAssignment = document.getElementById('compAssignmentMarks');
  const compFinal = document.getElementById('compFinalMarks');

  [compMid, compAssignment, compFinal].forEach(inp => {
    if (inp) {
      inp.addEventListener('input', updateComponentCalculatorPreview);
    }
  });

  if (btnCloseComp) btnCloseComp.addEventListener('click', () => modalComp.classList.remove('active'));
  if (btnCancelComp) btnCancelComp.addEventListener('click', () => modalComp.classList.remove('active'));
  if (btnApplyComp) {
    btnApplyComp.addEventListener('click', () => {
      if (activeComponentTarget) {
        const rounded = updateComponentCalculatorPreview();
        const { semIdx, courseIdx } = activeComponentTarget;
        const course = appState.semesters[semIdx].courses[courseIdx];
        course.mode = 'marks';
        course.rawMarks = rounded.toString();
        saveStateToStorage();
        renderCoursesForSemester(semIdx);
        updateAllCalculations();
      }
      modalComp.classList.remove('active');
    });
  }

  // Target Planner Modal
  const btnTargetPlanner = document.getElementById('btnTargetPlanner');
  const modalTarget = document.getElementById('modalTargetPlanner');
  const btnCloseTarget = document.getElementById('btnCloseTargetModal');
  const btnCancelTarget = document.getElementById('btnCancelTarget');
  const btnCalculateTarget = document.getElementById('btnCalculateTarget');

  if (btnTargetPlanner && modalTarget) {
    btnTargetPlanner.addEventListener('click', openTargetModal);
    if (btnCloseTarget) btnCloseTarget.addEventListener('click', () => modalTarget.classList.remove('active'));
    if (btnCancelTarget) btnCancelTarget.addEventListener('click', () => modalTarget.classList.remove('active'));
    if (btnCalculateTarget) btnCalculateTarget.addEventListener('click', calculateTargetGPA);
  }

  // Welcome / How-to-Use Modal
  const modalWelcome = document.getElementById('modalWelcome');
  const btnCloseWelcome = document.getElementById('btnCloseWelcome');
  const btnStartCalculating = document.getElementById('btnStartCalculating');
  const chkDontShow = document.getElementById('chkDontShowWelcome');
  const btnHowToUse = document.getElementById('btnHowToUse');

  function closeWelcomeModal() {
    if (modalWelcome) modalWelcome.classList.remove('active');
    if (chkDontShow && chkDontShow.checked) {
      localStorage.setItem('PU_WELCOME_SEEN', '1');
    }
  }

  if (btnCloseWelcome) btnCloseWelcome.addEventListener('click', closeWelcomeModal);
  if (btnStartCalculating) btnStartCalculating.addEventListener('click', closeWelcomeModal);
  if (modalWelcome) {
    modalWelcome.addEventListener('click', (e) => {
      if (e.target === modalWelcome) closeWelcomeModal();
    });
  }

  // How to Use button always opens welcome guide
  if (btnHowToUse && modalWelcome) {
    btnHowToUse.addEventListener('click', () => {
      if (chkDontShow) chkDontShow.checked = false;
      modalWelcome.classList.add('active');
    });
  }

  // Quickstart Banner dismiss
  const btnCloseQuickstart = document.getElementById('btnCloseQuickstart');
  const quickstartBanner = document.getElementById('quickstartBanner');
  if (btnCloseQuickstart && quickstartBanner) {
    btnCloseQuickstart.addEventListener('click', () => {
      quickstartBanner.classList.add('hidden');
      localStorage.setItem('PU_QUICKSTART_HIDDEN', '1');
    });
  }
}

// Component Modal Helpers
function openComponentModal(semIdx, courseIdx) {
  activeComponentTarget = { semIdx, courseIdx };
  const modal = document.getElementById('modalComponentHelper');

  document.getElementById('compMidMarks').value = '';
  document.getElementById('compAssignmentMarks').value = '';
  document.getElementById('compFinalMarks').value = '';

  updateComponentCalculatorPreview();
  modal.classList.add('active');
}

function updateComponentCalculatorPreview() {
  const mid = parseFloat(document.getElementById('compMidMarks').value) || 0;
  const sessional = parseFloat(document.getElementById('compAssignmentMarks').value) || 0;
  const finalMarks = parseFloat(document.getElementById('compFinalMarks').value) || 0;

  const rawTotal = mid + sessional + finalMarks;
  const rounded = Math.min(100, Math.ceil(rawTotal));
  const gradeData = getGradeDataFromMarks(rounded);

  document.getElementById('compRawTotal').textContent = rawTotal.toFixed(1);
  document.getElementById('compRoundedTotal').textContent = rounded;
  document.getElementById('compGradePreview').innerHTML = `
    <span class="badge-grade ${gradeData.css}">${gradeData.grade} (${gradeData.gp.toFixed(2)})</span>
  `;

  return rounded;
}

// Target CGPA Modal Helpers
function openTargetModal() {
  const modal = document.getElementById('modalTargetPlanner');
  let currentCredits = 0;
  let currentWeightedGP = 0;

  appState.semesters.forEach(s => {
    if (s.included) {
      const stats = calculateSemesterStats(s);
      currentCredits += stats.totalCredits;
      currentWeightedGP += stats.totalWeightedGP;
    }
  });

  const currentCGPA = currentCredits > 0 ? (currentWeightedGP / currentCredits) : 0;

  document.getElementById('targetCurrentCredits').value = currentCredits;
  document.getElementById('targetCurrentCGPA').value = currentCGPA.toFixed(2);
  document.getElementById('targetGoalCGPA').value = '';
  document.getElementById('targetUpcomingCredits').value = '18';
  document.getElementById('targetResultCard').style.display = 'none';

  modal.classList.add('active');
}

function calculateTargetGPA() {
  const curCredits = parseFloat(document.getElementById('targetCurrentCredits').value) || 0;
  const curCGPA = parseFloat(document.getElementById('targetCurrentCGPA').value) || 0;
  const targetCGPA = parseFloat(document.getElementById('targetGoalCGPA').value);
  const upCredits = parseFloat(document.getElementById('targetUpcomingCredits').value) || 0;

  if (isNaN(targetCGPA) || targetCGPA < 2.00 || targetCGPA > 4.00) {
    alert('Please enter a target CGPA between 2.00 and 4.00');
    return;
  }
  if (upCredits <= 0) {
    alert('Please enter positive upcoming credit hours.');
    return;
  }

  const currentWeightedGP = curCredits * curCGPA;
  const totalFutureCredits = curCredits + upCredits;
  const totalRequiredGP = targetCGPA * totalFutureCredits;
  const neededGP = totalRequiredGP - currentWeightedGP;
  const requiredGPA = neededGP / upCredits;

  const resultCard = document.getElementById('targetResultCard');
  const reqGPAEl = document.getElementById('targetRequiredGPA');
  const statusEl = document.getElementById('targetStatusText');

  resultCard.style.display = 'block';
  reqGPAEl.textContent = requiredGPA.toFixed(2);

  if (requiredGPA > 4.00) {
    reqGPAEl.style.color = '#dc2626';
    resultCard.style.borderColor = '#fca5a5';
    resultCard.style.background = '#fef2f2';
    statusEl.innerHTML = `<strong>Mathematically Unattainable:</strong> Requires ${requiredGPA.toFixed(2)} GPA (Maximum possible GPA is 4.00).`;
  } else if (requiredGPA <= 0) {
    reqGPAEl.style.color = '#15803d';
    resultCard.style.borderColor = '#86efac';
    resultCard.style.background = '#f0fdf4';
    statusEl.innerHTML = `Target already secured even with 0.00 GPA!`;
  } else {
    reqGPAEl.style.color = '#15803d';
    resultCard.style.borderColor = '#86efac';
    resultCard.style.background = '#f0fdf4';
    statusEl.innerHTML = `Achievable! Maintain an average semester GPA of <strong>${requiredGPA.toFixed(2)}</strong> across the next ${upCredits} credit hours.`;
  }
}

// ==========================================================================
// Official PU Example Loader
// ==========================================================================

function loadPUOfficialExample() {
  appState.semesters = [];
  for (let s = 1; s <= TOTAL_SEMESTERS; s++) {
    appState.semesters.push(getDefaultSemester(s));
  }

  // Example Semester 1 from PU statute:
  appState.semesters[0].included = true;
  appState.semesters[0].courses = [
    { code: 'Course 103', credits: 3, mode: 'marks', rawMarks: '67', grade: 'B-', gp: 2.70 },
    { code: 'Course 107', credits: 3, mode: 'marks', rawMarks: '98', grade: 'A',  gp: 4.00 },
    { code: 'Course 105', credits: 3, mode: 'marks', rawMarks: '76', grade: 'B+', gp: 3.30 },
    { code: 'Course 102', credits: 3, mode: 'marks', rawMarks: '89', grade: 'A',  gp: 4.00 },
    { code: 'Course 108', credits: 4, mode: 'marks', rawMarks: '60', grade: 'C',  gp: 2.00 }
  ];

  // Example Semester 2 from PU statute:
  appState.semesters[1].included = true;
  appState.semesters[1].courses = [
    { code: 'Course 201', credits: 3, mode: 'marks', rawMarks: '55', grade: 'C-', gp: 1.70 },
    { code: 'Course 202', credits: 3, mode: 'marks', rawMarks: '63', grade: 'C+', gp: 2.30 },
    { code: 'Course 206', credits: 3, mode: 'marks', rawMarks: '78', grade: 'B+', gp: 3.30 },
    { code: 'Course 207', credits: 2, mode: 'marks', rawMarks: '65', grade: 'B-', gp: 2.70 },
    { code: 'Course 205', credits: 4, mode: 'marks', rawMarks: '85', grade: 'A',  gp: 4.00 }
  ];

  for (let s = 2; s < TOTAL_SEMESTERS; s++) {
    appState.semesters[s].included = false;
  }

  saveStateToStorage();
  renderSemesters();
  renderSemesterPills();
  renderCgpaSemChips();
  updateAllCalculations();
}

// ==========================================================================
// Print Transcript Preparation
// ==========================================================================

function prepareAndTriggerPrint() {
  const container = document.getElementById('printTranscript');
  if (!container) { window.print(); return; }

  let totalCredits = 0;
  let totalWeightedGP = 0;
  let semHtml = '';

  appState.semesters.forEach((sem, idx) => {
    const stats = calculateSemesterStats(sem);
    if (stats.evaluatedCourses === 0) return;

    if (sem.included) {
      totalCredits += stats.totalCredits;
      totalWeightedGP += stats.totalWeightedGP;
    }

    // Build course rows - only show courses with entered marks/grades
    const rows = sem.courses.map((c, cIdx) => {
      const cr = parseFloat(c.credits) || 0;
      if (cr <= 0) return '';
      const rnd = roundPUMarks(c.rawMarks);
      if (c.mode === 'marks' && rnd === null) return '';
      const g = c.mode === 'marks' ? getGradeDataFromMarks(rnd) : GRADE_TO_GP_MAP[c.grade];
      const effectiveM = c.mode === 'marks' ? rnd : (g ? g.defaultMarks : '-');
      const gp = g ? g.gp : 0;
      const wgp = (cr * gp).toFixed(2);
      const name = c.code && c.code.trim() ? c.code : `Subject ${cIdx + 1}`;
      return `
        <tr>
          <td style="border:1px solid #cbd5e1;padding:8px 12px;text-align:left;">${name}</td>
          <td style="border:1px solid #cbd5e1;padding:8px 12px;text-align:center;">${cr}</td>
          <td style="border:1px solid #cbd5e1;padding:8px 12px;text-align:center;">${effectiveM}</td>
          <td style="border:1px solid #cbd5e1;padding:8px 12px;text-align:center;font-weight:700;">${g ? g.grade : '-'}</td>
          <td style="border:1px solid #cbd5e1;padding:8px 12px;text-align:center;">${gp.toFixed(2)}</td>
          <td style="border:1px solid #cbd5e1;padding:8px 12px;text-align:center;">${wgp}</td>
        </tr>`;
    }).join('');

    semHtml += `
      <div style="margin-bottom:24px;page-break-inside:avoid;">
        <div style="background:#08284d;color:#ffffff;padding:8px 14px;border-radius:4px 4px 0 0;display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:12pt;font-weight:700;">Semester ${idx + 1}</span>
          <span style="font-size:12pt;font-weight:700;">GPA: ${stats.gpa.toFixed(2)}</span>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:10.5pt;">
          <thead>
            <tr style="background:#f1f5f9;">
              <th style="border:1px solid #cbd5e1;padding:8px 12px;text-align:left;">Subject</th>
              <th style="border:1px solid #cbd5e1;padding:8px 12px;text-align:center;">Credits</th>
              <th style="border:1px solid #cbd5e1;padding:8px 12px;text-align:center;">Marks</th>
              <th style="border:1px solid #cbd5e1;padding:8px 12px;text-align:center;">Grade</th>
              <th style="border:1px solid #cbd5e1;padding:8px 12px;text-align:center;">GP</th>
              <th style="border:1px solid #cbd5e1;padding:8px 12px;text-align:center;">Weighted GP</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  });

  const finalCGPA = totalCredits > 0 ? (totalWeightedGP / totalCredits).toFixed(2) : '0.00';

  container.innerHTML = `
    <div style="font-family:Arial,sans-serif;padding:24px;max-width:850px;margin:0 auto;color:#0f172a;">
      <h2 style="text-align:center;color:#08284d;margin:0 0 20px;font-size:16pt;border-bottom:2.5px solid #08284d;padding-bottom:10px;">
        GPA &amp; CGPA Result Sheet
      </h2>

      ${semHtml || '<p style="text-align:center;color:#64748b;padding:30px;">No marks entered yet. Please enter your marks in the calculator first.</p>'}

      <div style="margin-top:20px;border-top:2.5px solid #08284d;padding-top:12px;text-align:right;">
        <span style="font-size:18pt;font-weight:800;color:#08284d;">CGPA: ${finalCGPA}</span>
      </div>
    </div>`;

  window.print();
}


// Run on page load
document.addEventListener('DOMContentLoaded', initApp);
