# Punjab University (PU) GPA & CGPA Calculator

An academic GPA & CGPA calculator tailored specifically for students of the **University of the Punjab (PU)**, adhering strictly to official PU Examination Regulations, Grading System, and Promotion/Probation Policies.

---

## 🌟 Key Features

1. **Compliant with Official PU Rules**:
   - **Ceiling Rounding Rule**: A fraction of marks in a course is counted as 1 mark (e.g. $64.1$ or $64.9 \to 65$, $71.4 \to 72$).
   - **Direct CGPA Calculation**: Computed as $\frac{\sum (c_i \times GP_i)}{\sum c_i}$ across all evaluated courses.
   - **Obtained Percentage Marks (OPM)**: Automatically calculated for each semester and overall degree: $\text{OPM} = \frac{\sum (c_i \times \text{Marks}_i)}{\sum c_i}$.
   - **Course Codes Optional**: Course name or code is optional (`Course 1`, `Course 2`, etc. are provided automatically).

2. **Up to 8 Semesters Support**:
   - Calculate each semester's GPA individually.
   - Calculate CGPA across **any chosen number of semesters** (select or deselect any semester with 1 click).

3. **Dual Input Modes**:
   - **Marks Mode**: Enter percentage marks (0-100) — automatically applies ceiling rounding, determines the official letter grade, and assigns the correct grade points.
   - **Direct Grade Mode**: If percentage marks are not known, choose Letter Grade directly from the dropdown.

4. **Component Marks Breakdown Calculator**:
   - Quickly calculate Midterm (25%), Sessional/Assignment (15%), and Final (60%) marks with automatic rounding and apply directly to any course.

5. **Official Promotion & Probation Engine (Sections 12 & 13)**:
   - **Semester 1**: $\text{GPA} \ge 2.00$ (Promoted), $1.50 \le \text{GPA} < 2.00$ (1st Probation), $\text{GPA} < 1.50$ (Dropped).
   - **Semester 2 onwards**: $\text{CGPA} \ge 2.00$ (Promoted / Degree Eligible), $1.70 \le \text{CGPA} < 2.00$ (Probation warning / max 2 probations check), $\text{CGPA} < 1.70$ (Dropped from rolls).
   - **F & D Course Alerts**: Flags mandatory repeats for 'F' grades and improvement advisories for 'D' grades.

6. **Target CGPA Estimator**:
   - Determine what GPA is required in upcoming semesters to achieve your target graduation CGPA.

7. **Official PU Example One-Click Loader**:
   - Instant 1-click button to load the exact 2-semester example from the PU examination statute ($\text{CGPA} = 3.01$, $\text{OPM} = 73.81\%$) to verify formulas.

8. **Print & PDF Transcript Generation**:
   - Clean printable grade record with student details and signature spaces for official university records.

9. **Automatic LocalStorage Save**:
   - Your entered courses, grades, and settings persist safely even if you close or refresh the browser.

---

## 📊 Official Punjab University Grading Scale

| Percent Marks | Letter Grade | Grade Points (GP) | Remarks / Status |
| :--- | :---: | :---: | :--- |
| **85 & above** | **A** | **4.00** | Excellent |
| **80 – 84** | **A-** | **3.70** | Very Good |
| **75 – 79** | **B+** | **3.30** | Good |
| **70 – 74** | **B** | **3.00** | Above Average |
| **65 – 69** | **B-** | **2.70** | Average |
| **61 – 64** | **C+** | **2.30** | Satisfactory |
| **58 – 60** | **C** | **2.00** | Pass |
| **55 – 57** | **C-** | **1.70** | Marginal Pass |
| **50 – 54** | **D** | **1.00** | Low Pass (Repeat if CGPA < 2.00) |
| **Below 50 or Absent** | **F** | **0.00** | Fail (Mandatory Repeat) |

---

## 🚀 How to Run the Calculator

Simply open `index.html` in any modern web browser (Google Chrome, Microsoft Edge, Mozilla Firefox, Safari, etc.):

1. Double click on `index.html` in file explorer, OR
2. Serve via any local server:
   ```bash
   # Using Python:
   python -m http.server 8080

   # Or using Node:
   npx serve .
   ```
3. Open `http://localhost:8080` in your browser.
