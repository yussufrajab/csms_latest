# USER ACCEPTANCE TEST (UAT) DOCUMENT

## Civil Service Management System (CSMS) — Tume Ya Utumishi Serikalini

| Document Information | |
|---|---|
| **System Name** | Civil Service Management System (CSMS) |
| **Domain** | https://csms.zanajira.go.tz |
| **Document Type** | User Acceptance Test (UAT) |
| **Prepared For** | TUME YA UTUMISHI SERIKALINI |
| **Version** | 1.1 |
| **Date** | June 2026 |

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Test Environment & Test Data](#2-test-environment--test-data)
3. [Module 1: Authentication & Security](#3-module-1-authentication--security)
4. [Module 2: Dashboard](#4-module-2-dashboard)
5. [Module 3: Employee Management](#5-module-3-employee-management)
6. [Module 4: Request Management (HR Workflows)](#6-module-4-request-management-hr-workflows)
7. [Module 5: Complaints Management](#7-module-5-complaints-management)
8. [Module 6: User & Access Management (Admin)](#8-module-6-user--access-management-admin)
9. [Module 7: Institution Management](#9-module-7-institution-management)
10. [Module 8: HRIMS Integration & Data Sync](#10-module-8-hrims-integration--data-sync)
11. [Module 9: Reports & Analytics](#11-module-9-reports--analytics)
12. [Module 10: Notifications](#12-module-10-notifications)
13. [Module 11: File Upload & Document Management](#13-module-11-file-upload--document-management)
14. [Module 12: Profile Management](#14-module-12-profile-management)
15. [Module 13: Security Features](#15-module-13-security-features)
16. [Overall System Tests](#16-overall-system-tests)
17. [Test Summary & Sign-Off](#17-test-summary--sign-off)

---

## 1. Introduction

### 1.1 Purpose

This document outlines the User Acceptance Testing (UAT) plan for the Civil Service Management System (CSMS). The purpose of UAT is to verify that the system meets the business requirements and is ready for production use. Each functional area is tested with real-world scenarios to ensure the system behaves as expected.

### 1.2 Scope

This UAT covers all functional modules of the CSMS including authentication, employee management, HR request workflows, complaints management, reports, admin functions, HRIMS integration, and security features.

### 1.3 Roles and Responsibilities

| Role | User | Responsibility |
|------|------|---------------|
| **Tester / HRO** | Various HRO accounts | Test institution-level HR operations, request submission |
| **Tester / HRRP** | khamadi | Test intermediate review and approval of requests |
| **Tester / HHRMD** | skhamis | Test commission-level oversight and approvals |
| **Tester / HRMO** | fiddi | Test commission-level processing |
| **Tester / DO** | mussi | Test disciplinary officer workflows |
| **Tester / CSCS** | zhaji | Test high-level oversight and final approvals |
| **Tester / ADMIN** | akassim | Test system administration and configuration |
| **Tester / EMPLOYEE** | alijuma, khadijanassor, yussufmakame | Test self-service features |
| **Tester / PO** | mishak | Test read-only reports access |

### 1.4 Instructions for Testers

1. Perform each test case in the order specified.
2. Mark each test as **PASS** or **FAIL**.
3. For any FAIL result, document the actual result and any relevant screenshots/notes in the "Remarks" column.
4. Report critical failures immediately to the development team.
5. Use the test credentials provided. Do not modify user passwords unless testing password-related features.

### 1.5 Abbreviations

| Abbreviation | Meaning |
|--------------|---------|
| HRO | Human Resource Officer |
| HRRP | Human Resource Responsible Personnel |
| HHRMD | Head of HR Management Department |
| HRMO | Human Resource Management Officer |
| DO | Disciplinary Officer |
| CSCS | Civil Service Commission Secretary |
| PO | Planning Officer |
| ADMIN | System Administrator |

---

## 2. Test Environment & Test Data

### 2.1 Test Environment

| Component | Value |
|-----------|-------|
| **Application URL** | https://csms.zanajira.go.tz |
| **Browser(s)** | Chrome (latest), Firefox (latest), Edge (latest) |
| **Screen Resolution** | Desktop (1920x1080), Tablet (768x1024), Mobile (375x812) |
| **Network** | Production network |
| **Database** | PostgreSQL (nody) |
| **File Storage** | MinIO (S3-compatible) |
| **Queue** | BullMQ + Redis |

### 2.2 Test Credentials

**Admin Users:**

| Username | Name | Role | Institution |
|----------|------|------|-------------|
| akassim | Amina Kassim | ADMIN | TUME YA UTUMISHI SERIKALINI |
| zhaji | Zaituni Haji | CSCS | TUME YA UTUMISHI SERIKALINI |
| skhamis | Safia Khamis | HHRMD | TUME YA UTUMISHI SERIKALINI |
| fiddi | Fauzia Iddi | HRMO | TUME YA UTUMISHI SERIKALINI |
| mussi | Maimuna Ussi | DO | TUME YA UTUMISHI SERIKALINI |
| mishak | Mwanakombo Is-hak | PO | TUME YA UTUMISHI SERIKALINI |
| khamadi | Khamis Hamadi | HRRP | TUME YA UTUMISHI SERIKALINI |
| hro_commission | HRO (Tume) | HRO | TUME YA UTUMISHI SERIKALINI |

**Institution HROs:**

| Username | Name | Role | Institution |
|----------|------|------|-------------|
| kmnyonge | Khamis Mnyonge | HRO | OFISI YA RAIS, FEDHA NA MIPANGO |
| ahmedm | Ahmed Mohammed | HRO | WIZARA YA ELIMU NA MAFUNZO YA AMALI |
| mariamj | Mariam Juma | HRO | WIZARA YA AFYA |

**Employee Users:**

| Username | Name | Role | Institution |
|----------|------|------|-------------|
| alijuma | Ali Juma | EMPLOYEE | OFISI YA RAIS, FEDHA NA MIPANGO |
| khadijanassor | Khadija Nassor | EMPLOYEE | WIZARA YA ELIMU NA MAFUNZO YA AMALI |
| yussufmakame | Yussuf Makame | EMPLOYEE | WIZARA YA ELIMU NA MAFUNZO YA AMALI |

All test users default password: **password123**

### 2.3 Test Status Definitions

| Status | Description |
|--------|-------------|
| **PASS** | Test executed successfully, actual result matches expected result |
| **FAIL** | Test executed, actual result DOES NOT match expected result |
| **N/A** | Test not applicable in current environment/setup |
| **SKIP** | Test skipped due to dependency on a failing test or external factor |
| **BLOCKED** | Test cannot be executed due to a defect in a pre-requisite |

---

## 3. Module 1: Authentication & Security

### 3.1 Staff Login

| TC-ID | Test Case | Precondition | Steps | Expected Result | Status | Remarks |
|-------|-----------|-------------|-------|-----------------|--------|---------|
| **AUTH-01** | Verify staff login page loads | User not logged in | 1. Navigate to https://csms.zanajira.go.tz/login | Login page displays with username and password fields, a "Login" button, and a link to employee login | | |
| **AUTH-02** | Verify successful login with valid HRO credentials | User not logged in | 1. Navigate to login page<br>2. Enter username: **kmnyonge**<br>3. Enter password: **password123**<br>4. Click "Login" | User is redirected to the dashboard. User name "Khamis Mnyonge" is displayed in the header. | | |
| **AUTH-03** | Verify successful login with Admin credentials | User not logged in | 1. Login with username: **akassim**, password: **password123** | Admin is redirected to dashboard with Admin role displayed and all admin menu items visible in sidebar | | |
| **AUTH-04** | Verify login with invalid username | User not logged in | 1. Enter invalid username: **nonexistent**<br>2. Enter any password<br>3. Click "Login" | Error message displayed: invalid credentials. No redirect occurs. | | |
| **AUTH-05** | Verify login with invalid password | User not logged in | 1. Enter valid username: **kmnyonge**<br>2. Enter invalid password: **wrongpassword**<br>3. Click "Login" | Error message displayed: invalid credentials. No redirect occurs. | | |
| **AUTH-06** | Verify login with empty fields | User not logged in | 1. Leave username field empty<br>2. Leave password field empty<br>3. Click "Login" | Validation error displayed: both fields are required. Form is not submitted. | | |
| **AUTH-07** | Verify rate limiting on login attempts | User not logged in | 1. Attempt login with wrong password 6+ times within 1 minute | After 5 failed attempts, rate limit kicks in (429 error). User sees rate limit error message. | | |

### 3.2 Employee (ZanID) Login

| TC-ID | Test Case | Precondition | Steps | Expected Result | Status | Remarks |
|-------|-----------|-------------|-------|-----------------|--------|---------|
| **AUTH-08** | Verify employee login page loads | User not logged in | 1. Navigate to https://csms.zanajira.go.tz/employee-login | Employee login page displays with ZanID/username field and password field | | |
| **AUTH-09** | Verify employee login with valid credentials | User not logged in | 1. Navigate to employee login<br>2. Enter username: **alijuma**<br>3. Enter password: **password123**<br>4. Click "Login" | Employee is redirected to dashboard with limited employee menu items visible | | |
| **AUTH-10** | Verify link back to staff login | User on employee login page | 1. Look for link back to staff login | "Staff Login" or "Login as Staff" link is visible and functional | | |

### 3.3 Logout

| TC-ID | Test Case | Precondition | Steps | Expected Result | Status | Remarks |
|-------|-----------|-------------|-------|-----------------|--------|---------|
| **AUTH-11** | Verify logout from any page | User is logged in (any role) | 1. Click on user profile/name in header<br>2. Click "Logout" from dropdown | User is logged out, session is terminated, redirected to login page. Back button does not return to dashboard. | | |

### 3.4 Password Management

| TC-ID | Test Case | Precondition | Steps | Expected Result | Status | Remarks |
|-------|-----------|-------------|-------|-----------------|--------|---------|
| **AUTH-12** | Verify change password flow | User is logged in | 1. Navigate to change password option<br>2. Enter current password: **password123**<br>3. Enter new password: **NewPass@123**<br>4. Confirm new password<br>5. Click "Change Password" | Password is changed successfully. User sees success message. *Note: Reset password to default after test* | | |
| **AUTH-13** | Verify password strength requirement | User is logged in | 1. Try to change password to **weak**<br>2. Try to change password to **12345678**<br>3. Try to change password to **alllowercase** | System rejects weak passwords. Must contain at least: 8 chars, uppercase, lowercase, number, and special character. | | |
| **AUTH-14** | Verify password history enforcement | User is logged in | 1. Change password to **Test@123**<br>2. Immediately change back to a recent password (**password123** or **NewPass@123**) | System prevents reuse of last 3 passwords | | |

### 3.5 Session Management

| TC-ID | Test Case | Precondition | Steps | Expected Result | Status | Remarks |
|-------|-----------|-------------|-------|-----------------|--------|---------|
| **AUTH-15** | Verify session persistence during navigation | User is logged in | 1. Login successfully<br>2. Navigate to 3-4 different pages via sidebar<br>3. Refresh the browser | User remains logged in across all pages and after refresh | | |
| **AUTH-16** | Verify concurrent session limit (3 sessions max) | User has 3 active sessions | 1. Login from Browser 1<br>2. Login from Browser 2<br>3. Login from Browser 3<br>4. Login from Browser 4 (4th session) | Device limit dialog is displayed informing user of session limit. User must terminate another session or cannot proceed. | | |
| **AUTH-17** | Verify session timeout / inactivity | User is logged in | 1. Login and leave session idle for >2 hours | After 2 hours of inactivity, session expires and user is redirected to login page | | |
| **AUTH-18** | Verify session termination on logout | User logged in | 1. Login from Browser 1<br>2. Login from Browser 2<br>3. Logout from Browser 1<br>4. Try to use the session from Browser 1 again | After logout, Browser 1 session is invalid. User cannot navigate without re-logging in. | | |
| **AUTH-19** | Verify active sessions list | User is logged in | 1. Login from multiple browsers/devices<br>2. View active sessions from session management page | All active sessions are listed with device info, IP address, and last activity timestamp | | |
| **AUTH-20** | Verify force logout of specific session | User is logged in with multiple sessions | 1. View active sessions<br>2. Click "Terminate" on one session | Selected session is terminated. Other sessions remain active. | | |

### 3.6 Account Lockout

| TC-ID | Test Case | Precondition | Steps | Expected Result | Status | Remarks |
|-------|-----------|-------------|-------|-----------------|--------|---------|
| **AUTH-21** | Verify 5 failed login attempts lockout | Account unlocked | 1. Attempt login 5 times with wrong password for the same user | After 5 failed attempts, account is locked for 30 minutes. User sees lockout message with remaining time. | | |
| **AUTH-22** | Verify 10+ failed attempts security lockout | Account has been locked before | 1. Attempt 10+ failed logins total | After 10+ failed attempts, account requires admin unlock. User sees message to contact admin. | | |
| **AUTH-23** | Verify admin can unlock account | ADMIN is logged in | 1. Admin navigates to unlock account function<br>2. Select locked user<br>3. Confirm unlock | User account is unlocked. User can now login successfully. | | |
| **AUTH-24** | Verify admin can manually lock account | ADMIN is logged in | 1. Admin navigates to lock account function<br>2. Select active user<br>3. Provide lock reason<br>4. Confirm lock | User account is locked. User cannot login until unlocked by admin. | | |

---

## 4. Module 2: Dashboard

### 4.1 Dashboard Overview (HRO View)

| TC-ID | Test Case | Precondition | Steps | Expected Result | Status | Remarks |
|-------|-----------|-------------|-------|-----------------|--------|---------|
| **DASH-01** | Verify HRO dashboard loads correctly | Logged in as HRO (kmnyonge) | 1. Login as kmnyonge<br>2. Navigate to Dashboard | Dashboard displays with metrics cards and recent activities table | | |
| **DASH-02** | Verify dashboard metric cards display | Logged in as HRO | 1. View dashboard | Metric cards shown: Total Employees, Pending Confirmations, Pending Promotions, Employees on LWOP, Pending Terminations, Pending Cadre Changes, Pending Retirements, Pending Resignations, Pending Service Extensions, Urgent Actions | | |
| **DASH-03** | Verify metric card drill-down navigation | Logged in as HRO | 1. Click on "Total Employees" metric card | Navigates to employee profiles page | | |
| **DASH-04** | Verify metric card drill-down: Pending Confirmations | Logged in as HRO | 1. Click on "Pending Confirmations" card | Navigates to confirmation requests page | | |
| **DASH-05** | Verify recent activities table | Logged in as HRO | 1. View dashboard | Recent activities table shows latest requests with status, employee name, and date | | |

### 4.2 Dashboard Overview (Admin View)

| TC-ID | Test Case | Precondition | Steps | Expected Result | Status | Remarks |
|-------|-----------|-------------|-------|-----------------|--------|---------|
| **DASH-06** | Verify Admin dashboard | Logged in as ADMIN (akassim) | 1. Login as akassim<br>2. View dashboard | Dashboard loads with admin-appropriate metrics and no employee-specific metrics | | |
| **DASH-07** | Verify Employee dashboard | Logged in as EMPLOYEE (alijuma) | 1. Login as alijuma<br>2. View dashboard | Employee dashboard shows limited employee-relevant information | | |

---

## 5. Module 3: Employee Management

### 5.1 View Employee List

| TC-ID | Test Case | Precondition | Steps | Expected Result | Status | Remarks |
|-------|-----------|-------------|-------|-----------------|--------|---------|
| **EMP-01** | Verify employee list loads for HRO | Logged in as HRO (kmnyonge) | 1. Navigate to "Employee Profiles" | List of employees for HRO's institution is displayed with pagination | | |
| **EMP-02** | Verify employee list columns | Logged in as HRO | 1. Navigate to Employee Profiles | Columns: Employee name, ZanID, Department, Cadre, Status, Actions | | |
| **EMP-03** | Verify pagination works | Logged in as HRO | 1. Navigate to Employee Profiles with many employees<br>2. Click "Next" page<br>3. Click "Previous" page | Pagination works correctly, showing correct set of records per page | | |

### 5.2 Search Employees

| TC-ID | Test Case | Precondition | Steps | Expected Result | Status | Remarks |
|-------|-----------|-------------|-------|-----------------|--------|---------|
| **EMP-04** | Verify employee search by name | Logged in as HRO | 1. Navigate to Employee Profiles<br>2. Type employee name (partial or full) in search box<br>3. Click search or press Enter | Employee list filters to show matching results | | |
| **EMP-05** | Verify employee search by ZanID | Logged in as HRO | 1. Search by valid ZanID number | Employee with that ZanID is found and displayed | | |
| **EMP-06** | Verify search with no results | Logged in as HRO | 1. Search for non-existent employee name | "No employees found" message is displayed | | |
| **EMP-07** | Verify clear search resets list | Logged in as HRO | 1. Perform a search<br>2. Clear the search field | Employee list returns to full unfiltered list | | |

### 5.3 View Employee Profile

| TC-ID | Test Case | Precondition | Steps | Expected Result | Status | Remarks |
|-------|-----------|-------------|-------|-----------------|--------|---------|
| **EMP-08** | Verify employee profile details view | Logged in as HRO | 1. Navigate to Employee Profiles<br>2. Click on an employee name or "View" | Employee profile page displays: Personal info (name, ZanID, DOB, gender, contact), Employment info (institution, department, cadre, salary scale, appointment type), Dates (employment date, confirmation date, retirement date), Documents section | | |
| **EMP-09** | Verify employee photo display | Logged in as HRO | 1. Navigate to employee profile | Employee photo is displayed if available, or placeholder/avatar if not | | |
| **EMP-10** | Verify employee certificates section | Logged in as HRO | 1. Navigate to employee profile | Certificates section lists all uploaded certificates with type, name, and download link | | |

### 5.4 Add Employee (Manual Entry)

| TC-ID | Test Case | Precondition | Steps | Expected Result | Status | Remarks |
|-------|-----------|-------------|-------|-----------------|--------|---------|
| **EMP-11** | Verify Add Employee page loads | Logged in as HRO with manual entry permission | 1. Navigate to "Add Employee"<br>2. Verify form fields | Form displays with fields: Name, ZanID, Gender, Date of Birth, Phone, Email, Department, Cadre, Appointment Type, Employment Date, etc. | | |
| **EMP-12** | Verify successful employee creation | Logged in as HRO with permission | 1. Fill all required fields with valid data<br>2. Click "Submit" or "Save" | Employee is created successfully. Success message shown. Employee appears in employee list. | | |
| **EMP-13** | Verify validation on required fields | Logged in as HRO with permission | 1. Click "Submit" with empty required fields | Validation errors shown for all required fields. Form is not submitted. | | |
| **EMP-14** | Verify duplicate ZanID validation | Logged in as HRO with permission | 1. Try to create employee with existing ZanID | Error message: "Employee with this ZanID already exists" | | |

### 5.5 Bulk Upload Employees

| TC-ID | Test Case | Precondition | Steps | Expected Result | Status | Remarks |
|-------|-----------|-------------|-------|-----------------|--------|---------|
| **EMP-15** | Verify bulk upload page loads | Logged in as HRO | 1. Navigate to Bulk Upload<br>2. View page | Page displays with file upload area and template download link for CSV upload | | |
| **EMP-16** | Verify template download | Logged in as HRO | 1. Click "Download Template" link | CSV/XLS template file is downloaded with correct column headers | | |
| **EMP-17** | Verify successful bulk upload with valid CSV | Logged in as HRO | 1. Prepare valid CSV with employee data<br>2. Upload the CSV file<br>3. Submit | Success message shown. Employees are created from the CSV data. Validation report shown (X imported, Y errors). | | |
| **EMP-18** | Verify invalid CSV file rejection | Logged in as HRO | 1. Upload invalid file (wrong format, missing columns)<br>2. Submit | Error message with details of validation failures. No employees are created. | | |
| **EMP-19** | Verify file size validation | Logged in as HRO | 1. Upload CSV file >1MB | File rejected with size limit error message | | |

### 5.6 Employee Documents & Certificates

| TC-ID | Test Case | Precondition | Steps | Expected Result | Status | Remarks |
|-------|-----------|-------------|-------|-----------------|--------|---------|
| **EMP-20** | Verify certificate upload for employee | Logged in as HRO | 1. Navigate to employee profile<br>2. Go to Certificates section<br>3. Click "Upload Certificate"<br>4. Select valid PDF/JPG file<br>5. Fill certificate details (type, name)<br>6. Submit | Certificate is uploaded successfully. Appears in certificates list with download link. | | |
| **EMP-21** | Verify certificate upload file type validation | Logged in as HRO | 1. Try uploading .exe or .bat file as certificate | File is rejected. Error: invalid file type. | | |
| **EMP-22** | Verify certificate upload size limit | Logged in as HRO | 1. Try uploading file >5MB | File rejected with size limit error message (5MB max) | | |
| **EMP-23** | Verify document download | Logged in as HRO | 1. Navigate to employee documents<br>2. Click download on an existing document | File is downloaded successfully | | |
| **EMP-24** | Verify fetching employee documents from HRIMS | Logged in as HRO | 1. Navigate to employee profile<br>2. Click "Fetch from HRIMS" for documents | Documents are fetched from HRIMS and linked to employee profile | | |
| **EMP-25** | Verify fetching employee photo from HRIMS | Logged in as HRO | 1. Navigate to employee profile<br>2. Click "Fetch Photo" from HRIMS | Employee photo is retrieved from HRIMS and displayed on profile | | |

### 5.7 Urgent Actions

| TC-ID | Test Case | Precondition | Steps | Expected Result | Status | Remarks |
|-------|-----------|-------------|-------|-----------------|--------|---------|
| **EMP-26** | Verify urgent actions page loads | Logged in as HRO/HRRP | 1. Navigate to "Urgent Actions" | Page displays: Employees with probation period overdue, Employees nearing retirement date, Paginated list | | |
| **EMP-27** | Verify urgent actions from dashboard | Logged in as HRO | 1. View dashboard | Urgent Actions metric card shows count of pending urgent items | | |

---

## 6. Module 4: Request Management (HR Workflows)

### 6.1 Common Workflow Tests (Applicable to ALL Request Types)

| TC-ID | Test Case | Precondition | Steps | Expected Result | Status | Remarks |
|-------|-----------|-------------|-------|-----------------|--------|---------|
| **REQ-01** | Verify each request type page loads | Logged in as HRO | 1. Navigate to each request type page via sidebar | Each request type page loads with its list of requests (if any) and a submit/new request option | | |
| **REQ-02** | Verify request list displays correct data | Logged in as HRO | 1. Navigate to any request type page | Table/List shows: Employee name, Status, Submission date, Actions (View/Edit) | | |
| **REQ-03** | Verify new request submission form | Logged in as HRO | 1. Click "New Request" or "Submit Request" for any type<br>2. Verify form fields | Form displays with employee selector, required fields specific to the request type, and document upload option | | |
| **REQ-04** | Verify HRO submits request → status = "Pending" | Logged in as HRO | 1. Complete a valid request form<br>2. Submit | Request is created with status "Pending". Request appears in request list. | | |
| **REQ-05** | Verify submitted request visible to HRRP | Logged in as HRRP (khamadi) | 1. Login as khamadi<br>2. Navigate to the same request type | The request submitted by HRO is visible with status "Pending" and review action buttons | | |
| **REQ-06** | Verify HRRP can review and forward request | Logged in as HRRP | 1. Open pending request<br>2. Review details<br>3. Click "Approve" / "Forward to Commission" | Request status changes. HRRP can add comments. Request moves to next stage. | | |
| **REQ-07** | Verify HRRP can reject request with reason | Logged in as HRRP | 1. Open pending request<br>2. Click "Reject"<br>3. Enter rejection reason | Request status changes to "Rejected". HRO sees rejection reason. | | |
| **REQ-08** | Verify commission level (HRMO/HHRMD) can view forwarded request | Logged in as HRMO (fiddi) or HHRMD (skhamis) | 1. Login as commission role<br>2. Navigate to request type | The forwarded request is visible with appropriate review actions | | |
| **REQ-09** | Verify commission can make final decision | Logged in as HRMO/HHRMD | 1. Open forwarded request<br>2. Review all details<br>3. Approve or reject with reason | Final decision is recorded. Request status updates to "Approved" or "Rejected". | | |
| **REQ-10** | Verify request tracking shows current stage | Logged in as any role | 1. Navigate to "Track Status"<br>2. Find the submitted request | Tracking view shows: Current review stage, History of actions (who reviewed, when, decision), Progress indicator | | |
| **REQ-11** | Verify request status visible to original HRO | Logged in as HRO who submitted | 1. Login as HRO<br>2. Navigate to the request type or Track Status | HRO can see current status and review progress of their submitted request | | |

### 6.2 Employee Confirmation

| TC-ID | Test Case | Precondition | Steps | Expected Result | Status | Remarks |
|-------|-----------|-------------|-------|-----------------|--------|---------|
| **CONF-01** | Submit new confirmation request | Logged in as HRO | 1. Navigate to "Employee Confirmation"<br>2. Click "New Confirmation"<br>3. Select eligible employee<br>4. Upload confirmation documents<br>5. Submit | Confirmation request created with "Pending" status | | |
| **CONF-02** | Verify confirmation list page | Logged in as HRO | 1. Navigate to Confirmation page | List of all confirmation requests with status filters | | |

### 6.3 Promotion

| TC-ID | Test Case | Precondition | Steps | Expected Result | Status | Remarks |
|-------|-----------|-------------|-------|-----------------|--------|---------|
| **PRO-01** | Submit new promotion request | Logged in as HRO | 1. Navigate to "Promotion"<br>2. Click "New Promotion"<br>3. Select employee<br>4. Enter proposed cadre, promotion type<br>5. Indicate if studied outside country<br>6. Upload supporting documents<br>7. Submit | Promotion request created | | |
| **PRO-02** | Verify promotion form template download | Logged in as HRO | 1. Navigate to Promotion page<br>2. Click "Download Template" | Promotion form template is downloaded | | |
| **PRO-03** | Verify commission can set final cadre | Logged in as HRMO/HHRMD | 1. Review approved promotion request<br>2. Set "finalCadre" field<br>3. Submit final decision | Promotion is finalized with the final cadre recorded | | |

### 6.4 Leave Without Pay (LWOP)

| TC-ID | Test Case | Precondition | Steps | Expected Result | Status | Remarks |
|-------|-----------|-------------|-------|-----------------|--------|---------|
| **LWOP-01** | Submit new LWOP request | Logged in as HRO | 1. Navigate to "LWOP"<br>2. Click "New LWOP"<br>3. Select employee<br>4. Enter start date, end date, duration, reason<br>5. Upload supporting documents<br>6. Submit | LWOP request created | | |
| **LWOP-02** | Verify LWOP duration validation | Logged in as HRO | 1. Submit LWOP with end date before start date | Validation error: end date must be after start date | | |

### 6.5 Change of Cadre

| TC-ID | Test Case | Precondition | Steps | Expected Result | Status | Remarks |
|-------|-----------|-------------|-------|-----------------|--------|---------|
| **CADRE-01** | Submit new cadre change request | Logged in as HRO | 1. Navigate to "Change of Cadre"<br>2. Click "New Change"<br>3. Select employee<br>4. Enter new cadre, reason, original cadre<br>5. Indicate if studied outside country<br>6. Submit | Cadre change request created | | |
| **CADRE-02** | Verify original cadre auto-populates | Logged in as HRO | 1. Select employee for cadre change | Employee's current cadre auto-populates in "Original Cadre" field | | |

### 6.6 Retirement

| TC-ID | Test Case | Precondition | Steps | Expected Result | Status | Remarks |
|-------|-----------|-------------|-------|-----------------|--------|---------|
| **RET-01** | Submit new retirement request | Logged in as HRO | 1. Navigate to "Retirement"<br>2. Click "New Retirement"<br>3. Select employee<br>4. Enter retirement type, proposed date<br>5. Upload supporting documents<br>6. Submit | Retirement request created | | |
| **RET-02** | Verify retirement by illness option | Logged in as HRO | 1. Create retirement request<br>2. Select "Illness" as retirement type<br>3. Enter illness description | Illness details field is shown and required | | |

### 6.7 Resignation

| TC-ID | Test Case | Precondition | Steps | Expected Result | Status | Remarks |
|-------|-----------|-------------|-------|-----------------|--------|---------|
| **RES-01** | Submit new resignation request | Logged in as HRO | 1. Navigate to "Resignation"<br>2. Click "New Resignation"<br>3. Select employee<br>4. Enter effective date, reason<br>5. Submit | Resignation request created | | |

### 6.8 Service Extension

| TC-ID | Test Case | Precondition | Steps | Expected Result | Status | Remarks |
|-------|-----------|-------------|-------|-----------------|--------|---------|
| **SERVEXT-01** | Submit new service extension request | Logged in as HRO | 1. Navigate to "Service Extension"<br>2. Click "New Extension"<br>3. Select employee<br>4. Enter current retirement date, requested extension period, justification<br>5. Upload supporting documents<br>6. Submit | Service extension request created | | |

### 6.9 Termination & Dismissal

| TC-ID | Test Case | Precondition | Steps | Expected Result | Status | Remarks |
|-------|-----------|-------------|-------|-----------------|--------|---------|
| **TERM-01** | Submit new termination request | Logged in as HRO | 1. Navigate to "Termination and Dismissal"<br>2. Click "New Termination"<br>3. Select employee<br>4. Enter termination type, reason<br>5. Upload supporting documents<br>6. Submit | Termination request created | | |
| **TERM-02** | Verify DO can review termination | Logged in as DO (mussi) | 1. Login as mussi<br>2. Navigate to Termination page | Termination request is visible with review actions for DO | | |
| **TERM-03** | Verify dismissals route through DO workflow | Logged in as DO | 1. Review termination/dismissal request<br>2. Add officer comments<br>3. Forward or reject | DO processes the request before commission review | | |

---

## 7. Module 5: Complaints Management

| TC-ID | Test Case | Precondition | Steps | Expected Result | Status | Remarks |
|-------|-----------|-------------|-------|-----------------|--------|---------|
| **COMP-01** | Verify employee can submit a complaint | Logged in as EMPLOYEE (alijuma) | 1. Login as alijuma<br>2. Navigate to "Complaints"<br>3. Click "New Complaint"<br>4. Select complaint type<br>5. Enter subject, details<br>6. Enter complainant phone, next of kin phone<br>7. Upload attachments<br>8. Submit | Complaint is submitted successfully. Success message displayed. | | |
| **COMP-02** | Verify complaint form validation | Logged in as EMPLOYEE | 1. Submit complaint with empty required fields | Validation errors for required fields | | |
| **COMP-03** | Verify DO can view assigned complaints | Logged in as DO (mussi) | 1. Login as mussi<br>2. Navigate to "Complaints" | List of complaints assigned to DO role is displayed with status | | |
| **COMP-04** | Verify DO can add officer comments | Logged in as DO | 1. Open a complaint<br>2. Add officer comments<br>3. Save | Officer comments are saved and displayed on the complaint | | |
| **COMP-05** | Verify HHRMD can view and process complaints | Logged in as HHRMD (skhamis) | 1. Login as skhamis<br>2. Navigate to "Complaints" | Option to assign DO or process directly. Internal notes can be added. | | |
| **COMP-06** | Verify employee can track their complaint status | Logged in as EMPLOYEE | 1. Navigate to "Track Status" | Employee can see their complaint's current status and any officer responses | | |
| **COMP-07** | Verify complaint attachment upload | Logged in as EMPLOYEE | 1. Submit complaint with PDF/JPG attachment | Attachment is uploaded and accessible in complaint details | | |

---

## 8. Module 6: User & Access Management (Admin)

### 8.1 User Management

| TC-ID | Test Case | Precondition | Steps | Expected Result | Status | Remarks |
|-------|-----------|-------------|-------|-----------------|--------|---------|
| **ADMIN-01** | Verify Admin user list loads | Logged in as ADMIN (akassim) | 1. Navigate to "Admin Management → User Management" | List of all system users displayed: Username, Name, Role, Institution, Active status | | |
| **ADMIN-02** | Verify create new user | Logged in as ADMIN | 1. Click "Add User" or "New User"<br>2. Fill form: username, name, role, institution<br>3. Submit | User is created with a temporary password. User appears in user list. | | |
| **ADMIN-03** | Verify edit existing user | Logged in as ADMIN | 1. Click "Edit" on a user<br>2. Modify name or role<br>3. Save changes | User details are updated. | | |
| **ADMIN-04** | Verify deactivate user | Logged in as ADMIN | 1. Click "Edit" on a user<br>2. Set Active to false<br>3. Save | User is deactivated. User cannot login. | | |
| **ADMIN-05** | Verify admin password reset | Logged in as ADMIN | 1. Select a user<br>2. Click "Reset Password"<br>3. Confirm | User's password is reset to a temporary password. User gets "must change password" prompt on next login. | | |
| **ADMIN-06** | Verify bulk user upload | Logged in as ADMIN | 1. Navigate to bulk user upload<br>2. Upload CSV with user data<br>3. Submit | Multiple users created from CSV. Success/error report displayed. | | |

### 8.2 Audit Trail

| TC-ID | Test Case | Precondition | Steps | Expected Result | Status | Remarks |
|-------|-----------|-------------|-------|-----------------|--------|---------|
| **ADMIN-07** | Verify audit trail loads | Logged in as ADMIN | 1. Navigate to "Admin → Audit Trail" | Audit log table displays: Timestamp, User, Action, Details, IP Address | | |
| **ADMIN-08** | Verify audit log captures login events | Logged in as any user | 1. Login as any user<br>2. Admin checks audit trail | Login event is recorded in audit trail | | |
| **ADMIN-09** | Verify audit log captures request submissions | Any user submits a request | 1. Submit any request type<br>2. Admin checks audit trail | Request submission is logged with details | | |
| **ADMIN-10** | Verify audit log filtering | Logged in as ADMIN | 1. Use date filter<br>2. Use action type filter | Audit log is filtered by selected criteria | | |

### 8.3 Session Cleanup

| TC-ID | Test Case | Precondition | Steps | Expected Result | Status | Remarks |
|-------|-----------|-------------|-------|-----------------|--------|---------|
| **ADMIN-11** | Verify session cleanup page | Logged in as ADMIN | 1. Navigate to "Admin → Session Cleanup" | Page displays with option to clean expired sessions | | |
| **ADMIN-12** | Verify expired sessions cleanup | Logged in as ADMIN | 1. Click "Clean Up Expired Sessions" | Expired sessions are removed. Count of cleaned sessions displayed. | | |

---

## 9. Module 7: Institution Management

| TC-ID | Test Case | Precondition | Steps | Expected Result | Status | Remarks |
|-------|-----------|-------------|-------|-----------------|--------|---------|
| **INST-01** | Verify institution list loads | Logged in as ADMIN | 1. Navigate to "Admin → Institution Management" | List of all 41 institutions displayed with details | | |
| **INST-02** | Verify create new institution | Logged in as ADMIN | 1. Click "Add Institution"<br>2. Fill form: name, email, phone, vote number, TIN<br>3. Submit | New institution is created and appears in the list | | |
| **INST-03** | Verify edit institution | Logged in as ADMIN | 1. Click "Edit" on an institution<br>2. Modify fields<br>3. Save | Institution details are updated | | |
| **INST-04** | Verify HRO/HRRP can view institutions list | Logged in as HRO or HRRP | 1. Navigate to "Institutions" (if permitted) | Institution list is displayed (typically commission roles can view all) | | |
| **INST-05** | Verify manual entry permission settings | Logged in as ADMIN | 1. Edit an institution<br>2. Enable "Manual Entry Enabled"<br>3. Set start/end dates for manual entry period<br>4. Save | Institution is configured for manual employee entry. HRO at that institution can add employees. | | |

---

## 10. Module 8: HRIMS Integration & Data Sync

### 10.1 HRIMS Configuration

| TC-ID | Test Case | Precondition | Steps | Expected Result | Status | Remarks |
|-------|-----------|-------------|-------|-----------------|--------|---------|
| **HRIMS-01** | Verify HRIMS settings page | Logged in as ADMIN | 1. Navigate to "Admin → HRIMS Settings" | Settings page displays: Server IP, Port, Credentials fields. Current values shown. | | |
| **HRIMS-02** | Verify HRIMS settings can be updated | Logged in as ADMIN | 1. Modify HRIMS server settings<br>2. Save | Settings are saved. Confirmation message displayed. | | |
| **HRIMS-03** | Verify HRIMS connectivity test | Logged in as ADMIN | 1. Navigate to "Admin → Test HRIMS"<br>2. Click "Test Connection" | Connection test result is displayed: "Success" or "Failed" with details | | |

### 10.2 Fetch Employee Data

| TC-ID | Test Case | Precondition | Steps | Expected Result | Status | Remarks |
|-------|-----------|-------------|-------|-----------------|--------|---------|
| **HRIMS-04** | Verify fetch single employee from HRIMS | Logged in as HRO | 1. Navigate to employee profile<br>2. Click "Fetch from HRIMS" for employee data | Employee data is retrieved from HRIMS and updated in local database | | |
| **HRIMS-05** | Verify bulk fetch employees by institution | Logged in as ADMIN | 1. Navigate to "Admin → Fetch Data"<br>2. Select institution<br>3. Click "Fetch Employees" | Employees are fetched from HRIMS for the selected institution. Progress shown. | | |
| **HRIMS-06** | Verify bulk fetch documents by institution | Logged in as ADMIN | 1. Navigate to "Admin → Get Documents"<br>2. Select institution<br>3. Click "Fetch Documents" | Documents are fetched from HRIMS for the selected institution. Progress shown. | | |
| **HRIMS-07** | Verify bulk fetch photos by institution | Logged in as ADMIN | 1. Navigate to "Admin → Get Photos"<br>2. Select institution<br>3. Click "Fetch Photos" | Photos are fetched from HRIMS for the selected institution. Progress shown. | | |
| **HRIMS-08** | Verify job status tracking | After initiating any sync job | 1. Note the Job ID from sync initiation<br>2. Navigate to sync status page<br>3. Check job status | Job progress is displayed (e.g., "45/100 employees processed") | | |

---

## 11. Module 9: Reports & Analytics

| TC-ID | Test Case | Precondition | Steps | Expected Result | Status | Remarks |
|-------|-----------|-------------|-------|-----------------|--------|---------|
| **REP-01** | Verify reports page loads | Logged in as HRO, Admin, or PO | 1. Navigate to "Reports" | Reports page displays with available report types and filter options | | |
| **REP-02** | Verify report generation | Logged in as any reporting role | 1. Select report criteria<br>2. Click "Generate" | Report is generated and displayed | | |
| **REP-03** | Verify report export (CSV/PDF) | Logged in as any reporting role | 1. Generate a report<br>2. Click "Export"<br>3. Choose format (CSV or PDF) | Report file is downloaded in selected format | | |
| **REP-04** | Verify PO (read-only) can access reports | Logged in as PO (mishak) | 1. Login as mishak<br>2. "Reports" is the only menu item visible | PO can only see Reports menu. No other menu items visible. | | |
| **REP-05** | Verify reports show data only from user's institution | Logged in as HRO | 1. Generate employee report | Report only includes employees from the HRO's institution | | |

---

## 12. Module 10: Notifications

| TC-ID | Test Case | Precondition | Steps | Expected Result | Status | Remarks |
|-------|-----------|-------------|-------|-----------------|--------|---------|
| **NOTIF-01** | Verify notification bell icon is visible | Logged in as any user | 1. Look at header bar | Bell/c notification icon is visible in the top header | | |
| **NOTIF-02** | Verify notification dropdown | Logged in as any user | 1. Click the notification bell | Dropdown displays recent notifications with: Message, Timestamp, Read/Unread indicator, Link to related item | | |
| **NOTIF-03** | Verify notification for request status change | Request workflow is active | 1. Have HRO submit a request<br>2. Have HRRP review/reject the request | HRO receives notification about the status change | | |
| **NOTIF-04** | Verify notification marks as read | Logged in as any user | 1. Open notifications<br>2. Click on a notification | Notification is marked as read. Unread count decreases. | | |
| **NOTIF-05** | Verify notification count badge | Logged in as any user | 1. Check bell icon | Unread notification count is displayed as a badge on the bell icon | | |
| **NOTIF-06** | Verify welcome notification on login | User logs in for the first time | 1. Login with a new user account | Welcome notification is created automatically | | |

---

## 13. Module 11: File Upload & Document Management

| TC-ID | Test Case | Precondition | Steps | Expected Result | Status | Remarks |
|-------|-----------|-------------|-------|-----------------|--------|---------|
| **FILE-01** | Verify file upload for documents context | Logged in as HRO | 1. Navigate to any upload function with "documents" context<br>2. Select a valid PDF file (<5MB)<br>3. Upload | File is uploaded successfully. File is accessible via generated URL. | | |
| **FILE-02** | Verify file upload for photos context | Logged in as HRO | 1. Navigate to photo upload<br>2. Select a valid JPEG/PNG file (<1MB)<br>3. Upload | Photo is uploaded successfully | | |
| **FILE-03** | Verify file type validation blocks executables | Logged in as any user | 1. Try to upload .exe, .bat, .sh, .php files | All blocked. Error: "File type not allowed" | | |
| **FILE-04** | Verify magic byte validation | Logged in as any user | 1. Rename a .exe file to .pdf<br>2. Try to upload | File is rejected at magic-byte check. Detected as non-PDF despite extension. | | |
| **FILE-05** | Verify file preview (PDF) | Logged in as any user | 1. Locate an uploaded PDF document<br>2. Click "Preview" | PDF is displayed in a preview modal/browser viewer | | |
| **FILE-06** | Verify file preview (Images) | Logged in as any user | 1. Locate an uploaded image<br>2. Click "Preview" | Image is displayed in a preview modal | | |
| **FILE-07** | Verify file download | Logged in as any user | 1. Locate an uploaded file<br>2. Click "Download" | File is downloaded with original filename | | |

---

## 14. Module 12: Profile Management

| TC-ID | Test Case | Precondition | Steps | Expected Result | Status | Remarks |
|-------|-----------|-------------|-------|-----------------|--------|---------|
| **PROF-01** | Verify user can view own profile | Logged in as any user | 1. Click on user profile/name in header<br>2. Navigate to "Profile" | Profile page displays user details: name, username, role, institution, contact info | | |
| **PROF-02** | Verify employee can view their own employee profile | Logged in as EMPLOYEE (alijuma) | 1. Navigate to "Employee Profiles" | Employee sees their own profile with personal and employment details | | |
| **PROF-03** | Verify role display in profile | Logged in as any role | 1. View profile | Current role is displayed correctly | | |

---

## 15. Module 13: Security Features

### 15.1 CSRF Protection

| TC-ID | Test Case | Precondition | Steps | Expected Result | Status | Remarks |
|-------|-----------|-------------|-------|-----------------|--------|---------|
| **SEC-01** | Verify CSRF token on state-changing requests | Logged in | 1. Inspect network requests for POST/PUT operations | CSRF token header is present on state-changing API requests | | |

### 15.2 Rate Limiting

| TC-ID | Test Case | Precondition | Steps | Expected Result | Status | Remarks |
|-------|-----------|-------------|-------|-----------------|--------|---------|
| **SEC-02** | Verify read rate limit (100/min) | Logged in | 1. Rapidly make GET requests (100+) within 1 minute | After 100 read requests, rate limit message (429) is returned | | |
| **SEC-03** | Verify write rate limit (30/min) | Logged in | 1. Rapidly make POST requests (30+) within 1 minute | After 30 write requests, rate limit kicks in | | |

### 15.3 Role-Based Access Control

| TC-ID | Test Case | Precondition | Steps | Expected Result | Status | Remarks |
|-------|-----------|-------------|-------|-----------------|--------|---------|
| **SEC-04** | Verify employee cannot access admin pages | Logged in as EMPLOYEE | 1. Try to navigate to admin URLs directly (e.g., /dashboard/admin/users) | Access denied. Redirect to dashboard or 403 error. | | |
| **SEC-05** | Verify HRO cannot access admin-only APIs | Logged in as HRO | 1. Using browser dev tools, try to call admin API endpoints | 403 Forbidden response | | |
| **SEC-06** | Verify employee can only view own data | Logged in as EMPLOYEE | 1. Try to search for other employees<br>2. Try to view other employee profiles | Employee can only view their own profile and submit complaints | | |
| **SEC-07** | Verify HRO from Institution A cannot access Institution B data | Logged in as HRO (kmnyonge - OFISI YA RAIS) | 1. Try to view employees from WIZARA YA ELIMU | Data scope is limited to HRO's own institution only | | |

---

## 16. Overall System Tests

### 16.1 Navigation

| TC-ID | Test Case | Precondition | Steps | Expected Result | Status | Remarks |
|-------|-----------|-------------|-------|-----------------|--------|---------|
| **NAV-01** | Verify all sidebar menu items visible based on role | Logged in as each role | 1. Login as each role sequentially<br>2. Check sidebar menu items | Menu items match role permissions (see Section 10 of codebase analysis) | | |
| **NAV-02** | Verify sidebar collapse/expand | Logged in as any role | 1. Click toggle/collapse button on sidebar | Sidebar collapses to icon-only view. Click again to expand. | | |
| **NAV-03** | Verify breadcrumb navigation | Logged in as any role | 1. Navigate to a sub-page | Breadcrumb trail shows current location (e.g., Dashboard > Employee Confirmation) | | |
| **NAV-04** | Verify browser back/forward navigation | Logged in as any role | 1. Navigate between pages<br>2. Use browser Back button | Browser navigation works correctly. No duplicate form submissions. | | |

### 16.2 Responsive Design

| TC-ID | Test Case | Precondition | Steps | Expected Result | Status | Remarks |
|-------|-----------|-------------|-------|-----------------|--------|---------|
| **RESP-01** | Verify responsive layout on tablet | Any page | 1. Resize browser to 768x1024 | Layout adapts. Sidebar collapses. Content is readable. | | |
| **RESP-02** | Verify responsive layout on mobile | Any page | 1. Resize browser to 375x812 | Mobile-optimized view. Hamburger menu for navigation. Content reflows appropriately. | | |

### 16.3 Error Handling

| TC-ID | Test Case | Precondition | Steps | Expected Result | Status | Remarks |
|-------|-----------|-------------|-------|-----------------|--------|---------|
| **ERR-01** | Verify 404 page for unknown routes | Any user | 1. Navigate to a non-existent URL | Friendly 404 page is displayed, not a browser error | | |
| **ERR-02** | Verify error state when server is unavailable | Server unavailable | 1. Try to load any page while server is down | Error message displayed: "Unable to connect to server" or similar | | |
| **ERR-03** | Verify form validation messages are clear | Any user | 1. Submit an empty form | Validation messages are displayed near each field in clear language | | |

### 16.4 Performance

| TC-ID | Test Case | Precondition | Steps | Expected Result | Status | Remarks |
|-------|-----------|-------------|-------|-----------------|--------|---------|
| **PERF-01** | Verify page load time under 5 seconds | Logged in as any role | 1. Load the dashboard<br>2. Load employee list<br>3. Load request list | Each page loads within 5 seconds | | |
| **PERF-02** | Verify search response time | Employee data loaded | 1. Search for an employee by name | Search returns results within 3 seconds | | |

---

## 17. Test Summary & Sign-Off

### 17.1 Test Summary Table

| Module | Total Tests | Pass | Fail | N/A | Skip | Blocked | Pass % |
|--------|-------------|------|------|-----|------|---------|--------|
| Module 1: Authentication & Security | | | | | | | |
| Module 2: Dashboard | | | | | | | |
| Module 3: Employee Management | | | | | | | |
| Module 4: Request Management | | | | | | | |
| Module 5: Complaints Management | | | | | | | |
| Module 6: User & Access Management | | | | | | | |
| Module 7: Institution Management | | | | | | | |
| Module 8: HRIMS Integration | | | | | | | |
| Module 9: Reports & Analytics | | | | | | | |
| Module 10: Notifications | | | | | | | |
| Module 11: File Upload & Documents | | | | | | | |
| Module 12: Profile Management | | | | | | | |
| Module 13: Security Features | | | | | | | |
| Overall System Tests | | | | | | | |
| **TOTAL** | **~150** | | | | | | |

### 17.2 Defect Summary

| Defect ID | Module | TC-ID Reference | Description | Severity | Status | Assigned To |
|-----------|--------|-----------------|-------------|----------|--------|-------------|
| | | | | | | |
| | | | | | | |
| | | | | | | |

**Severity Levels:**
- **Critical**: System crash, data loss, security breach, major feature completely broken
- **Major**: Feature partially broken, workaround exists but is cumbersome
- **Minor**: Cosmetic issue, non-functional requirement not met
- **Enhancement**: Suggestion for improvement, not a defect

### 17.3 Sign-Off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| **Tester (HRO)** | | | |
| **Tester (HRRP)** | | | |
| **Tester (HHRMD)** | | | |
| **Tester (HRMO)** | | | |
| **Tester (DO)** | | | |
| **Tester (CSCS)** | | | |
| **Tester (Admin)** | | | |
| **Tester (Employee)** | | | |
| **Project Manager** | | | |
| **Business Owner** | | | |

### 17.4 UAT Approval Decision

| Decision | Select One |
|----------|------------|
| **Approved** — All critical/major defects resolved | |
| **Approved with Conditions** — Non-critical defects remain, timeline for resolution agreed | |
| **Not Approved** — Critical/major defects remain that block production release | |

---

### 17.5 Notes for Testers

1. **Test Data Preparation**: Before starting, ensure you have at least 2-3 employees in your institution for testing requests.
2. **Sequential Testing**: Some tests depend on preconditions from earlier tests (e.g., submitting a request before reviewing it). Follow the order provided.
3. **Password Resets**: After completing password-related tests (AUTH-12 to AUTH-14), reset the test user password back to **password123**.
4. **Browser Sessions**: For session-related tests (AUTH-16 to AUTH-20), use different browser profiles or incognito windows.
5. **HRIMS Connectivity**: Ensure HRIMS server is configured and reachable before testing Module 8.
6. **Reporting Defects**: For each FAIL result, capture:
   - Screenshot of the error/issue
   - Browser console errors (if any)
   - Network request/response details
   - Steps to reproduce

---

*End of UAT Document*

*Prepared for the Civil Service Commission — TUME YA UTUMISHI SERIKALINI*
