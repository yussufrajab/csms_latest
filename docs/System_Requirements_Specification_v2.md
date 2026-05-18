# SYSTEM REQUIREMENTS SPECIFICATION (SRS)

## CIVIL SERVICE MANAGEMENT SYSTEM (CSMS)

---

## Document Control

| Item                   | Details                                                  |
| ---------------------- | -------------------------------------------------------- |
| **Document Title**     | System Requirements Specification (SRS)                  |
| **Project Name**       | Civil Service Management System (CSMS)                   |
| **Project Owner**      | Civil Service Commission, Revolutionary Government of Zanzibar |
| **Version**            | 2.0                                                      |
| **Date Prepared**      | February 2, 2026                                         |
| **Prepared By**        | Systems Analysis and Design Team                         |
| **Document Status**    | Final                                                    |
| **Classification**     | Official - Government of Zanzibar                        |
| **Supersedes**         | System Requirements Specification v1.0                   |

---

## Document Revision History

| Version | Date           | Author               | Description                              |
| ------- | -------------- | -------------------- | ---------------------------------------- |
| 1.0     | Mar 15, 2025   | Business Analyst     | Initial SRS based on requirements gathering |
| 1.1     | Apr 5, 2025    | Systems Analyst      | Updated with design review feedback      |
| 1.2     | May 20, 2025   | Development Team     | Refined based on implementation learnings |
| 1.3     | Aug 10, 2025   | QA Team              | Updated based on UAT findings            |
| 2.0     | Feb 2, 2026    | Systems Analyst      | Comprehensive update reflecting as-built system |

---

## Executive Summary

This System Requirements Specification (SRS) document provides a complete and precise description of the functional and non-functional requirements for the Civil Service Management System (CSMS). This document serves as the definitive reference for system design, development, testing, and validation.

### Purpose of This Document

This SRS serves multiple critical purposes:

**For Development Teams:**
- Definitive specification of all system features and functions
- Detailed input/output specifications for each function
- Data validation rules and business logic
- Error handling and exception scenarios
- API specifications and interface contracts

**For Testing Teams:**
- Testable requirements with specific acceptance criteria
- Expected system behaviors and responses
- Error conditions and boundary cases
- Performance benchmarks and targets
- Security requirements validation criteria

**For Project Management:**
- Scope baseline for change control
- Requirements traceability to business objectives
- Progress tracking and milestone validation
- Risk identification and mitigation

**For Stakeholders:**
- Clear understanding of system capabilities
- Validation that system meets business needs
- Acceptance criteria for deliverables
- User experience expectations

### System Overview

The Civil Service Management System (CSMS) is a comprehensive web-based application that automates human resource management processes for the Revolutionary Government of Zanzibar's Civil Service Commission. The system manages the complete HR lifecycle for 50,000+ civil servants across 41 government institutions.

**Core Capabilities:**
- Digital workflow automation for 8 HR request types
- Employee complaint management with AI enhancement
- Centralized employee data repository with HRIMS integration
- Role-based access control for 9 user types
- Document management and storage
- Real-time reporting and analytics
- Comprehensive audit trail
- Automated notifications and alerts

**Technology Platform:**
- **Frontend:** Next.js 14 with React, Tailwind CSS, Radix UI
- **Backend:** Next.js API routes (RESTful)
- **Database:** PostgreSQL 15 with Prisma ORM
- **Storage:** MinIO (S3-compatible object storage)
- **Background Jobs:** BullMQ with Redis
- **AI:** Google Genkit (Gemini)
- **Deployment:** Ubuntu server with aaPanel, Nginx reverse proxy

**System Boundaries:**
- **In Scope:** HR request workflows, employee management, complaints, reporting, administration
- **Out of Scope:** Payroll processing, recruitment, performance appraisals, regular leave management, training management

### Intended Audience

This document is intended for:
- **System Architects:** Overall system design and technology decisions
- **Software Developers:** Implementation of features and functions
- **Database Administrators:** Database schema and optimization
- **QA Engineers:** Test planning, test case development, validation
- **UI/UX Designers:** User interface design and usability
- **Project Managers:** Planning, tracking, and control
- **Business Analysts:** Requirements validation and traceability
- **DevOps Engineers:** Deployment and infrastructure
- **Technical Writers:** User documentation development
- **Stakeholders:** System acceptance and validation

### Document Conventions

**Requirement Notation:**
- **REQ-[Module]-[Category]-[Number]:** Unique requirement identifier
  - Module: AUTH, DASH, EMP, CONF, PROM, LWOP, CADR, SEXT, RETR, RESN, TERM, COMP, RPT, AUDIT, ADMIN
  - Category: FR (Functional), NFR (Non-Functional), DATA, UI, API, SEC
  - Number: Sequential (001, 002, etc.)
- **Example:** REQ-AUTH-FR-001 (Authentication Module, Functional Requirement #1)

**Priority Levels:**
- **Critical:** Must be implemented; system cannot function without it
- **High:** Important functionality; significant impact if missing
- **Medium:** Desirable functionality; moderate impact
- **Low:** Nice-to-have; minimal impact if deferred

**Requirement Status:**
- **Implemented:** Requirement fully implemented in production
- **Tested:** Requirement implemented and validated through testing
- **Verified:** Requirement validated through UAT and stakeholder acceptance

**Acceptance Criteria Notation:**
- Each requirement includes specific, testable acceptance criteria
- Acceptance criteria define "done" for the requirement
- Format: Given-When-Then or specific validation steps

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Overall Description](#2-overall-description)
3. [System Features](#3-system-features)
4. [External Interface Requirements](#4-external-interface-requirements)
5. [Functional Requirements](#5-functional-requirements)
6. [Non-Functional Requirements](#6-non-functional-requirements)
7. [Data Requirements](#7-data-requirements)
8. [System Quality Attributes](#8-system-quality-attributes)
9. [Appendices](#appendices)

---

## 1. Introduction

### 1.1 Purpose

This System Requirements Specification (SRS) document comprehensively describes the functional and non-functional requirements for the Civil Service Management System (CSMS). The document provides detailed specifications for all system features, capabilities, interfaces, and constraints to guide system design, development, testing, and acceptance.

**Specific Purposes:**

1. **Define System Scope:** Establish clear boundaries of what the system will and will not do
2. **Specify Functionality:** Detail all functional requirements with precise acceptance criteria
3. **Establish Performance Criteria:** Define measurable performance, security, and quality targets
4. **Guide Development:** Provide developers with unambiguous specifications for implementation
5. **Enable Testing:** Give QA teams testable requirements for validation
6. **Support Acceptance:** Provide stakeholders with criteria for system acceptance
7. **Control Changes:** Serve as baseline for change management and scope control
8. **Ensure Traceability:** Link system features to business objectives and use cases

### 1.2 Scope

**Product Name:** Civil Service Management System (CSMS)

**Product Description:**
A comprehensive, web-based HR management platform that digitizes and automates all critical human resource workflows for the Civil Service Commission of Zanzibar, serving 50,000+ employees across 41 government institutions.

**Major Features:**

1. **Authentication & Authorization System**
   - Multi-role user authentication (9 roles)
   - Password policy enforcement
   - Session management
   - Account lockout protection

2. **Employee Information Management**
   - Centralized employee repository (50,000+ records)
   - HRIMS data synchronization
   - Advanced search and filtering
   - Document repository per employee

3. **HR Request Workflow Automation (8 Types)**
   - Employee Confirmation (probation completion)
   - Promotion Requests (education/performance-based)
   - Leave Without Pay (LWOP)
   - Change of Cadre (job category transfer)
   - Service Extension (beyond retirement)
   - Retirement Processing (compulsory/voluntary/illness)
   - Resignation (3-month or 24-hour notice)
   - Termination and Dismissal (disciplinary)

4. **Employee Complaint Management**
   - Self-service complaint submission
   - AI-powered complaint enhancement (Google Genkit)
   - Complaint categorization and routing
   - Resolution tracking and escalation

5. **Document Management**
   - PDF document upload and storage (MinIO)
   - Document preview and download
   - Document association with requests/employees
   - Secure, role-based document access

6. **Reporting and Analytics**
   - 10+ pre-built standard reports
   - Custom report builder
   - Real-time dashboard analytics
   - Export to PDF and Excel

7. **Notification System**
   - Email notifications for workflow events
   - In-app notification center
   - Automated alerts and reminders

8. **Audit Trail and Security**
   - Comprehensive activity logging
   - Immutable audit trail (10-year retention)
   - Security monitoring and alerting
   - Compliance reporting

9. **System Administration**
   - User account management
   - Institution configuration
   - Role assignment
   - System health monitoring

**Benefits:**
- 70-80% reduction in HR request processing time
- 100% elimination of paper-based processes
- Real-time status visibility for all stakeholders
- Data-driven decision-making capabilities
- Enhanced compliance and audit trail
- Improved employee service delivery

**System Boundaries:**

**In Scope:**
- All functionality described in this SRS
- Web-based user interface (responsive design)
- RESTful API for all operations
- PostgreSQL database with 25+ tables
- MinIO object storage for documents
- HRIMS integration (background synchronization)
- Email notification integration
- Comprehensive audit logging

**Out of Scope:**
- Mobile native applications (iOS/Android)
- Payroll calculation and disbursement
- Recruitment and hiring workflows
- Performance appraisal system
- Regular leave management (annual, sick)
- Training and development tracking
- Real-time integrations with TCU, Pension, Payroll (future phases)
- SMS notifications
- Biometric authentication
- Single sign-on (SSO) with government systems

### 1.3 Definitions, Acronyms, and Abbreviations

**Key Terms:**

| Term | Definition |
| --- | --- |
| **Approver** | User authorized to approve HR requests (HHRMD, HRMO, or DO) |
| **Audit Trail** | Immutable log of all user actions and system events |
| **Confirmation** | Process of transitioning employee from probationary to confirmed status |
| **Decision Letter** | Official PDF document uploaded by approver confirming request approval |
| **HRIMS** | HR Information Management System (legacy employee database) |
| **HRO** | HR Officer at institution level who submits requests on behalf of employees |
| **Probation Period** | Initial 12-18 month evaluation period for new employees |
| **Rectification** | Process of correcting and resubmitting a request that was sent back |
| **Review Stage** | Granular workflow stage (Submitted, Under Review, Decision Made) |
| **Send Back** | Action where approver returns request to HRO for corrections |
| **Status** | Request lifecycle state (PENDING, APPROVED, REJECTED, SENT_BACK) |

**Acronyms:**

| Acronym | Full Form |
| --- | --- |
| **ADMIN** | System Administrator |
| **API** | Application Programming Interface |
| **CSC** | Civil Service Commission |
| **CSCS** | Chief Secretary Civil Service |
| **CSMS** | Civil Service Management System |
| **CSRF** | Cross-Site Request Forgery |
| **DO** | Disciplinary Officer |
| **HHRMD** | Head of HR Management Division |
| **HRO** | HR Officer |
| **HRIMS** | HR Information Management System |
| **HRMO** | HR Management Officer |
| **HRRP** | Head of Research and Planning |
| **LWOP** | Leave Without Pay |
| **ORM** | Object-Relational Mapping |
| **PDF** | Portable Document Format |
| **PO** | Planning Officer |
| **RBAC** | Role-Based Access Control |
| **REST** | Representational State Transfer |
| **SRS** | System Requirements Specification |
| **TCU** | Tanzania Commission for Universities |
| **UAT** | User Acceptance Testing |
| **ZanID** | Zanzibar National ID Number |
| **ZSSF** | Zanzibar Social Security Fund Number |

### 1.4 References

**Related Project Documentation:**
1. Business Requirements Document (BRD) v1.0
2. Business Process Document v1.0
3. Concept Note v1.0
4. Inception Report v1.0
5. System Design Document (SDD) v1.0
6. Database Design Document v1.0
7. High-Level Design Document v2.0
8. Low-Level Design Document v1.0
9. Technical Architecture Document v1.0
10. User Manual v1.0
11. Administrator Manual v1.0

**Standards and Regulations:**
- Civil Service Commission Employment Regulations
- E-Government Quality Assurance Standards (E-GAZ)
- Zanzibar Data Protection Guidelines
- ISO/IEC 25010 Software Quality Model

**External Systems:**
- HRIMS Database Schema Documentation
- MinIO S3 API Documentation
- PostgreSQL 15 Documentation
- Next.js 14 Documentation
- Prisma ORM Documentation

### 1.5 Overview

This SRS is organized into the following major sections:

**Section 2: Overall Description**
- Product perspective and system context
- Product functions overview
- User classes and characteristics
- Operating environment
- Design and implementation constraints
- Assumptions and dependencies

**Section 3: System Features**
- High-level overview of all 15 system modules
- Feature relationships and dependencies

**Section 4: External Interface Requirements**
- User interfaces (UI)
- Hardware interfaces
- Software interfaces
- Communication interfaces

**Section 5: Functional Requirements**
- Detailed functional requirements for all 15 modules
- 400+ individual requirements with acceptance criteria
- Organized by module and function

**Section 6: Non-Functional Requirements**
- Performance requirements
- Security requirements
- Reliability and availability
- Usability and accessibility
- Maintainability and supportability
- Compliance and regulatory requirements

**Section 7: Data Requirements**
- Data models and entities
- Data validation rules
- Data retention policies
- Data integrity constraints

**Section 8: System Quality Attributes**
- Testability
- Scalability
- Interoperability
- Recoverability

**Appendices:**
- Use case diagrams
- Data flow diagrams
- State transition diagrams
- Requirements traceability matrix
- Glossary

---

## 2. Overall Description

### 2.1 Product Perspective

The Civil Service Management System (CSMS) is a new, purpose-built system designed to replace manual, paper-based HR processes at the Civil Service Commission of Zanzibar. While CSMS is a standalone system, it operates within an ecosystem of related systems and infrastructure.

#### 2.1.1 System Context Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        External Actors                          │
├─────────────────────────────────────────────────────────────────┤
│  - 41 HROs (Institutional HR Officers)                          │
│  - HHRMD, HRMO, DO (CSC Approvers)                             │
│  - CSCS, PO, HRRP (Oversight/Planning)                         │
│  - ADMIN (System Administrators)                                │
│  - 50,000+ Employees (Complaint Submitters)                     │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTPS (Web Browser)
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CSMS Web Application                         │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              Frontend (Next.js SSR)                       │  │
│  │  - React Components                                       │  │
│  │  - Tailwind CSS + Radix UI                               │  │
│  │  - Role-based Dashboards                                 │  │
│  │  - Forms, Tables, Reports                                │  │
│  └──────────────────────┬────────────────────────────────────┘  │
│                         │ API Calls
│  ┌──────────────────────▼────────────────────────────────────┐  │
│  │           Backend (Next.js API Routes)                    │  │
│  │  - Authentication & Authorization                         │  │
│  │  - Business Logic                                         │  │
│  │  - Workflow Management                                    │  │
│  │  - Data Validation                                        │  │
│  │  - Notification Service                                   │  │
│  └──┬────────┬──────────┬──────────┬──────────┬─────────────┘  │
│     │        │          │          │          │                 │
└─────┼────────┼──────────┼──────────┼──────────┼─────────────────┘
      │        │          │          │          │
      ▼        ▼          ▼          ▼          ▼
┌──────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌──────────────┐
│PostgreSQL│ │ MinIO  │ │ Redis  │ │ Email  │ │ Google       │
│ Database │ │ Object │ │ Queue  │ │ Server │ │ Genkit (AI)  │
│          │ │Storage │ │(BullMQ)│ │(SMTP)  │ │              │
│- Employee│ │        │ │        │ │        │ │- Complaint   │
│- Requests│ │-PDFs   │ │-HRIMS  │ │-Notify │ │  Rewriting   │
│- Users   │ │-Photos │ │ Sync   │ │        │ │              │
│- Audit   │ │-Certs  │ │-Email  │ │        │ │              │
└────┬─────┘ └────────┘ └────────┘ └────────┘ └──────────────┘
     │
     │ Daily Sync (Background Job)
     ▼
┌──────────────────┐
│ HRIMS Database   │
│ (Legacy System)  │
│                  │
│ - Source of      │
│   Truth for      │
│   Employee       │
│   Master Data    │
└──────────────────┘
```

#### 2.1.2 System Interfaces

**1. HRIMS Integration (Legacy System)**
- **Nature:** Read-only data synchronization
- **Direction:** HRIMS → CSMS (one-way)
- **Frequency:** Daily automated sync (background job)
- **Protocol:** Direct database connection or batch file
- **Data:** Employee master data (demographics, employment info)

**2. MinIO Object Storage**
- **Nature:** Document storage and retrieval
- **Protocol:** S3-compatible API
- **Usage:** PDF documents, photos, certificates
- **Operations:** Upload, download, delete, list

**3. Email Server (SMTP)**
- **Nature:** Outbound email notifications
- **Protocol:** SMTP
- **Usage:** Workflow notifications, alerts
- **Operations:** Send email (async via BullMQ)

**4. Google Genkit (AI Service)**
- **Nature:** AI-powered text enhancement
- **Protocol:** API calls
- **Usage:** Complaint text rewriting
- **Operations:** Analyze and suggest improved complaint text

**5. Redis (Message Queue)**
- **Nature:** Background job processing
- **Protocol:** Redis protocol
- **Usage:** HRIMS sync jobs, email jobs, scheduled tasks
- **Operations:** Job queue management

#### 2.1.3 System Dependencies

**Required Infrastructure:**
- Ubuntu Server (Linux OS)
- PostgreSQL 15+ database server
- MinIO object storage server
- Redis server
- SMTP-capable email server
- Internet connectivity
- Nginx reverse proxy
- SSL certificates

**Required External Systems:**
- HRIMS database (for employee data synchronization)

**Optional External Systems (Future):**
- TCU API (qualification verification)
- Pension Authority system (retirement notifications)
- Payroll system (salary adjustments)

### 2.2 Product Functions

The CSMS provides the following major functions:

**F1. User Authentication and Authorization**
- User login with username/password
- Role-based access control (9 roles)
- Password policy enforcement
- Session management
- Account lockout protection

**F2. Employee Information Management**
- View employee profiles (role-filtered)
- Search and filter employees
- View employee documents
- HRIMS data synchronization

**F3. HR Request Workflow Processing**
- Submit HR requests (8 types)
- Automated routing to approvers
- Review and approve/reject/send back requests
- Upload decision letters
- Update employee records upon approval
- Track request status and history

**F4. Complaint Management**
- Employee self-service complaint submission
- AI-powered complaint enhancement
- Complaint review and resolution
- Escalation workflow (DO → HHRMD)

**F5. Document Management**
- Upload PDF documents (requests, approvals)
- Store documents in MinIO
- Preview and download documents
- Role-based document access

**F6. Notification and Communication**
- Email notifications for workflow events
- In-app notification center
- Automated reminders (90-day service extension expiry)

**F7. Reporting and Analytics**
- Standard reports (10+ types)
- Custom report builder
- Dashboard analytics (role-based)
- Export to PDF and Excel

**F8. Audit Trail and Logging**
- Log all user actions
- Immutable audit trail
- Security event monitoring
- Compliance reporting

**F9. System Administration**
- User account management
- Institution configuration
- Role assignment
- System health monitoring
- Password resets
- Account lock/unlock

### 2.3 User Classes and Characteristics

The system supports 9 distinct user classes:

#### User Class 1: Chief Secretary Civil Service (CSCS)
- **Count:** 1 user
- **Technical Expertise:** Medium (executive, minimal hands-on system use)
- **Frequency of Use:** Low (oversight and monitoring)
- **Primary Functions:**
  - View executive dashboard (institution performance, high-level metrics)
  - View all requests and employees across all institutions
  - Access all reports
- **Permissions:** Read-only access to all data; no approval authority
- **Training Needs:** 4 hours (dashboard navigation, report access)

#### User Class 2: Head of HR Management Division (HHRMD)
- **Count:** 1-2 users
- **Technical Expertise:** Medium-High (HR professional, daily system use)
- **Frequency of Use:** High (daily processing of requests)
- **Primary Functions:**
  - Approve/reject/send back all 8 request types + complaints
  - View all requests and employees (all institutions)
  - Upload decision letters
  - Access comprehensive reports
- **Permissions:** Full approval authority; access to all institutions
- **Training Needs:** 4 hours (all workflows, decision-making, reporting)

#### User Class 3: HR Management Officer (HRMO)
- **Count:** 3-5 users
- **Technical Expertise:** Medium (HR professional, daily system use)
- **Frequency of Use:** High (daily processing of routine requests)
- **Primary Functions:**
  - Approve/reject/send back: Confirmation, Promotion, LWOP, Retirement, Resignation, Service Extension
  - View all requests and employees (all institutions)
  - Upload decision letters
- **Permissions:** Approval authority for 6 request types (excludes Cadre Change, Termination/Dismissal, Complaints)
- **Training Needs:** 4 hours (workflow processing, decision letters)

#### User Class 4: Disciplinary Officer (DO)
- **Count:** 1-2 users
- **Technical Expertise:** Medium (HR/legal professional, regular system use)
- **Frequency of Use:** Medium (complaint and disciplinary case processing)
- **Primary Functions:**
  - Approve/reject/send back: Termination/Dismissal, Complaints
  - Escalate complaints to HHRMD
  - View employees and relevant requests
- **Permissions:** Approval authority for disciplinary matters only
- **Training Needs:** 4 hours (complaint management, termination processing)

#### User Class 5: HR Officer (HRO)
- **Count:** 41 users (one per institution)
- **Technical Expertise:** Low-Medium (varies; primary users)
- **Frequency of Use:** High (daily request submissions)
- **Primary Functions:**
  - Submit all 8 HR request types on behalf of employees
  - View requests from own institution only
  - Upload supporting documents
  - Rectify and resubmit sent-back requests
- **Permissions:** Submit requests for own institution; view own institution's data only
- **Training Needs:** 3 hours (request submission, document upload, status tracking)

#### User Class 6: Planning Officer (PO)
- **Count:** 2-3 users
- **Technical Expertise:** Medium-High (data analysis, strategic planning)
- **Frequency of Use:** Medium (periodic reporting and analysis)
- **Primary Functions:**
  - Access all reports and analytics
  - Custom report builder
  - View all requests and employees (for planning purposes)
- **Permissions:** Read-only access to all data; no approval authority
- **Training Needs:** 4 hours (reporting, analytics, custom report builder)

#### User Class 7: Head of Research and Planning (HRRP)
- **Count:** 5-10 users (institutional planning officers)
- **Technical Expertise:** Medium (planning and analysis)
- **Frequency of Use:** Low-Medium (periodic institutional analysis)
- **Primary Functions:**
  - View institution-specific reports and analytics
  - Access requests and employees from own institution
- **Permissions:** Read-only access to own institution's data
- **Training Needs:** 4 hours (institutional reporting and analytics)

#### User Class 8: System Administrator (ADMIN)
- **Count:** 2-3 users
- **Technical Expertise:** High (IT professionals)
- **Frequency of Use:** Medium (ongoing system maintenance and user support)
- **Primary Functions:**
  - Create/update/delete user accounts
  - Assign roles and institutions
  - Reset passwords, lock/unlock accounts
  - Force logout users
  - Create/update institutions
  - View system health metrics and error logs
- **Permissions:** Full administrative access; no HR approval authority
- **Training Needs:** 4 hours (user management, system configuration)

#### User Class 9: Employee (EMPLOYEE)
- **Count:** 50,000+ users
- **Technical Expertise:** Low (general public, minimal system interaction)
- **Frequency of Use:** Very Low (occasional complaint submission)
- **Primary Functions:**
  - Submit complaints via employee portal
  - View own profile (read-only)
  - Track complaint status
- **Permissions:** Access to own data only; complaint submission
- **Training Needs:** 1 hour (employee portal, complaint submission)

### 2.4 Operating Environment

**Client-Side (User Workstations):**
- **Operating System:** Windows 10+, macOS 10.14+, or Linux (any modern distribution)
- **Web Browser:**
  - Google Chrome 90+
  - Mozilla Firefox 88+
  - Microsoft Edge 90+
  - Safari 14+ (macOS)
- **Screen Resolution:** Minimum 1024x768 (optimal: 1920x1080)
- **Internet Connection:** Broadband (minimum 1 Mbps download, 512 Kbps upload)
- **JavaScript:** Enabled and supported

**Server-Side (Production Environment):**
- **Operating System:** Ubuntu Server 20.04 LTS or higher
- **Web Server:** Nginx (reverse proxy to Next.js app)
- **Application Server:** Node.js 18+ running Next.js 14 application (port 9002)
- **Database Server:** PostgreSQL 15+ (dedicated or co-located)
- **Object Storage:** MinIO server (S3-compatible, port 9001)
- **Cache/Queue:** Redis 6+ for BullMQ job queue
- **Process Manager:** PM2 for Node.js process management
- **Control Panel:** aaPanel (optional, for server management)
- **Memory:** Minimum 8GB RAM (16GB recommended for production)
- **Storage:**
  - Database: 100GB+ SSD (for 50,000+ employees and request history)
  - Object Storage: 500GB+ (for documents, scalable)
- **CPU:** Minimum 4 cores (8 cores recommended)
- **Network:** Static IP address, domain name (csms.zanajira.go.tz), SSL certificate

**Integration Environment:**
- **HRIMS Database:** Accessible via network (direct connection or VPN)
- **Email Server:** SMTP server with authentication (internal or external)
- **Internet Access:** Required for email sending, AI services (Google Genkit)

**Backup and Disaster Recovery:**
- **Backup Storage:** Offsite or separate server for database backups
- **Backup Schedule:** Daily automated backups
- **Retention:** 30-day backup retention

### 2.5 Design and Implementation Constraints

**C1. Technology Stack Constraints**
- **Constraint:** Must use Next.js 14, PostgreSQL, Prisma ORM, MinIO as specified
- **Rationale:** Technology stack already selected and implemented
- **Impact:** No alternative frameworks or databases

**C2. Document Format Constraints**
- **Constraint:** Only PDF documents supported (no Word, Excel, images)
- **Rationale:** Standardization, security, universal viewability
- **Impact:** Users must convert documents to PDF before upload

**C3. File Size Constraints**
- **Constraint:** Maximum 2MB per request document, 1MB per complaint attachment
- **Rationale:** Storage optimization, upload performance, network bandwidth
- **Impact:** Large documents must be compressed or split

**C4. Browser Support Constraints**
- **Constraint:** Modern browsers only (Chrome 90+, Firefox 88+, Edge 90+, Safari 14+)
- **Rationale:** Leverage modern web APIs, reduce compatibility overhead
- **Impact:** Users with older browsers must upgrade

**C5. Network Dependency**
- **Constraint:** System requires internet connectivity; no offline mode
- **Rationale:** Centralized, real-time system; complexity of offline sync
- **Impact:** Users cannot work without internet

**C6. Integration Constraints**
- **Constraint:** HRIMS integration via direct database access or batch files (no real-time API)
- **Rationale:** HRIMS lacks modern APIs
- **Impact:** Daily sync only (not real-time); potential data lag

**C7. Regulatory Constraints**
- **Constraint:** Must adhere to civil service regulations and approval authority
- **Rationale:** Legal and policy requirements
- **Impact:** Workflows are fixed; no ad-hoc customization

**C8. Data Ownership Constraints**
- **Constraint:** HRIMS is authoritative source for employee master data; CSMS cannot modify
- **Rationale:** Data governance and single source of truth
- **Impact:** CSMS is read-only for HRIMS-sourced data

**C9. Language Support Constraints**
- **Constraint:** Partial bilingual support (English primary, Swahili for reports and selected UI elements)
- **Rationale:** Resource limitations, phased implementation
- **Impact:** Full Swahili interface not available

**C10. Infrastructure Constraints**
- **Constraint:** Shared server infrastructure with other government systems
- **Rationale:** Resource availability and cost
- **Impact:** Performance may be affected by other applications; resource contention

### 2.6 Assumptions and Dependencies

**Assumptions:**

**A1. Infrastructure Availability**
- Production servers, database, and storage are provisioned and meet specifications
- Internet connectivity is reliable at CSC and all 41 institutions

**A2. Data Availability**
- HRIMS contains accurate employee data for 50,000+ employees
- HRIMS database is accessible for integration

**A3. User Capability**
- Users have basic computer literacy
- HROs can dedicate time to submit requests digitally
- Users will complete training before system use

**A4. Organizational Commitment**
- CSC leadership mandates digital adoption
- Transition from paper-based to digital processes is enforced
- Stakeholders will provide timely feedback and decisions

**A5. Email Infrastructure**
- SMTP server is available and configured for outbound emails
- User email addresses are accurate and monitored

**Dependencies:**

**D1. External Systems**
- **HRIMS:** Employee data synchronization depends on HRIMS availability and data quality
- **Email Server:** Notifications depend on SMTP server availability
- **Google Genkit:** AI complaint enhancement depends on Genkit service availability and internet access

**D2. Infrastructure**
- **PostgreSQL:** System depends on database availability and performance
- **MinIO:** Document management depends on MinIO storage availability
- **Redis:** Background jobs depend on Redis server availability
- **Nginx:** User access depends on reverse proxy configuration and availability

**D3. Internal**
- **Requirements Finalization:** Development depends on approved requirements (this SRS)
- **Database Schema:** Application depends on Prisma schema and migrations
- **API Endpoints:** Frontend depends on backend API implementation
- **User Accounts:** System usage depends on user account creation and role assignment
- **Training:** User adoption depends on training completion

**D4. Third-Party Services**
- **SSL Certificate:** HTTPS access depends on valid SSL certificate
- **Domain Name:** Public access depends on DNS configuration for csms.zanajira.go.tz
- **Cloud Services:** Google Genkit AI depends on internet access and API keys

---

## 3. System Features

This section provides a high-level overview of all 15 major system features (modules). Detailed functional requirements for each feature are provided in Section 5.

### 3.1 Feature Overview

| Feature ID | Feature Name | Priority | Users | Dependencies |
| --- | --- | --- | --- | --- |
| **F1** | Authentication & Authorization | Critical | All | None |
| **F2** | Dashboard | High | All | F1 |
| **F3** | Employee Management | Critical | All except EMPLOYEE | F1, F15 |
| **F4** | Confirmation Requests | Critical | HRO, HHRMD, HRMO | F1, F3 |
| **F5** | Promotion Requests | Critical | HRO, HHRMD, HRMO | F1, F3 |
| **F6** | LWOP Requests | Critical | HRO, HHRMD, HRMO | F1, F3 |
| **F7** | Cadre Change Requests | High | HRO, HHRMD | F1, F3 |
| **F8** | Service Extension Requests | High | HRO, HHRMD, HRMO | F1, F3 |
| **F9** | Retirement Requests | Critical | HRO, HHRMD, HRMO | F1, F3 |
| **F10** | Resignation Requests | High | HRO, HHRMD, HRMO | F1, F3 |
| **F11** | Termination/Dismissal | High | HRO, DO, HHRMD | F1, F3 |
| **F12** | Complaint Management | Medium | EMPLOYEE, DO, HHRMD | F1 |
| **F13** | Reporting & Analytics | High | CSCS, HHRMD, HRMO, DO, HRO, PO, HRRP | F1, F3 |
| **F14** | Audit Trail | Critical | ADMIN, HHRMD | F1 |
| **F15** | System Administration | Critical | ADMIN | F1 |

### 3.2 Feature Relationships

```
┌──────────────────────────────────────────────────────────┐
│  F1: Authentication & Authorization (Foundation)         │
│  - All features depend on F1 for user authentication    │
│    and role-based access control                        │
└──────────────┬───────────────────────────────────────────┘
               │
               ├─────► F2: Dashboard (All Users)
               │
               ├─────► F3: Employee Management
               │         │
               │         ├─────► F4: Confirmation Requests
               │         ├─────► F5: Promotion Requests
               │         ├─────► F6: LWOP Requests
               │         ├─────► F7: Cadre Change Requests
               │         ├─────► F8: Service Extension Requests
               │         ├─────► F9: Retirement Requests
               │         ├─────► F10: Resignation Requests
               │         └─────► F11: Termination/Dismissal
               │
               ├─────► F12: Complaint Management (Independent of F3)
               │
               ├─────► F13: Reporting & Analytics
               │         └─────► Depends on F3 and F4-F11 data
               │
               ├─────► F14: Audit Trail
               │         └─────► Logs actions from all features
               │
               └─────► F15: System Administration
                         └─────► Manages users for all features
```

### 3.3 Feature Priority Justification

**Critical Priority (Must Have):**
- **F1 (Authentication):** No access without authentication
- **F3 (Employee Management):** Foundation for all HR requests
- **F4-F6, F9 (Core HR Requests):** Confirmation, Promotion, LWOP, Retirement are highest-volume, most critical workflows
- **F14 (Audit Trail):** Compliance and accountability requirement
- **F15 (Admin):** System cannot be managed without administration

**High Priority (Should Have):**
- **F2 (Dashboard):** Improves usability and efficiency
- **F7-F8, F10-F11 (Other HR Requests):** Important but lower volume
- **F13 (Reporting):** Strategic value for decision-making

**Medium Priority (Nice to Have):**
- **F12 (Complaints):** Important for employee satisfaction but can be deferred if needed

---

## 4. External Interface Requirements

### 4.1 User Interfaces

#### 4.1.1 General UI Requirements

**UI-GEN-001: Responsive Design**
- **Requirement:** UI must be fully responsive and functional on desktop (≥1024px), tablet (768px-1023px), and mobile (≥375px) screen widths
- **Acceptance Criteria:**
  - All pages render correctly on desktop, tablet, and mobile viewports
  - No horizontal scrolling on any screen size
  - Touch-friendly controls on mobile (minimum 44x44px touch targets)
  - Navigation menu collapses to hamburger menu on mobile
  - Forms stack vertically on narrow screens
  - Tables scroll horizontally on mobile if needed

**UI-GEN-002: Browser Compatibility**
- **Requirement:** UI must function correctly in modern browsers
- **Supported Browsers:**
  - Google Chrome 90+
  - Mozilla Firefox 88+
  - Microsoft Edge 90+
  - Safari 14+ (macOS/iOS)
- **Acceptance Criteria:**
  - All features work identically across supported browsers
  - No browser-specific bugs or rendering issues
  - Graceful degradation for unsupported features

**UI-GEN-003: Visual Design Consistency**
- **Requirement:** Consistent visual design across all pages using Tailwind CSS and Radix UI components
- **Design Elements:**
  - Color scheme: Primary colors defined in Tailwind config
  - Typography: Consistent font families, sizes, weights
  - Spacing: Tailwind spacing utilities (p-, m-, space-)
  - Components: Radix UI primitives (buttons, dialogs, dropdowns, etc.)
- **Acceptance Criteria:**
  - All pages use consistent colors, fonts, spacing
  - UI components styled consistently
  - Hover states, focus states, active states defined

**UI-GEN-004: Loading States**
- **Requirement:** Display loading indicators for asynchronous operations
- **Acceptance Criteria:**
  - Spinner or skeleton screen displayed during data loading
  - Loading indicator for form submissions
  - Loading indicator for report generation
  - Disabled buttons with loading state during API calls

**UI-GEN-005: Error Display**
- **Requirement:** Display clear, user-friendly error messages
- **Acceptance Criteria:**
  - Validation errors highlighted on specific form fields
  - Error messages in plain language (no technical jargon)
  - Error toast/alert for API failures
  - Retry option for network errors
  - Contact information or help link for persistent errors

**UI-GEN-006: Accessibility**
- **Requirement:** Basic accessibility features for keyboard navigation and screen readers
- **Acceptance Criteria:**
  - All interactive elements accessible via keyboard (Tab, Enter, Escape)
  - Focus indicators visible
  - Form labels associated with inputs (for attribute)
  - ARIA labels for icon buttons
  - Semantic HTML (header, nav, main, footer)

#### 4.1.2 Login Page (UI-LOGIN)

**UI-LOGIN-001: Login Form**
- **URL:** `/login` or `/` (root redirects to login if not authenticated)
- **Elements:**
  - Username input (text field)
  - Password input (password field with show/hide toggle)
  - "Login" button (primary CTA)
  - "Forgot Password?" link (future enhancement)
  - Logo and system name (CSMS)
- **Validation:**
  - Required field indicators
  - Inline validation on blur
- **Acceptance Criteria:**
  - Form centered on page
  - Responsive on all screen sizes
  - Password toggle icon to show/hide password
  - Error messages displayed below respective fields
  - Loading spinner on "Login" button during authentication

**UI-LOGIN-002: Employee Login Link**
- **Requirement:** Link to separate employee login portal for complaint submission
- **Elements:** "Employee Login" link/button redirects to `/employee-login`
- **Acceptance Criteria:**
  - Link prominently displayed on main login page
  - Separate page for employee authentication

#### 4.1.3 Employee Login Page (UI-EMP-LOGIN)

**UI-EMP-LOGIN-001: Employee Authentication Form**
- **URL:** `/employee-login`
- **Elements:**
  - ZanID input (text field, 12-digit validation)
  - Payroll Number input (text field)
  - ZSSF Number input (text field)
  - "Login" button
  - Instructions explaining authentication requirements
- **Validation:**
  - All three fields required
  - Format validation for each field
- **Acceptance Criteria:**
  - Clear instructions for employees
  - Format hints (e.g., "ZanID: 12 digits")
  - Error messages for invalid credentials
  - Redirect to employee dashboard on success

#### 4.1.4 Dashboard Pages (UI-DASH)

**UI-DASH-001: Role-Based Dashboard Layout**
- **Requirement:** Each role has a customized dashboard showing relevant metrics and quick actions
- **Common Elements (All Dashboards):**
  - Header with logo, system name, user name, role badge, logout button
  - Navigation menu (sidebar or top nav)
  - Notification bell icon with unread count badge
  - Main content area with dashboard widgets
  - Footer
- **Acceptance Criteria:**
  - Dashboard loads within 5 seconds
  - Widgets display real-time data
  - Navigation menu highlights current page
  - Responsive layout

**UI-DASH-002: HRO Dashboard**
- **Widgets:**
  - Requests submitted this month (count)
  - Pending requests (count, clickable → request list)
  - Approved requests this month (count)
  - Rejected requests this month (count)
  - Sent-back requests awaiting rectification (count, clickable)
  - Quick action: "Submit New Request" button
- **Acceptance Criteria:**
  - All counts filtered to HRO's institution only
  - Widgets clickable to view detailed lists
  - Quick action button prominent

**UI-DASH-003: HHRMD/HRMO Dashboard**
- **Widgets:**
  - Pending requests in my queue (count by type: Confirmation, Promotion, LWOP, etc.)
  - Requests reviewed this month (count)
  - Average processing time (days)
  - Overdue requests (pending >10 days, count)
  - Quick action: View pending confirmations, promotions, etc.
- **Acceptance Criteria:**
  - Counts show all institutions (CSC-wide)
  - Pending requests grouped by type
  - Overdue requests highlighted (red indicator)

**UI-DASH-004: DO Dashboard**
- **Widgets:**
  - Pending complaints (count by category)
  - Pending terminations/dismissals (count)
  - Complaints resolved this month (count)
  - Average complaint resolution time (days)
  - Overdue complaints (pending >14 days, count)
- **Acceptance Criteria:**
  - Complaint categories displayed separately
  - Overdue items highlighted

**UI-DASH-005: CSCS Dashboard**
- **Widgets:**
  - Total employees (all institutions)
  - Request volumes by type (current month)
  - Institution performance comparison (table: institution, avg processing time, approval rate)
  - Overdue requests (count)
  - System health status (green/yellow/red indicator)
- **Acceptance Criteria:**
  - High-level executive summary
  - Institution comparison sortable
  - System health refreshes every 60 seconds

**UI-DASH-006: PO/HRRP Dashboard**
- **Widgets:**
  - Workforce metrics (total employees, by institution if HRRP)
  - Retirement projections (next 6 months, count)
  - Promotion trends (chart: promotions per month, last 12 months)
  - Confirmation trends (chart: confirmations per month, last 12 months)
  - LWOP active count
  - Quick action: "Generate Report" button
- **Acceptance Criteria:**
  - Charts display trend data
  - HRRP dashboard filtered to own institution

**UI-DASH-007: ADMIN Dashboard**
- **Widgets:**
  - Total users (count by role: pie chart or bar chart)
  - Active sessions (count)
  - Failed login attempts (last 24 hours, count)
  - System uptime (percentage, last 30 days)
  - Database size (GB)
  - Recent errors (last 10 errors, table with timestamp, message, user)
  - Quick action: "Create User" button
- **Acceptance Criteria:**
  - Charts visualize user distribution
  - Error log clickable for details
  - System metrics auto-refresh every 60 seconds

**UI-DASH-008: Employee Dashboard**
- **Widgets:**
  - Personal profile summary (name, institution, cadre, status)
  - My complaints (table: ID, subject, status, date submitted)
  - Quick action: "Submit Complaint" button
- **Acceptance Criteria:**
  - Profile displays read-only data
  - Complaints table shows only employee's own complaints
  - "Submit Complaint" button prominent

#### 4.1.5 Navigation Menu (UI-NAV)

**UI-NAV-001: Role-Based Navigation Menu**
- **Requirement:** Navigation menu shows only items relevant to user's role
- **Menu Items by Role:**

| Menu Item | HRO | HHRMD | HRMO | DO | CSCS | PO | HRRP | ADMIN | EMPLOYEE |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Dashboard | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Employees | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | - | - |
| Confirmations | ✓ | ✓ | ✓ | - | ✓ | ✓ | ✓ | - | - |
| Promotions | ✓ | ✓ | ✓ | - | ✓ | ✓ | ✓ | - | - |
| LWOP | ✓ | ✓ | ✓ | - | ✓ | ✓ | ✓ | - | - |
| Cadre Change | ✓ | ✓ | - | - | ✓ | ✓ | ✓ | - | - |
| Service Extension | ✓ | ✓ | ✓ | - | ✓ | ✓ | ✓ | - | - |
| Retirement | ✓ | ✓ | ✓ | - | ✓ | ✓ | ✓ | - | - |
| Resignation | ✓ | ✓ | ✓ | - | ✓ | ✓ | ✓ | - | - |
| Termination/Dismissal | ✓ | ✓ | - | ✓ | ✓ | - | - | - | - |
| Complaints | - | ✓ | - | ✓ | ✓ | - | - | - | ✓ |
| Reports | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | - | - |
| Audit Logs | - | ✓ | - | - | - | - | - | ✓ | - |
| Users | - | - | - | - | - | - | - | ✓ | - |
| Institutions | - | - | - | - | - | - | - | ✓ | - |
| Profile | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Logout | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

- **Acceptance Criteria:**
  - Menu items displayed only if user has permission
  - Current page highlighted in menu
  - Submenu expansion for request types (collapsible)

**UI-NAV-002: Notification Center**
- **Requirement:** Notification bell icon in header with dropdown
- **Elements:**
  - Bell icon with unread count badge (red circle with number)
  - Dropdown showing recent notifications (last 10)
  - Each notification: message, timestamp, mark as read checkbox
  - "View All" link to full notifications page
- **Acceptance Criteria:**
  - Unread count updates in real-time
  - Clicking notification marks as read
  - Dropdown scrollable if >10 notifications
  - "View All" link navigates to `/notifications`

#### 4.1.6 Request Forms (UI-FORM)

**UI-FORM-001: Request Submission Form Layout**
- **Common Elements (All Request Forms):**
  - Form title (e.g., "Submit Confirmation Request")
  - Breadcrumb navigation (Dashboard > Confirmations > New Request)
  - Employee search/selection (autocomplete input)
  - Employee details display (read-only: name, ZanID, payroll, institution, employment date, status)
  - Request-specific fields (varies by request type)
  - Document upload section (multiple file inputs)
  - Supporting notes/comments (textarea, optional)
  - Action buttons: "Submit" (primary), "Cancel" (secondary)
  - Validation errors summary at top
- **Acceptance Criteria:**
  - Form fields clearly labeled with required indicators (*)
  - Employee autocomplete searches by name, ZanID, or payroll
  - Selected employee details populate automatically
  - Document upload accepts PDF only, max 2MB each
  - Validation errors displayed inline and in summary
  - "Submit" button disabled until validation passes
  - Success message on successful submission

**UI-FORM-002: Confirmation Request Form**
- **Specific Fields:**
  - Proposed Confirmation Date (date picker)
  - Supporting Notes (textarea, optional)
- **Document Uploads:**
  - Confirmation Letter (required, PDF, ≤2MB)
  - IPA Certificate (required, PDF, ≤2MB)
  - Performance Appraisal (required, PDF, ≤2MB)
- **Validation:**
  - Employee must be "On Probation" status
  - Employee must have ≥12 months since employment date
  - Proposed confirmation date must be ≥12 months after employment date
  - Proposed confirmation date cannot be in future
  - All three documents required
- **Acceptance Criteria:**
  - Validation errors prevent submission
  - System calculates probation period completed (months)
  - Success message displays request ID (e.g., "CONF-MoE-2025-000123")

**UI-FORM-003: Promotion Request Form**
- **Specific Fields:**
  - Promotion Type (radio buttons: Education-Based, Performance-Based)
  - Proposed Cadre (text input or dropdown)
  - Studied Outside Country (checkbox: "Did employee study outside Tanzania?")
  - Commission Decision Reason (textarea, optional)
- **Document Uploads:**
  - Educational Certificates (required for education-based, PDF, ≤2MB, multiple)
  - TCU Verification Letter (required if "Studied Outside Country" checked, PDF, ≤2MB)
  - Performance Appraisals (required for performance-based, PDF, ≤2MB, multiple, 2+ years)
  - Promotion Request Letter (required, PDF, ≤2MB)
- **Validation:**
  - Employee must be "Confirmed" status
  - Employee must have ≥2 years since employment date or last promotion
  - If "Studied Outside Country" checked, TCU verification required
  - Proposed cadre cannot be same as current cadre
- **Acceptance Criteria:**
  - Promotion type selection shows/hides relevant document upload fields
  - TCU verification field appears conditionally
  - Multiple document upload for certificates and appraisals
  - Validation prevents submission if requirements not met

(Continue with similar detailed UI specifications for all other request forms: LWOP, Cadre Change, Service Extension, Retirement, Resignation, Termination/Dismissal, Complaint)

**UI-FORM-004: Complaint Submission Form (Employee)**
- **URL:** `/employee-login` then `/dashboard` then "Submit Complaint"
- **Specific Fields:**
  - Complaint Type (dropdown: Unconfirmed Employees, Job-Related, Other)
  - Subject (text input, ≤200 chars, required)
  - Details (textarea, ≥100 chars, ≤5000 chars, required)
  - Incident Date (date picker, optional)
  - Complainant Phone Number (text input, required)
  - Next of Kin Phone Number (text input, required)
- **Document Uploads:**
  - Evidence Documents (optional, PDF, ≤1MB each, multiple allowed)
- **AI Enhancement:**
  - "Enhance with AI" button below Details textarea
  - Clicking shows AI-suggested rewritten text in modal
  - Employee can accept (replace Details) or decline (keep original)
  - Loading indicator during AI processing
- **Acceptance Criteria:**
  - All required fields validated
  - Character count displayed for Subject and Details
  - AI enhancement optional (employee can skip)
  - AI suggestion reviewed by employee before acceptance
  - Success message displays complaint ID (e.g., "COMP-2025-000456")

#### 4.1.7 Request Review/Approval Interface (UI-REVIEW)

**UI-REVIEW-001: Request List Page**
- **URL:** `/confirmations`, `/promotions`, etc. (one per request type)
- **Elements:**
  - Page title (e.g., "Confirmation Requests")
  - Tabs: "Pending" (default), "All", "Sent Back" (for HRO)
  - Filter controls: Status dropdown, Institution dropdown (if applicable), Date range
  - Search box (search by employee name, ZanID, request ID)
  - Request table with columns:
    - Request ID (clickable)
    - Employee Name
    - Institution
    - Submitted By (HRO name)
    - Submitted Date
    - Days Pending
    - Status (badge: PENDING=yellow, APPROVED=green, REJECTED=red, SENT_BACK=orange)
    - Actions (View button)
  - Pagination controls (if >50 requests)
- **Acceptance Criteria:**
  - Table sortable by columns (click column header)
  - Filters apply immediately (no page reload)
  - Search works on name, ZanID, request ID
  - Status badges color-coded
  - Clicking request ID or "View" button opens detail page

**UI-REVIEW-002: Request Detail Page (Approver View)**
- **URL:** `/confirmations/[id]`, `/promotions/[id]`, etc.
- **Sections:**
  1. **Request Header:**
     - Request ID (large, prominent)
     - Status badge (current status)
     - Submitted Date
     - Days Pending
     - Review Stage (Submitted, Under Review, Decision Made)

  2. **Employee Information Card:**
     - Employee photo (if available)
     - Name
     - ZanID
     - Payroll Number
     - Institution
     - Cadre
     - Employment Date
     - Current Status
     - Probation Period Completed (for confirmations)
     - Service Years (for promotions)

  3. **Request Details Card:**
     - Request-specific fields (e.g., proposed confirmation date, proposed cadre, LWOP duration, etc.)
     - Supporting notes/comments from HRO

  4. **Uploaded Documents Section:**
     - List of uploaded documents with:
       - Document name
       - File size
       - Upload date
       - Preview button (opens PDF in new tab or modal)
       - Download button

  5. **Request History/Timeline:**
     - Chronological list of events:
       - Submitted by [HRO Name] on [Date]
       - Sent back by [Approver Name] on [Date] - Reason: [Text]
       - Resubmitted by [HRO Name] on [Date]
       - Approved by [Approver Name] on [Date]

  6. **Decision Actions (for Approvers: HHRMD, HRMO, DO):**
     - If status = PENDING:
       - **Approve** button (primary, green)
         - Clicking opens approval modal
       - **Reject** button (danger, red)
         - Clicking opens rejection modal
       - **Send Back** button (secondary, orange)
         - Clicking opens send-back modal

  7. **Approval Modal:**
     - Title: "Approve [Request Type] Request"
     - Upload Decision Letter (file input, PDF, ≤2MB, required)
     - Decision Date (date picker, defaults to today, required)
     - Commission Decision Date (date picker, optional for some request types)
     - Internal Notes (textarea, optional, visible only to approvers)
     - "Confirm Approval" button
     - "Cancel" button
     - Validation: Decision letter required before approval

  8. **Rejection Modal:**
     - Title: "Reject [Request Type] Request"
     - Rejection Reason (textarea, ≥20 chars, ≤1000 chars, required)
     - Internal Notes (textarea, optional)
     - "Confirm Rejection" button
     - "Cancel" button
     - Validation: Rejection reason required (min 20 chars)

  9. **Send Back Modal:**
     - Title: "Send Back [Request Type] Request"
     - Rectification Instructions (textarea, ≥20 chars, ≤1000 chars, required)
       - Guidance: "Provide specific, actionable instructions for the HRO to correct the request"
     - Internal Notes (textarea, optional)
     - "Confirm Send Back" button
     - "Cancel" button
     - Validation: Instructions required (min 20 chars)

- **Acceptance Criteria:**
  - All sections display complete, accurate information
  - Employee photo displayed if available; placeholder if not
  - Documents preview in new tab or modal PDF viewer
  - Modals show validation errors inline
  - Approval, rejection, send-back actions update status immediately
  - Success message on action completion
  - Page redirects to request list after action

**UI-REVIEW-003: Request Detail Page (HRO View)**
- **Sections:** Similar to UI-REVIEW-002 but with differences:
  - No Decision Actions section (HRO cannot approve/reject)
  - If status = SENT_BACK:
    - Display "Rectification Instructions" prominently (from approver)
    - "Edit Request" button (opens edit form)
    - "Resubmit" button (submits edited request)
  - If status = APPROVED or REJECTED:
    - Display decision information:
      - Approved/Rejected by [Approver Name] on [Date]
      - Decision Letter (if approved, download link)
      - Rejection Reason (if rejected, text display)
- **Acceptance Criteria:**
  - HRO can view all request details
  - HRO can edit and resubmit SENT_BACK requests
  - HRO can view decision letters and rejection reasons

#### 4.1.8 Employee List and Profile Pages (UI-EMP)

**UI-EMP-001: Employee List Page**
- **URL:** `/employees`
- **Elements:**
  - Page title: "Employees"
  - Filter controls:
    - Institution dropdown (HRO/HRRP: fixed to own institution; others: all institutions)
    - Status dropdown (All, On Probation, Confirmed, On LWOP, Retired, Resigned, Terminated, Dismissed)
    - Cadre dropdown (multi-select or search)
    - Employment Date range (date pickers: from, to)
  - Search box (name, ZanID, payroll number)
  - Employee table with columns:
    - Photo (thumbnail)
    - Name (clickable)
    - ZanID
    - Payroll Number
    - Institution
    - Cadre
    - Status (badge)
    - Employment Date
    - Actions (View Profile button)
  - Pagination controls (50 employees per page)
  - Export button (Export to Excel)
- **Acceptance Criteria:**
  - Table displays employees filtered by role (HRO sees only own institution)
  - Search works on name, ZanID, payroll number
  - Filters apply immediately
  - Clicking name or "View Profile" opens employee profile page
  - Export generates Excel file with filtered results

**UI-EMP-002: Employee Profile Page**
- **URL:** `/employees/[id]`
- **Sections:**
  1. **Profile Header:**
     - Employee photo (large)
     - Name (large)
     - ZanID
     - Payroll Number
     - Status badge (large, color-coded)

  2. **Personal Information Card:**
     - Gender
     - Date of Birth
     - Place of Birth
     - Region
     - Country of Birth
     - Phone Number
     - Contact Address

  3. **Employment Information Card:**
     - Institution
     - Ministry
     - Department
     - Cadre
     - Salary Scale
     - Appointment Type
     - Contract Type
     - Employment Date
     - Confirmation Date (if confirmed)
     - Retirement Date (if set)
     - Current Reporting Office
     - Current Workplace

  4. **Documents Section:**
     - Birth Certificate (download link if available)
     - Job Contract (download link if available)
     - Confirmation Letter (download link if available)
     - Ardhili Hali Certificate (download link if available)
     - Educational Certificates (list with download links)

  5. **Request History Section:**
     - Table of all requests for this employee:
       - Request Type
       - Request ID (clickable)
       - Submitted Date
       - Status
       - Actions (View button)

  6. **Action Buttons (if applicable):**
     - "Submit Request" dropdown (HRO only, shows request types applicable to this employee)

- **Acceptance Criteria:**
  - All employee information displayed accurately
  - Documents downloadable (PDF preview option)
  - Request history shows all request types
  - HRO can navigate to submit new request for this employee
  - Read-only view (no editing except via request workflows)

#### 4.1.9 Report Pages (UI-RPT)

**UI-RPT-001: Reports Menu Page**
- **URL:** `/reports`
- **Elements:**
  - Page title: "Reports & Analytics"
  - Tabs: "Standard Reports", "Custom Reports"
  - **Standard Reports Tab:**
    - List of 10+ standard reports with:
      - Report icon
      - Report name (e.g., "Employee Master List")
      - Report description (brief)
      - "Generate" button
  - **Custom Reports Tab:**
    - Report builder interface (see UI-RPT-003)
- **Acceptance Criteria:**
  - Standard reports listed with clear names and descriptions
  - Clicking "Generate" opens report configuration page

**UI-RPT-002: Standard Report Configuration Page**
- **URL:** `/reports/[report-type]`
- **Elements:**
  - Report title (e.g., "Employee Master List Report")
  - Configuration options:
    - Date Range (date pickers: from, to) - if applicable
    - Institution (dropdown: All, or specific institution) - if applicable
    - Status (dropdown: All, On Probation, Confirmed, etc.) - if applicable
    - Other report-specific filters
  - Preview button (generates report preview)
  - Export buttons: "Export to PDF", "Export to Excel"
- **Acceptance Criteria:**
  - Configuration options displayed based on report type
  - Preview shows first 100 rows
  - Export generates downloadable file
  - Report generation completes within 30 seconds (for 10,000+ records)
  - Loading indicator during generation

**UI-RPT-003: Custom Report Builder**
- **Elements:**
  - Step 1: Select Data Source (dropdown: Employees, Requests, Audit Logs)
  - Step 2: Select Fields (multi-select checkboxes of available fields)
  - Step 3: Apply Filters (add filter rows: field, operator, value)
  - Step 4: Sort (dropdown: sort by field, ascending/descending)
  - Preview button
  - Export buttons: "Export to PDF", "Export to Excel"
- **Acceptance Criteria:**
  - Step-by-step wizard interface
  - Available fields update based on data source selection
  - Filters support operators: equals, contains, greater than, less than, between
  - Preview shows first 100 rows with selected fields
  - Export generates custom report

#### 4.1.10 Admin Pages (UI-ADMIN)

**UI-ADMIN-001: User Management Page**
- **URL:** `/admin/users`
- **Elements:**
  - Page title: "User Management"
  - "Create New User" button (primary, opens user creation modal)
  - Search box (search by username, name, email)
  - Filter controls: Role dropdown, Institution dropdown, Status (Active/Inactive)
  - User table with columns:
    - Username
    - Full Name
    - Email
    - Role (badge)
    - Institution
    - Status (badge: Active=green, Inactive=gray)
    - Last Login
    - Actions (Edit, Reset Password, Lock/Unlock, Force Logout dropdown)
  - Pagination controls
- **Acceptance Criteria:**
  - Table displays all users (Admin sees all)
  - Search works on username, name, email
  - Filters apply immediately
  - Actions update user immediately (confirmation modals for destructive actions)

**UI-ADMIN-002: User Creation/Edit Modal**
- **Elements:**
  - Title: "Create User" or "Edit User"
  - Username (text input, required, unique)
  - Full Name (text input, required)
  - Email (email input, required, unique)
  - Password (password input, required for new user, optional for edit)
  - Confirm Password (password input, required if password entered)
  - Role (dropdown: ADMIN, CSCS, HHRMD, HRMO, DO, HRO, PO, HRRP, EMPLOYEE, required)
  - Institution (dropdown: required if role = HRO or HRRP; disabled otherwise)
  - Status (toggle: Active/Inactive)
  - "Save" button
  - "Cancel" button
- **Validation:**
  - Username unique
  - Email unique and valid format
  - Password complexity requirements if entered
  - Passwords match
  - Institution required for HRO and HRRP
- **Acceptance Criteria:**
  - Validation errors displayed inline
  - Institution field shows/hides based on role selection
  - Success message on save
  - User list updates immediately

**UI-ADMIN-003: Institution Management Page**
- **URL:** `/admin/institutions`
- **Elements:**
  - Page title: "Institutions"
  - "Create New Institution" button
  - Search box (search by name, vote number, TIN)
  - Institution table with columns:
    - Name
    - Email
    - Phone Number
    - Vote Number
    - TIN Number
    - HRO Assigned (user name if assigned)
    - Actions (Edit, Delete dropdown)
  - Pagination controls
- **Acceptance Criteria:**
  - Table displays all institutions
  - Search works on name, vote number, TIN
  - Create/Edit opens modal with institution form
  - Delete requires confirmation (cannot delete if employees associated)

**UI-ADMIN-004: System Health Dashboard**
- **URL:** `/admin/system-health`
- **Elements:**
  - Page title: "System Health"
  - Cards/Widgets:
    - Database Status (green/red indicator, connection status)
    - MinIO Status (green/red indicator, connection status)
    - Redis Status (green/red indicator, connection status)
    - System Uptime (percentage, last 30 days)
    - Disk Space (progress bar: used/total GB)
    - Database Size (GB)
    - MinIO Storage Used (GB)
    - Active Sessions (count)
    - Recent Errors (table: last 20 errors with timestamp, message, user)
  - Refresh button (manual refresh)
  - Auto-refresh toggle (on/off, refreshes every 60 seconds)
- **Acceptance Criteria:**
  - All metrics display current values
  - Indicators color-coded (green=healthy, yellow=warning, red=error)
  - Auto-refresh updates metrics without page reload
  - Error log clickable for details

#### 4.1.11 Audit Log Page (UI-AUDIT)

**UI-AUDIT-001: Audit Log Page**
- **URL:** `/audit-logs`
- **Elements:**
  - Page title: "Audit Trail"
  - Filter controls:
    - User (dropdown: All, or specific user)
    - Action Type (dropdown: All, LOGIN, LOGOUT, CREATE, UPDATE, APPROVE, REJECT, etc.)
    - Entity Type (dropdown: All, Employee, ConfirmationRequest, PromotionRequest, etc.)
    - Date Range (date pickers: from, to)
  - Search box (search by user, IP address, entity ID)
  - Audit log table with columns:
    - Timestamp (sortable, default desc)
    - User (username)
    - Action Type (badge)
    - Entity Type
    - Entity ID (clickable if applicable)
    - IP Address
    - Details (expandable row showing before/after values)
  - Pagination controls (100 logs per page)
  - Export button (Export to Excel)
- **Acceptance Criteria:**
  - Table displays audit logs filtered by role (Admin and HHRMD see all)
  - Filters apply immediately
  - Search works on user, IP, entity ID
  - Clicking entity ID navigates to entity (e.g., request detail page)
  - Expandable rows show full details (before/after values for updates)
  - Export generates Excel file with filtered logs

### 4.2 Hardware Interfaces

The CSMS is a web-based application and does not directly interface with hardware. However, the following hardware considerations apply:

**HW-001: Server Hardware**
- **Requirement:** Application runs on server hardware meeting minimum specifications
- **Specifications:**
  - CPU: Minimum 4 cores, 2.0 GHz+ (8 cores recommended)
  - RAM: Minimum 8GB (16GB recommended for production)
  - Storage: SSD recommended for database (100GB+ for database, 500GB+ for MinIO)
  - Network: Gigabit Ethernet
- **Acceptance Criteria:** System performance meets NFRs on specified hardware

**HW-002: Client Hardware**
- **Requirement:** Users can access system from any device with modern web browser
- **Minimum Client Specs:**
  - Desktop/Laptop: 2GB RAM, any OS with supported browser
  - Tablet: 2GB RAM, iOS 13+ or Android 8+
  - Mobile: 1GB RAM, iOS 13+ or Android 8+
- **Acceptance Criteria:** UI responsive and functional on minimum client specs

**HW-003: Storage Devices**
- **Requirement:** Backup storage for database and document backups
- **Specifications:**
  - Capacity: Minimum 2TB (offsite or separate server)
  - Type: HDD acceptable for backups (SSD preferred)
  - Connectivity: Network-attached or cloud storage
- **Acceptance Criteria:** Daily automated backups succeed to backup storage

### 4.3 Software Interfaces

#### 4.3.1 Database Interface (PostgreSQL)

**SW-DB-001: PostgreSQL Database Connection**
- **Database System:** PostgreSQL 15+
- **Connection:** Prisma ORM client
- **Connection String:** Configured via environment variable `DATABASE_URL`
- **Example:** `postgresql://user:password@localhost:5432/csms_db?schema=public`
- **Connection Pooling:** Prisma default connection pool (10 connections)
- **SSL:** Enabled for production
- **Acceptance Criteria:**
  - Application connects to PostgreSQL on startup
  - Prisma ORM successfully queries and mutates data
  - Connection errors logged and handled gracefully

**SW-DB-002: Prisma ORM**
- **Version:** Prisma 6.19.1+
- **Schema File:** `prisma/schema.prisma`
- **Generated Client:** `@prisma/client`
- **Migrations:** Managed via `prisma migrate`
- **Operations:** CRUD operations via Prisma Client API
- **Acceptance Criteria:**
  - Prisma schema defines all 25+ tables with relationships
  - Prisma Client successfully performs all CRUD operations
  - Migrations apply cleanly without errors

#### 4.3.2 Object Storage Interface (MinIO)

**SW-MINIO-001: MinIO S3-Compatible API**
- **Storage System:** MinIO (S3-compatible object storage)
- **API:** S3 API (AWS SDK compatible)
- **Endpoint:** Configured via environment variable `MINIO_ENDPOINT` (e.g., `http://localhost:9001`)
- **Authentication:** Access Key and Secret Key (environment variables)
- **Buckets:**
  - `csms-documents` (request documents, decision letters)
  - `employee-photos` (employee profile photos)
  - `employee-certificates` (educational certificates)
- **Operations:**
  - `putObject` (upload file)
  - `getObject` (download file)
  - `listObjects` (list files in bucket)
  - `deleteObject` (delete file)
  - `presignedGetObject` (generate temporary download URL)
- **Acceptance Criteria:**
  - Application uploads PDFs to MinIO buckets
  - Application retrieves and serves PDFs from MinIO
  - URLs generated for document download
  - MinIO connection errors logged and handled

**SW-MINIO-002: MinIO Client Library**
- **Library:** `minio` npm package
- **Version:** 8.0.5+
- **Usage:** Initialize MinIO client with credentials, perform S3 operations
- **Error Handling:** Retry mechanism for transient failures (3 retries)
- **Acceptance Criteria:**
  - MinIO client successfully initializes with credentials
  - Upload, download, list, delete operations succeed
  - Errors handled gracefully with retry logic

#### 4.3.3 HRIMS Database Interface

**SW-HRIMS-001: HRIMS Data Synchronization**
- **Integration Type:** Read-only batch synchronization
- **HRIMS System:** Legacy MSSQL or Oracle database (TBD based on actual HRIMS)
- **Connection Method:** Direct database connection or batch file import
- **Frequency:** Daily automated sync (BullMQ background job)
- **Sync Schedule:** 2:00 AM daily (configurable)
- **Data Direction:** HRIMS → CSMS (one-way)
- **Data Synchronized:**
  - Employee ID (HRIMS primary key)
  - Name
  - Gender
  - Date of Birth
  - ZanID
  - Payroll Number
  - ZSSF Number
  - Cadre
  - Institution
  - Employment Date
  - Confirmation Date
  - Retirement Date
  - Status
- **Sync Logic:**
  - Upsert (insert new employees, update existing by employee ID)
  - Map HRIMS fields to CSMS employee schema
  - Handle data type conversions (dates, enums)
- **Error Handling:**
  - Log sync errors (invalid data, missing fields, connection failures)
  - Flag failed records for manual review
  - Send alert email if failure rate >5%
  - Retry mechanism for connection failures
- **Acceptance Criteria:**
  - Daily sync job runs successfully
  - Employee data in CSMS matches HRIMS (>99% accuracy)
  - Sync errors logged with details
  - Failed records reviewable by admin

#### 4.3.4 Email Interface (SMTP)

**SW-EMAIL-001: SMTP Email Sending**
- **Protocol:** SMTP
- **SMTP Server:** Configured via environment variables (host, port, username, password)
- **Authentication:** Username/password or API key (depends on SMTP provider)
- **TLS:** Enabled for secure email transmission
- **From Address:** Configured (e.g., `noreply@csms.zanajira.go.tz`)
- **Email Library:** Node.js `nodemailer` package or similar
- **Operations:**
  - Send email (async via BullMQ job queue)
  - Retry on failure (3 retries with exponential backoff)
- **Email Templates:**
  - Request submitted (to approver)
  - Request approved (to HRO)
  - Request rejected (to HRO)
  - Request sent back (to HRO)
  - Complaint status changed (to employee)
  - 90-day service extension expiry reminder (to HRO and employee)
- **Acceptance Criteria:**
  - Emails sent successfully to recipients
  - Email content matches templates
  - Failed emails logged (non-blocking)
  - Retry mechanism handles transient failures

#### 4.3.5 AI Interface (Google Genkit)

**SW-AI-001: Google Genkit Integration**
- **AI Service:** Google Genkit (Gemini AI)
- **Usage:** Complaint text enhancement (rewriting poorly-formatted complaints)
- **API:** Genkit SDK for Node.js
- **Model:** Gemini Pro or similar (configured in Genkit)
- **Operations:**
  - Analyze complaint text for clarity
  - Generate improved/rewritten version
  - Return suggested text to frontend
- **Input:**
  - Original complaint text (subject + details)
- **Output:**
  - Suggested rewritten text
  - Confidence score (if available)
- **Error Handling:**
  - Fallback to original text if AI fails
  - Log AI errors (non-blocking)
  - Timeout after 10 seconds
- **Acceptance Criteria:**
  - AI enhancement functional for complaint submission
  - Suggested text maintains factual accuracy (no hallucination)
  - Employee can accept or decline suggestion
  - AI failure does not block complaint submission

#### 4.3.6 Background Job Queue (Redis + BullMQ)

**SW-REDIS-001: Redis Connection**
- **System:** Redis 6+
- **Connection:** Redis client library (ioredis)
- **Connection String:** Configured via environment variable `REDIS_URL`
- **Usage:** Message queue for background jobs (BullMQ)
- **Acceptance Criteria:**
  - Application connects to Redis on startup
  - BullMQ successfully enqueues and processes jobs
  - Redis connection errors logged and handled

**SW-BULL-001: BullMQ Job Queue**
- **Library:** BullMQ (npm package)
- **Version:** 5.66.4+
- **Job Types:**
  - HRIMS sync job (daily, scheduled)
  - Email notification job (async, triggered by events)
  - 90-day service extension reminder job (scheduled, weekly scan)
- **Job Configuration:**
  - Retry: 3 attempts with exponential backoff
  - Timeout: 30 minutes (for HRIMS sync), 5 minutes (for email)
  - Priority: Email=high, HRIMS sync=medium
- **Job Monitoring:**
  - Job status (queued, active, completed, failed)
  - Failed job logs
  - Job retry count
- **Acceptance Criteria:**
  - Jobs enqueued and processed successfully
  - Failed jobs retry per configuration
  - Job logs viewable by admin

### 4.4 Communication Interfaces

**COM-001: HTTPS/TLS Protocol**
- **Requirement:** All client-server communication encrypted via HTTPS
- **Protocol:** HTTPS (HTTP over TLS 1.2+)
- **Port:** 443 (standard HTTPS port)
- **SSL Certificate:** Valid SSL certificate for `csms.zanajira.go.tz` domain
- **Certificate Authority:** Trusted CA (Let's Encrypt or commercial)
- **Acceptance Criteria:**
  - All HTTP requests redirect to HTTPS
  - SSL certificate valid and trusted by browsers
  - No mixed content warnings
  - TLS version 1.2 or higher enforced

**COM-002: RESTful API**
- **Architecture:** RESTful API principles
- **HTTP Methods:**
  - GET (retrieve data, no side effects)
  - POST (create resources, submit actions)
  - PATCH/PUT (update resources)
  - DELETE (delete resources)
- **URL Structure:** `/api/[resource]/[id]` (e.g., `/api/employees/123`, `/api/confirmations`, `/api/users`)
- **Request Format:** JSON (Content-Type: application/json)
- **Response Format:** JSON
- **Status Codes:**
  - 200 OK (successful GET, PATCH)
  - 201 Created (successful POST creating resource)
  - 204 No Content (successful DELETE)
  - 400 Bad Request (validation errors)
  - 401 Unauthorized (authentication required)
  - 403 Forbidden (insufficient permissions)
  - 404 Not Found (resource not found)
  - 500 Internal Server Error (server error)
- **Error Response Format:**
  ```json
  {
    "error": "Error message",
    "code": "ERROR_CODE",
    "details": {} // optional additional details
  }
  ```
- **Acceptance Criteria:**
  - API follows REST principles
  - Status codes used correctly
  - JSON requests and responses
  - Errors return structured JSON with error details

**COM-003: WebSocket (Future Enhancement)**
- **Status:** Out of scope for current version
- **Future Use:** Real-time notification updates without page refresh
- **Note:** Currently using HTTP polling or page refresh for notifications

---

## 5. Functional Requirements

This section details all functional requirements for the 15 system modules. Each requirement is assigned a unique ID, priority, acceptance criteria, and traceability to business objectives.

### 5.1 Authentication and Authorization Module (AUTH)

#### 5.1.1 User Login (User/Password)

**REQ-AUTH-FR-001: User Login Form**
- **Priority:** Critical
- **Description:** System shall provide a login form for users to authenticate with username and password
- **Inputs:**
  - Username (string, required, max 50 chars)
  - Password (string, required, max 100 chars)
- **Processing:**
  - Validate inputs (not empty)
  - Query database for user by username
  - Compare submitted password with stored bcrypt hash
  - If match, create JWT session token
  - If mismatch, increment failed login counter
  - If 5 failed attempts, lock account for 30 minutes
- **Outputs:**
  - Success: Redirect to dashboard, set session cookie
  - Failure: Error message "Invalid username or password"
  - Account locked: Error message "Account locked due to multiple failed attempts. Try again in 30 minutes."
- **Acceptance Criteria:**
  - AC-001: User with valid credentials successfully logs in
  - AC-002: User with invalid credentials receives error message
  - AC-003: User account locked after 5 failed attempts within 30 minutes
  - AC-004: Locked account cannot login until 30-minute lockout expires
  - AC-005: Successful login creates JWT token and session cookie
  - AC-006: Failed login attempt logged in audit trail
  - AC-007: Successful login logged in audit trail with IP address and timestamp
- **Business Rule:** BR-SEC-001 (Authentication required)
- **Traceability:** BRD Objective 4 (Security), Use Case UC-AUTH-001

**REQ-AUTH-FR-002: Password Hashing**
- **Priority:** Critical
- **Description:** System shall store passwords as bcrypt hashes (never plaintext)
- **Processing:**
  - On user creation or password change, hash password with bcrypt (10-12 salt rounds)
  - Store only hash in database (password field)
- **Acceptance Criteria:**
  - AC-001: Passwords never stored in plaintext
  - AC-002: Bcrypt used with 10-12 salt rounds
  - AC-003: Password verification uses bcrypt compare function
- **Security Requirement:** NFR-SEC-001 (Password protection)

**REQ-AUTH-FR-003: JWT Session Token**
- **Priority:** Critical
- **Description:** System shall issue JWT token upon successful login for session management
- **Processing:**
  - Generate JWT token with payload:
    - User ID
    - Username
    - Role
    - Institution ID (if applicable)
    - Issued at (timestamp)
    - Expires in (24 hours)
  - Sign token with secret key (environment variable `JWT_SECRET`)
  - Set HTTP-only, secure cookie with JWT token
- **Acceptance Criteria:**
  - AC-001: JWT token generated with correct payload
  - AC-002: Token signed with secret key
  - AC-003: Token set in HTTP-only, secure cookie (not accessible via JavaScript)
  - AC-004: Token expires after 24 hours
  - AC-005: Expired token rejected (user must re-login)
- **Security Requirement:** NFR-SEC-002 (Session security)

**REQ-AUTH-FR-004: Account Lockout**
- **Priority:** Critical
- **Description:** System shall lock user account after 5 consecutive failed login attempts for 30 minutes
- **Processing:**
  - Track failed login attempts per user (in database or cache)
  - Increment counter on each failed login
  - Reset counter to 0 on successful login
  - If counter reaches 5, set account lockout timestamp (current time + 30 minutes)
  - Reject login attempts until lockout timestamp expires
- **Acceptance Criteria:**
  - AC-001: Failed login counter increments on each failure
  - AC-002: Counter resets on successful login
  - AC-003: Account locked after 5 failures
  - AC-004: Lockout lasts 30 minutes
  - AC-005: Lockout timestamp stored in database
  - AC-006: User can login after lockout expires
  - AC-007: Lockout event logged in audit trail
- **Business Rule:** BR-SEC-003 (Account lockout protection)

**REQ-AUTH-FR-005: Inactivity Timeout**
- **Priority:** High
- **Description:** System shall automatically log out users after 7 minutes of inactivity
- **Processing:**
  - Track last activity timestamp (on each API request, update session timestamp)
  - Check session timestamp on each API request
  - If current time - last activity > 7 minutes, invalidate session
  - Redirect to login page with message "Session expired due to inactivity"
- **Acceptance Criteria:**
  - AC-001: Session timeout set to 7 minutes of inactivity
  - AC-002: User activity resets inactivity timer
  - AC-003: Inactive session expires after 7 minutes
  - AC-004: Expired session redirects to login with message
  - AC-005: User can re-login after timeout
- **Security Requirement:** NFR-SEC-004 (Session timeout)

**REQ-AUTH-FR-006: Maximum Session Limit**
- **Priority:** High
- **Description:** System shall limit each user to maximum 3 concurrent sessions
- **Processing:**
  - Store active session tokens in database (User-Session table)
  - On login, check count of active sessions for user
  - If count ≥ 3, invalidate oldest session (by timestamp)
  - Create new session for current login
- **Acceptance Criteria:**
  - AC-001: Maximum 3 active sessions per user enforced
  - AC-002: Oldest session terminated when limit exceeded
  - AC-003: User notified on other device when session terminated
  - AC-004: Admin can view active sessions per user
- **Security Requirement:** NFR-SEC-005 (Session management)

**REQ-AUTH-FR-007: Logout**
- **Priority:** Critical
- **Description:** System shall allow user to logout and terminate session
- **Processing:**
  - Delete session token from database
  - Clear session cookie on client
  - Redirect to login page
  - Log logout event in audit trail
- **Acceptance Criteria:**
  - AC-001: Logout button available in header/menu
  - AC-002: Clicking logout terminates session
  - AC-003: Session token invalidated
  - AC-004: User redirected to login page
  - AC-005: Logout event logged with timestamp
  - AC-006: User must re-login to access system

**REQ-AUTH-FR-008: Force Logout (Admin)**
- **Priority:** High
- **Description:** System shall allow admin to forcefully logout a user (terminate all sessions)
- **Processing:**
  - Admin selects user from user management page
  - Admin clicks "Force Logout" action
  - System deletes all active session tokens for that user from database
  - User's next API request fails with 401 Unauthorized
  - User redirected to login page
- **Acceptance Criteria:**
  - AC-001: Admin can force logout any user
  - AC-002: All active sessions for user terminated
  - AC-003: User must re-login
  - AC-004: Force logout event logged in audit trail

#### 5.1.2 Employee Login (Three-Factor Verification)

**REQ-AUTH-FR-009: Employee Login Form**
- **Priority:** High
- **Description:** System shall provide separate employee login for complaint submission using ZanID, Payroll Number, and ZSSF Number
- **Inputs:**
  - ZanID (string, required, exactly 12 digits)
  - Payroll Number (string, required)
  - ZSSF Number (string, required)
- **Processing:**
  - Validate all three inputs (not empty, ZanID = 12 digits)
  - Query database for employee matching all three fields
  - If match found, create employee session (JWT with employee role)
  - If no match, show error message
- **Outputs:**
  - Success: Redirect to employee dashboard
  - Failure: Error message "Invalid credentials. Please verify your ZanID, Payroll Number, and ZSSF Number."
- **Acceptance Criteria:**
  - AC-001: Employee login form accessible at `/employee-login`
  - AC-002: All three fields required
  - AC-003: ZanID validated for 12-digit format
  - AC-004: Employee with matching credentials successfully logs in
  - AC-005: Non-matching credentials rejected
  - AC-006: Employee session created with EMPLOYEE role
  - AC-007: Employee redirected to employee dashboard
  - AC-008: Employee login attempt logged in audit trail
- **Business Rule:** BR-COMP-002 (Employee authentication)

**REQ-AUTH-FR-010: Employee Session Management**
- **Priority:** High
- **Description:** Employee sessions managed separately from user sessions with read-only employee permissions
- **Processing:**
  - Employee session JWT includes:
    - Employee ID
    - Role: EMPLOYEE
    - ZanID
    - Issued at
    - Expires in (24 hours)
  - Employee can only:
    - View own profile (read-only)
    - Submit complaints
    - View own complaints
- **Acceptance Criteria:**
  - AC-001: Employee session JWT contains employee-specific data
  - AC-002: Employee role enforced (cannot access user functions)
  - AC-003: Employee can view only own data
  - AC-004: Employee cannot access employee management, requests, reports, admin
  - AC-005: Employee session expires after 24 hours

#### 5.1.3 Password Management

**REQ-AUTH-FR-011: Password Complexity Enforcement**
- **Priority:** Critical
- **Description:** System shall enforce password complexity requirements on password creation and change
- **Requirements:**
  - Minimum 8 characters
  - At least one uppercase letter (A-Z)
  - At least one lowercase letter (a-z)
  - At least one number (0-9)
  - At least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)
- **Acceptance Criteria:**
  - AC-001: Password meeting all requirements accepted
  - AC-002: Password missing any requirement rejected with specific error
  - AC-003: Error message indicates which requirement failed
  - AC-004: Password complexity validated on user creation
  - AC-005: Password complexity validated on password change
- **Security Requirement:** NFR-SEC-006 (Password policy)

**REQ-AUTH-FR-012: Password Expiration**
- **Priority:** High
- **Description:** System shall enforce password expiration based on user role
- **Expiration Periods:**
  - Admin: 60 days
  - All other roles: 90 days
- **Processing:**
  - Store password created/changed date in database
  - Check password age on login
  - If expired, force password change before allowing access
  - Display warning 7 days before expiration
- **Acceptance Criteria:**
  - AC-001: Admin password expires after 60 days
  - AC-002: Non-admin password expires after 90 days
  - AC-003: User with expired password must change before login
  - AC-004: User warned 7 days before expiration
  - AC-005: Password expiration date displayed in user profile
  - AC-006: Password change resets expiration timer
- **Security Requirement:** NFR-SEC-007 (Password expiration)

**REQ-AUTH-FR-013: Password History**
- **Priority:** High
- **Description:** System shall prevent password reuse (last 5 passwords)
- **Processing:**
  - Store hash of last 5 passwords in database (password history table)
  - On password change, compare new password hash with history
  - Reject if match found
  - Add new password hash to history
  - Remove oldest hash if history >5
- **Acceptance Criteria:**
  - AC-001: User cannot reuse any of last 5 passwords
  - AC-002: Error message if password reused: "Cannot reuse recent passwords"
  - AC-003: Password history stored as hashes (not plaintext)
  - AC-004: History limited to 5 passwords
- **Security Requirement:** NFR-SEC-008 (Password history)

**REQ-AUTH-FR-014: Password Change**
- **Priority:** High
- **Description:** System shall allow authenticated users to change their password
- **Inputs:**
  - Current password (required, for verification)
  - New password (required, must meet complexity)
  - Confirm new password (required, must match new password)
- **Processing:**
  - Verify current password matches stored hash
  - Validate new password complexity
  - Check new password not in password history
  - Hash new password with bcrypt
  - Update password in database
  - Add old password hash to history
  - Update password changed date
  - Log password change event
- **Acceptance Criteria:**
  - AC-001: User can access password change form from profile menu
  - AC-002: Current password required and verified
  - AC-003: New password must meet complexity requirements
  - AC-004: New password and confirm password must match
  - AC-005: New password cannot be in password history
  - AC-006: Successful change updates password and resets expiration
  - AC-007: Success message displayed
  - AC-008: Password change event logged

**REQ-AUTH-FR-015: Password Reset (Admin)**
- **Priority:** High
- **Description:** System shall allow admin to reset user password
- **Processing:**
  - Admin selects user from user management page
  - Admin clicks "Reset Password" action
  - System generates temporary random password (meets complexity)
  - System sets "force password change on next login" flag
  - Admin views temporary password (one-time display)
  - Admin communicates temporary password to user securely
  - User logs in with temporary password
  - User forced to change password before accessing system
- **Acceptance Criteria:**
  - AC-001: Admin can reset password for any user
  - AC-002: Temporary password meets complexity requirements
  - AC-003: Temporary password displayed once to admin
  - AC-004: User with temporary password forced to change on next login
  - AC-005: User cannot access system without changing password
  - AC-006: Password reset event logged

#### 5.1.4 Role-Based Access Control (RBAC)

**REQ-AUTH-FR-016: Role Assignment**
- **Priority:** Critical
- **Description:** System shall assign each user to exactly one role
- **Roles:**
  1. ADMIN (System Administrator)
  2. CSCS (Chief Secretary Civil Service)
  3. HHRMD (Head of HR Management Division)
  4. HRMO (HR Management Officer)
  5. DO (Disciplinary Officer)
  6. HRO (HR Officer)
  7. PO (Planning Officer)
  8. HRRP (Head of Research and Planning)
  9. EMPLOYEE (Employee)
- **Acceptance Criteria:**
  - AC-001: Each user assigned exactly one role
  - AC-002: Role stored in database (user.role field)
  - AC-003: Role included in JWT session token
  - AC-004: Role cannot be null or empty
  - AC-005: Role must be one of the 9 defined values

**REQ-AUTH-FR-017: Role-Based UI Access**
- **Priority:** Critical
- **Description:** System shall display UI elements based on user role
- **Access Matrix:** (See UI-NAV-001 table in Section 4.1.5)
- **Acceptance Criteria:**
  - AC-001: Navigation menu shows only items user has permission to access
  - AC-002: Dashboard displays role-specific widgets
  - AC-003: Action buttons (Approve, Reject, etc.) visible only to authorized roles
  - AC-004: Unauthorized pages return 403 Forbidden
  - AC-005: Role checked on every page load and API request

**REQ-AUTH-FR-018: Institution-Based Data Filtering (HRO, HRRP)**
- **Priority:** Critical
- **Description:** System shall filter data to show only user's institution for HRO and HRRP roles
- **Processing:**
  - HRO and HRRP users have institutionId field in database
  - All queries for employees, requests filtered by institutionId
  - Attempts to access other institutions' data blocked
- **Acceptance Criteria:**
  - AC-001: HRO sees only employees from own institution
  - AC-002: HRO can submit requests only for own institution's employees
  - AC-003: HRRP sees only requests and reports from own institution
  - AC-004: Attempts to access other institutions' data return 403 Forbidden
  - AC-005: Unauthorized access attempts logged
- **Business Rule:** BR-006 (Institutional data isolation)

**REQ-AUTH-FR-019: Approval Authority Enforcement**
- **Priority:** Critical
- **Description:** System shall enforce approval authority based on role and request type
- **Authority Matrix:**

| Request Type | HHRMD | HRMO | DO |
| --- | --- | --- | --- |
| Confirmation | ✓ | ✓ | - |
| Promotion | ✓ | ✓ | - |
| LWOP | ✓ | ✓ | - |
| Cadre Change | ✓ | - | - |
| Service Extension | ✓ | ✓ | - |
| Retirement | ✓ | ✓ | - |
| Resignation | ✓ | ✓ | - |
| Termination/Dismissal | ✓ | - | ✓ |
| Complaint | ✓ | - | ✓ |

- **Acceptance Criteria:**
  - AC-001: Approval actions (approve, reject, send back) visible only to authorized roles
  - AC-002: API-level authorization blocks unauthorized approval attempts
  - AC-003: HRMO cannot approve Cadre Change requests
  - AC-004: HRMO cannot approve Termination/Dismissal or Complaints
  - AC-005: DO cannot approve non-disciplinary requests
  - AC-006: Unauthorized approval attempts return 403 Forbidden and logged
- **Business Rule:** BR-005 (Approval authority)

**REQ-AUTH-FR-020: Employee Self-Service Restrictions**
- **Priority:** High
- **Description:** System shall restrict EMPLOYEE role to self-service functions only
- **Allowed Functions:**
  - View own profile (read-only)
  - Submit complaints
  - View own complaints
  - Logout
- **Prohibited Functions:**
  - View other employees
  - Submit HR requests (must go through HRO)
  - View institution-wide data
  - Access reports, audit logs, admin functions
- **Acceptance Criteria:**
  - AC-001: Employee can access only allowed functions
  - AC-002: Employee dashboard shows only profile and complaints
  - AC-003: Employee cannot navigate to prohibited pages
  - AC-004: API requests to prohibited endpoints return 403 Forbidden
- **Business Rule:** BR-COMP-006 (Employee view only own complaints)

---

### 5.2 Dashboard Module (DASH)

#### 5.2.1 Dashboard Statistics Display

**REQ-DASH-FR-001: Role-Based Dashboard Metrics**
- **Priority:** High
- **Description:** System shall display role-specific statistics and metrics on user dashboard
- **Inputs:**
  - User role (from JWT token)
  - User institution ID (if HRO/HRRP)
- **Processing:**
  - Query database for role-specific metrics
  - Filter data by institution for HRO/HRRP roles
  - Calculate counts for each metric category
  - Return formatted statistics object
- **Outputs:**
  - Dashboard metrics JSON containing:
    - Total employees count
    - Pending confirmations count
    - Pending promotions count
    - Employees on LWOP count
    - Pending terminations count
    - Pending cadre changes count
    - Pending retirements count
    - Pending resignations count
    - Pending service extensions count
    - Open complaints count
- **Acceptance Criteria:**
  - AC-001: HRO/HRRP see only their institution's statistics
  - AC-002: HHRMD/CSCS/DO/HRMO/PO see all institutions' statistics
  - AC-003: All counts are accurate and real-time
  - AC-004: Statistics load within 2 seconds
  - AC-005: Zero-count metrics still displayed (show "0")
  - AC-006: Metrics clickable to navigate to detail pages
- **Business Rule:** BR-DASH-001 (Role-based data visibility)
- **Traceability:** BRD Objective 2 (Process automation), Use Case UC-DASH-001

**REQ-DASH-FR-002: Pending Request Status Filters**
- **Priority:** High
- **Description:** System shall filter pending requests by role-appropriate statuses
- **Processing:**
  - HRO/HRRP: Show "Pending HRMO Review", "Pending HRMO/HHRMD Review"
  - HHRMD: Show "Pending HRMO/HHRMD Review"
  - CSCS: Show all pending statuses
  - HRMO: Show "Pending HRMO Review"
  - DO: Show "Pending DO/HHRMD Review" (terminations/complaints)
- **Acceptance Criteria:**
  - AC-001: Each role sees only relevant pending items
  - AC-002: Status filter logic correctly applied to each request type
  - AC-003: Counts exclude concluded/rejected requests
  - AC-004: Filters consistent across all request types
- **Business Rule:** BR-DASH-002 (Role-based status visibility)
- **Traceability:** BRD Objective 4 (Security), Use Case UC-DASH-002

**REQ-DASH-FR-003: Recent Activities Timeline**
- **Priority:** High
- **Description:** System shall display recent activities across all request types
- **Inputs:**
  - User role and institution
  - Pagination parameters (page, size)
- **Processing:**
  - Fetch last 100 items from each of 9 request tables
  - Filter by user's institution if HRO/HRRP
  - Merge all activities
  - Sort by updatedAt descending (newest first)
  - Paginate results (default 10 per page)
  - Format activity items with:
    - Employee name
    - Request type
    - Current status
    - Last updated timestamp
    - Link to detail page
- **Outputs:**
  - Array of activity objects with pagination metadata
- **Acceptance Criteria:**
  - AC-001: Shows up to 100 most recent activities
  - AC-002: Activities sorted newest first
  - AC-003: Each activity shows correct employee name, type, status
  - AC-004: Timestamp displayed in user-friendly format (e.g., "2 hours ago")
  - AC-005: Clicking activity navigates to detail page
  - AC-006: Pagination works correctly (next/previous)
  - AC-007: HRO/HRRP see only their institution's activities
  - AC-008: Empty state shown when no activities exist
- **Business Rule:** BR-DASH-003 (Activity aggregation)
- **Traceability:** BRD Objective 2 (Efficiency), Use Case UC-DASH-003

**REQ-DASH-FR-004: Urgent Actions Panel (HRO/HRRP)**
- **Priority:** Medium
- **Description:** System shall display urgent action items requiring immediate attention
- **Processing:**
  - Query for probation overdue employees (>12 months on probation)
  - Query for employees nearing retirement (within 6 months)
  - Count urgent items per category
  - Display counts with warning indicators
- **Outputs:**
  - Urgent actions object:
    - Probation overdue count
    - Nearing retirement count
- **Acceptance Criteria:**
  - AC-001: Probation overdue shows employees >12 months on probation
  - AC-002: Nearing retirement shows employees retiring within 6 months
  - AC-003: Counts updated real-time
  - AC-004: Panel only visible to HRO/HRRP roles
  - AC-005: Clicking count navigates to filtered employee list
  - AC-006: Visual warning indicators (red badge) for overdue items
- **Business Rule:** BR-DASH-004 (Urgent action identification)
- **Traceability:** BRD Objective 2 (Proactive management), Use Case UC-DASH-004

**REQ-DASH-FR-005: Dashboard API Endpoint**
- **Priority:** Critical
- **Description:** System shall provide API endpoint for fetching dashboard data
- **API Endpoint:** `GET /api/dashboard/metrics`
- **Query Parameters:**
  - userRole (required)
  - userInstitutionId (required for HRO/HRRP)
- **Response Schema:**
```json
{
  "stats": {
    "totalEmployees": number,
    "pendingConfirmations": number,
    "pendingPromotions": number,
    "employeesOnLWOP": number,
    "pendingTerminations": number,
    "pendingCadreChanges": number,
    "pendingRetirements": number,
    "pendingResignations": number,
    "pendingServiceExtensions": number,
    "openComplaints": number
  },
  "recentActivities": {
    "data": [...],
    "pagination": { "page": 1, "size": 10, "total": number }
  },
  "urgentActions": {
    "probationOverdue": number,
    "nearingRetirement": number
  }
}
```
- **Acceptance Criteria:**
  - AC-001: API returns 200 OK with valid data
  - AC-002: Invalid role returns 403 Forbidden
  - AC-003: Missing userInstitutionId for HRO/HRRP returns 400 Bad Request
  - AC-004: Response time <2 seconds
  - AC-005: All counts are non-negative integers
- **Security Requirement:** NFR-SEC-003 (API authorization)
- **Traceability:** BRD Objective 2 (Real-time visibility), API Doc DASH-001

#### 5.2.2 Dashboard Navigation

**REQ-DASH-FR-006: Quick Navigation Links**
- **Priority:** Medium
- **Description:** System shall provide quick navigation to key modules from dashboard
- **Navigation Items:**
  - Employees (if not EMPLOYEE role)
  - Confirmation Requests
  - Promotion Requests
  - LWOP Requests
  - Cadre Change Requests
  - Service Extension Requests
  - Retirement Requests
  - Resignation Requests
  - Termination Requests
  - Complaints (if EMPLOYEE/DO/HHRMD)
  - Reports (if authorized)
  - Admin (if ADMIN)
- **Acceptance Criteria:**
  - AC-001: Navigation items filtered by user role
  - AC-002: Each item links to correct module
  - AC-003: Active module highlighted in navigation
  - AC-004: Navigation accessible on all screen sizes
  - AC-005: Badge counts shown for pending items
- **Business Rule:** BR-DASH-005 (Role-based navigation)
- **Traceability:** BRD Objective 5 (Usability), Use Case UC-DASH-006

---

### 5.3 Employee Information Management Module (EMP)

#### 5.3.1 Employee Data Retrieval

**REQ-EMP-FR-001: List Employees with Pagination**
- **Priority:** Critical
- **Description:** System shall retrieve and display employee list with pagination
- **API Endpoint:** `GET /api/employees`
- **Query Parameters:**
  - page (default: 1)
  - size (default: 200, max: 500)
  - q (search query, optional)
  - status (filter, optional)
  - gender (filter, optional)
  - institutionId (filter, optional)
- **Processing:**
  - Validate user authorization
  - Apply institution filter for HRO/HRRP/Admin
  - Apply search filter if q provided (name, zanId, payrollNumber, cadre)
  - Apply status and gender filters
  - Execute database query with pagination
  - Include institution and certificates relations
  - Return paginated results
- **Response Schema:**
```json
{
  "employees": [...],
  "pagination": {
    "page": number,
    "size": number,
    "total": number,
    "totalPages": number
  }
}
```
- **Acceptance Criteria:**
  - AC-001: Returns employees with valid pagination metadata
  - AC-002: HRO/HRRP/Admin see only their institution's employees
  - AC-003: HHRMD/CSCS/HRMO/DO/PO see all institutions
  - AC-004: Search works across name, zanId, payrollNumber, cadre fields
  - AC-005: Case-insensitive search
  - AC-006: Multiple filters can be combined
  - AC-007: Response time <3 seconds for up to 500 records
  - AC-008: Each employee includes institution object
  - AC-009: Certificates array included (if any)
- **Business Rule:** BR-EMP-001 (Institutional data isolation)
- **Traceability:** BRD Objective 1 (Centralized data), Use Case UC-EMP-001

**REQ-EMP-FR-002: Get Single Employee Details**
- **Priority:** Critical
- **Description:** System shall retrieve detailed information for a single employee
- **API Endpoint:** `GET /api/employees?id={employeeId}`
- **Processing:**
  - Validate user authorization for employee's institution
  - Query employee by ID with all relations
  - Include institution, certificates, all document URLs
  - Return complete employee object
- **Response Schema:**
```json
{
  "id": string,
  "employeeEntityId": string,
  "name": string,
  "gender": string,
  "dateOfBirth": DateTime,
  "zanId": string (unique),
  "payrollNumber": string,
  "phoneNumber": string,
  "cadre": string,
  "salaryScale": string,
  "status": string,
  "institution": {...},
  "certificates": [...],
  "ardhilHaliUrl": string,
  "confirmationLetterUrl": string,
  "jobContractUrl": string,
  "birthCertificateUrl": string,
  "profileImageUrl": string,
  // ... all employee fields
}
```
- **Acceptance Criteria:**
  - AC-001: Returns complete employee data
  - AC-002: 404 Not Found if employee doesn't exist
  - AC-003: 403 Forbidden if user lacks access to employee's institution
  - AC-004: All document URLs are valid MinIO keys
  - AC-005: Institution object populated
  - AC-006: Certificates array includes all employee certificates
  - AC-007: Null fields returned as null (not omitted)
- **Business Rule:** BR-EMP-002 (Complete employee profile)
- **Traceability:** BRD Objective 1 (Complete employee data), Use Case UC-EMP-002

**REQ-EMP-FR-003: Search Employees**
- **Priority:** High
- **Description:** System shall provide full-text search across employee fields
- **API Endpoint:** `GET /api/employees/search`
- **Search Fields:**
  - name (full-text)
  - zanId (exact or partial)
  - payrollNumber (exact or partial)
  - cadre (full-text)
  - institution name (full-text)
- **Processing:**
  - Combine all search fields with OR logic
  - Apply case-insensitive matching
  - Support partial matches
  - Filter by user's institution if HRO/HRRP/Admin
  - Return ranked results (most relevant first)
- **Acceptance Criteria:**
  - AC-001: Search returns relevant results within 2 seconds
  - AC-002: Partial matches work (e.g., "Ali" finds "Ali Hassan")
  - AC-003: Case-insensitive (e.g., "ZANZIBAR" finds "Zanzibar")
  - AC-004: Searches across all specified fields
  - AC-005: Empty query returns all employees (paginated)
  - AC-006: No results returns empty array (not error)
  - AC-007: Results respect institution access restrictions
- **Business Rule:** BR-EMP-003 (Comprehensive search)
- **Traceability:** BRD Objective 2 (Easy data access), Use Case UC-EMP-003

**REQ-EMP-FR-004: Filter Employees by Status**
- **Priority:** High
- **Description:** System shall filter employees by employment status
- **Status Values:**
  - "On Probation"
  - "Confirmed"
  - "On LWOP"
  - "Retired"
  - "Resigned"
  - "Terminated"
  - "Dismissed"
- **Processing:**
  - Apply exact match filter on status field
  - Combine with other filters (search, gender, institution)
  - Return filtered results
- **Acceptance Criteria:**
  - AC-001: Filter returns only employees with exact status match
  - AC-002: All status values supported
  - AC-003: Invalid status value returns 400 Bad Request
  - AC-004: Status filter combinable with search and other filters
  - AC-005: Case-sensitive matching
- **Business Rule:** BR-EMP-004 (Status-based filtering)
- **Traceability:** BRD Objective 2 (Efficient filtering), Use Case UC-EMP-004

**REQ-EMP-FR-005: Filter Employees by Gender**
- **Priority:** Medium
- **Description:** System shall filter employees by gender
- **Gender Values:**
  - "Male"
  - "Female"
- **Acceptance Criteria:**
  - AC-001: Filter returns employees matching specified gender
  - AC-002: Invalid gender value returns 400 Bad Request
  - AC-003: Gender filter combinable with other filters
- **Business Rule:** BR-EMP-005 (Gender-based filtering)
- **Traceability:** BRD Objective 2 (Reporting capability), Use Case UC-EMP-005

#### 5.3.2 Employee Documents and Certificates

**REQ-EMP-FR-006: Get Employee Documents**
- **Priority:** High
- **Description:** System shall retrieve all documents associated with an employee
- **API Endpoint:** `GET /api/employees/{id}/documents`
- **Document Types:**
  - ardhilHali (Service record)
  - confirmationLetter
  - jobContract
  - birthCertificate
  - profileImage
- **Processing:**
  - Validate user access to employee
  - Retrieve all document URLs from employee record
  - Return array of document objects with type, URL, name
- **Response Schema:**
```json
{
  "documents": [
    {
      "type": "ardhilHali",
      "name": "Service Record",
      "url": string (MinIO key),
      "uploadedAt": DateTime
    },
    // ... more documents
  ]
}
```
- **Acceptance Criteria:**
  - AC-001: Returns all non-null document URLs
  - AC-002: Empty array if no documents exist
  - AC-003: 403 Forbidden if user lacks access
  - AC-004: URLs are valid MinIO object keys
  - AC-005: Document type and name clearly labeled
- **Business Rule:** BR-EMP-006 (Document accessibility)
- **Traceability:** BRD Objective 1 (Document management), Use Case UC-EMP-006

**REQ-EMP-FR-007: Get Employee Certificates**
- **Priority:** High
- **Description:** System shall retrieve all academic/professional certificates for an employee
- **API Endpoint:** `GET /api/employees/{id}/certificates`
- **Processing:**
  - Validate user access to employee
  - Query EmployeeCertificate table for employee's certificates
  - Return array of certificate objects
- **Response Schema:**
```json
{
  "certificates": [
    {
      "id": string,
      "type": string,
      "name": string,
      "url": string (MinIO key),
      "uploadedAt": DateTime
    },
    // ... more certificates
  ]
}
```
- **Acceptance Criteria:**
  - AC-001: Returns all certificates for employee
  - AC-002: Empty array if no certificates exist
  - AC-003: 403 Forbidden if user lacks access
  - AC-004: Certificates sorted by uploadedAt (newest first)
  - AC-005: Each certificate has valid URL
- **Business Rule:** BR-EMP-007 (Certificate tracking)
- **Traceability:** BRD Objective 1 (Qualification tracking), Use Case UC-EMP-007

**REQ-EMP-FR-008: Fetch Employee Photo**
- **Priority:** Medium
- **Description:** System shall retrieve employee profile photo
- **API Endpoint:** `GET /api/employees/{id}/fetch-photo`
- **Processing:**
  - Validate user access to employee
  - Retrieve profileImageUrl from employee record
  - If URL exists, return photo URL for download
  - If no photo, return default avatar
- **Acceptance Criteria:**
  - AC-001: Returns valid photo URL if exists
  - AC-002: Returns default avatar if no photo
  - AC-003: 403 Forbidden if user lacks access
  - AC-004: Photo loads within 2 seconds
  - AC-005: Supports common image formats (JPG, PNG)
- **Business Rule:** BR-EMP-008 (Profile photo display)
- **Traceability:** BRD Objective 5 (User experience), Use Case UC-EMP-008

#### 5.3.3 Urgent Actions Identification

**REQ-EMP-FR-009: Identify Probation Overdue Employees**
- **Priority:** High
- **Description:** System shall identify employees overdue for confirmation
- **API Endpoint:** `GET /api/employees/urgent-actions?countOnly=true`
- **Processing:**
  - Query employees with status = "On Probation"
  - Calculate probation duration (current date - employmentDate)
  - Filter employees where duration > 12 months
  - Count or return list based on countOnly parameter
- **Acceptance Criteria:**
  - AC-001: Identifies employees on probation >12 months
  - AC-002: countOnly=true returns count only
  - AC-003: countOnly=false returns full employee list
  - AC-004: HRO/HRRP see only their institution's overdue employees
  - AC-005: List includes employee name, employmentDate, probation duration
- **Business Rule:** BR-EMP-009 (Probation period = 12 months minimum)
- **Traceability:** BRD Objective 2 (Compliance monitoring), Use Case UC-EMP-009

**REQ-EMP-FR-010: Identify Employees Nearing Retirement**
- **Priority:** High
- **Description:** System shall identify employees approaching retirement
- **Processing:**
  - Query employees with retirementDate not null
  - Filter employees where retirementDate within next 6 months
  - Exclude employees with status = "Retired"
  - Count or return list based on countOnly parameter
- **Acceptance Criteria:**
  - AC-001: Identifies employees retiring within 6 months
  - AC-002: Excludes already retired employees
  - AC-003: Calculation based on retirementDate field
  - AC-004: HRO/HRRP see only their institution
  - AC-005: List includes employee name, retirementDate, days remaining
- **Business Rule:** BR-EMP-010 (Retirement planning = 6 months advance notice)
- **Traceability:** BRD Objective 2 (Proactive planning), Use Case UC-EMP-010

#### 5.3.4 HRIMS Integration

**REQ-EMP-FR-011: HRIMS Employee Sync**
- **Priority:** Critical
- **Description:** System shall synchronize employee data from HRIMS
- **API Endpoint:** `POST /api/hrims/sync-employee`
- **Request Body:**
```json
{
  "zanId": string (optional),
  "payrollNumber": string (optional),
  "institutionVoteNumber": string (required),
  "syncDocuments": boolean (default: false),
  "hrimsApiUrl": string (optional),
  "hrimsApiKey": string (optional)
}
```
- **Processing:**
  1. Validate institution exists by vote number
  2. Fetch employee from HRIMS API
  3. Validate HRIMS response schema
  4. Upsert employee into database (create or update)
  5. Trigger background jobs for documents/certificates if requested
- **Acceptance Criteria:**
  - AC-001: Creates new employee if doesn't exist
  - AC-002: Updates existing employee if found by zanId
  - AC-003: Returns employeeId and sync status
  - AC-004: 404 Not Found if institution doesn't exist
  - AC-005: 500 Server Error if HRIMS API fails
  - AC-006: Documents sync in background without blocking response
  - AC-007: Sync completes within 5 seconds (excluding background jobs)
- **Business Rule:** BR-EMP-011 (HRIMS as source of truth for employee master data)
- **Traceability:** BRD Objective 1 (HRIMS integration), Use Case UC-EMP-011

**REQ-EMP-FR-012: Employee Data Validation from HRIMS**
- **Priority:** Critical
- **Description:** System shall validate employee data received from HRIMS
- **Required Fields from HRIMS:**
  - zanId (must be unique)
  - name
  - institutionVoteNumber (must match existing institution)
- **Optional Fields:**
  - All other employee fields (use defaults if missing)
- **Validation Rules:**
  - zanId: Alphanumeric, max 50 chars
  - payrollNumber: Numeric if provided
  - dateOfBirth: Valid date format
  - gender: "Male" or "Female" if provided
  - employmentDate: Valid date, not in future
- **Acceptance Criteria:**
  - AC-001: Rejects sync if required fields missing
  - AC-002: Rejects sync if zanId already exists (unless updating same employee)
  - AC-003: Accepts sync with missing optional fields
  - AC-004: Returns validation errors clearly
  - AC-005: Invalid date formats rejected
- **Business Rule:** BR-EMP-012 (Data quality enforcement)
- **Traceability:** BRD Objective 1 (Data integrity), Use Case UC-EMP-012

---

### 5.4 Confirmation Request Module (CONF)

#### 5.4.1 Confirmation Request Submission

**REQ-CONF-FR-001: Create Confirmation Request**
- **Priority:** Critical
- **Description:** System shall allow HRO/HRRP to submit employee confirmation requests
- **API Endpoint:** `POST /api/confirmations`
- **Request Body:**
```json
{
  "employeeId": string (required),
  "submittedById": string (required),
  "documents": [string] (required, min 1 document)
}
```
- **Processing:**
  1. Validate user role (HRO/HRRP only)
  2. Validate employee exists and belongs to user's institution
  3. Validate employee status = "On Probation"
  4. Validate probation duration >= 12 months
  5. Check no active confirmation request exists for employee
  6. Validate documents array (min 1 document)
  7. Create confirmation request with status "Pending HRMO Review"
  8. Generate unique request ID (CONF-{InstitutionCode}-{YYYY}-{NNNNNN})
  9. Create notification for HRMO
- **Acceptance Criteria:**
  - AC-001: Only HRO/HRRP can submit
  - AC-002: Employee must be "On Probation"
  - AC-003: Probation period must be >=12 months
  - AC-004: Cannot submit if active confirmation request exists
  - AC-005: At least 1 document required
  - AC-006: Request ID format correct
  - AC-007: Initial status is "Pending HRMO Review"
  - AC-008: Notification sent to HRMO
  - AC-009: Request logged in audit trail
- **Business Rule:** BR-CONF-001 (Probation period >=12 months)
- **Business Rule:** BR-CONF-002 (One active confirmation per employee)
- **Business Rule:** BR-CONF-003 (Only "On Probation" employees confirmable)
- **Traceability:** BRD Objective 2 (Automate confirmation), Use Case UC-CONF-001

**REQ-CONF-FR-002: Employee Status Validation**
- **Priority:** Critical
- **Description:** System shall validate employee eligibility for confirmation
- **Eligible Status:** "On Probation"
- **Ineligible Statuses:**
  - "Confirmed" (already confirmed)
  - "On LWOP" (cannot confirm while on leave)
  - "Retired" (no longer employed)
  - "Resigned" (no longer employed)
  - "Terminated" (no longer employed)
  - "Dismissed" (no longer employed)
- **Acceptance Criteria:**
  - AC-001: "On Probation" allowed
  - AC-002: All ineligible statuses rejected with clear error message
  - AC-003: Error message states reason (e.g., "Employee already confirmed")
  - AC-004: Validation occurs before request creation
- **Business Rule:** BR-CONF-003 (Employee status eligibility)
- **Traceability:** BRD Objective 3 (Data integrity), Use Case UC-CONF-001

**REQ-CONF-FR-003: Probation Duration Validation**
- **Priority:** Critical
- **Description:** System shall validate minimum probation period before confirmation
- **Calculation:** Current date - employmentDate >= 12 months
- **Processing:**
  - Retrieve employee employmentDate
  - Calculate months elapsed
  - Reject if < 12 months
- **Acceptance Criteria:**
  - AC-001: Employees with >=12 months probation allowed
  - AC-002: Employees with <12 months rejected
  - AC-003: Error message shows months elapsed and required
  - AC-004: Calculation accurate to the day
- **Business Rule:** BR-CONF-001 (Minimum 12-month probation)
- **Traceability:** BRD Objective 3 (Policy compliance), Use Case UC-CONF-001

**REQ-CONF-FR-004: Document Upload Requirement**
- **Priority:** High
- **Description:** System shall require supporting documents for confirmation requests
- **Minimum Documents:** 1
- **Recommended Documents:**
  - Performance appraisal
  - Supervisor recommendation
  - Training completion certificate (if applicable)
- **Processing:**
  - Validate documents array not empty
  - Validate each document is valid MinIO object key
  - Store document URLs in request record
- **Acceptance Criteria:**
  - AC-001: At least 1 document required
  - AC-002: All document URLs must be valid
  - AC-003: Documents accessible to authorized users
  - AC-004: Documents displayed in request detail view
  - AC-005: Invalid document URL rejected with error
- **Business Rule:** BR-CONF-004 (Document evidence required)
- **Traceability:** BRD Objective 1 (Document management), Use Case UC-CONF-001

#### 5.4.2 Confirmation Request Review and Approval

**REQ-CONF-FR-005: HRMO/HHRMD Review Confirmation**
- **Priority:** Critical
- **Description:** System shall allow HRMO/HHRMD to review confirmation requests
- **API Endpoint:** `PATCH /api/confirmations/{id}`
- **Authorized Roles:** HRMO, HHRMD
- **Actions:**
  - Approve
  - Reject (with reason)
  - Send back for correction
- **Request Body:**
```json
{
  "status": "Approved by HRMO" | "Rejected by HRMO" | "Sent Back for Correction",
  "rejectionReason": string (required if rejected),
  "reviewedById": string (required),
  "decisionDate": DateTime (required)
}
```
- **Acceptance Criteria:**
  - AC-001: Only HRMO/HHRMD can review
  - AC-002: Rejection requires reason (min 20 chars)
  - AC-003: Status updated correctly
  - AC-004: reviewedById and decisionDate recorded
  - AC-005: Notification sent to HRO
  - AC-006: Cannot review own submission
  - AC-007: Review logged in audit trail
- **Business Rule:** BR-CONF-005 (HRMO/HHRMD approval authority)
- **Traceability:** BRD Objective 2 (Workflow automation), Use Case UC-CONF-002

**REQ-CONF-FR-006: Commission Approval**
- **Priority:** Critical
- **Description:** System shall track Commission approval decisions
- **Status Transition:** "Request Received – Awaiting Commission Decision" → "Approved by Commission" | "Rejected by Commission"
- **Update Fields:**
  - commissionDecisionDate
  - commissionDecision ("Approved" | "Rejected")
  - status ("Approved by Commission" | "Rejected by Commission")
- **Acceptance Criteria:**
  - AC-001: Commission decision date recorded
  - AC-002: Decision clearly marked as approved or rejected
  - AC-003: Status updated to final state
  - AC-004: Notification sent to HRO and employee
  - AC-005: Decision logged in audit trail
- **Business Rule:** BR-CONF-006 (Commission final authority)
- **Traceability:** BRD Objective 2 (Governance compliance), Use Case UC-CONF-003

**REQ-CONF-FR-007: Employee Status Update on Approval**
- **Priority:** Critical
- **Description:** System shall update employee status to "Confirmed" upon approval
- **Trigger:** Confirmation request approved by Commission
- **Processing:**
  1. Update employee status from "On Probation" to "Confirmed"
  2. Set confirmationDate to current date
  3. Update employee record
- **Acceptance Criteria:**
  - AC-001: Employee status changes only when approved
  - AC-002: confirmationDate set to approval date
  - AC-003: Status change reflected immediately
  - AC-004: Rejected requests do NOT change employee status
  - AC-005: Status change logged in audit trail
- **Business Rule:** BR-CONF-006 (Status updated only when APPROVED)
- **Traceability:** BRD Objective 2 (Data accuracy), Use Case UC-CONF-003

#### 5.4.3 Confirmation Request Listing and Filtering

**REQ-CONF-FR-008: List Confirmation Requests**
- **Priority:** High
- **Description:** System shall display list of confirmation requests with filters
- **API Endpoint:** `GET /api/confirmations`
- **Query Parameters:**
  - page, size (pagination)
  - status (filter by status)
  - institutionId (filter by institution)
  - employeeId (filter by employee)
- **Processing:**
  - Apply role-based institution filter (HRO/HRRP = own institution)
  - Apply status filter
  - Include employee and institution relations
  - Paginate results
- **Acceptance Criteria:**
  - AC-001: HRO/HRRP see only their institution's requests
  - AC-002: HHRMD/HRMO/CSCS see all institutions
  - AC-003: Status filter works correctly
  - AC-004: Each request includes employee name, institution
  - AC-005: Pagination works correctly
  - AC-006: Results sorted by updatedAt (newest first)
- **Business Rule:** BR-CONF-008 (Role-based access)
- **Traceability:** BRD Objective 2 (Request tracking), Use Case UC-CONF-004

**REQ-CONF-FR-009: Confirmation Request Status Filters**
- **Priority:** Medium
- **Description:** System shall filter confirmation requests by status
- **Status Values:**
  - "Pending HRMO Review"
  - "Pending HRMO/HHRMD Review"
  - "Sent Back for Correction"
  - "Rejected by HRMO"
  - "Rejected by HHRMD"
  - "Request Received – Awaiting Commission Decision"
  - "Approved by Commission"
  - "Rejected by Commission"
  - "Request Concluded"
- **Acceptance Criteria:**
  - AC-001: All status values supported
  - AC-002: Filter returns exact matches
  - AC-003: Multiple statuses can be combined (OR logic)
  - AC-004: Invalid status returns 400 Bad Request
- **Business Rule:** BR-CONF-009 (Status-based tracking)
- **Traceability:** BRD Objective 2 (Efficient filtering), Use Case UC-CONF-005

---

### 5.5 Promotion Request Module (PROM)

#### 5.5.1 Promotion Request Submission

**REQ-PROM-FR-001: Create Promotion Request**
- **Priority:** Critical
- **Description:** System shall allow HRO/HRRP to submit promotion requests
- **API Endpoint:** `POST /api/promotions`
- **Request Body:**
```json
{
  "employeeId": string (required),
  "submittedById": string (required),
  "promotionType": "Experience" | "EducationAdvancement" (required),
  "proposedCadre": string (required for Experience),
  "studiedOutsideCountry": boolean (default: false),
  "documents": [string] (required, min 1)
}
```
- **Processing:**
  1. Validate user role (HRO/HRRP only)
  2. Validate employee exists and belongs to user's institution
  3. Validate employee status = "Confirmed"
  4. Validate promotionType is valid
  5. Validate documents based on type:
     - Experience: 3 performance appraisals + CSC form + letter
     - Education: Certificate + TCU form (if outside) + letter
  6. Create promotion request with status "Pending HRMO/HHRMD Review"
  7. Generate unique request ID (PROM-{InstitutionCode}-{YYYY}-{NNNNNN})
  8. Create notification for HRMO/HHRMD
- **Acceptance Criteria:**
  - AC-001: Only HRO/HRRP can submit
  - AC-002: Employee must be "Confirmed"
  - AC-003: promotionType required
  - AC-004: proposedCadre required for Experience promotions
  - AC-005: Minimum documents validated by type
  - AC-006: Request ID format correct
  - AC-007: Notification sent to reviewers
  - AC-008: Request logged in audit trail
- **Business Rule:** BR-PROM-001 (Only confirmed employees promotable)
- **Business Rule:** BR-PROM-002 (Promotion types: Experience, Education)
- **Traceability:** BRD Objective 2 (Automate promotions), Use Case UC-PROM-001

**REQ-PROM-FR-002: Experience-Based Promotion Requirements**
- **Priority:** Critical
- **Description:** System shall enforce requirements for experience-based promotions
- **Required Documents (minimum 5):**
  1. Performance appraisal Year 1
  2. Performance appraisal Year 2
  3. Performance appraisal Year 3
  4. CSC promotion form
  5. Letter of request
- **Required Fields:**
  - proposedCadre (new cadre/position)
  - studiedOutsideCountry flag
- **Acceptance Criteria:**
  - AC-001: Minimum 5 documents required
  - AC-002: proposedCadre cannot be empty
  - AC-003: Clear error if documents insufficient
  - AC-004: Document labels shown (Y1, Y2, Y3, Form, Letter)
- **Business Rule:** BR-PROM-003 (Experience promotion = 3 years appraisals)
- **Traceability:** BRD Objective 3 (Policy compliance), Use Case UC-PROM-001

**REQ-PROM-FR-003: Education-Based Promotion Requirements**
- **Priority:** Critical
- **Description:** System shall enforce requirements for education-based promotions
- **Required Documents (minimum 2-3):**
  1. Academic certificate (required)
  2. TCU verification form (required if studied outside country)
  3. Letter of request (required)
- **Required Fields:**
  - studiedOutsideCountry (boolean)
- **Processing:**
  - If studiedOutsideCountry = true, require TCU form
  - Validate certificate is valid document URL
- **Acceptance Criteria:**
  - AC-001: Certificate required
  - AC-002: TCU form required if studiedOutsideCountry = true
  - AC-003: Letter of request required
  - AC-004: Clear error if required documents missing
  - AC-005: studiedOutsideCountry flag recorded
- **Business Rule:** BR-PROM-004 (Education promotion requires qualification)
- **Business Rule:** BR-PROM-005 (TCU verification for foreign degrees)
- **Traceability:** BRD Objective 3 (Qualification verification), Use Case UC-PROM-001

**REQ-PROM-FR-004: Employee Status Validation for Promotion**
- **Priority:** Critical
- **Description:** System shall validate employee eligibility for promotion
- **Eligible Status:** "Confirmed"
- **Ineligible Statuses:**
  - "On Probation" (must be confirmed first)
  - "On LWOP" (cannot promote while on leave)
  - "Retired" (no longer employed)
  - "Resigned" (no longer employed)
  - "Terminated" (no longer employed)
  - "Dismissed" (no longer employed)
- **Acceptance Criteria:**
  - AC-001: Only "Confirmed" employees allowed
  - AC-002: All ineligible statuses rejected
  - AC-003: Error message states reason
  - AC-004: Validation before request creation
- **Business Rule:** BR-PROM-001 (Only confirmed employees)
- **Traceability:** BRD Objective 3 (Data integrity), Use Case UC-PROM-001

#### 5.5.2 Promotion Request Review and Approval

**REQ-PROM-FR-005: HRMO/HHRMD Review Promotion**
- **Priority:** Critical
- **Description:** System shall allow HRMO/HHRMD to review promotion requests
- **API Endpoint:** `PATCH /api/promotions/{id}`
- **Authorized Roles:** HRMO, HHRMD
- **Actions:**
  - Approve
  - Reject (with reason)
  - Request correction
- **Request Body:**
```json
{
  "status": string (new status),
  "rejectionReason": string (if rejected, min 20 chars),
  "reviewedById": string (required),
  "decisionDate": DateTime (required)
}
```
- **Acceptance Criteria:**
  - AC-001: Only HRMO/HHRMD can review
  - AC-002: Rejection requires reason
  - AC-003: Status updated correctly
  - AC-004: reviewedById and decisionDate recorded
  - AC-005: Notification sent to HRO
  - AC-006: Cannot review own submission
  - AC-007: Review logged in audit trail
- **Business Rule:** BR-PROM-006 (HRMO/HHRMD approval authority)
- **Traceability:** BRD Objective 2 (Approval workflow), Use Case UC-PROM-002

**REQ-PROM-FR-006: Commission Approval for Promotions**
- **Priority:** Critical
- **Description:** System shall track Commission approval for promotions
- **Status Transition:** "Request Received – Awaiting Commission Decision" → "Approved by Commission" | "Rejected by Commission"
- **Update Fields:**
  - commissionDecisionDate
  - commissionDecision
  - status
- **Acceptance Criteria:**
  - AC-001: Commission decision recorded
  - AC-002: Decision date captured
  - AC-003: Final status set
  - AC-004: Notifications sent
  - AC-005: Decision logged in audit trail
- **Business Rule:** BR-PROM-007 (Commission final authority)
- **Traceability:** BRD Objective 2 (Governance), Use Case UC-PROM-003

#### 5.5.3 Promotion Form Template Management

**REQ-PROM-FR-007: Download Promotion Form Template**
- **Priority:** High
- **Description:** System shall provide downloadable promotion form template
- **API Endpoint:** `GET /api/promotion-form-template/download`
- **Authorized Roles:** HRO, HRRP
- **Processing:**
  - Retrieve current form template from MinIO
  - Return file for download
- **Acceptance Criteria:**
  - AC-001: Only HRO/HRRP can download
  - AC-002: Returns latest template version
  - AC-003: File downloads correctly (PDF/Word format)
  - AC-004: 404 if no template uploaded
- **Business Rule:** BR-PROM-008 (Standardized promotion form)
- **Traceability:** BRD Objective 5 (Ease of use), Use Case UC-PROM-004

**REQ-PROM-FR-008: Upload Promotion Form Template**
- **Priority:** Medium
- **Description:** System shall allow HHRMD to upload/update promotion form template
- **API Endpoint:** `POST /api/promotion-form-template/upload`
- **Authorized Roles:** HHRMD only
- **Processing:**
  - Validate file format (PDF/Word)
  - Upload to MinIO
  - Update template reference
- **Acceptance Criteria:**
  - AC-001: Only HHRMD can upload
  - AC-002: Accepts PDF/Word formats
  - AC-003: Replaces old template
  - AC-004: Upload logged in audit trail
- **Business Rule:** BR-PROM-009 (HHRMD manages templates)
- **Traceability:** BRD Objective 15 (Administration), Use Case UC-PROM-005

#### 5.5.4 Promotion Request Listing and Filtering

**REQ-PROM-FR-009: List Promotion Requests**
- **Priority:** High
- **Description:** System shall display list of promotion requests
- **API Endpoint:** `GET /api/promotions`
- **Query Parameters:**
  - page, size
  - status
  - promotionType
  - institutionId
- **Processing:**
  - Apply role-based filters
  - Include employee, institution relations
  - Paginate results
- **Acceptance Criteria:**
  - AC-001: HRO/HRRP see own institution only
  - AC-002: HHRMD/HRMO/CSCS see all
  - AC-003: Filters work correctly
  - AC-004: Pagination functional
  - AC-005: Sorted by updatedAt descending
- **Business Rule:** BR-PROM-010 (Role-based access)
- **Traceability:** BRD Objective 2 (Request tracking), Use Case UC-PROM-006

**REQ-PROM-FR-010: Filter by Promotion Type**
- **Priority:** Medium
- **Description:** System shall filter promotions by type
- **Types:**
  - "Experience"
  - "EducationAdvancement"
- **Acceptance Criteria:**
  - AC-001: Both types filterable
  - AC-002: Filter returns exact matches
  - AC-003: Can combine with status filter
- **Business Rule:** BR-PROM-011 (Type-based filtering)
- **Traceability:** BRD Objective 2 (Reporting), Use Case UC-PROM-007

---


### 5.6 Leave Without Pay (LWOP) Request Module

#### 5.6.1 LWOP Request Submission

**REQ-LWOP-FR-001: Create LWOP Request**
- **Priority:** Critical
- **Description:** System shall allow HRO/HRRP to submit Leave Without Pay requests
- **API Endpoint:** `POST /api/lwop`
- **Request Body:**
```json
{
  "employeeId": string (required),
  "submittedById": string (required),
  "duration": string (required, e.g., "3 months", "6 months"),
  "reason": string (required, min 20 chars),
  "startDate": DateTime (required),
  "endDate": DateTime (required),
  "documents": [string] (required, min 1)
}
```
- **Processing:**
  1. Validate user role (HRO/HRRP only)
  2. Validate employee exists and belongs to user's institution
  3. Validate employee status (Confirmed or On Probation allowed)
  4. Validate employee NOT already on LWOP
  5. Validate date range (endDate > startDate)
  6. Validate duration matches date range
  7. Create LWOP request with status "Pending HRMO Review"
  8. Generate unique request ID (LWOP-{InstitutionCode}-{YYYY}-{NNNNNN})
  9. Create notification for HRMO
- **Acceptance Criteria:**
  - AC-001: Only HRO/HRRP can submit
  - AC-002: Employee must be "Confirmed" or "On Probation"
  - AC-003: Cannot submit if employee already "On LWOP"
  - AC-004: endDate must be after startDate
  - AC-005: duration required (text description)
  - AC-006: reason required (min 20 chars)
  - AC-007: At least 1 document required
  - AC-008: Request ID format correct
  - AC-009: Notification sent to HRMO
  - AC-010: Request logged in audit trail
- **Business Rule:** BR-LWOP-001 (LWOP available for Confirmed and On Probation)
- **Business Rule:** BR-LWOP-002 (Cannot grant LWOP if already on LWOP)
- **Traceability:** BRD Objective 2 (Automate LWOP), Use Case UC-LWOP-001

**REQ-LWOP-FR-002: Employee Status Validation for LWOP**
- **Priority:** Critical
- **Description:** System shall validate employee eligibility for LWOP
- **Eligible Statuses:**
  - "Confirmed"
  - "On Probation"
- **Ineligible Statuses:**
  - "On LWOP" (already on leave)
  - "Retired" (no longer employed)
  - "Resigned" (no longer employed)
  - "Terminated" (no longer employed)
  - "Dismissed" (no longer employed)
- **Acceptance Criteria:**
  - AC-001: "Confirmed" and "On Probation" allowed
  - AC-002: All ineligible statuses rejected
  - AC-003: Error message states reason
  - AC-004: Validation before request creation
- **Business Rule:** BR-LWOP-001 (Employee status eligibility)
- **Traceability:** BRD Objective 3 (Data integrity), Use Case UC-LWOP-001

**REQ-LWOP-FR-003: LWOP Date Range Validation**
- **Priority:** High
- **Description:** System shall validate LWOP start and end dates
- **Validation Rules:**
  - startDate required
  - endDate required
  - endDate must be after startDate
  - startDate should not be in the past (warning, not error)
  - Maximum duration: 24 months (configurable)
- **Acceptance Criteria:**
  - AC-001: endDate > startDate enforced
  - AC-002: Both dates required
  - AC-003: Invalid date range rejected
  - AC-004: Warning shown if startDate in past
  - AC-005: Duration calculated automatically
- **Business Rule:** BR-LWOP-003 (Valid date range required)
- **Traceability:** BRD Objective 3 (Data validation), Use Case UC-LWOP-001

**REQ-LWOP-FR-004: LWOP Duration Field**
- **Priority:** Medium
- **Description:** System shall capture LWOP duration in human-readable format
- **Format:** Free text (e.g., "3 months", "6 months", "1 year")
- **Acceptance Criteria:**
  - AC-001: Duration field required
  - AC-002: Accepts text format
  - AC-003: Duration shown in request details
  - AC-004: Duration should reasonably match date range
- **Business Rule:** BR-LWOP-004 (Duration documentation required)
- **Traceability:** BRD Objective 1 (Complete information), Use Case UC-LWOP-001

#### 5.6.2 LWOP Request Review and Approval

**REQ-LWOP-FR-005: HRMO/HHRMD Review LWOP**
- **Priority:** Critical
- **Description:** System shall allow HRMO/HHRMD to review LWOP requests
- **API Endpoint:** `PATCH /api/lwop/{id}`
- **Authorized Roles:** HRMO, HHRMD
- **Actions:**
  - Approve
  - Reject (with reason)
  - Send back for correction
- **Request Body:**
```json
{
  "status": string (new status),
  "rejectionReason": string (if rejected, min 20 chars),
  "reviewedById": string (required),
  "decisionDate": DateTime (required)
}
```
- **Acceptance Criteria:**
  - AC-001: Only HRMO/HHRMD can review
  - AC-002: Rejection requires reason
  - AC-003: Status updated correctly
  - AC-004: reviewedById and decisionDate recorded
  - AC-005: Notification sent to HRO
  - AC-006: Cannot review own submission
  - AC-007: Review logged in audit trail
- **Business Rule:** BR-LWOP-005 (HRMO/HHRMD approval authority)
- **Traceability:** BRD Objective 2 (Approval workflow), Use Case UC-LWOP-002

**REQ-LWOP-FR-006: Employee Status Update on LWOP Approval**
- **Priority:** Critical
- **Description:** System shall update employee status to "On LWOP" upon approval
- **Trigger:** LWOP request approved by HHRMD/Commission
- **Processing:**
  1. Update employee status to "On LWOP"
  2. Record LWOP start and end dates
  3. Update employee record immediately
- **Acceptance Criteria:**
  - AC-001: Employee status changes only when approved
  - AC-002: Status change reflected immediately
  - AC-003: Rejected requests do NOT change status
  - AC-004: LWOP dates stored in employee record
  - AC-005: Status change logged in audit trail
- **Business Rule:** BR-LWOP-006 (Status updated only when APPROVED)
- **Traceability:** BRD Objective 2 (Data accuracy), Use Case UC-LWOP-003

#### 5.6.3 LWOP Request Listing and Filtering

**REQ-LWOP-FR-007: List LWOP Requests**
- **Priority:** High
- **Description:** System shall display list of LWOP requests
- **API Endpoint:** `GET /api/lwop`
- **Query Parameters:**
  - page, size (pagination)
  - status (filter)
  - institutionId (filter)
  - employeeId (filter)
- **Processing:**
  - Apply role-based institution filter
  - Include employee and institution relations
  - Paginate results
- **Acceptance Criteria:**
  - AC-001: HRO/HRRP see only their institution
  - AC-002: HHRMD/HRMO/CSCS see all institutions
  - AC-003: Status filter works
  - AC-004: Each request includes employee name, duration, dates
  - AC-005: Pagination functional
  - AC-006: Sorted by updatedAt descending
- **Business Rule:** BR-LWOP-007 (Role-based access)
- **Traceability:** BRD Objective 2 (Request tracking), Use Case UC-LWOP-004

**REQ-LWOP-FR-008: LWOP Status Filters**
- **Priority:** Medium
- **Description:** System shall filter LWOP requests by status
- **Status Values:**
  - "Pending HRMO Review"
  - "Pending HRMO/HHRMD Review"
  - "Sent Back for Correction"
  - "Rejected by HRMO"
  - "Rejected by HHRMD"
  - "Request Received – Awaiting Commission Decision"
  - "Approved by Commission"
  - "Rejected by Commission"
  - "Request Concluded"
- **Acceptance Criteria:**
  - AC-001: All status values supported
  - AC-002: Exact match filtering
  - AC-003: Invalid status returns 400 Bad Request
- **Business Rule:** BR-LWOP-008 (Status-based tracking)
- **Traceability:** BRD Objective 2 (Efficient filtering), Use Case UC-LWOP-005

---

### 5.7 Cadre Change Request Module

#### 5.7.1 Cadre Change Request Submission

**REQ-CADR-FR-001: Create Cadre Change Request**
- **Priority:** High
- **Description:** System shall allow HRO/HRRP to submit cadre change requests
- **API Endpoint:** `POST /api/cadre-change`
- **Request Body:**
```json
{
  "employeeId": string (required),
  "submittedById": string (required),
  "newCadre": string (required, min 3 chars),
  "originalCadre": string (optional),
  "reason": string (optional),
  "studiedOutsideCountry": boolean (default: false),
  "documents": [string] (required, min 1)
}
```
- **Processing:**
  1. Validate user role (HRO/HRRP only)
  2. Validate employee exists and belongs to user's institution
  3. Validate employee status (Confirmed or On Probation allowed)
  4. Validate newCadre not empty
  5. Auto-populate originalCadre from employee record if not provided
  6. Create cadre change request with status "Pending HRMO Review"
  7. Generate unique request ID (CADR-{InstitutionCode}-{YYYY}-{NNNNNN})
  8. Create notification for HHRMD (only HHRMD approves cadre changes)
- **Acceptance Criteria:**
  - AC-001: Only HRO/HRRP can submit
  - AC-002: Employee must be "Confirmed" or "On Probation"
  - AC-003: newCadre required (min 3 chars)
  - AC-004: originalCadre populated from employee if not provided
  - AC-005: At least 1 document required
  - AC-006: Request ID format correct
  - AC-007: Notification sent to HHRMD
  - AC-008: Request logged in audit trail
- **Business Rule:** BR-CADR-001 (Cadre change for Confirmed/On Probation)
- **Business Rule:** BR-CADR-002 (HHRMD exclusive approval authority)
- **Traceability:** BRD Objective 2 (Automate cadre changes), Use Case UC-CADR-001

**REQ-CADR-FR-002: Employee Status Validation for Cadre Change**
- **Priority:** Critical
- **Description:** System shall validate employee eligibility for cadre change
- **Eligible Statuses:**
  - "Confirmed"
  - "On Probation"
- **Ineligible Statuses:**
  - "On LWOP" (cannot change while on leave)
  - "Retired" (no longer employed)
  - "Resigned" (no longer employed)
  - "Terminated" (no longer employed)
  - "Dismissed" (no longer employed)
- **Acceptance Criteria:**
  - AC-001: "Confirmed" and "On Probation" allowed
  - AC-002: All ineligible statuses rejected
  - AC-003: Error message states reason
  - AC-004: Validation before request creation
- **Business Rule:** BR-CADR-001 (Employee status eligibility)
- **Traceability:** BRD Objective 3 (Data integrity), Use Case UC-CADR-001

**REQ-CADR-FR-003: New Cadre Validation**
- **Priority:** High
- **Description:** System shall validate new cadre field
- **Validation Rules:**
  - newCadre required
  - Minimum 3 characters
  - Maximum 100 characters
  - Should differ from originalCadre (warning, not error)
- **Acceptance Criteria:**
  - AC-001: newCadre required and validated
  - AC-002: Length constraints enforced
  - AC-003: Warning if newCadre same as originalCadre
  - AC-004: Empty newCadre rejected
- **Business Rule:** BR-CADR-003 (New cadre must be specified)
- **Traceability:** BRD Objective 3 (Data validation), Use Case UC-CADR-001

**REQ-CADR-FR-004: Foreign Study Flag for Cadre Change**
- **Priority:** Medium
- **Description:** System shall track if cadre change involves foreign qualifications
- **Field:** studiedOutsideCountry (boolean)
- **Purpose:** Indicates if TCU verification required
- **Acceptance Criteria:**
  - AC-001: Flag stored with request
  - AC-002: Defaults to false
  - AC-003: If true, additional documents expected
  - AC-004: Flag displayed in request details
- **Business Rule:** BR-CADR-004 (TCU verification for foreign qualifications)
- **Traceability:** BRD Objective 3 (Qualification verification), Use Case UC-CADR-001

#### 5.7.2 Cadre Change Request Review and Approval

**REQ-CADR-FR-005: HHRMD Review Cadre Change**
- **Priority:** Critical
- **Description:** System shall allow HHRMD to review cadre change requests
- **API Endpoint:** `PATCH /api/cadre-change/{id}`
- **Authorized Roles:** HHRMD only (NOT HRMO)
- **Actions:**
  - Approve
  - Reject (with reason)
  - Send back for correction
- **Request Body:**
```json
{
  "status": string (new status),
  "rejectionReason": string (if rejected, min 20 chars),
  "reviewedById": string (required),
  "decisionDate": DateTime (required)
}
```
- **Acceptance Criteria:**
  - AC-001: Only HHRMD can review (HRMO blocked)
  - AC-002: Rejection requires reason
  - AC-003: Status updated correctly
  - AC-004: reviewedById and decisionDate recorded
  - AC-005: Notification sent to HRO
  - AC-006: Cannot review own submission
  - AC-007: Review logged in audit trail
  - AC-008: HRMO attempting review returns 403 Forbidden
- **Business Rule:** BR-CADR-002 (HHRMD exclusive approval)
- **Traceability:** BRD Objective 2 (Approval workflow), Use Case UC-CADR-002

**REQ-CADR-FR-006: Commission Approval for Cadre Change**
- **Priority:** Critical
- **Description:** System shall track Commission approval for cadre changes
- **Status Transition:** "Request Received – Awaiting Commission Decision" → "Approved by Commission" | "Rejected by Commission"
- **Update Fields:**
  - commissionDecisionDate
  - commissionDecision
  - status
- **Acceptance Criteria:**
  - AC-001: Commission decision recorded
  - AC-002: Decision date captured
  - AC-003: Final status set
  - AC-004: Notifications sent
  - AC-005: Decision logged in audit trail
- **Business Rule:** BR-CADR-005 (Commission final authority)
- **Traceability:** BRD Objective 2 (Governance), Use Case UC-CADR-003

**REQ-CADR-FR-007: Employee Cadre Update on Approval**
- **Priority:** Critical
- **Description:** System shall update employee cadre upon approval
- **Trigger:** Cadre change request approved by Commission
- **Processing:**
  1. Update employee.cadre to newCadre value
  2. Record update timestamp
  3. Update employee record immediately
- **Acceptance Criteria:**
  - AC-001: Employee cadre changes only when approved
  - AC-002: Cadre update reflected immediately
  - AC-003: Rejected requests do NOT update cadre
  - AC-004: Old cadre value preserved in request record
  - AC-005: Cadre change logged in audit trail
- **Business Rule:** BR-CADR-006 (Cadre updated only when APPROVED)
- **Traceability:** BRD Objective 2 (Data accuracy), Use Case UC-CADR-003

#### 5.7.3 Cadre Change Request Listing and Filtering

**REQ-CADR-FR-008: List Cadre Change Requests**
- **Priority:** High
- **Description:** System shall display list of cadre change requests
- **API Endpoint:** `GET /api/cadre-change`
- **Query Parameters:**
  - page, size
  - status
  - institutionId
  - employeeId
- **Processing:**
  - Apply role-based filters
  - Include employee and institution relations
  - Paginate results
- **Acceptance Criteria:**
  - AC-001: HRO/HRRP see own institution only
  - AC-002: HHRMD/CSCS see all institutions
  - AC-003: Each request shows originalCadre → newCadre
  - AC-004: Pagination functional
  - AC-005: Sorted by updatedAt descending
- **Business Rule:** BR-CADR-007 (Role-based access)
- **Traceability:** BRD Objective 2 (Request tracking), Use Case UC-CADR-004

---

### 5.8 Service Extension Request Module

#### 5.8.1 Service Extension Request Submission

**REQ-SEXT-FR-001: Create Service Extension Request**
- **Priority:** High
- **Description:** System shall allow HRO/HRRP to submit service extension requests
- **API Endpoint:** `POST /api/service-extension`
- **Request Body:**
```json
{
  "employeeId": string (required),
  "submittedById": string (required),
  "currentRetirementDate": DateTime (required),
  "requestedExtensionPeriod": string (required, e.g., "1 year", "2 years"),
  "justification": string (required, min 50 chars),
  "documents": [string] (required, min 1)
}
```
- **Processing:**
  1. Validate user role (HRO/HRRP only)
  2. Validate employee exists and belongs to user's institution
  3. Validate employee approaching retirement (has retirementDate)
  4. Validate employee NOT already "Retired"
  5. Validate justification length (min 50 chars)
  6. Create service extension request with status "Pending HRMO/HHRMD Review"
  7. Generate unique request ID (SEXT-{InstitutionCode}-{YYYY}-{NNNNNN})
  8. Create notification for HRMO/HHRMD
- **Acceptance Criteria:**
  - AC-001: Only HRO/HRRP can submit
  - AC-002: Employee must have retirementDate set
  - AC-003: Employee cannot be "Retired" or "On Probation"
  - AC-004: currentRetirementDate required
  - AC-005: requestedExtensionPeriod required
  - AC-006: justification required (min 50 chars)
  - AC-007: At least 1 document required
  - AC-008: Request ID format correct
  - AC-009: Notification sent to HRMO/HHRMD
  - AC-010: Request logged in audit trail
- **Business Rule:** BR-SEXT-001 (Service extension for employees approaching retirement)
- **Business Rule:** BR-SEXT-002 (Not available for probationary employees)
- **Traceability:** BRD Objective 2 (Automate service extensions), Use Case UC-SEXT-001

**REQ-SEXT-FR-002: Employee Status Validation for Service Extension**
- **Priority:** Critical
- **Description:** System shall validate employee eligibility for service extension
- **Eligible Statuses:**
  - "Confirmed" (approaching retirement)
- **Required Conditions:**
  - Employee must have retirementDate set
  - Employee must NOT be already retired
- **Ineligible Statuses:**
  - "On Probation" (ineligible for service extension)
  - "Retired" (already retired)
  - "Resigned" (no longer employed)
  - "Terminated" (no longer employed)
  - "Dismissed" (no longer employed)
- **Acceptance Criteria:**
  - AC-001: Only "Confirmed" with retirementDate allowed
  - AC-002: "On Probation" explicitly rejected
  - AC-003: Already "Retired" rejected
  - AC-004: Error message states reason
  - AC-005: Validation before request creation
- **Business Rule:** BR-SEXT-002 (Status eligibility)
- **Traceability:** BRD Objective 3 (Data integrity), Use Case UC-SEXT-001

**REQ-SEXT-FR-003: Current Retirement Date Validation**
- **Priority:** High
- **Description:** System shall validate current retirement date
- **Validation Rules:**
  - currentRetirementDate required
  - Must match employee.retirementDate (or close)
  - Should be in the future or recent past
- **Acceptance Criteria:**
  - AC-001: currentRetirementDate required
  - AC-002: Warning if significantly differs from employee.retirementDate
  - AC-003: Date stored for record purposes
- **Business Rule:** BR-SEXT-003 (Retirement date verification)
- **Traceability:** BRD Objective 3 (Data accuracy), Use Case UC-SEXT-001

**REQ-SEXT-FR-004: Extension Period Specification**
- **Priority:** High
- **Description:** System shall capture requested extension period
- **Format:** Free text (e.g., "1 year", "2 years", "6 months")
- **Acceptance Criteria:**
  - AC-001: requestedExtensionPeriod required
  - AC-002: Accepts text format
  - AC-003: Displayed in request details
  - AC-004: No maximum limit enforced (Commission decision)
- **Business Rule:** BR-SEXT-004 (Extension period documentation)
- **Traceability:** BRD Objective 1 (Complete information), Use Case UC-SEXT-001

**REQ-SEXT-FR-005: Justification Requirement**
- **Priority:** High
- **Description:** System shall require detailed justification for service extension
- **Validation:**
  - justification required
  - Minimum 50 characters
  - Maximum 2000 characters
- **Acceptance Criteria:**
  - AC-001: justification required (min 50 chars)
  - AC-002: Length constraints enforced
  - AC-003: Empty or too short justification rejected
  - AC-004: Justification displayed in request details
- **Business Rule:** BR-SEXT-005 (Justification required for extension)
- **Traceability:** BRD Objective 3 (Policy compliance), Use Case UC-SEXT-001

#### 5.8.2 Service Extension Request Review and Approval

**REQ-SEXT-FR-006: HRMO/HHRMD Review Service Extension**
- **Priority:** Critical
- **Description:** System shall allow HRMO/HHRMD to review service extension requests
- **API Endpoint:** `PATCH /api/service-extension/{id}`
- **Authorized Roles:** HRMO, HHRMD
- **Actions:**
  - Approve
  - Reject (with reason)
  - Request more information
- **Request Body:**
```json
{
  "status": string (new status),
  "rejectionReason": string (if rejected, min 20 chars),
  "reviewedById": string (required),
  "decisionDate": DateTime (required)
}
```
- **Acceptance Criteria:**
  - AC-001: Only HRMO/HHRMD can review
  - AC-002: Rejection requires reason
  - AC-003: Status updated correctly
  - AC-004: reviewedById and decisionDate recorded
  - AC-005: Notification sent to HRO
  - AC-006: Cannot review own submission
  - AC-007: Review logged in audit trail
- **Business Rule:** BR-SEXT-006 (HRMO/HHRMD approval authority)
- **Traceability:** BRD Objective 2 (Approval workflow), Use Case UC-SEXT-002

**REQ-SEXT-FR-007: Commission Approval for Service Extension**
- **Priority:** Critical
- **Description:** System shall track Commission approval for service extensions
- **Status Transition:** "Request Received – Awaiting Commission Decision" → "Approved by Commission" | "Rejected by Commission"
- **Update Fields:**
  - commissionDecisionDate
  - commissionDecision
  - status
- **Acceptance Criteria:**
  - AC-001: Commission decision recorded
  - AC-002: Decision date captured
  - AC-003: Final status set
  - AC-004: Notifications sent
  - AC-005: Decision logged in audit trail
- **Business Rule:** BR-SEXT-007 (Commission final authority)
- **Traceability:** BRD Objective 2 (Governance), Use Case UC-SEXT-003

**REQ-SEXT-FR-008: Employee Retirement Date Update on Approval**
- **Priority:** Critical
- **Description:** System shall extend employee retirement date upon approval
- **Trigger:** Service extension approved by Commission
- **Processing:**
  1. Calculate new retirementDate (currentRetirementDate + extension period)
  2. Update employee.retirementDate
  3. Update employee record immediately
- **Acceptance Criteria:**
  - AC-001: Retirement date extended only when approved
  - AC-002: New date calculated correctly
  - AC-003: Rejected requests do NOT change retirementDate
  - AC-004: Old retirementDate preserved in request record
  - AC-005: Date change logged in audit trail
- **Business Rule:** BR-SEXT-008 (Retirement date updated only when APPROVED)
- **Traceability:** BRD Objective 2 (Data accuracy), Use Case UC-SEXT-003

#### 5.8.3 Service Extension Request Listing and Filtering

**REQ-SEXT-FR-009: List Service Extension Requests**
- **Priority:** High
- **Description:** System shall display list of service extension requests
- **API Endpoint:** `GET /api/service-extension`
- **Query Parameters:**
  - page, size
  - status
  - institutionId
  - employeeId
- **Processing:**
  - Apply role-based filters
  - Include employee and institution relations
  - Paginate results
- **Acceptance Criteria:**
  - AC-001: HRO/HRRP see own institution only
  - AC-002: HHRMD/HRMO/CSCS see all institutions
  - AC-003: Each request shows currentRetirementDate, extension period
  - AC-004: Pagination functional
  - AC-005: Sorted by updatedAt descending
- **Business Rule:** BR-SEXT-009 (Role-based access)
- **Traceability:** BRD Objective 2 (Request tracking), Use Case UC-SEXT-004

---

### 5.9 Retirement Request Module

#### 5.9.1 Retirement Request Submission

**REQ-RETR-FR-001: Create Retirement Request**
- **Priority:** Critical
- **Description:** System shall allow HRO/HRRP to submit retirement requests
- **API Endpoint:** `POST /api/retirement`
- **Request Body:**
```json
{
  "employeeId": string (required),
  "submittedById": string (required),
  "retirementType": "compulsory" | "voluntary" | "illness" (required),
  "proposedDate": DateTime (required except for illness),
  "illnessDescription": string (required if illness type, min 50 chars),
  "delayReason": string (optional),
  "documents": [string] (required, min 1)
}
```
- **Processing:**
  1. Validate user role (HRO/HRRP only)
  2. Validate employee exists and belongs to user's institution
  3. Validate employee status (Confirmed or On Probation allowed)
  4. Validate employee NOT already retired/resigned/terminated
  5. Validate retirementType is valid
  6. If illness type, validate illnessDescription provided (min 50 chars)
  7. If not illness type, validate proposedDate provided
  8. Create retirement request with status "Pending HRMO Review"
  9. Generate unique request ID (RETR-{InstitutionCode}-{YYYY}-{NNNNNN})
  10. Create notification for HRMO/HHRMD
- **Acceptance Criteria:**
  - AC-001: Only HRO/HRRP can submit
  - AC-002: Employee must be "Confirmed" or "On Probation"
  - AC-003: Cannot submit if already "Retired"
  - AC-004: retirementType required (compulsory/voluntary/illness)
  - AC-005: proposedDate required for compulsory/voluntary
  - AC-006: illnessDescription required for illness (min 50 chars)
  - AC-007: At least 1 document required
  - AC-008: Request ID format correct
  - AC-009: Notification sent to HRMO/HHRMD
  - AC-010: Request logged in audit trail
- **Business Rule:** BR-RETR-001 (Three retirement types)
- **Business Rule:** BR-RETR-002 (Illness retirement requires description)
- **Traceability:** BRD Objective 2 (Automate retirements), Use Case UC-RETR-001

**REQ-RETR-FR-002: Retirement Type Validation**
- **Priority:** Critical
- **Description:** System shall enforce retirement type-specific requirements
- **Retirement Types:**
  1. **Compulsory:** Age-based mandatory retirement
     - proposedDate required
     - Should align with employee.retirementDate
  2. **Voluntary:** Employee-initiated early retirement
     - proposedDate required
     - No age restriction
  3. **Illness:** Medical grounds retirement
     - illnessDescription required (min 50 chars)
     - proposedDate optional (may use current date)
     - Medical documents required
- **Acceptance Criteria:**
  - AC-001: All three types supported
  - AC-002: Type-specific fields validated
  - AC-003: compulsory/voluntary require proposedDate
  - AC-004: illness requires illnessDescription
  - AC-005: Invalid type rejected
  - AC-006: Error messages specific to type
- **Business Rule:** BR-RETR-001 (Type-specific requirements)
- **Traceability:** BRD Objective 3 (Policy compliance), Use Case UC-RETR-001

**REQ-RETR-FR-003: Employee Status Validation for Retirement**
- **Priority:** Critical
- **Description:** System shall validate employee eligibility for retirement
- **Eligible Statuses:**
  - "Confirmed"
  - "On Probation" (allowed, though unusual)
- **Ineligible Statuses:**
  - "Retired" (already retired)
  - "Resigned" (already separated)
  - "Terminated" (already separated)
  - "Dismissed" (already separated)
- **Acceptance Criteria:**
  - AC-001: "Confirmed" and "On Probation" allowed
  - AC-002: Already separated statuses rejected
  - AC-003: Error message states reason
  - AC-004: Validation before request creation
- **Business Rule:** BR-RETR-003 (Status eligibility)
- **Traceability:** BRD Objective 3 (Data integrity), Use Case UC-RETR-001

**REQ-RETR-FR-004: Illness Description Requirement**
- **Priority:** High
- **Description:** System shall require illness description for illness-based retirements
- **Validation:**
  - Required only if retirementType = "illness"
  - Minimum 50 characters
  - Maximum 2000 characters
- **Acceptance Criteria:**
  - AC-001: Required for illness type only
  - AC-002: Length constraints enforced
  - AC-003: Empty/short description rejected
  - AC-004: Description displayed in request details
  - AC-005: Not required for compulsory/voluntary types
- **Business Rule:** BR-RETR-002 (Illness documentation)
- **Traceability:** BRD Objective 3 (Complete information), Use Case UC-RETR-001

**REQ-RETR-FR-005: Proposed Retirement Date**
- **Priority:** High
- **Description:** System shall capture proposed retirement date
- **Validation:**
  - Required for compulsory and voluntary types
  - Optional for illness type
  - Should be future date (warning if past)
  - For compulsory, should match employee.retirementDate
- **Acceptance Criteria:**
  - AC-001: Required for compulsory/voluntary
  - AC-002: Optional for illness
  - AC-003: Warning if date in past
  - AC-004: Validation based on retirement type
- **Business Rule:** BR-RETR-004 (Proposed date based on type)
- **Traceability:** BRD Objective 3 (Data accuracy), Use Case UC-RETR-001

**REQ-RETR-FR-006: Delay Reason Field**
- **Priority:** Medium
- **Description:** System shall capture delay reason if retirement delayed
- **Field:** delayReason (optional text)
- **Purpose:** Document why retirement delayed beyond normal date
- **Acceptance Criteria:**
  - AC-001: Optional field
  - AC-002: Captured if provided
  - AC-003: Displayed in request details
  - AC-004: No minimum length (optional)
- **Business Rule:** BR-RETR-005 (Document delays)
- **Traceability:** BRD Objective 1 (Complete records), Use Case UC-RETR-001

#### 5.9.2 Retirement Request Review and Approval

**REQ-RETR-FR-007: HRMO/HHRMD Review Retirement**
- **Priority:** Critical
- **Description:** System shall allow HRMO/HHRMD to review retirement requests
- **API Endpoint:** `PATCH /api/retirement/{id}`
- **Authorized Roles:** HRMO, HHRMD
- **Actions:**
  - Approve
  - Reject (with reason)
  - Request additional information
- **Request Body:**
```json
{
  "status": string (new status),
  "rejectionReason": string (if rejected, min 20 chars),
  "reviewedById": string (required),
  "decisionDate": DateTime (required)
}
```
- **Acceptance Criteria:**
  - AC-001: Only HRMO/HHRMD can review
  - AC-002: Rejection requires reason
  - AC-003: Status updated correctly
  - AC-004: reviewedById and decisionDate recorded
  - AC-005: Notification sent to HRO
  - AC-006: Cannot review own submission
  - AC-007: Review logged in audit trail
- **Business Rule:** BR-RETR-006 (HRMO/HHRMD approval authority)
- **Traceability:** BRD Objective 2 (Approval workflow), Use Case UC-RETR-002

**REQ-RETR-FR-008: Commission Approval for Retirement**
- **Priority:** Critical
- **Description:** System shall track Commission approval for retirements
- **Status Transition:** "Request Received – Awaiting Commission Decision" → "Approved by Commission" | "Rejected by Commission"
- **Update Fields:**
  - commissionDecisionDate
  - commissionDecision
  - status
- **Acceptance Criteria:**
  - AC-001: Commission decision recorded
  - AC-002: Decision date captured
  - AC-003: Final status set
  - AC-004: Notifications sent
  - AC-005: Decision logged in audit trail
- **Business Rule:** BR-RETR-007 (Commission final authority)
- **Traceability:** BRD Objective 2 (Governance), Use Case UC-RETR-003

**REQ-RETR-FR-009: Employee Status Update on Retirement Approval**
- **Priority:** Critical
- **Description:** System shall update employee status to "Retired" upon approval
- **Trigger:** Retirement request approved by Commission
- **Processing:**
  1. Update employee status to "Retired"
  2. Set retirementDate to proposedDate (or current date if not set)
  3. Update employee record immediately
- **Acceptance Criteria:**
  - AC-001: Employee status changes only when approved
  - AC-002: Status changed to "Retired"
  - AC-003: retirementDate set correctly
  - AC-004: Rejected requests do NOT change status
  - AC-005: Status change logged in audit trail
- **Business Rule:** BR-RETR-008 (Status updated only when APPROVED)
- **Traceability:** BRD Objective 2 (Data accuracy), Use Case UC-RETR-003

#### 5.9.3 Retirement Request Listing and Filtering

**REQ-RETR-FR-010: List Retirement Requests**
- **Priority:** High
- **Description:** System shall display list of retirement requests
- **API Endpoint:** `GET /api/retirement`
- **Query Parameters:**
  - page, size
  - status
  - retirementType
  - institutionId
  - employeeId
- **Processing:**
  - Apply role-based filters
  - Include employee and institution relations
  - Paginate results
- **Acceptance Criteria:**
  - AC-001: HRO/HRRP see own institution only
  - AC-002: HHRMD/HRMO/CSCS see all institutions
  - AC-003: Each request shows type, proposedDate
  - AC-004: Pagination functional
  - AC-005: Sorted by updatedAt descending
- **Business Rule:** BR-RETR-009 (Role-based access)
- **Traceability:** BRD Objective 2 (Request tracking), Use Case UC-RETR-004

**REQ-RETR-FR-011: Filter by Retirement Type**
- **Priority:** Medium
- **Description:** System shall filter retirement requests by type
- **Types:**
  - "compulsory"
  - "voluntary"
  - "illness"
- **Acceptance Criteria:**
  - AC-001: All three types filterable
  - AC-002: Exact match filtering
  - AC-003: Can combine with status filter
  - AC-004: Invalid type returns 400 Bad Request
- **Business Rule:** BR-RETR-010 (Type-based filtering)
- **Traceability:** BRD Objective 2 (Reporting), Use Case UC-RETR-005

---


### 5.10 Resignation Request Module

#### 5.10.1 Resignation Request Submission

**REQ-RESN-FR-001: Create Resignation Request**
- **Priority:** High
- **Description:** System shall allow HRO/HRRP to submit resignation requests
- **API Endpoint:** `POST /api/resignation`
- **Request Body:**
```json
{
  "employeeId": string (required),
  "submittedById": string (required),
  "effectiveDate": DateTime (required),
  "reason": string (optional, max 1000 chars),
  "documents": [string] (required, min 1)
}
```
- **Processing:**
  1. Validate user role (HRO/HRRP only)
  2. Validate employee exists and belongs to user's institution
  3. Validate employee status (Confirmed or On Probation allowed)
  4. Validate employee NOT already resigned/retired/terminated
  5. Validate effectiveDate not in past (warning, not error)
  6. Create resignation request with status "Pending HRMO/HHRMD Review"
  7. Generate unique request ID (RESN-{InstitutionCode}-{YYYY}-{NNNNNN})
  8. Create notification for HRMO/HHRMD
- **Acceptance Criteria:**
  - AC-001: Only HRO/HRRP can submit
  - AC-002: Employee must be "Confirmed" or "On Probation"
  - AC-003: Cannot submit if already "Resigned", "Retired", "Terminated", "Dismissed"
  - AC-004: effectiveDate required
  - AC-005: reason optional
  - AC-006: At least 1 document required
  - AC-007: Request ID format correct
  - AC-008: Notification sent to HRMO/HHRMD
  - AC-009: Request logged in audit trail
- **Business Rule:** BR-RESN-001 (Resignation for active employees)
- **Business Rule:** BR-RESN-002 (3-month or 24-hour notice periods)
- **Traceability:** BRD Objective 2 (Automate resignations), Use Case UC-RESN-001

**REQ-RESN-FR-002: Employee Status Validation for Resignation**
- **Priority:** Critical
- **Description:** System shall validate employee eligibility for resignation
- **Eligible Statuses:**
  - "Confirmed"
  - "On Probation"
- **Ineligible Statuses:**
  - "Resigned" (already resigned)
  - "Retired" (already retired)
  - "Terminated" (already terminated)
  - "Dismissed" (already dismissed)
- **Acceptance Criteria:**
  - AC-001: "Confirmed" and "On Probation" allowed
  - AC-002: Already separated statuses rejected
  - AC-003: Error message states reason
  - AC-004: Validation before request creation
- **Business Rule:** BR-RESN-001 (Status eligibility)
- **Traceability:** BRD Objective 3 (Data integrity), Use Case UC-RESN-001

**REQ-RESN-FR-003: Resignation Effective Date**
- **Priority:** High
- **Description:** System shall capture resignation effective date
- **Validation:**
  - effectiveDate required
  - Should be future date (warning if past)
  - Should allow reasonable notice period
- **Notice Periods (informational, not enforced):**
  - Standard: 3 months notice
  - Special circumstances: 24 hours notice
- **Acceptance Criteria:**
  - AC-001: effectiveDate required
  - AC-002: Warning if date in past
  - AC-003: No maximum future limit
  - AC-004: Date captured for record purposes
- **Business Rule:** BR-RESN-003 (Notice period documentation)
- **Traceability:** BRD Objective 1 (Complete records), Use Case UC-RESN-001

**REQ-RESN-FR-004: Resignation Reason Field**
- **Priority:** Medium
- **Description:** System shall capture resignation reason (optional)
- **Field:** reason (optional text, max 1000 chars)
- **Acceptance Criteria:**
  - AC-001: reason optional
  - AC-002: Max 1000 characters
  - AC-003: Displayed in request details if provided
  - AC-004: Empty reason allowed
- **Business Rule:** BR-RESN-004 (Reason documentation optional)
- **Traceability:** BRD Objective 1 (Complete information), Use Case UC-RESN-001

#### 5.10.2 Resignation Request Review and Approval

**REQ-RESN-FR-005: HRMO/HHRMD Review Resignation**
- **Priority:** Critical
- **Description:** System shall allow HRMO/HHRMD to review resignation requests
- **API Endpoint:** `PATCH /api/resignation/{id}`
- **Authorized Roles:** HRMO, HHRMD
- **Actions:**
  - Approve (forward to Commission)
  - Reject (with reason)
  - Request additional information
- **Request Body:**
```json
{
  "status": string (new status),
  "rejectionReason": string (if rejected, min 20 chars),
  "reviewedById": string (required),
  "decisionDate": DateTime (required)
}
```
- **Acceptance Criteria:**
  - AC-001: Only HRMO/HHRMD can review
  - AC-002: Rejection requires reason
  - AC-003: Status updated correctly
  - AC-004: reviewedById and decisionDate recorded
  - AC-005: Notification sent to HRO
  - AC-006: Cannot review own submission
  - AC-007: Review logged in audit trail
- **Business Rule:** BR-RESN-005 (HRMO/HHRMD review authority)
- **Traceability:** BRD Objective 2 (Approval workflow), Use Case UC-RESN-002

**REQ-RESN-FR-006: Commission Acknowledgment for Resignation**
- **Priority:** High
- **Description:** System shall track Commission acknowledgment of resignations
- **Note:** Resignations typically forwarded for acknowledgment (not approval)
- **Status:** "Forwarded to Commission for Acknowledgment"
- **Final Status:** "Request Concluded"
- **Update Fields:**
  - commissionDecisionDate
  - status
- **Acceptance Criteria:**
  - AC-001: Commission acknowledgment recorded
  - AC-002: Date captured
  - AC-003: Final status set
  - AC-004: Notifications sent
  - AC-005: Acknowledgment logged in audit trail
- **Business Rule:** BR-RESN-006 (Commission acknowledgment)
- **Traceability:** BRD Objective 2 (Governance), Use Case UC-RESN-003

**REQ-RESN-FR-007: Employee Status Update on Resignation Approval**
- **Priority:** Critical
- **Description:** System shall update employee status to "Resigned" upon approval
- **Trigger:** Resignation request approved/acknowledged
- **Processing:**
  1. Update employee status to "Resigned"
  2. Record resignation date
  3. Update employee record immediately
- **Acceptance Criteria:**
  - AC-001: Employee status changes when approved
  - AC-002: Status changed to "Resigned"
  - AC-003: Resignation date recorded
  - AC-004: Rejected requests do NOT change status
  - AC-005: Status change logged in audit trail
- **Business Rule:** BR-RESN-007 (Status updated when APPROVED)
- **Traceability:** BRD Objective 2 (Data accuracy), Use Case UC-RESN-003

#### 5.10.3 Resignation Request Listing and Filtering

**REQ-RESN-FR-008: List Resignation Requests**
- **Priority:** High
- **Description:** System shall display list of resignation requests
- **API Endpoint:** `GET /api/resignation`
- **Query Parameters:**
  - page, size
  - status
  - institutionId
  - employeeId
- **Processing:**
  - Apply role-based filters
  - Include employee and institution relations
  - Paginate results
- **Acceptance Criteria:**
  - AC-001: HRO/HRRP see own institution only
  - AC-002: HHRMD/HRMO/CSCS see all institutions
  - AC-003: Each request shows effectiveDate, reason
  - AC-004: Pagination functional
  - AC-005: Sorted by updatedAt descending
- **Business Rule:** BR-RESN-008 (Role-based access)
- **Traceability:** BRD Objective 2 (Request tracking), Use Case UC-RESN-004

---

### 5.11 Termination and Dismissal Request Module (Separation Request)

#### 5.11.1 Separation Request Submission

**REQ-TERM-FR-001: Create Termination/Dismissal Request**
- **Priority:** High
- **Description:** System shall allow HRO/HRRP to submit termination or dismissal requests
- **API Endpoint:** `POST /api/termination`
- **Request Body:**
```json
{
  "employeeId": string (required),
  "submittedById": string (required),
  "type": "TERMINATION" | "DISMISSAL" (required),
  "reason": string (required, min 50 chars),
  "documents": [string] (required, min 1)
}
```
- **Processing:**
  1. Validate user role (HRO/HRRP only)
  2. Validate employee exists and belongs to user's institution
  3. Validate employee NOT already terminated/dismissed/resigned/retired
  4. Validate type is valid (TERMINATION or DISMISSAL)
  5. Validate reason provided (min 50 chars)
  6. Create separation request with status "Pending DO/HHRMD Review"
  7. Generate unique request ID (TERM-{InstitutionCode}-{YYYY}-{NNNNNN} or DISM-{InstitutionCode}-{YYYY}-{NNNNNN})
  8. Create notification for DO and HHRMD (not HRMO)
- **Acceptance Criteria:**
  - AC-001: Only HRO/HRRP can submit
  - AC-002: Employee cannot be already separated
  - AC-003: type required (TERMINATION or DISMISSAL)
  - AC-004: reason required (min 50 chars)
  - AC-005: At least 1 document required
  - AC-006: Request ID format includes type prefix
  - AC-007: Notification sent to DO and HHRMD (NOT HRMO)
  - AC-008: Request logged in audit trail
- **Business Rule:** BR-TERM-001 (Two separation types: Termination, Dismissal)
- **Business Rule:** BR-TERM-002 (DO and HHRMD review authority)
- **Traceability:** BRD Objective 2 (Automate separations), Use Case UC-TERM-001

**REQ-TERM-FR-002: Separation Type Validation**
- **Priority:** Critical
- **Description:** System shall enforce separation type-specific processing
- **Separation Types:**
  1. **TERMINATION:** Administrative termination
     - Examples: Contract end, performance issues, redundancy
     - Review: DO and HHRMD
  2. **DISMISSAL:** Disciplinary dismissal
     - Examples: Misconduct, breach of conduct
     - Review: DO and HHRMD
- **Acceptance Criteria:**
  - AC-001: Both types supported
  - AC-002: type field required
  - AC-003: Invalid type rejected
  - AC-004: Type determines request ID prefix
  - AC-005: Both types follow DO/HHRMD review workflow
- **Business Rule:** BR-TERM-001 (Separation type distinction)
- **Traceability:** BRD Objective 3 (Policy compliance), Use Case UC-TERM-001

**REQ-TERM-FR-003: Employee Status Validation for Separation**
- **Priority:** Critical
- **Description:** System shall validate employee not already separated
- **Ineligible Statuses:**
  - "Terminated" (already terminated)
  - "Dismissed" (already dismissed)
  - "Resigned" (already resigned)
  - "Retired" (already retired)
- **Eligible Statuses:**
  - "Confirmed"
  - "On Probation"
  - "On LWOP" (can be terminated while on leave)
- **Acceptance Criteria:**
  - AC-001: All active statuses allowed
  - AC-002: Already separated statuses rejected
  - AC-003: Error message states reason
  - AC-004: Validation before request creation
- **Business Rule:** BR-TERM-003 (Status eligibility)
- **Traceability:** BRD Objective 3 (Data integrity), Use Case UC-TERM-001

**REQ-TERM-FR-004: Separation Reason Requirement**
- **Priority:** Critical
- **Description:** System shall require detailed reason for separation
- **Validation:**
  - reason required
  - Minimum 50 characters
  - Maximum 2000 characters
- **Acceptance Criteria:**
  - AC-001: reason required (min 50 chars)
  - AC-002: Length constraints enforced
  - AC-003: Empty or too short reason rejected
  - AC-004: Reason displayed in request details
- **Business Rule:** BR-TERM-004 (Justification required for separation)
- **Traceability:** BRD Objective 3 (Legal compliance), Use Case UC-TERM-001

#### 5.11.2 Separation Request Review and Approval

**REQ-TERM-FR-005: DO/HHRMD Review Termination/Dismissal**
- **Priority:** Critical
- **Description:** System shall allow DO/HHRMD to review separation requests
- **API Endpoint:** `PATCH /api/termination/{id}`
- **Authorized Roles:** DO, HHRMD (NOT HRMO)
- **Actions:**
  - Approve
  - Reject (with reason)
  - Request correction
- **Request Body:**
```json
{
  "status": string (new status),
  "rejectionReason": string (if rejected, min 20 chars),
  "reviewedById": string (required),
  "decisionDate": DateTime (required)
}
```
- **Acceptance Criteria:**
  - AC-001: Only DO/HHRMD can review (HRMO blocked)
  - AC-002: Rejection requires reason
  - AC-003: Status updated correctly
  - AC-004: reviewedById and decisionDate recorded
  - AC-005: Notification sent to HRO
  - AC-006: Cannot review own submission
  - AC-007: Review logged in audit trail
  - AC-008: HRMO attempting review returns 403 Forbidden
- **Business Rule:** BR-TERM-002 (DO/HHRMD exclusive authority)
- **Traceability:** BRD Objective 2 (Approval workflow), Use Case UC-TERM-002

**REQ-TERM-FR-006: Commission Approval for Separation**
- **Priority:** Critical
- **Description:** System shall track Commission approval for separations
- **Status Transition:** "Request Received – Awaiting Commission Decision" → "Approved by Commission" | "Rejected by Commission"
- **Update Fields:**
  - commissionDecisionDate
  - commissionDecision
  - status
- **Acceptance Criteria:**
  - AC-001: Commission decision recorded
  - AC-002: Decision date captured
  - AC-003: Final status set
  - AC-004: Notifications sent
  - AC-005: Decision logged in audit trail
- **Business Rule:** BR-TERM-005 (Commission final authority)
- **Traceability:** BRD Objective 2 (Governance), Use Case UC-TERM-003

**REQ-TERM-FR-007: Employee Status Update on Separation Approval**
- **Priority:** Critical
- **Description:** System shall update employee status to "Terminated" or "Dismissed" upon approval
- **Trigger:** Separation request approved by Commission
- **Processing:**
  1. Update employee status based on type:
     - TERMINATION → "Terminated"
     - DISMISSAL → "Dismissed"
  2. Record separation date
  3. Update employee record immediately
- **Acceptance Criteria:**
  - AC-001: Employee status changes only when approved
  - AC-002: Status matches separation type
  - AC-003: Separation date recorded
  - AC-004: Rejected requests do NOT change status
  - AC-005: Status change logged in audit trail
- **Business Rule:** BR-TERM-006 (Status updated only when APPROVED)
- **Traceability:** BRD Objective 2 (Data accuracy), Use Case UC-TERM-003

#### 5.11.3 Separation Request Listing and Filtering

**REQ-TERM-FR-008: List Termination/Dismissal Requests**
- **Priority:** High
- **Description:** System shall display list of separation requests
- **API Endpoint:** `GET /api/termination`
- **Query Parameters:**
  - page, size
  - status
  - type (TERMINATION or DISMISSAL)
  - institutionId
  - employeeId
- **Processing:**
  - Apply role-based filters
  - Include employee and institution relations
  - Paginate results
- **Acceptance Criteria:**
  - AC-001: HRO/HRRP see own institution only
  - AC-002: DO/HHRMD/CSCS see all institutions
  - AC-003: Each request shows type, reason
  - AC-004: Pagination functional
  - AC-005: Sorted by updatedAt descending
- **Business Rule:** BR-TERM-007 (Role-based access)
- **Traceability:** BRD Objective 2 (Request tracking), Use Case UC-TERM-004

**REQ-TERM-FR-009: Filter by Separation Type**
- **Priority:** Medium
- **Description:** System shall filter separation requests by type
- **Types:**
  - "TERMINATION"
  - "DISMISSAL"
- **Acceptance Criteria:**
  - AC-001: Both types filterable
  - AC-002: Exact match filtering
  - AC-003: Can combine with status filter
  - AC-004: Invalid type returns 400 Bad Request
- **Business Rule:** BR-TERM-008 (Type-based filtering)
- **Traceability:** BRD Objective 2 (Reporting), Use Case UC-TERM-005

---

### 5.12 Complaint Management Module (COMP)

#### 5.12.1 Complaint Submission

**REQ-COMP-FR-001: Employee Submit Complaint**
- **Priority:** Medium
- **Description:** System shall allow employees to submit complaints
- **API Endpoint:** `POST /api/complaints`
- **Request Body:**
```json
{
  "complainantId": string (required, User ID),
  "complaintType": string (required),
  "subject": string (required, min 5 chars),
  "complaintText": string (required, min 20 chars),
  "details": string (optional),
  "complainantPhoneNumber": string (required),
  "nextOfKinPhoneNumber": string (required),
  "attachments": [string] (optional)
}
```
- **Processing:**
  1. Validate user is EMPLOYEE role
  2. Validate complainantId matches authenticated user
  3. Validate complaintType is valid
  4. Validate subject (min 5 chars)
  5. Validate complaintText or details (min 20 chars)
  6. Validate phone numbers provided
  7. Create complaint with status "Submitted"
  8. Assign to DO by default (assignedOfficerRole = "DO")
  9. Create notifications for DO and HHRMD
- **Acceptance Criteria:**
  - AC-001: Only EMPLOYEE role can submit
  - AC-002: Employee can only submit for themselves
  - AC-003: complaintType required
  - AC-004: subject required (min 5 chars)
  - AC-005: complaintText or details required (min 20 chars)
  - AC-006: complainantPhoneNumber required
  - AC-007: nextOfKinPhoneNumber required
  - AC-008: attachments optional
  - AC-009: Initial status "Submitted"
  - AC-010: Assigned to DO by default
  - AC-011: Notifications sent to DO and HHRMD
  - AC-012: Submission logged in audit trail
- **Business Rule:** BR-COMP-001 (Employee self-service complaint)
- **Business Rule:** BR-COMP-002 (Contact information required)
- **Traceability:** BRD Objective 6 (Complaint management), Use Case UC-COMP-001

**REQ-COMP-FR-002: Complaint Type Validation**
- **Priority:** High
- **Description:** System shall validate complaint type
- **Complaint Types:**
  - "Harassment"
  - "Misconduct"
  - "Discrimination"
  - "Other"
- **Acceptance Criteria:**
  - AC-001: All four types supported
  - AC-002: Invalid type rejected
  - AC-003: Type required
  - AC-004: Type displayed in complaint details
- **Business Rule:** BR-COMP-003 (Predefined complaint categories)
- **Traceability:** BRD Objective 6 (Categorization), Use Case UC-COMP-001

**REQ-COMP-FR-003: Complaint Text Validation**
- **Priority:** High
- **Description:** System shall validate complaint content
- **Validation:**
  - subject: min 5 chars, max 200 chars
  - complaintText or details: min 20 chars, max 5000 chars
  - At least one must be provided
- **Acceptance Criteria:**
  - AC-001: subject required (min 5 chars)
  - AC-002: complaintText or details required (min 20 chars)
  - AC-003: Length constraints enforced
  - AC-004: Empty content rejected
- **Business Rule:** BR-COMP-004 (Substantive complaint required)
- **Traceability:** BRD Objective 6 (Quality control), Use Case UC-COMP-001

**REQ-COMP-FR-004: Contact Information Requirement**
- **Priority:** Critical
- **Description:** System shall require contact information for follow-up
- **Required Fields:**
  - complainantPhoneNumber (phone number format)
  - nextOfKinPhoneNumber (phone number format)
- **Acceptance Criteria:**
  - AC-001: Both phone numbers required
  - AC-002: Valid phone number format
  - AC-003: Empty phone number rejected
  - AC-004: Contact info accessible to DO/HHRMD
- **Business Rule:** BR-COMP-002 (Contact information mandatory)
- **Traceability:** BRD Objective 6 (Follow-up capability), Use Case UC-COMP-001

**REQ-COMP-FR-005: Complaint Attachments**
- **Priority:** Low
- **Description:** System shall allow optional file attachments to complaints
- **Processing:**
  - Attachments optional
  - Multiple files allowed
  - Stored as array of MinIO URLs
- **Acceptance Criteria:**
  - AC-001: Attachments optional
  - AC-002: Multiple files supported
  - AC-003: Valid MinIO URLs required
  - AC-004: Attachments viewable by authorized users
- **Business Rule:** BR-COMP-005 (Evidence documentation optional)
- **Traceability:** BRD Objective 6 (Evidence support), Use Case UC-COMP-001

#### 5.12.2 AI-Enhanced Complaint Rewriting

**REQ-COMP-FR-006: AI Complaint Enhancement**
- **Priority:** Low
- **Description:** System shall provide AI-powered complaint text enhancement
- **AI Integration:** Google Genkit (Gemini model)
- **Processing:**
  1. Employee enters complaint text
  2. System offers option to enhance with AI
  3. AI rewrites for clarity, professionalism, completeness
  4. Employee reviews and can accept or reject
  5. Enhanced text used if accepted
- **Acceptance Criteria:**
  - AC-001: AI enhancement optional
  - AC-002: Original text preserved if rejected
  - AC-003: Enhanced text shown for review before submission
  - AC-004: Employee can edit enhanced text
  - AC-005: AI enhancement logged
- **Business Rule:** BR-COMP-007 (AI assistance optional)
- **Traceability:** BRD Objective 7 (AI enhancement), Use Case UC-COMP-002

#### 5.12.3 Complaint Review and Management

**REQ-COMP-FR-007: DO/HHRMD Review Complaints**
- **Priority:** Medium
- **Description:** System shall allow DO/HHRMD to review and manage complaints
- **API Endpoint:** `PATCH /api/complaints/{id}`
- **Authorized Roles:** DO, HHRMD
- **Actions:**
  - Update status
  - Add officer comments
  - Add internal notes
  - Resolve (approve/reject)
  - Close
- **Request Body:**
```json
{
  "status": string (new status),
  "officerComments": string (optional),
  "internalNotes": string (optional),
  "reviewStage": string (optional),
  "reviewedById": string (required),
  "rejectionReason": string (if rejected)
}
```
- **Acceptance Criteria:**
  - AC-001: Only DO/HHRMD can review
  - AC-002: Status transitions valid
  - AC-003: Comments and notes stored
  - AC-004: reviewedById recorded
  - AC-005: Notification sent to complainant on status change
  - AC-006: Review logged in audit trail
- **Business Rule:** BR-COMP-008 (DO/HHRMD review authority)
- **Traceability:** BRD Objective 6 (Complaint resolution), Use Case UC-COMP-003

**REQ-COMP-FR-008: Complaint Status Workflow**
- **Priority:** Medium
- **Description:** System shall enforce complaint status workflow
- **Status Flow:**
  - "Submitted" (initial)
  - "Under Review" (investigation)
  - "Resolved - Approved by Commission" (accepted)
  - "Resolved - Rejected by Commission" (dismissed)
  - "Closed - Satisfied" (complainant satisfied)
- **Acceptance Criteria:**
  - AC-001: All statuses supported
  - AC-002: Valid transitions only
  - AC-003: Status history tracked
  - AC-004: Each status change notifies complainant
- **Business Rule:** BR-COMP-009 (Complaint lifecycle)
- **Traceability:** BRD Objective 6 (Workflow management), Use Case UC-COMP-004

**REQ-COMP-FR-009: Officer Comments and Internal Notes**
- **Priority:** Medium
- **Description:** System shall allow officers to add comments and notes
- **Fields:**
  - officerComments: Visible to complainant
  - internalNotes: Internal only (not visible to complainant)
- **Acceptance Criteria:**
  - AC-001: Both fields optional
  - AC-002: Officer comments visible to complainant
  - AC-003: Internal notes only visible to DO/HHRMD/CSCS
  - AC-004: Comments/notes editable by officers
  - AC-005: Update history tracked
- **Business Rule:** BR-COMP-010 (Communication tracking)
- **Traceability:** BRD Objective 6 (Case management), Use Case UC-COMP-005

#### 5.12.4 Complaint Listing and Access Control

**REQ-COMP-FR-010: Employee View Own Complaints**
- **Priority:** High
- **Description:** System shall allow employees to view only their own complaints
- **API Endpoint:** `GET /api/complaints`
- **EMPLOYEE Role Filtering:**
  - Automatically filter by complainantId = authenticated user ID
  - Cannot see other employees' complaints
- **Response:**
  - List of user's complaints
  - Status updates
  - Officer comments (not internal notes)
- **Acceptance Criteria:**
  - AC-001: EMPLOYEE sees only own complaints
  - AC-002: Cannot access other employees' complaints (403 Forbidden)
  - AC-003: officerComments visible
  - AC-004: internalNotes NOT visible
  - AC-005: Sorted by updatedAt descending
- **Business Rule:** BR-COMP-006 (Employee view only own complaints)
- **Traceability:** BRD Objective 4 (Data privacy), Use Case UC-COMP-006

**REQ-COMP-FR-011: DO/HHRMD View All Complaints**
- **Priority:** High
- **Description:** System shall allow DO/HHRMD to view all complaints
- **API Endpoint:** `GET /api/complaints`
- **Query Parameters:**
  - page, size
  - status
  - complaintType
  - assignedOfficerRole
  - reviewStage
- **Processing:**
  - DO/HHRMD see all complaints across all employees
  - Include complainant information
  - Include internal notes
  - Paginate results
- **Acceptance Criteria:**
  - AC-001: DO/HHRMD see all complaints
  - AC-002: All filters functional
  - AC-003: Complainant details visible
  - AC-004: Internal notes visible
  - AC-005: Pagination works
  - AC-006: Sorted by updatedAt descending
- **Business Rule:** BR-COMP-011 (DO/HHRMD full access)
- **Traceability:** BRD Objective 6 (Complaint oversight), Use Case UC-COMP-007

**REQ-COMP-FR-012: Filter Complaints by Status**
- **Priority:** Medium
- **Description:** System shall filter complaints by status
- **Status Values:**
  - "Submitted"
  - "Under Review"
  - "Resolved - Approved by Commission"
  - "Resolved - Rejected by Commission"
  - "Closed - Satisfied"
- **Acceptance Criteria:**
  - AC-001: All statuses filterable
  - AC-002: Exact match filtering
  - AC-003: Multiple statuses combinable (OR logic)
  - AC-004: Invalid status returns 400 Bad Request
- **Business Rule:** BR-COMP-012 (Status-based tracking)
- **Traceability:** BRD Objective 6 (Complaint filtering), Use Case UC-COMP-008

**REQ-COMP-FR-013: Open Complaints Identification**
- **Priority:** Medium
- **Description:** System shall identify open (unresolved) complaints
- **Open Complaint Definition:**
  - Status NOT IN ["Closed - Satisfied", "Resolved - Approved by Commission", "Resolved - Rejected by Commission"]
- **Processing:**
  - Count open complaints for dashboard
  - List open complaints for DO/HHRMD
- **Acceptance Criteria:**
  - AC-001: Open complaints correctly identified
  - AC-002: Closed/resolved complaints excluded
  - AC-003: Count accurate for dashboard
  - AC-004: List available to authorized users
- **Business Rule:** BR-COMP-013 (Open complaint tracking)
- **Traceability:** BRD Objective 6 (Workload visibility), Use Case UC-COMP-009

---


### 5.13 Reporting and Analytics Module (RPT)

#### 5.13.1 Report Generation

**REQ-RPT-FR-001: Generate Request Type Reports**
- **Priority:** High
- **Description:** System shall generate reports for all request types
- **API Endpoint:** `GET /api/reports?reportType={type}`
- **Report Types:**
  - "confirmation" - Confirmation requests report
  - "promotion" - All promotion requests
  - "promotionExperience" - Experience-based promotions only
  - "promotionEducation" - Education-based promotions only
  - "lwop" - LWOP requests report
  - "retirement" - Retirement requests report
  - "resignation" - Resignation requests report
  - "termination" - Termination requests report
  - "dismissal" - Dismissal requests report
  - "cadreChange" - Cadre change requests report
  - "serviceExtension" - Service extension requests report
- **Processing:**
  1. Validate user authorization
  2. Apply role-based institution filter
  3. Query request data with employee and institution joins
  4. Format data for report display
  5. Translate status and fields to Swahili
  6. Return formatted report with headers and totals
- **Acceptance Criteria:**
  - AC-001: All 11 report types supported
  - AC-002: HRO/HRRP see own institution data only
  - AC-003: HHRMD/CSCS/HRMO/DO/PO see all institutions
  - AC-004: Reports load within 5 seconds
  - AC-005: Data sorted appropriately (by date, status)
  - AC-006: Empty report shown if no data
- **Business Rule:** BR-RPT-001 (Role-based report access)
- **Traceability:** BRD Objective 8 (Reporting), Use Case UC-RPT-001

**REQ-RPT-FR-002: Report Column Structure**
- **Priority:** High
- **Description:** System shall structure reports with consistent columns
- **Common Columns (All Reports):**
  - S/N (Serial Number)
  - Employee Name
  - ZAN ID
  - Gender
  - Institution
  - Request Date
  - Status (in Swahili)
  - Commission Decision (in Swahili)
- **Type-Specific Columns:**
  - **Promotion:** Promotion Type
  - **LWOP:** Duration, Reason, Start Date, End Date
  - **Retirement:** Retirement Type, Proposed Date
  - **Resignation:** Effective Date, Reason
  - **Termination/Dismissal:** Type, Reason
  - **Cadre Change:** Original Cadre, New Cadre, Reason
  - **Service Extension:** Current Retirement Date, Extension Period, Justification
- **Acceptance Criteria:**
  - AC-001: All common columns present
  - AC-002: Type-specific columns included where relevant
  - AC-003: Column headers in Swahili
  - AC-004: Data formatted appropriately (dates, text)
- **Business Rule:** BR-RPT-002 (Standardized report format)
- **Traceability:** BRD Objective 8 (Consistent reporting), Use Case UC-RPT-002

**REQ-RPT-FR-003: Swahili Translation in Reports**
- **Priority:** High
- **Description:** System shall translate status and decision fields to Swahili
- **Status Translations:**
  - "Request Concluded" → "Imekamilika"
  - "Pending..." → "Inasubiri"
  - (All pending statuses map to "Inasubiri")
- **Decision Translations:**
  - "Approved by Commission" → "Imekubaliwa"
  - "Rejected by Commission" → "Imekataliwa"
  - Pending/No decision → "-"
- **Promotion Type Translations:**
  - "Experience" → "kwa uzoefu"
  - "EducationAdvancement" → "kwa maendeleo ya elimu"
- **Acceptance Criteria:**
  - AC-001: Status translated correctly
  - AC-002: Decision translated correctly
  - AC-003: Promotion types translated
  - AC-004: Pending states shown as "-"
  - AC-005: Translations consistent across all reports
- **Business Rule:** BR-RPT-003 (Swahili language for government reports)
- **Traceability:** BRD Objective 8 (Language localization), Use Case UC-RPT-003

**REQ-RPT-FR-004: Report Totals Row**
- **Priority:** Medium
- **Description:** System shall include totals row at end of reports
- **Totals Row Content:**
  - S/N column: "JUMLA" (Total in Swahili)
  - Count column: Total number of records
  - Other columns: Empty or aggregate if applicable
- **Acceptance Criteria:**
  - AC-001: Totals row added to all reports
  - AC-002: "JUMLA" label in first column
  - AC-003: Correct record count displayed
  - AC-004: Totals row visually distinguished (bold, border)
- **Business Rule:** BR-RPT-004 (Summary statistics in reports)
- **Traceability:** BRD Objective 8 (Report completeness), Use Case UC-RPT-004

**REQ-RPT-FR-005: Report Export Capability**
- **Priority:** Medium
- **Description:** System shall support report data export
- **Export Formats:**
  - CSV (primary)
  - Excel (if implemented)
- **Processing:**
  - Return data in export-ready format
  - Include all columns with headers
  - Include totals row
  - Maintain Swahili translations
- **Acceptance Criteria:**
  - AC-001: Data structured for CSV export
  - AC-002: Headers included
  - AC-003: Totals row included
  - AC-004: Character encoding supports Swahili characters
  - AC-005: Export completes within 10 seconds
- **Business Rule:** BR-RPT-005 (Export for external analysis)
- **Traceability:** BRD Objective 8 (Data portability), Use Case UC-RPT-005

#### 5.13.2 Report Response Structure

**REQ-RPT-FR-006: Report API Response Format**
- **Priority:** High
- **Description:** System shall return reports in standardized JSON format
- **Response Schema:**
```json
{
  "title": string (report title in Swahili),
  "headers": [string] (column headers),
  "dataKeys": [string] (property keys for data mapping),
  "data": [
    {
      "sn": number,
      "employeeName": string,
      "zanId": string,
      "gender": string,
      "institution": string,
      "requestDate": string (formatted date),
      "status": string (translated),
      "decision": string (translated),
      // ... type-specific fields
    }
  ],
  "totals": {
    "label": "JUMLA",
    "count": number
  },
  "pagination": {
    "page": number,
    "size": number,
    "total": number
  }
}
```
- **Acceptance Criteria:**
  - AC-001: Response follows schema
  - AC-002: All required fields present
  - AC-003: Data array populated correctly
  - AC-004: Pagination metadata included
  - AC-005: Title and headers in Swahili
- **Business Rule:** BR-RPT-006 (Structured response format)
- **Traceability:** BRD Objective 8 (API consistency), API Doc RPT-001

#### 5.13.3 Report Access Control

**REQ-RPT-FR-007: Role-Based Report Access**
- **Priority:** Critical
- **Description:** System shall enforce role-based access to reports
- **Access Matrix:**

| Role | Access Level | Institution Filter |
|------|--------------|-------------------|
| HRO/HRRP | Own institution only | Automatic |
| HHRMD | All institutions | None |
| HRMO | All institutions | None |
| DO | All institutions | None |
| CSCS | All institutions | None |
| PO | All institutions | None |
| Admin | No report access | N/A |
| Employee | No report access | N/A |

- **Acceptance Criteria:**
  - AC-001: HRO/HRRP automatically filtered to own institution
  - AC-002: HHRMD/HRMO/DO/CSCS/PO see all institutions
  - AC-003: Admin and Employee roles denied access (403 Forbidden)
  - AC-004: Institution filter enforced at API level
  - AC-005: Unauthorized access logged in audit trail
- **Business Rule:** BR-RPT-007 (Report authorization)
- **Traceability:** BRD Objective 4 (Security), Use Case UC-RPT-006

---

### 5.14 Audit Trail Module (AUDIT)

#### 5.14.1 Audit Event Logging

**REQ-AUDIT-FR-001: Log Security Events**
- **Priority:** Critical
- **Description:** System shall log all security-related events
- **Logged Events:**
  - Failed login attempts
  - Successful logins
  - Account lockouts
  - Password changes
  - Password expiration warnings
  - Unauthorized access attempts
  - Permission denials (403 Forbidden)
- **Event Data:**
  - eventType, eventCategory ("SECURITY", "AUTHENTICATION")
  - severity (INFO, WARNING, ERROR, CRITICAL)
  - userId, username, userRole
  - ipAddress, userAgent, deviceInfo
  - timestamp (indexed for fast queries)
  - additionalData (JSON with context)
- **Acceptance Criteria:**
  - AC-001: All security events logged
  - AC-002: Event data complete
  - AC-003: Timestamp accurate
  - AC-004: IP address captured
  - AC-005: Log entries immutable
  - AC-006: Logging does not block user operations
- **Business Rule:** BR-AUDIT-001 (Comprehensive security logging)
- **Traceability:** BRD Objective 4 (Security compliance), Use Case UC-AUDIT-001

**REQ-AUDIT-FR-002: Log Access Events**
- **Priority:** High
- **Description:** System shall log access control events
- **Logged Events:**
  - Unauthorized route access attempts
  - Access denied (insufficient permissions)
  - Access granted (successful authorization)
  - Resource not found (404)
- **Event Data:**
  - eventCategory: "ACCESS", "AUTHORIZATION"
  - attemptedRoute, requestMethod
  - isAuthenticated, wasBlocked
  - blockReason
  - userId, userRole
  - ipAddress, timestamp
- **Acceptance Criteria:**
  - AC-001: All access events logged
  - AC-002: Attempted route captured
  - AC-003: Block reason captured if blocked
  - AC-004: User context included
  - AC-005: Timestamp indexed
- **Business Rule:** BR-AUDIT-002 (Access logging)
- **Traceability:** BRD Objective 4 (Access monitoring), Use Case UC-AUDIT-002

**REQ-AUDIT-FR-003: Log Request Lifecycle Events**
- **Priority:** High
- **Description:** System shall log HR request lifecycle events
- **Logged Events:**
  - Request submission
  - Request approval
  - Request rejection
  - Request sent back for correction
  - Status changes
  - Document uploads
- **Event Data:**
  - eventCategory: "REQUEST"
  - requestType (CONFIRMATION, PROMOTION, etc.)
  - requestId
  - action (SUBMITTED, APPROVED, REJECTED, etc.)
  - performedBy (userId)
  - timestamp
  - additionalData (old status, new status, etc.)
- **Acceptance Criteria:**
  - AC-001: All request events logged
  - AC-002: Request type and ID captured
  - AC-003: Action and performer recorded
  - AC-004: Status transitions tracked
  - AC-005: Logged in near real-time
- **Business Rule:** BR-AUDIT-003 (Request auditing)
- **Traceability:** BRD Objective 9 (Accountability), Use Case UC-AUDIT-003

**REQ-AUDIT-FR-004: Log Administrative Actions**
- **Priority:** High
- **Description:** System shall log all administrative actions
- **Logged Events:**
  - User creation
  - User deletion/deactivation
  - User role changes
  - User password resets
  - Account lock/unlock
  - Institution creation/modification
  - System configuration changes
- **Event Data:**
  - eventCategory: "ADMIN"
  - adminAction (USER_CREATED, USER_DELETED, etc.)
  - targetUserId, targetUsername
  - performedBy (admin userId)
  - changeDetails (JSON)
  - timestamp
- **Acceptance Criteria:**
  - AC-001: All admin actions logged
  - AC-002: Target user identified
  - AC-003: Performing admin identified
  - AC-004: Change details captured
  - AC-005: Logged before commit (transaction-safe)
- **Business Rule:** BR-AUDIT-004 (Administrative auditing)
- **Traceability:** BRD Objective 9 (Admin accountability), Use Case UC-AUDIT-004

#### 5.14.2 Audit Log Retrieval and Analysis

**REQ-AUDIT-FR-005: Query Audit Logs**
- **Priority:** High
- **Description:** System shall provide comprehensive audit log querying
- **API Endpoint:** `GET /api/audit/logs`
- **Authorized Roles:** Admin, CSCS
- **Query Parameters:**
  - startDate, endDate (date range filter)
  - eventType (specific event filter)
  - eventCategory (SECURITY, ACCESS, AUTHENTICATION, etc.)
  - severity (INFO, WARNING, ERROR, CRITICAL)
  - userId (filter by user)
  - username (filter by username)
  - attemptedRoute (filter by route)
  - limit, offset (pagination)
- **Processing:**
  1. Validate user authorization (Admin/CSCS only)
  2. Apply filters to AuditLog table
  3. Sort by timestamp descending (newest first)
  4. Paginate results
  5. Return logs with full details
- **Acceptance Criteria:**
  - AC-001: Only Admin/CSCS can query
  - AC-002: All filters functional
  - AC-003: Date range filter accurate
  - AC-004: Results sorted newest first
  - AC-005: Pagination works correctly
  - AC-006: Query completes within 3 seconds
  - AC-007: Empty result set returns empty array
- **Business Rule:** BR-AUDIT-005 (Admin-only audit access)
- **Traceability:** BRD Objective 9 (Audit review), Use Case UC-AUDIT-005

**REQ-AUDIT-FR-006: Audit Statistics**
- **Priority:** Medium
- **Description:** System shall provide audit log statistics
- **API Endpoint:** `GET /api/audit/logs?statsOnly=true`
- **Statistics Provided:**
  - Total events count
  - Events by severity (INFO, WARNING, ERROR, CRITICAL)
  - Events by category (SECURITY, ACCESS, etc.)
  - Events by event type
  - Failed access attempts count
  - Failed login attempts count
- **Acceptance Criteria:**
  - AC-001: Statistics accurate
  - AC-002: Calculated efficiently (no full table scan)
  - AC-003: Filtered by date range if provided
  - AC-004: Response time <2 seconds
- **Business Rule:** BR-AUDIT-006 (Audit analytics)
- **Traceability:** BRD Objective 9 (Security insights), Use Case UC-AUDIT-006

**REQ-AUDIT-FR-007: Severity-Based Filtering**
- **Priority:** Medium
- **Description:** System shall filter audit logs by severity
- **Severity Levels:**
  - INFO: Informational events (logins, access grants)
  - WARNING: Warning events (password expiring soon)
  - ERROR: Error events (access denied, validation failures)
  - CRITICAL: Critical events (account lockout, security breaches)
- **Acceptance Criteria:**
  - AC-001: All four severity levels supported
  - AC-002: Filtering accurate
  - AC-003: Can filter multiple severities (OR logic)
  - AC-004: Severity displayed clearly in logs
- **Business Rule:** BR-AUDIT-007 (Severity classification)
- **Traceability:** BRD Objective 9 (Event prioritization), Use Case UC-AUDIT-007

#### 5.14.3 Audit Log Display and Export

**REQ-AUDIT-FR-008: Audit Log Display Format**
- **Priority:** Medium
- **Description:** System shall display audit logs in readable format
- **Display Fields:**
  - Timestamp (formatted)
  - Event Type
  - Event Category
  - Severity (with color coding)
  - User (username and role)
  - IP Address
  - Action/Route
  - Status (success/failure)
  - Details (expandable)
- **Acceptance Criteria:**
  - AC-001: All fields displayed clearly
  - AC-002: Severity color-coded (INFO=blue, WARNING=yellow, ERROR=orange, CRITICAL=red)
  - AC-003: Timestamps in user-friendly format
  - AC-004: Details expandable for full JSON
  - AC-005: Table sortable by columns
- **Business Rule:** BR-AUDIT-008 (User-friendly display)
- **Traceability:** BRD Objective 5 (Usability), Use Case UC-AUDIT-008

**REQ-AUDIT-FR-009: Export Audit Logs**
- **Priority:** Medium
- **Description:** System shall support exporting audit logs
- **Export Format:** CSV
- **Export Content:**
  - All filtered log entries
  - All fields (timestamp, event, user, IP, details)
  - Header row with column names
- **Acceptance Criteria:**
  - AC-001: Export respects current filters
  - AC-002: CSV formatted correctly
  - AC-003: All data included
  - AC-004: Export completes within 30 seconds for up to 10,000 records
  - AC-005: Large exports show progress indicator
- **Business Rule:** BR-AUDIT-009 (Audit export for compliance)
- **Traceability:** BRD Objective 9 (Evidence preservation), Use Case UC-AUDIT-009

---

### 5.15 System Administration Module (ADMIN)

#### 5.15.1 User Management

**REQ-ADMIN-FR-001: Create User Account**
- **Priority:** Critical
- **Description:** System shall allow admin to create user accounts
- **API Endpoint:** `POST /api/users`
- **Authorized Roles:** Admin only
- **Request Body:**
```json
{
  "name": string (required, max 100 chars),
  "username": string (required, 3-50 chars, unique),
  "email": string (required, valid email, unique),
  "phoneNumber": string (optional),
  "role": string (required, one of 9 roles),
  "institutionId": string (required for HRO/HRRP/Employee),
  "password": string (required, min 8 chars),
  "mustChangePassword": boolean (default: true)
}
```
- **Processing:**
  1. Validate admin authorization
  2. Validate username unique
  3. Validate email unique
  4. Validate role is valid
  5. Validate institution assignment rules:
     - HHRMD, HRMO, DO, PO, CSCS: MUST be from "TUME YA UTUMISHI SERIKALINI"
     - Admin: MUST be from "TUME YA UTUMISHI SERIKALINI"
     - HRO, HRRP, Employee: Can be from any institution
  6. Hash password with bcrypt
  7. Create user with isTemporaryPassword if mustChangePassword
  8. Set temporaryPasswordExpiry (24 hours)
  9. Create notification for new user
  10. Log in audit trail
- **Acceptance Criteria:**
  - AC-001: Only Admin can create users
  - AC-002: Username must be unique
  - AC-003: Email must be unique
  - AC-004: Institution assignment rules enforced
  - AC-005: Password hashed (never stored plaintext)
  - AC-006: mustChangePassword flag honored
  - AC-007: User created successfully
  - AC-008: Creation logged in audit trail
  - AC-009: Notification sent to new user
- **Business Rule:** BR-ADMIN-001 (Admin-only user creation)
- **Business Rule:** BR-ADMIN-002 (CSC roles must be from CSC institution)
- **Traceability:** BRD Objective 4 (User management), Use Case UC-ADMIN-001

**REQ-ADMIN-FR-002: Update User Account**
- **Priority:** High
- **Description:** System shall allow admin to update user accounts
- **API Endpoint:** `PATCH /api/users/{id}`
- **Authorized Roles:** Admin only
- **Updatable Fields:**
  - name
  - username (if unique)
  - email (if unique)
  - phoneNumber
  - role (with institution rules validation)
  - institutionId (with role rules validation)
  - active status
- **Processing:**
  1. Validate admin authorization
  2. Validate user exists
  3. Validate uniqueness constraints (username, email)
  4. Validate institution assignment rules for new role
  5. Update user record
  6. Log in audit trail
- **Acceptance Criteria:**
  - AC-001: Only Admin can update users
  - AC-002: Uniqueness constraints enforced
  - AC-003: Institution rules validated on role change
  - AC-004: Update successful
  - AC-005: Update logged in audit trail
  - AC-006: Cannot update own admin role (prevent lockout)
- **Business Rule:** BR-ADMIN-003 (Controlled user updates)
- **Traceability:** BRD Objective 4 (User management), Use Case UC-ADMIN-002

**REQ-ADMIN-FR-003: List Users**
- **Priority:** High
- **Description:** System shall display list of users with filtering
- **API Endpoint:** `GET /api/users`
- **Authorized Roles:** Admin only
- **Query Parameters:**
  - page, size (pagination)
  - role (filter by role)
  - institutionId (filter by institution)
  - active (filter by active status)
  - q (search by name, username, email)
- **Processing:**
  - Apply filters
  - Include institution relation
  - Paginate results
  - Return user list (passwords excluded)
- **Acceptance Criteria:**
  - AC-001: Only Admin can list users
  - AC-002: All filters functional
  - AC-003: Search works across name, username, email
  - AC-004: Passwords never returned
  - AC-005: Pagination works
  - AC-006: Sorted by name alphabetically
- **Business Rule:** BR-ADMIN-004 (User listing)
- **Traceability:** BRD Objective 4 (User oversight), Use Case UC-ADMIN-003

**REQ-ADMIN-FR-004: Deactivate User Account**
- **Priority:** High
- **Description:** System shall allow admin to deactivate user accounts
- **Processing:**
  - Set active = false
  - Invalidate all user sessions
  - Prevent login attempts
  - Log deactivation in audit trail
- **Acceptance Criteria:**
  - AC-001: Deactivated user cannot login
  - AC-002: Existing sessions terminated
  - AC-003: Deactivation logged
  - AC-004: User can be reactivated later
  - AC-005: Cannot deactivate own account
- **Business Rule:** BR-ADMIN-005 (Account deactivation)
- **Traceability:** BRD Objective 4 (Access control), Use Case UC-ADMIN-004

#### 5.15.2 Password Management

**REQ-ADMIN-FR-005: Reset User Password**
- **Priority:** High
- **Description:** System shall allow admin to reset user passwords
- **API Endpoint:** `POST /api/admin/reset-password`
- **Authorized Roles:** Admin only
- **Request Body:**
```json
{
  "userId": string (required),
  "newPassword": string (required, min 8 chars)
}
```
- **Processing:**
  1. Validate admin authorization
  2. Validate user exists
  3. Validate password complexity
  4. Hash new password
  5. Update user password
  6. Set isTemporaryPassword = true
  7. Set temporaryPasswordExpiry = current time + 24 hours
  8. Set mustChangePassword = true
  9. Add old password hash to passwordHistory
  10. Log password reset in audit trail
  11. Send notification to user
- **Acceptance Criteria:**
  - AC-001: Only Admin can reset passwords
  - AC-002: Password complexity enforced
  - AC-003: Password hashed
  - AC-004: Temporary password expires in 24 hours
  - AC-005: User must change on first login
  - AC-006: Reset logged in audit trail
  - AC-007: User notified
- **Business Rule:** BR-ADMIN-006 (Admin password reset)
- **Traceability:** BRD Objective 4 (Password recovery), Use Case UC-ADMIN-005

**REQ-ADMIN-FR-006: Password Policy Enforcement**
- **Priority:** Critical
- **Description:** System shall enforce password policy
- **Policy Rules:**
  - Minimum 8 characters
  - Must contain at least one uppercase letter
  - Must contain at least one lowercase letter
  - Must contain at least one number OR special character
  - Cannot be common/easily guessable
  - Cannot reuse last 5 passwords (from passwordHistory)
  - Expires after 90 days
- **Acceptance Criteria:**
  - AC-001: All policy rules enforced
  - AC-002: Weak passwords rejected
  - AC-003: Password reuse prevented
  - AC-004: Expiration warning shown 7 days before
  - AC-005: Expired password forces change
- **Business Rule:** BR-ADMIN-007 (Password policy)
- **Traceability:** BRD Objective 4 (Security), Use Case UC-ADMIN-006

**REQ-ADMIN-FR-007: Change Own Password**
- **Priority:** High
- **Description:** System shall allow users to change own password
- **API Endpoint:** `POST /api/admin/change-password`
- **Authorized Roles:** All authenticated users
- **Request Body:**
```json
{
  "currentPassword": string (required),
  "newPassword": string (required, min 8 chars)
}
```
- **Processing:**
  1. Validate current password correct
  2. Validate new password meets policy
  3. Validate new password not in history
  4. Hash new password
  5. Update password
  6. Add old hash to passwordHistory
  7. Clear mustChangePassword flag
  8. Clear isTemporaryPassword flag
  9. Log password change in audit trail
- **Acceptance Criteria:**
  - AC-001: Current password must be correct
  - AC-002: New password meets policy
  - AC-003: Password history enforced
  - AC-004: Change successful
  - AC-005: Temporary/must-change flags cleared
  - AC-006: Change logged in audit trail
- **Business Rule:** BR-ADMIN-008 (Self-service password change)
- **Traceability:** BRD Objective 4 (User autonomy), Use Case UC-ADMIN-007

#### 5.15.3 Account Lockout Management

**REQ-ADMIN-FR-008: Lock User Account**
- **Priority:** High
- **Description:** System shall allow admin to manually lock user accounts
- **API Endpoint:** `POST /api/admin/lock-account`
- **Authorized Roles:** Admin only
- **Request Body:**
```json
{
  "userId": string (required),
  "lockoutReason": string (required, min 20 chars)
}
```
- **Processing:**
  1. Validate admin authorization
  2. Validate user exists
  3. Set isManuallyLocked = true
  4. Set loginLockedUntil = null (indefinite)
  5. Set loginLockoutReason = reason
  6. Set lockedBy = admin user ID
  7. Set lockedAt = current timestamp
  8. Invalidate all user sessions
  9. Log lockout in audit trail
  10. Send notification to user
- **Acceptance Criteria:**
  - AC-001: Only Admin can lock accounts
  - AC-002: Lockout reason required
  - AC-003: User cannot login while locked
  - AC-004: Existing sessions terminated
  - AC-005: Lockout logged in audit trail
  - AC-006: User notified
  - AC-007: Cannot lock own account
- **Business Rule:** BR-ADMIN-009 (Manual account lockout)
- **Traceability:** BRD Objective 4 (Security enforcement), Use Case UC-ADMIN-008

**REQ-ADMIN-FR-009: Unlock User Account**
- **Priority:** High
- **Description:** System shall allow admin to unlock user accounts
- **API Endpoint:** `POST /api/admin/unlock-account`
- **Authorized Roles:** Admin only
- **Request Body:**
```json
{
  "userId": string (required)
}
```
- **Processing:**
  1. Validate admin authorization
  2. Validate user exists and is locked
  3. Clear isManuallyLocked
  4. Clear loginLockedUntil
  5. Clear loginLockoutReason
  6. Reset failed login counter to 0
  7. Log unlock in audit trail
  8. Send notification to user
- **Acceptance Criteria:**
  - AC-001: Only Admin can unlock accounts
  - AC-002: Unlocked user can login immediately
  - AC-003: Failed login counter reset
  - AC-004: Unlock logged in audit trail
  - AC-005: User notified
- **Business Rule:** BR-ADMIN-010 (Account unlock)
- **Traceability:** BRD Objective 4 (Access restoration), Use Case UC-ADMIN-009

#### 5.15.4 Institution Management

**REQ-ADMIN-FR-010: Create Institution**
- **Priority:** High
- **Description:** System shall allow admin to create institutions
- **API Endpoint:** `POST /api/institutions`
- **Authorized Roles:** Admin only
- **Request Body:**
```json
{
  "name": string (required, unique, max 200 chars),
  "email": string (optional, unique if provided),
  "phoneNumber": string (optional),
  "voteNumber": string (optional, unique if provided),
  "tinNumber": string (optional, unique if provided)
}
```
- **Processing:**
  1. Validate admin authorization
  2. Validate name unique (case-insensitive)
  3. Validate email unique if provided
  4. Validate voteNumber unique if provided
  5. Validate tinNumber unique if provided
  6. Create institution record
  7. Log creation in audit trail
- **Acceptance Criteria:**
  - AC-001: Only Admin can create institutions
  - AC-002: Name must be unique
  - AC-003: Email must be unique if provided
  - AC-004: voteNumber must be unique if provided
  - AC-005: tinNumber must be unique if provided
  - AC-006: Institution created successfully
  - AC-007: Creation logged in audit trail
- **Business Rule:** BR-ADMIN-011 (Unique institution identifiers)
- **Traceability:** BRD Objective 15 (Institution management), Use Case UC-ADMIN-010

**REQ-ADMIN-FR-011: Update Institution**
- **Priority:** Medium
- **Description:** System shall allow admin to update institutions
- **API Endpoint:** `PATCH /api/institutions/{id}`
- **Authorized Roles:** Admin only
- **Updatable Fields:**
  - name (if unique)
  - email (if unique)
  - phoneNumber
  - voteNumber (if unique)
  - tinNumber (if unique)
- **Processing:**
  1. Validate admin authorization
  2. Validate institution exists
  3. Validate uniqueness constraints
  4. Update institution record
  5. Log update in audit trail
- **Acceptance Criteria:**
  - AC-001: Only Admin can update institutions
  - AC-002: Uniqueness constraints enforced
  - AC-003: Update successful
  - AC-004: Update logged in audit trail
- **Business Rule:** BR-ADMIN-012 (Controlled institution updates)
- **Traceability:** BRD Objective 15 (Institution management), Use Case UC-ADMIN-011

**REQ-ADMIN-FR-012: List Institutions**
- **Priority:** High
- **Description:** System shall display list of all institutions
- **API Endpoint:** `GET /api/institutions`
- **Authorized Roles:** All authenticated users (for dropdown selection)
- **Query Parameters:**
  - page, size (pagination, optional)
- **Processing:**
  - Query all institutions
  - Sort alphabetically by name
  - Return institution list
- **Acceptance Criteria:**
  - AC-001: All users can view institutions (for selection)
  - AC-002: List complete and accurate
  - AC-003: Sorted alphabetically
  - AC-004: Includes all institution fields
- **Business Rule:** BR-ADMIN-013 (Public institution list)
- **Traceability:** BRD Objective 15 (Institution visibility), Use Case UC-ADMIN-012

#### 5.15.5 Role Assignment Rules

**REQ-ADMIN-FR-013: Enforce CSC Role Institution Rules**
- **Priority:** Critical
- **Description:** System shall enforce institution assignment rules for CSC-internal roles
- **CSC-Internal Roles (MUST be from "TUME YA UTUMISHI SERIKALINI"):**
  - HHRMD (Head of HR Management Division)
  - HRMO (HR Management Officer)
  - DO (Disciplinary Officer)
  - PO (Planning Officer)
  - CSCS (Civil Service Commission Secretary)
  - Admin
- **Institution-Based Roles (Can be from ANY institution):**
  - HRO (HR Officer)
  - HRRP (HR Representative)
  - Employee
- **Validation:**
  - On user creation: Validate role-institution compatibility
  - On user update: Revalidate if role or institution changes
  - Reject if CSC role assigned to non-CSC institution
- **Acceptance Criteria:**
  - AC-001: CSC roles only assignable to CSC institution
  - AC-002: Non-CSC roles assignable to any institution
  - AC-003: Validation on create and update
  - AC-004: Clear error message if rule violated
  - AC-005: Existing users grandfathered (no forced changes)
- **Business Rule:** BR-ADMIN-002 (CSC role restrictions)
- **Traceability:** BRD Objective 4 (Organizational structure), Use Case UC-ADMIN-013

**REQ-ADMIN-FR-014: Validate Institution Requirement by Role**
- **Priority:** High
- **Description:** System shall enforce institution requirement based on role
- **Roles Requiring Institution:**
  - HRO, HRRP, Employee (must have institutionId)
- **Roles NOT Requiring Institution:**
  - HHRMD, HRMO, DO, PO, CSCS, Admin (institutionId auto-set to CSC)
- **Validation:**
  - HRO/HRRP/Employee: institutionId required
  - CSC roles: institutionId auto-set to CSC institution ID
- **Acceptance Criteria:**
  - AC-001: HRO/HRRP/Employee require institutionId
  - AC-002: CSC roles auto-assigned to CSC institution
  - AC-003: Null institutionId rejected for HRO/HRRP/Employee
  - AC-004: Validation on user creation
- **Business Rule:** BR-ADMIN-014 (Institution requirement)
- **Traceability:** BRD Objective 4 (Data integrity), Use Case UC-ADMIN-014

---


## 6. Non-Functional Requirements

### 6.1 Performance Requirements

**REQ-PERF-NFR-001: Login Response Time**
- **Requirement:** System shall complete user login within 1.5 seconds (95th percentile)
- **Measurement:** Time from clicking "Login" button to dashboard display
- **Acceptance Criteria:**
  - 95% of login requests complete in ≤1.5 seconds
  - Average login time ≤1.0 second
  - Database query time ≤100ms
  - Password verification time ≤200ms
- **Test Method:** Load testing with 100 concurrent users
- **Priority:** High

**REQ-PERF-NFR-002: Dashboard Load Time**
- **Requirement:** System shall load dashboard page within 5 seconds
- **Measurement:** Time from navigation to full dashboard render (all widgets loaded)
- **Acceptance Criteria:**
  - Dashboard initial render ≤3 seconds
  - All dashboard widgets data loaded ≤5 seconds total
  - Skeleton screens shown during loading
  - No blocking operations delaying initial render
- **Test Method:** Performance testing with Lighthouse, WebPageTest
- **Priority:** High

**REQ-PERF-NFR-003: Employee Search Response Time**
- **Requirement:** System shall return employee search results within 1 second for 50,000+ employee database
- **Measurement:** Time from entering search query to displaying results
- **Acceptance Criteria:**
  - Search results returned in ≤1 second (95th percentile)
  - Database query optimized with indexes
  - Maximum 50 results per page (pagination)
  - Autocomplete suggestions returned in ≤500ms
- **Test Method:** Performance testing with full dataset (50,000 employees)
- **Priority:** High

**REQ-PERF-NFR-004: Report Generation Time**
- **Requirement:** System shall generate reports with 10,000+ records within 30 seconds
- **Measurement:** Time from clicking "Generate Report" to download availability
- **Acceptance Criteria:**
  - Reports with ≤1,000 records: ≤5 seconds
  - Reports with 1,001-10,000 records: ≤15 seconds
  - Reports with 10,001+ records: ≤30 seconds
  - Progress indicator shown during generation
  - Async processing for large reports
- **Test Method:** Report generation with various dataset sizes
- **Priority:** Medium

**REQ-PERF-NFR-005: API Response Time**
- **Requirement:** API endpoints shall respond within 2 seconds (95th percentile)
- **Acceptance Criteria:**
  - Simple queries (GET single resource): ≤500ms
  - List queries with pagination: ≤1 second
  - Complex queries with joins: ≤2 seconds
  - POST/PATCH operations: ≤1.5 seconds
  - 99th percentile ≤5 seconds
- **Test Method:** API load testing with k6 or Artillery
- **Priority:** High

**REQ-PERF-NFR-006: Concurrent User Support**
- **Requirement:** System shall support 100+ concurrent users without performance degradation
- **Acceptance Criteria:**
  - Response times remain within NFRs under 100 concurrent users
  - No timeout errors or 500 errors under load
  - Database connection pool handles concurrent queries
  - Server CPU usage ≤70% under 100 concurrent users
  - Server memory usage ≤70% under 100 concurrent users
- **Test Method:** Load testing with 100-150 concurrent virtual users
- **Priority:** High

**REQ-PERF-NFR-007: Database Performance**
- **Requirement:** Database queries shall execute within performance thresholds
- **Acceptance Criteria:**
  - Simple SELECT queries: ≤50ms
  - JOINed queries (2-3 tables): ≤200ms
  - Complex queries (4+ tables): ≤500ms
  - INSERT/UPDATE operations: ≤100ms
  - Database indexes optimized for frequent queries
  - Slow query log enabled (queries >1 second)
- **Test Method:** Database query profiling and analysis
- **Priority:** High

**REQ-PERF-NFR-008: File Upload Performance**
- **Requirement:** PDF file uploads shall complete within reasonable time based on file size
- **Acceptance Criteria:**
  - 1MB file: ≤5 seconds
  - 2MB file: ≤10 seconds
  - Upload progress indicator displayed
  - Chunked upload for files >1MB
  - Network errors auto-retry (3 attempts)
- **Test Method:** Upload testing with various file sizes and network speeds
- **Priority:** Medium

**REQ-PERF-NFR-009: Page Size and Load Time**
- **Requirement:** Web pages shall be optimized for fast loading
- **Acceptance Criteria:**
  - Page size (HTML, CSS, JS, images): ≤2MB compressed
  - First Contentful Paint (FCP): ≤2 seconds
  - Time to Interactive (TTI): ≤5 seconds
  - Largest Contentful Paint (LCP): ≤3 seconds
  - Cumulative Layout Shift (CLS): ≤0.1
  - Lighthouse Performance Score: ≥80
- **Test Method:** Lighthouse audit, WebPageTest
- **Priority:** Medium

### 6.2 Security Requirements

**REQ-SEC-NFR-001: Data Encryption in Transit**
- **Requirement:** All data transmitted between client and server shall be encrypted
- **Implementation:**
  - HTTPS enforced (HTTP redirects to HTTPS)
  - TLS 1.2 or higher
  - Valid SSL certificate from trusted CA
  - Strong cipher suites only (no weak/deprecated ciphers)
- **Acceptance Criteria:**
  - All requests use HTTPS
  - SSL Labs test grade: A or A+
  - No mixed content warnings
  - Certificate valid and trusted
- **Priority:** Critical

**REQ-SEC-NFR-002: Data Encryption at Rest**
- **Requirement:** Sensitive data shall be encrypted when stored
- **Implementation:**
  - Database encryption (PostgreSQL encryption or disk encryption)
  - MinIO documents encrypted at rest
  - Passwords hashed with bcrypt (never stored plaintext)
  - Environment variables for secrets (no hardcoded credentials)
- **Acceptance Criteria:**
  - Database files encrypted on disk
  - MinIO buckets configured for encryption
  - No plaintext passwords in database
  - Secrets stored in environment variables or secure vault
- **Priority:** Critical

**REQ-SEC-NFR-003: SQL Injection Prevention**
- **Requirement:** System shall prevent SQL injection attacks
- **Implementation:**
  - Prisma ORM with parameterized queries (no raw SQL)
  - Input validation and sanitization
  - No dynamic query construction with user input
- **Acceptance Criteria:**
  - All database queries use Prisma ORM parameterized queries
  - SQL injection testing shows no vulnerabilities
  - Code review confirms no raw SQL with user input
- **Priority:** Critical

**REQ-SEC-NFR-004: Cross-Site Scripting (XSS) Prevention**
- **Requirement:** System shall prevent XSS attacks
- **Implementation:**
  - React auto-escapes output by default
  - Content Security Policy (CSP) header
  - No `dangerouslySetInnerHTML` with user input
  - Input validation and sanitization
- **Acceptance Criteria:**
  - XSS testing shows no vulnerabilities
  - CSP header configured
  - Code review confirms proper output escaping
- **Priority:** Critical

**REQ-SEC-NFR-005: Cross-Site Request Forgery (CSRF) Prevention**
- **Requirement:** System shall prevent CSRF attacks
- **Implementation:**
  - CSRF tokens for state-changing operations
  - SameSite cookie attribute
  - Verify origin/referer headers
- **Acceptance Criteria:**
  - CSRF tokens implemented for POST/PATCH/DELETE requests
  - SameSite cookie attribute set
  - CSRF testing shows no vulnerabilities
- **Priority:** Critical

**REQ-SEC-NFR-006: Security Headers**
- **Requirement:** System shall send security headers with all responses
- **Required Headers:**
  - `Content-Security-Policy` (CSP)
  - `Strict-Transport-Security` (HSTS)
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `X-XSS-Protection: 1; mode=block`
  - `Referrer-Policy: no-referrer-when-downgrade`
- **Acceptance Criteria:**
  - All responses include security headers
  - Headers configured correctly
  - Security header scanner confirms presence
- **Priority:** High

**REQ-SEC-NFR-007: Sensitive Data Masking**
- **Requirement:** Sensitive data shall be masked in logs and error messages
- **Implementation:**
  - Passwords never logged
  - JWT tokens redacted in logs
  - Personal identifiable information (PII) redacted
  - Error messages sanitized (no stack traces to user)
- **Acceptance Criteria:**
  - Log files contain no plaintext passwords or tokens
  - User-facing errors generic (e.g., "An error occurred")
  - Technical details logged server-side only
- **Priority:** High

**REQ-SEC-NFR-008: File Upload Security**
- **Requirement:** File uploads shall be validated and secured
- **Implementation:**
  - File type validation (PDF only)
  - File size limits enforced (2MB for requests, 1MB for complaints)
  - Virus scanning (future enhancement)
  - Files stored outside web root
  - Files served with correct Content-Type header
- **Acceptance Criteria:**
  - Only PDF files accepted
  - File size limits enforced
  - Non-PDF uploads rejected
  - Files not executable from web
- **Priority:** High

**REQ-SEC-NFR-009: Rate Limiting**
- **Requirement:** API endpoints shall implement rate limiting to prevent abuse
- **Implementation:**
  - Login endpoint: 5 attempts per 15 minutes per IP
  - API endpoints: 100 requests per minute per user
  - Burst limit: 200 requests per minute
  - 429 Too Many Requests response when exceeded
- **Acceptance Criteria:**
  - Rate limiting enforced on login endpoint
  - Excessive requests return 429 status
  - Legitimate usage not blocked
- **Priority:** Medium

**REQ-SEC-NFR-010: Security Audit Logging**
- **Requirement:** Security-related events shall be logged for monitoring
- **Events Logged:**
  - All login attempts (success/failure)
  - Password changes
  - Account lockouts
  - Unauthorized access attempts (403 Forbidden)
  - Role changes
  - User account creation/deletion
  - Force logout events
  - Failed CSRF token validations
- **Acceptance Criteria:**
  - All security events logged with timestamp, user, IP, action
  - Logs immutable (cannot be edited)
  - Admin can view security logs
  - Alerts triggered for suspicious activity
- **Priority:** High

### 6.3 Reliability and Availability

**REQ-AVAIL-NFR-001: System Uptime**
- **Requirement:** System shall be available 99.5% of the time during working hours (Mon-Fri, 8:00-17:00 EAT)
- **Measurement:** Uptime monitored via health checks (ping/HTTP GET)
- **Acceptance Criteria:**
  - Uptime ≥99.5% over 30-day period during working hours
  - Downtime for scheduled maintenance excluded (announced 48 hours in advance)
  - Health check endpoint (`/api/health`) responds within 1 second
  - Monthly uptime reports generated
- **Priority:** High

**REQ-AVAIL-NFR-002: Error Handling**
- **Requirement:** System shall handle errors gracefully without crashing
- **Implementation:**
  - Try-catch blocks around risky operations
  - Database errors caught and logged
  - User-friendly error messages displayed
  - Technical errors logged server-side
  - 500 errors logged with stack trace
  - Error recovery mechanisms (retry, fallback)
- **Acceptance Criteria:**
  - Application does not crash on error
  - User sees friendly error message
  - Error logged with details for troubleshooting
  - User can retry or navigate away
- **Priority:** Critical

**REQ-AVAIL-NFR-003: Database Connection Resilience**
- **Requirement:** System shall handle database connection failures gracefully
- **Implementation:**
  - Connection pool with auto-reconnect
  - Retry database operations on transient failures (3 attempts)
  - Display error message if database unavailable
  - Health check monitors database connectivity
- **Acceptance Criteria:**
  - Database connection failures logged
  - User notified of temporary unavailability
  - System recovers automatically when database available
- **Priority:** High

**REQ-AVAIL-NFR-004: Backup and Recovery**
- **Requirement:** System shall have automated backup and recovery procedures
- **Implementation:**
  - Daily automated database backups (2:00 AM)
  - Backup retention: 30 days
  - Backups stored offsite or separate server
  - Backup success/failure logged and alerted
  - Documented recovery procedures
  - Quarterly backup restore testing
- **Acceptance Criteria:**
  - Backups run daily without manual intervention
  - Backup files encrypted
  - Successful backup verified (restore test)
  - Recovery Time Objective (RTO): 4 hours
  - Recovery Point Objective (RPO): 24 hours
- **Priority:** Critical

**REQ-AVAIL-NFR-005: Data Integrity**
- **Requirement:** System shall ensure data integrity through transactions and constraints
- **Implementation:**
  - Database transactions for multi-step operations
  - ACID compliance (Atomicity, Consistency, Isolation, Durability)
  - Foreign key constraints
  - Unique constraints (ZanID, email, username)
  - Not-null constraints on required fields
- **Acceptance Criteria:**
  - Multi-step operations commit or rollback atomically
  - Referential integrity enforced
  - Constraint violations prevented
  - Data consistency maintained
- **Priority:** Critical

### 6.4 Usability and Accessibility

**REQ-USABILITY-NFR-001: User Interface Intuitiveness**
- **Requirement:** System shall have an intuitive user interface requiring minimal training
- **Acceptance Criteria:**
  - New users productive within 1 hour of training
  - User satisfaction rating ≥85% (post-UAT survey)
  - Common tasks completable without help documentation
  - Consistent UI patterns throughout application
- **Priority:** High

**REQ-USABILITY-NFR-002: Error Messages**
- **Requirement:** Error messages shall be clear, specific, and actionable
- **Characteristics:**
  - Plain language (no technical jargon)
  - Specific to the error (not generic "An error occurred")
  - Actionable guidance (how to fix)
  - Positive tone (not blame)
- **Examples:**
  - Good: "Confirmation date must be at least 12 months after employment date. Please select a later date."
  - Bad: "Invalid date"
- **Acceptance Criteria:**
  - Validation errors identify specific field and issue
  - Error messages provide corrective guidance
  - No technical stack traces shown to users
- **Priority:** High

**REQ-USABILITY-NFR-003: Responsive Design**
- **Requirement:** User interface shall be responsive and functional on all screen sizes
- **Breakpoints:**
  - Desktop: ≥1024px
  - Tablet: 768px-1023px
  - Mobile: 375px-767px
- **Acceptance Criteria:**
  - All pages render correctly on desktop, tablet, mobile
  - No horizontal scrolling (except tables on mobile)
  - Touch-friendly controls on mobile (≥44x44px touch targets)
  - Navigation menu responsive (hamburger on mobile)
  - Forms stack vertically on narrow screens
- **Priority:** High

**REQ-USABILITY-NFR-004: Accessibility (Basic)**
- **Requirement:** System shall support basic accessibility features
- **Features:**
  - Keyboard navigation (Tab, Enter, Escape)
  - Focus indicators visible
  - Form labels associated with inputs
  - ARIA labels for icon buttons
  - Semantic HTML (header, nav, main, footer)
  - Sufficient color contrast (WCAG AA)
- **Acceptance Criteria:**
  - All interactive elements accessible via keyboard
  - Focus visible when navigating with Tab key
  - Screen reader can read form labels
  - Color contrast ratio ≥4.5:1 for normal text, ≥3:1 for large text
- **Priority:** Medium

**REQ-USABILITY-NFR-005: Loading Indicators**
- **Requirement:** System shall display loading indicators for asynchronous operations
- **Implementation:**
  - Spinner or skeleton screen during data loading
  - Progress bar for file uploads
  - Disabled button with spinner during form submission
  - Loading state prevents duplicate submissions
- **Acceptance Criteria:**
  - Loading indicator shown for operations >500ms
  - User aware system is processing
  - Buttons disabled during submission (prevent double-click)
- **Priority:** Medium

**REQ-USABILITY-NFR-006: Help and Guidance**
- **Requirement:** System shall provide contextual help and guidance
- **Implementation:**
  - Tooltips on hover for complex fields
  - Help text below form fields
  - Validation hints (e.g., "Password must be 8+ characters")
  - User manual accessible from menu
- **Acceptance Criteria:**
  - Tooltips explain purpose of fields
  - Help text guides user input
  - Link to user manual in header/footer
- **Priority:** Medium

### 6.5 Maintainability

**REQ-MAINT-NFR-001: Code Quality**
- **Requirement:** Codebase shall follow coding standards and best practices
- **Standards:**
  - TypeScript for type safety
  - ESLint for code linting
  - Prettier for code formatting
  - Code comments for complex logic
  - Modular architecture (separation of concerns)
- **Acceptance Criteria:**
  - ESLint configured and passing
  - Prettier formatting applied consistently
  - Code review process followed
  - Complex functions documented with comments
- **Priority:** High

**REQ-MAINT-NFR-002: Documentation**
- **Requirement:** System shall be well-documented for developers and administrators
- **Documentation Types:**
  - API documentation (endpoint descriptions, parameters, responses)
  - Database schema documentation (ERD, table descriptions)
  - README files for setup and deployment
  - Code comments for complex logic
  - User manual (for end users)
  - Administrator manual (for system admins)
- **Acceptance Criteria:**
  - API endpoints documented with examples
  - Database schema visualized (ERD)
  - Setup instructions in README
  - User and admin manuals available
- **Priority:** Medium

**REQ-MAINT-NFR-003: Logging**
- **Requirement:** System shall log sufficient information for troubleshooting
- **Log Levels:**
  - ERROR: Application errors, exceptions
  - WARN: Warnings, potential issues
  - INFO: Important events (login, logout, approvals)
  - DEBUG: Detailed diagnostic information (development only)
- **Logged Information:**
  - Timestamp
  - Log level
  - User ID (if authenticated)
  - Action/Event description
  - Error message and stack trace (if error)
  - IP address
- **Acceptance Criteria:**
  - Errors logged with stack trace
  - Important events logged at INFO level
  - Logs rotated daily (prevent file size issues)
  - Admin can view application logs
- **Priority:** High

**REQ-MAINT-NFR-004: Database Migrations**
- **Requirement:** Database schema changes shall be managed via migrations
- **Implementation:**
  - Prisma Migrate for schema changes
  - Migration files versioned in Git
  - Migrations applied automatically on deployment
  - Rollback capability for failed migrations
- **Acceptance Criteria:**
  - Schema changes applied via migrations (not manual SQL)
  - Migration history tracked
  - Failed migrations can be rolled back
  - Database schema in sync with Prisma schema file
- **Priority:** High

**REQ-MAINT-NFR-005: Monitoring and Alerting**
- **Requirement:** System shall have monitoring and alerting for critical issues
- **Monitored Metrics:**
  - System uptime (health check)
  - Error rate (500 errors)
  - Database connection status
  - MinIO connection status
  - Redis connection status
  - Disk space usage
  - Failed login attempts
- **Alerts:**
  - Email alert when uptime <99%
  - Email alert when error rate >5%
  - Email alert when disk space >80% full
  - Email alert when backup fails
  - Email alert when multiple failed logins detected
- **Acceptance Criteria:**
  - Monitoring dashboard displays metrics
  - Alerts sent when thresholds exceeded
  - Admin receives alert emails
- **Priority:** Medium

### 6.6 Compliance

**REQ-COMP-NFR-001: Audit Trail Retention**
- **Requirement:** Audit logs shall be retained for 10 years
- **Implementation:**
  - Audit logs stored in database (immutable)
  - Automated archival of old logs (>2 years moved to archive storage)
  - Backup includes audit logs
- **Acceptance Criteria:**
  - Audit logs retained for 10+ years
  - Old logs archived but accessible
  - Logs included in backups
- **Priority:** Critical

**REQ-COMP-NFR-002: Data Retention Policy Enforcement**
- **Requirement:** System shall enforce data retention policies
- **Retention Periods:**
  - Employee records: 10 years post-retirement
  - Approved requests: Indefinite
  - Rejected requests: 5 years
  - Audit logs: 10 years
- **Implementation:**
  - Retention periods configured in system
  - Automated archival/deletion jobs (future enhancement)
  - Manual data purging process documented
- **Acceptance Criteria:**
  - Retention policies documented
  - Data not deleted prematurely
  - Archived data accessible if needed
- **Priority:** Medium

**REQ-COMP-NFR-003: Civil Service Regulations Compliance**
- **Requirement:** System shall enforce civil service regulations via business rules
- **Regulations Enforced:**
  - Probation period: 12-18 months
  - Promotion eligibility: 2+ years service
  - LWOP limits: 3-year max, 2 lifetime
  - Service extension limits: 2 lifetime
  - Approval authority per regulations
- **Acceptance Criteria:**
  - Business rules implemented in code
  - Validation prevents non-compliant submissions
  - Compliance verified through UAT
- **Priority:** Critical

---

## 7. Data Requirements

### 7.1 Data Entities

**Entity: User**
- **Description:** System users (HRO, HHRMD, HRMO, DO, CSCS, PO, HRRP, ADMIN)
- **Primary Key:** id (String, UUID)
- **Attributes:**
  - username (String, unique, max 50 chars)
  - password (String, bcrypt hash)
  - email (String, unique, valid email)
  - fullName (String, max 100 chars)
  - role (Enum: ADMIN, CSCS, HHRMD, HRMO, DO, HRO, PO, HRRP)
  - institutionId (String, FK to Institution, required if role=HRO or HRRP)
  - isActive (Boolean, default true)
  - passwordChangedAt (DateTime)
  - accountLockedUntil (DateTime, nullable)
  - failedLoginAttempts (Integer, default 0)
  - lastLoginAt (DateTime, nullable)
  - createdAt (DateTime, default now)
  - updatedAt (DateTime, auto-update)
- **Relationships:**
  - belongsTo Institution (if HRO or HRRP)
  - hasMany ConfirmationRequest (submittedBy, reviewedBy)
  - hasMany PromotionRequest (submittedBy, reviewedBy)
  - (etc. for all request types)
  - hasMany Notification
- **Constraints:**
  - username unique
  - email unique
  - institutionId required if role = HRO or HRRP
- **Indexes:**
  - username (unique)
  - email (unique)
  - role

**Entity: Employee**
- **Description:** Civil servant employee records
- **Primary Key:** id (String, UUID)
- **Attributes:**
  - employeeEntityId (String, nullable, HRIMS ID for sync)
  - name (String, max 200 chars)
  - gender (String: Male, Female, Other)
  - profileImageUrl (String, nullable, MinIO URL)
  - dateOfBirth (DateTime, nullable)
  - placeOfBirth (String, nullable)
  - region (String, nullable)
  - countryOfBirth (String, nullable)
  - zanId (String, unique, exactly 12 digits)
  - phoneNumber (String, nullable)
  - contactAddress (String, nullable)
  - zssfNumber (String, nullable)
  - payrollNumber (String, nullable)
  - cadre (String, nullable)
  - salaryScale (String, nullable)
  - ministry (String, nullable)
  - department (String, nullable)
  - appointmentType (String, nullable)
  - contractType (String, nullable)
  - recentTitleDate (DateTime, nullable)
  - currentReportingOffice (String, nullable)
  - currentWorkplace (String, nullable)
  - employmentDate (DateTime, nullable)
  - confirmationDate (DateTime, nullable)
  - retirementDate (DateTime, nullable)
  - status (String: On Probation, Confirmed, On LWOP, Retired, Resigned, Terminated, Dismissed)
  - ardhilHaliUrl (String, nullable, MinIO URL)
  - confirmationLetterUrl (String, nullable, MinIO URL)
  - jobContractUrl (String, nullable, MinIO URL)
  - birthCertificateUrl (String, nullable, MinIO URL)
  - institutionId (String, FK to Institution)
  - createdAt (DateTime, default now)
  - updatedAt (DateTime, auto-update)
- **Relationships:**
  - belongsTo Institution
  - hasMany ConfirmationRequest
  - hasMany PromotionRequest
  - hasMany LwopRequest
  - hasMany CadreChangeRequest
  - hasMany ServiceExtensionRequest
  - hasMany RetirementRequest
  - hasMany ResignationRequest
  - hasMany SeparationRequest (Termination/Dismissal)
  - hasMany EmployeeCertificate
  - hasOne User (optional, for employee login)
- **Constraints:**
  - zanId unique
  - institutionId required (FK to Institution)
- **Indexes:**
  - name
  - zanId (unique)
  - payrollNumber
  - employmentDate (desc)
  - status, institutionId (composite)
  - institutionId

**Entity: Institution**
- **Description:** Government institutions/ministries
- **Primary Key:** id (String, UUID)
- **Attributes:**
  - name (String, unique, max 200 chars)
  - email (String, nullable, unique)
  - phoneNumber (String, nullable)
  - voteNumber (String, nullable, unique)
  - tinNumber (String, nullable, unique)
- **Relationships:**
  - hasMany Employee
  - hasMany User (HRO, HRRP assigned to institution)
- **Constraints:**
  - name unique
  - email unique if not null
  - voteNumber unique if not null
  - tinNumber unique if not null
- **Indexes:**
  - name (unique)

**Entity: ConfirmationRequest**
- **Description:** Employee confirmation requests (probation → confirmed)
- **Primary Key:** id (String, format: CONF-[Institution]-YYYY-NNNNNN)
- **Attributes:**
  - status (Enum: PENDING, APPROVED, REJECTED, SENT_BACK)
  - reviewStage (Enum: Submitted, Under Review, Decision Made)
  - documents (String[], array of MinIO URLs)
  - rejectionReason (String, nullable, required if REJECTED)
  - employeeId (String, FK to Employee)
  - submittedById (String, FK to User, HRO)
  - reviewedById (String, nullable, FK to User, HHRMD/HRMO)
  - decisionDate (DateTime, nullable, set when approved)
  - commissionDecisionDate (DateTime, nullable, set when approved)
  - createdAt (DateTime, default now)
  - updatedAt (DateTime, auto-update)
- **Relationships:**
  - belongsTo Employee
  - belongsTo User (submittedBy)
  - belongsTo User (reviewedBy, nullable)
- **Constraints:**
  - rejectionReason required if status = REJECTED
  - documents array length ≥ 3 (three required documents)
- **Indexes:**
  - status
  - reviewStage
  - employeeId
  - createdAt (desc)

(Similar detailed entity definitions for all 25+ tables: PromotionRequest, LwopRequest, CadreChangeRequest, ServiceExtensionRequest, RetirementRequest, ResignationRequest, SeparationRequest, Complaint, EmployeeCertificate, Notification, etc.)

### 7.2 Data Validation Rules

**Employee Data Validation:**
- zanId: Exactly 12 digits, unique
- name: Max 200 chars, required
- gender: Must be "Male", "Female", or "Other"
- email: Valid email format (if provided)
- phoneNumber: Valid phone format (if provided)
- status: Must be one of defined enum values

**Request Data Validation:**
- status: Must be PENDING, APPROVED, REJECTED, or SENT_BACK
- documents: Array of valid MinIO URLs, min 1 document
- rejectionReason: Min 20 chars if provided, max 1000 chars
- All request IDs: Match format (TYPE-Institution-YYYY-NNNNNN)

**User Data Validation:**
- username: 3-50 chars, alphanumeric + underscore, unique
- email: Valid email format, unique
- password: 8+ chars, complexity requirements
- role: Must be one of 9 defined roles
- institutionId: Required if role = HRO or HRRP

### 7.3 Data Integrity Constraints

**Referential Integrity:**
- All foreign keys enforced (Prisma relations)
- Cascade delete where appropriate (e.g., Employee certificates delete when employee deleted)
- Prevent orphaned records

**Uniqueness Constraints:**
- User.username unique
- User.email unique
- Employee.zanId unique
- Institution.name unique
- Institution.email unique (if not null)
- Institution.voteNumber unique (if not null)
- Institution.tinNumber unique (if not null)

**Not-Null Constraints:**
- All required fields enforced at database level
- Nullable fields explicitly allowed

### 7.4 Data Relationships

```
Institution (1) ──> (N) Employee
Institution (1) ──> (N) User (HRO, HRRP)

Employee (1) ──> (N) ConfirmationRequest
Employee (1) ──> (N) PromotionRequest
Employee (1) ──> (N) LwopRequest
Employee (1) ──> (N) CadreChangeRequest
Employee (1) ──> (N) ServiceExtensionRequest
Employee (1) ──> (N) RetirementRequest
Employee (1) ──> (N) ResignationRequest
Employee (1) ──> (N) SeparationRequest
Employee (1) ──> (N) EmployeeCertificate

User (1) ──> (N) ConfirmationRequest (submittedBy)
User (1) ──> (N) ConfirmationRequest (reviewedBy)
(Similar for all request types)

User (1) ──> (N) Complaint (complainantId, for employees)
User (1) ──> (N) Complaint (reviewedById, for DO/HHRMD)

User (1) ──> (N) Notification
```

---

## 8. System Quality Attributes

### 8.1 Testability

**Requirement:** System shall be designed for comprehensive testing
- **Characteristics:**
  - Modular architecture (separation of concerns)
  - Dependency injection for mocking
  - API endpoints testable with automated tools
  - Database operations testable with test database
  - UI components testable with testing library
- **Test Coverage Goals:**
  - Unit tests: ≥70% code coverage
  - Integration tests: All critical workflows
  - End-to-end tests: User journeys
  - Security tests: All security requirements

### 8.2 Scalability

**Requirement:** System shall scale to accommodate growth
- **Horizontal Scaling:**
  - Stateless application servers (multiple instances behind load balancer)
  - Database read replicas for scaling reads
- **Vertical Scaling:**
  - Increase server resources (CPU, RAM) as needed
- **Data Scaling:**
  - Database partitioning/sharding (future, if >500K employees)
  - Object storage scales independently (MinIO distributed mode)
- **Capacity Goals:**
  - Support 100,000+ employees (2x current)
  - Support 200+ concurrent users
  - Support 1,000,000+ document files

### 8.3 Interoperability

**Requirement:** System shall integrate with external systems
- **Current Integrations:**
  - HRIMS (batch data sync)
  - Email (SMTP)
  - Google Genkit (AI API)
- **Future Integrations:**
  - TCU (qualification verification API)
  - Pension Authority (retirement notification API)
  - Payroll system (salary adjustment API)
- **Integration Standards:**
  - RESTful APIs (JSON over HTTPS)
  - S3-compatible object storage
  - Standard protocols (SMTP, HTTP)

### 8.4 Recoverability

**Requirement:** System shall recover from failures quickly
- **Database Recovery:**
  - Automated daily backups
  - Point-in-time recovery capability (WAL archiving)
  - RTO: 4 hours, RPO: 24 hours
- **Application Recovery:**
  - Restart application on crash (PM2 auto-restart)
  - Graceful shutdown and startup
  - State stored in database (stateless application)
- **Disaster Recovery:**
  - Offsite backups
  - Documented recovery procedures
  - Quarterly DR drills

---

## Appendices

### Appendix A: Requirements Traceability Matrix

| Requirement ID | Business Objective | Use Case | Test Case(s) | Status |
| --- | --- | --- | --- | --- |
| REQ-AUTH-FR-001 | BRD-OBJ-4 (Security) | UC-AUTH-001 | TC-AUTH-001, TC-AUTH-002 | Implemented |
| REQ-AUTH-FR-002 | BRD-OBJ-4 (Security) | UC-AUTH-001 | TC-AUTH-003 | Implemented |
| (etc.) | (etc.) | (etc.) | (etc.) | (etc.) |

### Appendix B: Glossary

(See Section 1.3 for definitions)

### Appendix C: Acronyms

(See Section 1.3 for acronyms)

### Appendix D: Use Case List

**Authentication Module:**
- UC-AUTH-001: User logs in with username and password
- UC-AUTH-002: Employee logs in with ZanID, Payroll, ZSSF
- UC-AUTH-003: User changes password
- UC-AUTH-004: Admin resets user password
- UC-AUTH-005: User logs out

**Confirmation Request Module:**
- UC-CONF-001: HRO submits confirmation request
- UC-CONF-002: HHRMD/HRMO approves confirmation request
- UC-CONF-003: HHRMD/HRMO rejects confirmation request
- UC-CONF-004: HHRMD/HRMO sends back confirmation request
- UC-CONF-005: HRO rectifies and resubmits confirmation request

(etc. for all modules)

### Appendix E: Business Rules Reference

**Authentication:**
- BR-SEC-001: Authentication required for all system access
- BR-SEC-002: Password complexity enforced
- BR-SEC-003: Account lockout after 5 failed attempts
- BR-SEC-004: Session timeout after 7 minutes inactivity
- BR-SEC-005: Maximum 3 concurrent sessions per user

**Confirmation:**
- BR-CONF-001: Probation period ≥12 months
- BR-CONF-002: One active confirmation request per employee
- BR-CONF-003: Only "On Probation" employees confirmable
- BR-CONF-004: All three documents mandatory
- BR-CONF-005: HHRMD or HRMO approval authority
- BR-CONF-006: Employee status updated only when APPROVED
- BR-CONF-007: Decision letter required for APPROVED

(etc. for all modules - see Section 5 functional requirements)

---

## Document Approval

**Prepared By:**
Name: ______________________________________________________________
Title: Systems Analyst
Date: ______________________________________________________________
Signature: ______________________________________________________________

**Reviewed By:**
Name: ______________________________________________________________
Title: Project Manager
Date: ______________________________________________________________
Signature: ______________________________________________________________

**Approved By:**
Name: ______________________________________________________________
Title: Head of HR Management Division (HHRMD)
Date: ______________________________________________________________
Signature: ______________________________________________________________

**Technical Approval:**
Name: ______________________________________________________________
Title: Lead Developer / System Architect
Date: ______________________________________________________________
Signature: ______________________________________________________________

---

**Document Classification:** Official - Government of Zanzibar
**Distribution:** Project Team, Stakeholders, E-Government Authority
**Next Review:** As needed for change requests or enhancements

---

_This System Requirements Specification provides the definitive technical requirements for the Civil Service Management System (CSMS). All system design, development, testing, and acceptance activities shall be based on the requirements defined in this document._

**Document Version:** 2.0
**Date:** February 2, 2026
**Status:** Final for Implementation and Testing
