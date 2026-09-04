<p align="center">
  <img src="pu_logo.png" width="130" alt="University of the Punjab (PU) Emblem">
</p>

<h1 align="center">University of the Punjab (PU)</h1>
<h3 align="center">Official GPA & CGPA Calculator & Academic Standing Checker</h3>

<p align="center">
  An academic calculator tailored specifically for students and faculty of the <strong>University of the Punjab (PU)</strong>, adhering strictly to official PU Examination Regulations, Grading System, and Promotion/Probation Policies.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Punjab%20University-Examination%20System-0082ba?style=for-the-badge&logo=graduation-cap" alt="PU Standard">
  <img src="https://img.shields.io/badge/Semesters-1%20to%208-08284d?style=for-the-badge" alt="8 Semesters">
  <img src="https://img.shields.io/badge/Max%20GPA-4.00-be855c?style=for-the-badge" alt="4.00 Max">
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License">
</p>

---

## 🌟 Key Features

1. **Strict Compliance with Official PU Rules**:
   - **Ceiling Rounding Rule**: A fraction of marks in a course is counted as 1 mark (e.g. $64.1$ or $64.9 \to 65$, $71.4 \to 72$).
   - **Direct Course-Level CGPA Computation**: Computed as $\frac{\sum (c_i \times GP_i)}{\sum c_i}$ directly across individual courses (as required by PU Statute Rule 9, and not averaged from semester GPAs).
   - **Obtained Percentage Marks (OPM)**: Automatically calculated for each semester and overall degree: $\text{OPM} = \frac{\sum (c_i \times \text{Marks}_i)}{\sum c_i}$.
   - **Course Codes Optional**: Course code / title is optional (`Course 1`, `Course 2`, etc. are assigned automatically).

2. **Full 8-Semester Support & Flexible CGPA**:
   - Calculate individual GPA and OPM for any of the **8 semesters**.
   - Calculate CGPA across **any chosen number of semesters** (select or deselect any semester with 1 click).

3. **Authentic PU Coat of Arms Design**:
   - Styled with colors from the official emblem: **Deep River Navy** (`#08284d`), **5-Rivers Cerulean Blue** (`#0082ba`), **Ribbon Gold/Bronze** (`#be855c`), and **Rising Sun Crimson** (`#c92a2a`).

4. **Dual Input Modes**:
   - **Marks Mode**: Enter percentage marks (0-100) — automatically applies ceiling rounding, determines the official letter grade, and assigns the correct grade points.
   - **Direct Grade Mode**: If percentage marks are not known, select Letter Grade directly from the dropdown.

5. **Component Marks Breakdown Calculator**:
   - Quickly compute Midterm (25%), Sessional/Assignment (15%), and Final (60%) marks with automatic rounding and apply directly to any course.

6. **Official Promotion & Probation Engine (Sections 12 & 13)**:
   - **Semester 1**: $\text{GPA} \ge 2.00$ (Promoted), $1.50 \le \text{GPA} < 2.00$ (1st Probation), $\text{GPA} < 1.50$ (Dropped from rolls).
   - **Semester 2 onwards**: $\text{CGPA} \ge 2.00$ (Promoted / Degree Eligible), $1.70 \le \text{CGPA} < 2.00$ (Probation warning / max 2 probations check), $\text{CGPA} < 1.70$ (Dropped from rolls).
   - **F & D Course Alerts**: Flags mandatory repeats for 'F' grades and improvement advisories for 'D' grades.

7. **Target CGPA Estimator**:
   - Determine what GPA is required in upcoming semesters to achieve your target graduation CGPA.

8. **Official PU Example One-Click Loader**:
   - Instant 1-click button to load the exact 2-semester example from the PU examination statute ($\text{CGPA} = 3.01$, $\text{OPM} = 73.81\%$) to verify calculations.

9. **Print & PDF Transcript Generation**:
   - Formatted printable grade record with university header, crest, student details, and signature lines for official records.

10. **Automatic LocalStorage Save**:
    - All entered courses, grades, and settings persist safely across browser sessions.

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

1. **Direct Open**: Double click on `index.html` in file explorer.
2. **Local Server (Optional)**:
   ```bash
   # Using Python:
   python -m http.server 8080

   # Or using Node:
   npx serve .
   ```
3. Navigate to `http://localhost:8080` in your browser.
