# BUSINESS REQUIREMENTS DOCUMENT (BRD)

## CIVIL SERVICE MANAGEMENT SYSTEM (CSMS)

---

## Document Control

| Item                   | Details                                                  |
| ---------------------- | -------------------------------------------------------- |
| **Document Title**     | Business Requirements Document                           |
| **Project Name**       | Civil Service Management System (CSMS)                   |
| **Project Owner**      | Civil Service Commission, Revolutionary Government of Zanzibar |
| **Version**            | 1.0                                                      |
| **Date Prepared**      | February 2, 2026                                         |
| **Prepared By**        | Business Analysis Team                                   |
| **Document Status**    | Final                                                    |
| **Classification**     | Official - Government of Zanzibar                        |

---

## Document Revision History

| Version | Date           | Author           | Description                              |
| ------- | -------------- | ---------------- | ---------------------------------------- |
| 0.1     | Jan 25, 2026   | Business Analyst | Initial draft based on existing documentation |
| 0.2     | Jan 28, 2026   | Business Analyst | Added stakeholder analysis and business objectives |
| 0.3     | Jan 30, 2026   | Business Analyst | Incorporated technical review feedback   |
| 1.0     | Feb 2, 2026    | Business Analyst | Final version for stakeholder approval   |

---

## Executive Summary

The Civil Service Management System (CSMS) represents a transformational digital initiative for the Revolutionary Government of Zanzibar's Civil Service Commission (CSC). This Business Requirements Document defines the comprehensive business needs, objectives, and requirements for a modern web-based platform designed to automate and streamline human resource management processes across the entire Zanzibar civil service.

### Business Context

The CSC is responsible for managing the affairs of over **50,000 civil servants** distributed across **41 government institutions**. Prior to CSMS, all HR operations were conducted through manual, paper-based processes, resulting in significant operational inefficiencies, lack of transparency, prolonged processing times, and limited strategic oversight capabilities.

### The Challenge

The current manual system faces critical challenges:

- **Operational Inefficiency:** Average HR request processing time of 15+ days
- **Lack of Transparency:** No real-time visibility into request status
- **Data Fragmentation:** Employee records scattered across multiple locations
- **Compliance Risks:** Inadequate audit trails and documentation
- **Resource Intensive:** High administrative overhead for manual processing
- **Limited Analytics:** Inability to generate timely management reports
- **Scalability Constraints:** Manual processes cannot accommodate growth

### The Solution

CSMS is a comprehensive, full-stack web application that:

- **Automates** all 8 critical HR workflow processes from request submission through approval
- **Centralizes** employee data management with secure, role-based access
- **Digitizes** document management with S3-compatible object storage
- **Provides** real-time status tracking and automated notifications
- **Enables** data-driven decision-making through advanced reporting and analytics
- **Ensures** compliance through comprehensive, immutable audit trails
- **Integrates** with existing HRIMS infrastructure for data synchronization

### Business Value

**Quantitative Benefits:**
- 70% reduction in HR request processing time (from 15 days to 3-5 days)
- 90% reduction in manual data entry errors
- 100% digital document storage, eliminating physical filing requirements
- 99.5% system availability ensuring continuous service
- Support for 50,000+ employees with room for growth

**Qualitative Benefits:**
- Enhanced transparency and accountability in civil service operations
- Improved employee satisfaction through faster, more predictable service
- Better strategic decision-making through real-time workforce analytics
- Reduced operational costs and administrative overhead
- Stronger compliance posture with comprehensive audit capabilities

### Project Scope Summary

**In Scope:**
- 8 HR request workflow modules (Confirmation, Promotion, LWOP, Cadre Change, Service Extension, Retirement, Resignation, Termination/Dismissal)
- Employee complaint management system
- 9 role-based user types with granular permissions
- Comprehensive employee profile management
- Document management and storage
- Real-time notifications and alerts
- Reporting and analytics dashboard
- Complete audit trail system
- HRIMS integration for data synchronization

**Out of Scope:**
- Payroll processing (separate system)
- Recruitment and hiring workflows
- Regular leave management (annual, sick leave)
- Performance appraisal system
- Training and development tracking
- Mobile native applications (responsive web only)

### Investment & Timeline

**Technology Platform:** Next.js 14 full-stack application with PostgreSQL database, MinIO object storage, and Redis background processing

**Project Duration:** 31 weeks (February - September 2025)

**Current Status:** System successfully deployed and operational at https://csms.zanajira.go.tz

**Budget Performance:** Completed 1% under budget

**Schedule Performance:** Delivered on time with all success criteria met

---

## Table of Contents

1. [Business Overview](#1-business-overview)
2. [Stakeholder Analysis](#2-stakeholder-analysis)
3. [Business Objectives](#3-business-objectives)
4. [Current State Assessment](#4-current-state-assessment)
5. [Scope Definition](#5-scope-definition)
6. [Business Requirements](#6-business-requirements)
7. [Functional Requirements](#7-functional-requirements)
8. [Non-Functional Requirements](#8-non-functional-requirements)
9. [Business Rules](#9-business-rules)
10. [Data Requirements](#10-data-requirements)
11. [Integration Requirements](#11-integration-requirements)
12. [User Requirements](#12-user-requirements)
13. [Reporting Requirements](#13-reporting-requirements)
14. [Security & Compliance Requirements](#14-security--compliance-requirements)
15. [Success Criteria](#15-success-criteria)
16. [Assumptions & Constraints](#16-assumptions--constraints)
17. [Risk Assessment](#17-risk-assessment)
18. [Approval & Sign-Off](#18-approval--sign-off)

---

## 1. Business Overview

### 1.1 Organizational Context

**Organization:** Civil Service Commission (CSC), Revolutionary Government of Zanzibar

**Mission:** To ensure effective human resource management and development for the Zanzibar civil service, maintaining high standards of professionalism, integrity, and service delivery.

**Mandate:** The CSC is the statutory body responsible for:
- Appointment, confirmation, and promotion of civil servants
- Administration of civil service regulations and policies
- Workforce planning and development
- Disciplinary oversight and grievance resolution
- Performance management and compliance monitoring

**Operational Scope:**
- **Coverage:** All government ministries, departments, and agencies in Zanzibar
- **Institutions Managed:** 41+ government institutions
- **Employee Population:** 50,000+ active civil servants
- **Geographic Reach:** Islands of Unguja and Pemba
- **Hierarchical Structure:** 9 distinct functional roles managing HR operations

### 1.2 Business Context

The Zanzibar civil service operates under the framework of the Civil Service Act and related regulations that govern all aspects of employment in the public sector. The CSC serves as the central authority for human resource management, ensuring consistency, fairness, and compliance across all government institutions.

**Key Operational Characteristics:**

1. **Hierarchical Approval Structure:**
   - Institution-level HR Officers (HRO) serve as primary points of contact
   - CSC-level officers (HHRMD, HRMO, DO) provide approval authority
   - Executive oversight from Chief Secretary Civil Service (CSCS)
   - Specialized roles for planning (HRRP), research, and administration

2. **Complex Workflow Requirements:**
   - Multiple request types with varying approval authorities
   - Document-intensive processes requiring verification
   - Integration with external systems (HRIMS, TCU, Pension)
   - Regulatory compliance with probation periods, service requirements, and civil service regulations

3. **Data-Intensive Operations:**
   - Comprehensive employee lifecycle tracking from hiring to retirement
   - Multi-year service history and qualification records
   - Document repository for certificates, contracts, and official correspondence
   - Performance and disciplinary history maintenance

4. **Stakeholder Diversity:**
   - Individual employees seeking services and information
   - Institutional HR officers managing departmental workforce
   - CSC officers making policy and individual case decisions
   - Executive leadership requiring strategic oversight
   - External parties (TCU, Pension Authority, HRIMS) for integration

### 1.3 Strategic Alignment

The CSMS project directly supports the following strategic initiatives:

**Zanzibar Development Vision 2050:**
- Digital transformation of government services
- Enhanced public sector efficiency and effectiveness
- Transparent and accountable governance

**E-Government Strategy:**
- Transition from manual to digital service delivery
- Integration of government information systems
- Citizen-centric service design

**Public Service Reform Program:**
- Modernization of HR management practices
- Strengthening institutional capacity
- Performance-driven culture

**Civil Service Commission Strategic Plan:**
- Automated workflow management
- Data-driven workforce planning
- Enhanced service delivery to employees
- Compliance with civil service regulations

### 1.4 Business Drivers

The following business drivers necessitate the CSMS implementation:

**Operational Drivers:**
1. **Efficiency Imperative:** Eliminate manual, paper-based processes consuming excessive time and resources
2. **Service Quality:** Improve timeliness and reliability of HR services to employees
3. **Capacity Building:** Enable HR staff to focus on strategic activities rather than administrative tasks
4. **Process Standardization:** Ensure consistency in HR operations across all institutions

**Strategic Drivers:**
1. **Data-Driven Decision Making:** Provide management with real-time workforce analytics
2. **Workforce Planning:** Enable proactive planning based on retirement projections, skill gaps, and organizational needs
3. **Policy Compliance:** Enforce civil service regulations systematically through automated controls
4. **Risk Mitigation:** Reduce errors, fraud, and non-compliance through digital workflows

**External Drivers:**
1. **Digital Government Mandate:** Alignment with national e-government initiatives
2. **Employee Expectations:** Modern workforce expects digital self-service capabilities
3. **Accountability Pressure:** Increased demand for transparency and audit capability
4. **Integration Requirements:** Need to connect with other government systems (HRIMS, Pension, etc.)

### 1.5 Problem Statement

**Core Problem:**

The Civil Service Commission's reliance on manual, paper-based HR management processes creates significant operational inefficiencies, transparency gaps, compliance risks, and service delivery challenges that undermine the CSC's ability to effectively manage Zanzibar's civil service.

**Manifestations of the Problem:**

1. **Excessive Processing Time:**
   - Average 15+ days to process routine HR requests
   - Some complex cases taking months to resolve
   - Bottlenecks at approval stages due to physical document routing
   - Delayed employee services affecting morale and institutional operations

2. **Transparency and Tracking Deficiencies:**
   - Employees unable to track status of their requests
   - HROs lacking visibility into approval workflow progress
   - Management unable to monitor processing times and backlogs
   - Frequent inquiries consuming staff time

3. **Data Quality and Accessibility Issues:**
   - Employee records scattered across multiple systems and file cabinets
   - Inconsistent data entry leading to errors and discrepancies
   - Difficulty retrieving historical information
   - Manual data compilation for reporting

4. **Compliance and Audit Challenges:**
   - Insufficient audit trails for HR decisions
   - Difficulty verifying adherence to probation period requirements
   - Limited evidence of process compliance with regulations
   - Challenges in producing documentation for audits

5. **Document Management Problems:**
   - Physical storage requirements and space constraints
   - Risk of document loss, damage, or unauthorized access
   - Difficulty in sharing documents among authorized parties
   - No standardized document retention and archival

6. **Resource Inefficiency:**
   - High administrative overhead for manual processing
   - Staff time consumed by data entry and document handling
   - Duplication of effort across institutions
   - Limited scalability as civil service grows

7. **Strategic Planning Limitations:**
   - Inability to generate timely workforce analytics
   - Limited retirement projection capabilities
   - Difficulty in identifying skill gaps and training needs
   - Reactive rather than proactive HR management

**Business Impact:**

- **Operational Costs:** High administrative expenditure on manual processing
- **Service Delivery:** Poor employee experience and institutional frustration
- **Decision Quality:** Limited data-driven insights for policy and planning
- **Compliance Risk:** Potential violations of civil service regulations
- **Institutional Reputation:** Negative perception of CSC responsiveness and efficiency
- **Competitive Disadvantage:** Inability to attract and retain talent in modern civil service

**Root Causes:**

- Absence of integrated digital HR management platform
- Reliance on legacy paper-based processes
- Insufficient investment in HR technology infrastructure
- Limited integration among existing systems
- Lack of standardized digital workflows

---

## 2. Stakeholder Analysis

### 2.1 Stakeholder Identification

#### Primary Stakeholders (Direct Users & Beneficiaries)

**1. Civil Service Commission (CSC) - Project Owner**
- **Role:** Commissioning authority and system owner
- **Key Representatives:** CSC Secretary, HHRMD, HRMO, DO
- **Interest:** Modernized HR management, improved efficiency, better oversight
- **Influence:** High - Decision-making authority, budget approval
- **Requirements:** Strategic reporting, compliance monitoring, workflow automation
- **Success Measures:** Reduced processing time, improved transparency, better decision support

**2. Chief Secretary Civil Service (CSCS)**
- **Role:** Executive oversight and strategic leadership
- **Interest:** High-level visibility into civil service operations, strategic analytics
- **Influence:** Very High - Ultimate approval authority for major HR decisions
- **Requirements:** Executive dashboard, institution performance monitoring, policy compliance tracking
- **Success Measures:** Enhanced strategic decision-making, institutional accountability

**3. Head of HR Management Division (HHRMD)**
- **Role:** Primary approving authority for most HR requests
- **Interest:** Efficient workflow management, comprehensive case information, decision support
- **Influence:** Very High - Approval authority for all request types
- **Requirements:** Pending request queue, detailed case review interface, decision documentation
- **Success Measures:** Faster case processing, better decision quality, reduced backlog

**4. HR Management Officers (HRMO)**
- **Role:** Operational approvers for routine HR requests
- **Interest:** Streamlined review process, clear workflows, workload management
- **Influence:** High - Approval authority for confirmations, promotions, LWOP, retirements, resignations, service extensions
- **Requirements:** Role-based request filtering, decision tracking, notification management
- **Success Measures:** Increased throughput, reduced processing time, better work-life balance

**5. Disciplinary Officer (DO)**
- **Role:** Specialist for disciplinary and complaint matters
- **Interest:** Structured complaint management, evidence documentation, case tracking
- **Influence:** High - Authority for terminations, dismissals, and complaint resolution
- **Requirements:** Complaint dashboard, evidence management, escalation workflows
- **Success Measures:** Faster complaint resolution, better documentation, reduced escalations

**6. HR Officers (HRO) - 41 Institutional Representatives**
- **Role:** Request submitters on behalf of employees within their institutions
- **Interest:** Easy request submission, clear status tracking, rectification guidance
- **Influence:** Medium - Primary interface between institutions and CSC
- **Requirements:** Intuitive submission forms, document upload, status tracking, notifications
- **Success Measures:** Reduced submission errors, faster approvals, better employee service

**7. Planning Officers (PO/HRRP)**
- **Role:** Strategic workforce planning and analytics
- **Interest:** Comprehensive reporting, retirement projections, workforce trends
- **Influence:** Medium - Advisory role in strategic planning
- **Requirements:** Custom report builder, data export, trend analysis, forecasting tools
- **Success Measures:** Timely reports, actionable insights, better planning accuracy

**8. System Administrators (ADMIN)**
- **Role:** Technical system management and user administration
- **Interest:** User-friendly administration, system health monitoring, security management
- **Influence:** High - System configuration and access control
- **Requirements:** User management, institution setup, system configuration, audit log access
- **Success Measures:** System stability, security compliance, efficient user support

**9. Employees (50,000+ Civil Servants)**
- **Role:** End beneficiaries, complaint submitters
- **Interest:** Self-service complaint submission, status tracking, profile access
- **Influence:** Low (individually), High (collectively) - Beneficiaries of improved services
- **Requirements:** Employee portal, complaint submission, authentication, status checking
- **Success Measures:** Faster request processing, transparent status updates, complaint resolution

#### Secondary Stakeholders

**10. Government Institutions (41 Ministries/Departments)**
- **Role:** Employing entities
- **Interest:** Efficient HR services, institutional analytics, workforce management
- **Influence:** Medium - Provide input, participate in UAT
- **Requirements:** Institution-specific reporting, employee management
- **Success Measures:** Improved HR service delivery to their employees

**11. IT Department**
- **Role:** Infrastructure provider and technical support
- **Interest:** System reliability, security, integration with existing infrastructure
- **Influence:** High - Infrastructure control, technical decisions
- **Requirements:** Server infrastructure, database management, backup systems, monitoring
- **Success Measures:** 99.5% uptime, security compliance, successful integration

**12. HRIMS Team**
- **Role:** Integration partner for employee data synchronization
- **Interest:** Data consistency, reliable integration, minimal disruption
- **Influence:** Medium - Controls access to legacy employee data
- **Requirements:** API integration, data synchronization jobs, error handling
- **Success Measures:** Successful data synchronization, data integrity maintenance

#### External Stakeholders

**13. E-Government Authority (E-GAZ)**
- **Role:** E-government standards and compliance oversight
- **Interest:** Compliance with e-government quality assurance standards
- **Influence:** High - Approval for government systems
- **Requirements:** Compliance documentation, quality assurance processes
- **Success Measures:** E-GAZ certification achieved

**14. Tanzania Commission for Universities (TCU)**
- **Role:** Educational qualification verification
- **Interest:** Future integration for automated qualification verification
- **Influence:** Low (current phase) - Manual verification in place
- **Requirements:** API integration (future enhancement)
- **Success Measures:** Streamlined qualification verification

**15. Pension Authority**
- **Role:** Retirement benefit processing
- **Interest:** Timely retirement notifications, accurate employee data
- **Influence:** Medium - Dependent on CSC for retirement data
- **Requirements:** Data sharing (future integration)
- **Success Measures:** Automated pension processing initiation

**16. Ministry of Finance**
- **Role:** Budget authority and financial oversight
- **Interest:** Cost-effective solution, budget adherence
- **Influence:** High - Budget approval
- **Requirements:** Budget justification, value demonstration
- **Success Measures:** Project within budget, ROI achievement

**17. Auditor General's Office**
- **Role:** Audit and accountability oversight
- **Interest:** Comprehensive audit trails, compliance verification
- **Influence:** High - Audit authority
- **Requirements:** Immutable audit logs, compliance reporting capabilities
- **Success Measures:** Audit readiness, compliance demonstration

### 2.2 Stakeholder Requirements Summary

| Stakeholder | Priority | Key Requirements | Success Metrics |
| --- | --- | --- | --- |
| **CSCS** | Critical | Executive dashboard, strategic analytics, institutional oversight | Enhanced decision-making, accountability |
| **HHRMD** | Critical | All-request approval interface, comprehensive case info, decision support | Faster processing, better decisions |
| **HRMO** | Critical | Routine request approval, workload management, notifications | Increased throughput, reduced backlog |
| **DO** | High | Complaint management, evidence docs, disciplinary tracking | Faster resolution, better documentation |
| **HRO (41)** | Critical | Easy submission, status tracking, clear guidance | Reduced errors, faster approvals |
| **PO/HRRP** | High | Reporting, analytics, workforce planning tools | Timely insights, better planning |
| **ADMIN** | High | User management, system config, security controls | System stability, security compliance |
| **Employees** | Medium | Complaint portal, status tracking, profile access | Service quality, transparency |
| **IT Dept** | High | Reliable infrastructure, monitoring, backup | 99.5% uptime, security |
| **HRIMS** | Medium | Data integration, synchronization, consistency | Data integrity, sync reliability |
| **E-GAZ** | High | Standards compliance, QA documentation | Certification achieved |
| **Auditor** | High | Audit trails, compliance reporting | Audit readiness |

### 2.3 Stakeholder Engagement Strategy

**Communication Channels:**
- Monthly stakeholder meetings for CSC leadership
- Weekly status updates to HHRMD, HRMO, DO
- Bi-weekly check-ins with HRO representatives
- Quarterly briefings for CSCS and executive leadership
- User training sessions for all user roles
- Documentation and user manuals
- Help desk support for ongoing queries

**Decision-Making Framework:**
- CSCS: Final approval on major scope/budget changes
- HHRMD: Functional requirement validation, UAT sign-off
- Project Steering Committee: Risk decisions, milestone approvals
- Technical Working Group: Technical architecture, integration decisions

---

## 3. Business Objectives

### 3.1 Primary Business Objectives

**Objective 1: Automate HR Workflow Processes**

**Statement:** Digitize and automate all 8 critical HR request workflows to eliminate manual, paper-based processing and reduce average processing time by 70%.

**Strategic Alignment:** Operational Efficiency, Service Quality

**Success Criteria:**
- All 8 HR request types (Confirmation, Promotion, LWOP, Cadre Change, Service Extension, Retirement, Resignation, Termination/Dismissal) fully automated
- Digital request submission, routing, approval, and documentation
- Automated notifications at each workflow stage
- Average processing time reduced from 15 days to ≤5 days
- Zero paper-based processing for automated request types

**Measurement:**
- Average time from request submission to final decision (target: ≤5 days)
- % of requests processed digitally (target: 100%)
- % reduction in manual processing time (target: ≥70%)
- Volume of requests processed per month (baseline vs. post-implementation)

**Business Value:**
- Reduced administrative overhead and operational costs
- Faster service delivery to employees
- Increased HR staff capacity for strategic work
- Improved employee satisfaction

---

**Objective 2: Enhance Transparency and Accountability**

**Statement:** Provide real-time visibility into request status for all stakeholders and maintain comprehensive, immutable audit trails for all HR transactions to ensure accountability and compliance.

**Strategic Alignment:** Governance, Risk Management, Compliance

**Success Criteria:**
- All request statuses visible in real-time to authorized users
- Complete audit trail for every request from submission to completion
- Immutable audit logs capturing user actions, timestamps, and data changes
- 100% of HR decisions documented with approver identity and rationale

**Measurement:**
- % of requests with complete audit trail (target: 100%)
- Average time to retrieve request history (target: <10 seconds)
- Number of unauthorized access attempts (target: 0)
- Audit log retention compliance (target: 10+ years)

**Business Value:**
- Improved accountability for HR decisions
- Compliance with civil service regulations
- Audit readiness and transparency
- Reduced disputes and clarification requests

---

**Objective 3: Centralize Employee Data Management**

**Statement:** Establish a single, authoritative source of employee data integrated with HRIMS, ensuring data quality, accessibility, and security for 50,000+ civil servants.

**Strategic Alignment:** Data Governance, System Integration

**Success Criteria:**
- All 50,000+ employee records centralized in CSMS database
- Data synchronization with HRIMS achieving >99% accuracy
- Role-based access control ensuring data security
- Search and retrieval of employee records within 1 second
- Document repository integrated with employee profiles

**Measurement:**
- Number of employee records successfully migrated (target: 100%)
- Data accuracy rate (target: >99%)
- Average search response time (target: <1 second)
- % of employees with complete profile data (target: >95%)
- HRIMS synchronization success rate (target: >99%)

**Business Value:**
- Elimination of data silos and fragmentation
- Improved data quality and consistency
- Faster access to employee information
- Better support for strategic workforce planning

---

**Objective 4: Implement Robust Security and Access Control**

**Statement:** Protect sensitive employee data and ensure appropriate access through role-based permissions, encryption, and comprehensive security controls meeting government security standards.

**Strategic Alignment:** Information Security, Privacy Protection, Compliance

**Success Criteria:**
- 9 distinct user roles with granular permissions implemented
- Institutional data isolation ensuring HROs see only their institution's employees
- Password policies enforced (complexity, expiration, history)
- Account lockout after failed login attempts
- Session management and inactivity timeout
- All documents encrypted at rest (AES-256)
- All data encrypted in transit (HTTPS/TLS 1.2+)
- Comprehensive security audit logs

**Measurement:**
- % of security requirements implemented (target: 100%)
- Number of security incidents (target: 0)
- % of users with appropriate role assignments (target: 100%)
- Password policy compliance rate (target: 100%)
- Penetration test results (target: no critical vulnerabilities)

**Business Value:**
- Protection of sensitive employee information
- Compliance with data protection regulations
- Prevention of unauthorized access
- Maintenance of employee trust and confidence

---

**Objective 5: Enable Data-Driven Decision Making**

**Statement:** Provide CSC leadership with real-time reporting, analytics, and workforce insights to support strategic planning, policy development, and operational management.

**Strategic Alignment:** Strategic Planning, Workforce Management

**Success Criteria:**
- 10+ pre-built standard reports available
- Custom report builder for ad-hoc analysis
- Real-time dashboard metrics for all user roles
- Export capabilities to Excel and PDF
- Bilingual reporting (English/Swahili)
- Report generation within 30 seconds for large datasets

**Measurement:**
- Number of standard reports utilized monthly (target: all 10+)
- Average time to generate reports (target: <30 seconds)
- User satisfaction with reporting capabilities (target: >85%)
- % of decisions supported by system data (qualitative assessment)

**Business Value:**
- Better strategic workforce planning
- Evidence-based policy development
- Proactive retirement and succession planning
- Identification of training and capacity needs

---

**Objective 6: Improve Employee Service Delivery**

**Statement:** Enhance the employee experience by providing self-service capabilities, transparent request tracking, and faster processing times for HR services.

**Strategic Alignment:** Customer Service, Employee Satisfaction

**Success Criteria:**
- Employee portal for complaint submission operational
- Real-time status tracking available to HROs and employees
- Automated notifications for request status changes
- Average request processing time ≤5 days
- Complaint resolution within 14 days

**Measurement:**
- Average request processing time (target: ≤5 days)
- Average complaint resolution time (target: ≤14 days)
- Employee satisfaction rating (target: >80%)
- Number of status inquiries (target: 50% reduction)

**Business Value:**
- Improved employee satisfaction and morale
- Reduced administrative burden on HR staff
- Enhanced perception of CSC responsiveness
- Better employer brand for civil service

---

**Objective 7: Ensure Regulatory Compliance**

**Statement:** Systematically enforce civil service regulations, probation period requirements, and HR policies through automated business rules and validation checks.

**Strategic Alignment:** Compliance, Risk Management, Governance

**Success Criteria:**
- All probation period requirements (12-18 months) automatically validated
- Service year requirements for promotions enforced by system
- LWOP duration limits (3-year maximum) programmatically checked
- Service extension limits (2 lifetime maximum) tracked and enforced
- TCU verification requirements for foreign qualifications flagged
- Document requirements enforced for all request types

**Measurement:**
- % of requests meeting compliance requirements on first submission (target: >90%)
- Number of compliance violations detected (target: 0 post-approval)
- % of business rules successfully implemented (target: 100%)
- Audit findings related to compliance (target: 0 major findings)

**Business Value:**
- Reduced compliance risk
- Consistent application of regulations
- Prevention of errors and policy violations
- Audit readiness and defensibility

---

**Objective 8: Integrate with Existing Systems**

**Statement:** Establish seamless data integration with existing HRIMS infrastructure to ensure data consistency, eliminate duplication, and support long-term system interoperability.

**Strategic Alignment:** System Integration, Data Governance

**Success Criteria:**
- Background synchronization jobs pulling employee data from HRIMS
- Daily automated sync maintaining data freshness
- Error handling and retry mechanisms for sync failures
- Data consistency validation between CSMS and HRIMS
- API framework for future integrations (TCU, Pension, Payroll)

**Measurement:**
- HRIMS sync success rate (target: >99%)
- Data consistency rate (target: >99%)
- Average sync processing time (target: <30 minutes for full sync)
- Number of sync errors (target: <1% of records)

**Business Value:**
- Elimination of duplicate data entry
- Data consistency across systems
- Foundation for future integrations
- Reduced integration complexity

---

### 3.2 Secondary Business Objectives

**Objective 9: Build Institutional Capacity**

**Statement:** Enhance the digital literacy and technical capabilities of CSC and institutional HR staff through comprehensive training and change management.

**Success Criteria:**
- All HROs trained on system usage (target: 100%)
- All CSC approvers trained (HHRMD, HRMO, DO) (target: 100%)
- User manuals and training materials available in English and Swahili
- Help desk support established
- User satisfaction with training (target: >85%)

---

**Objective 10: Establish Foundation for Future Enhancements**

**Statement:** Design system architecture to support future phases including mobile applications, additional integrations, and advanced AI/ML capabilities.

**Success Criteria:**
- Modular architecture enabling feature additions
- API-first design supporting mobile apps
- Scalable infrastructure accommodating growth
- AI framework integrated (Google Genkit) for future enhancements

---

### 3.3 Objectives Measurement Framework

| Objective | Key Metric | Baseline | Target | Measurement Frequency |
| --- | --- | --- | --- | --- |
| **Automate Workflows** | Avg processing time (days) | 15 days | ≤5 days | Weekly |
| **Enhance Transparency** | % with complete audit trail | N/A | 100% | Monthly |
| **Centralize Data** | Employee records centralized | 0 | 50,000+ | One-time migration |
| **Security & Access** | Security incidents | N/A | 0 | Continuous |
| **Data-Driven Decisions** | Standard reports available | 0 | 10+ | N/A |
| **Employee Service** | Employee satisfaction | Unknown | >80% | Quarterly survey |
| **Regulatory Compliance** | Compliance violations | Unknown | 0 | Monthly |
| **System Integration** | HRIMS sync success rate | N/A | >99% | Daily |

---

## 4. Current State Assessment

### 4.1 Current Process Overview

**Process Landscape:**

The Civil Service Commission currently manages 8 primary HR processes entirely through manual, paper-based systems:

1. **Employee Confirmation** (after 12-18 month probation)
2. **Promotion Requests** (education-based or performance-based)
3. **Leave Without Pay (LWOP)** (1 month to 3 years duration)
4. **Change of Cadre** (job category transfers)
5. **Service Extension** (beyond retirement age)
6. **Retirement Processing** (compulsory, voluntary, or illness-based)
7. **Resignation** (3-month notice or 24-hour with payment)
8. **Termination and Dismissal** (disciplinary actions)

Additionally, the CSC handles **employee complaints** through an informal, unstructured process.

**Current Workflow:**

```
Employee/HRO → Physical Request Form → Document Attachment → Physical Delivery to CSC
                                                                          ↓
                                        HHRMD/HRMO/DO Review ← Physical Document Routing
                                                   ↓
                                    Physical Approval Letter ← Manual Decision Documentation
                                                   ↓
                                Physical Return to HRO ← No Automated Notification
                                                   ↓
                              HRO Communicates to Employee ← Manual Status Tracking
```

**Process Characteristics:**

- **Request Initiation:** Employees submit handwritten or typed requests to institutional HRO
- **Document Preparation:** HRO compiles supporting documents (certificates, appraisals, letters)
- **Physical Routing:** Documents physically transported to CSC offices
- **Manual Review:** HHRMD/HRMO/DO manually review documents and files
- **Decision Documentation:** Approval letters typed, printed, signed, and filed
- **Return Distribution:** Physical documents returned to HRO
- **Status Tracking:** Phone calls and in-person inquiries
- **Record Keeping:** Paper files stored in filing cabinets

### 4.2 Current State Challenges

**Challenge 1: Excessive Processing Time**

**Description:** Average processing time of 15+ days per request, with complex cases taking months

**Root Causes:**
- Physical document routing between institutions and CSC offices
- Serial processing (one approver at a time)
- Bottlenecks when approvers unavailable (travel, leave, competing priorities)
- Time lost searching for documents and employee records
- Manual typing and printing of decision letters

**Business Impact:**
- Delayed employee services (confirmations, promotions, retirements)
- Institutional frustration and HR workload
- Employee dissatisfaction and morale issues
- Productivity loss due to unresolved HR status

**Quantitative Evidence:**
- Average confirmation request: 18 days
- Average promotion request: 22 days
- Average retirement request: 25 days
- Some complex cases: 60+ days

---

**Challenge 2: Lack of Transparency**

**Description:** No visibility into request status between submission and final decision

**Root Causes:**
- No centralized tracking system
- Physical documents lack status indicators
- No automated notifications or alerts
- Manual status inquiries via phone/in-person

**Business Impact:**
- Frequent status inquiry calls consuming HR staff time
- Employee anxiety and uncertainty
- Inability to plan (e.g., employees don't know when retirement will be approved)
- Difficulty managing workload and priorities

**Quantitative Evidence:**
- Estimated 30% of HRO time spent on status inquiries
- Average 5-7 follow-up calls per request
- No formal SLA tracking

---

**Challenge 3: Data Fragmentation**

**Description:** Employee records scattered across HRIMS, paper files, institutional records, and CSC archives

**Root Causes:**
- Multiple systems with no integration
- Historical data in paper format only
- Inconsistent data entry practices across institutions
- No single source of truth for employee data

**Business Impact:**
- Time-consuming data retrieval
- Data inconsistencies and errors
- Duplicate data entry
- Difficulty generating accurate reports
- Risk of data loss or damage

**Quantitative Evidence:**
- Average 15-30 minutes to retrieve complete employee file
- Estimated 10-15% data error rate in manual records
- 3+ separate systems containing employee data

---

**Challenge 4: Inadequate Audit Trails**

**Description:** Limited documentation of decision-making process, approvals, and workflow history

**Root Causes:**
- No systematic logging of actions
- Approval signatures but no timestamps or context
- Limited documentation of rejection rationale
- Paper files subject to alteration or loss

**Business Impact:**
- Compliance risks and audit findings
- Difficulty defending decisions
- Inability to track performance metrics
- Challenges in process improvement

**Quantitative Evidence:**
- Incomplete audit trails in 40%+ of historical files
- Limited evidence of approval dates/times
- Minimal documentation of send-back reasons

---

**Challenge 5: Document Management Issues**

**Description:** Physical document storage requiring significant space and presenting security, accessibility, and preservation challenges

**Root Causes:**
- Paper-based processes generating physical documents
- Limited archival space and organization
- No document version control
- Vulnerability to damage (fire, water, deterioration)

**Business Impact:**
- High storage costs and space requirements
- Risk of document loss or damage
- Slow document retrieval
- Security concerns (unauthorized access)
- Difficulty sharing documents among authorized parties

**Quantitative Evidence:**
- 200+ filing cabinets for employee records
- Estimated 5% document loss/damage rate annually
- No disaster recovery for paper files

---

**Challenge 6: Resource Inefficiency**

**Description:** High administrative overhead with HR staff spending majority of time on manual processing tasks

**Root Causes:**
- Manual data entry and document handling
- Repetitive tasks (typing letters, filing, searching)
- Serial workflow requiring sequential actions
- Limited automation or process efficiency

**Business Impact:**
- High operational costs
- Limited capacity for strategic HR work
- Staff burnout and job dissatisfaction
- Inability to scale as civil service grows

**Quantitative Evidence:**
- Estimated 70% of HRO time on administrative tasks
- 60% of HRMO time on manual review and documentation
- High ratio of HR staff to employees

---

**Challenge 7: Limited Reporting and Analytics**

**Description:** Inability to generate timely workforce reports or analytics due to fragmented data and manual compilation

**Root Causes:**
- No integrated reporting system
- Data scattered across multiple sources
- Manual data compilation and spreadsheet creation
- Time lag in data availability

**Business Impact:**
- Reactive rather than proactive workforce planning
- Limited retirement projections and succession planning
- Inability to identify trends or patterns
- Poor support for policy development and strategic decisions

**Quantitative Evidence:**
- Average 2-3 weeks to generate management report
- Limited historical trend analysis
- Reports often incomplete or outdated

---

**Challenge 8: Complaint Management Gaps**

**Description:** No structured system for employee complaints, leading to inconsistent handling and resolution

**Root Causes:**
- Ad-hoc complaint submission (letters, phone, in-person)
- No tracking or case management
- Inconsistent escalation and resolution
- Limited documentation

**Business Impact:**
- Unresolved employee grievances
- Potential legal risks
- Employee dissatisfaction
- Reputational damage

**Quantitative Evidence:**
- Unknown number of complaints received annually
- No SLA for complaint resolution
- High variation in resolution time (days to months)

---

### 4.3 Current Technology Landscape

**Existing Systems:**

1. **HRIMS (HR Information Management System)**
   - Purpose: Employee master data repository
   - Coverage: 50,000+ employee records
   - Technology: Legacy database system
   - Usage: Source system for employee demographic and employment data
   - Limitations: No workflow capabilities, limited user interface, no integration APIs
   - Status: Operational but requires modernization

2. **Email System**
   - Purpose: Communication
   - Usage: Ad-hoc communication between HROs and CSC
   - Limitations: No integration with HR processes, unstructured

3. **Office Productivity Tools**
   - Purpose: Document creation (MS Word/Excel)
   - Usage: Creating request letters, approval letters, spreadsheets
   - Limitations: No automation, manual processes

4. **File Servers**
   - Purpose: Limited digital document storage
   - Usage: Scanned documents (not systematic)
   - Limitations: Unstructured, poor search capability

**Technology Gaps:**

- ❌ No integrated HR workflow management system
- ❌ No document management system
- ❌ No automated notifications or alerts
- ❌ No reporting and analytics platform
- ❌ No audit trail or logging system
- ❌ No employee self-service portal
- ❌ No role-based access control system
- ❌ No integration framework

**IT Infrastructure:**

- Server infrastructure available (Ubuntu servers, aaPanel)
- Database capability (PostgreSQL)
- Internet connectivity at CSC and major institutions
- Storage infrastructure (MinIO deployed)
- Backup systems in place

### 4.4 Current State Metrics (Baseline)

| Metric | Current State | Target State |
| --- | --- | --- |
| **Average Request Processing Time** | 15-25 days | ≤5 days |
| **Confirmation Avg Time** | 18 days | ≤5 days |
| **Promotion Avg Time** | 22 days | ≤7 days |
| **Retirement Avg Time** | 25 days | ≤7 days |
| **Manual Processing %** | 100% | 0% |
| **Status Tracking** | Manual inquiries | Real-time online |
| **Document Storage** | Paper-based | 100% digital |
| **Data Access Time** | 15-30 minutes | <10 seconds |
| **Audit Trail Completeness** | 60% | 100% |
| **Report Generation Time** | 2-3 weeks | <30 seconds |
| **Employee Satisfaction** | Unknown (low) | >80% |
| **Data Error Rate** | 10-15% | <1% |
| **System Uptime** | N/A | >99.5% |
| **HRO Administrative Time** | 70% | <30% |

### 4.5 Opportunities for Improvement

Based on the current state assessment, the following opportunities exist:

1. **Process Automation:** Eliminate 90%+ of manual processing through digital workflows
2. **Transparency Enhancement:** Real-time status visibility reducing inquiry volume by 80%+
3. **Data Centralization:** Single source of truth reducing data access time by 95%
4. **Efficiency Gains:** Free up 50%+ of HR staff time for strategic work
5. **Decision Support:** Enable data-driven workforce planning previously impossible
6. **Compliance Improvement:** Systematic enforcement of regulations via business rules
7. **Employee Experience:** Modern self-service capabilities improving satisfaction
8. **Cost Reduction:** Eliminate paper, printing, physical storage costs

**Estimated Annual Savings:**
- Administrative staff time: 40% reduction
- Paper/printing costs: 90% reduction
- Physical storage costs: 80% reduction
- Processing delays cost (employee productivity): 70% reduction

**Return on Investment (ROI):**
- Break-even estimated at 18-24 months
- 5-year ROI projected at 300%+

---

## 5. Scope Definition

### 5.1 Project Scope Overview

The CSMS project encompasses the design, development, testing, deployment, and operationalization of a comprehensive, web-based human resource management system for the Civil Service Commission of Zanzibar.

**Scope Boundary Statement:**

The project includes all functionality necessary to digitize and automate the 8 critical HR request workflows, employee data management, complaint handling, reporting, and system administration—replacing all current manual, paper-based processes with an integrated digital platform accessible via web browsers.

### 5.2 In-Scope Components

#### 5.2.1 Functional Modules

**Module 1: Authentication & User Management**

**In Scope:**
- User registration and account creation
- Username/password authentication with bcrypt hashing
- Role-based access control (9 distinct roles)
- Password policy enforcement:
  - Minimum complexity requirements (8+ characters, mixed case, numbers, special characters)
  - Password expiration (Admin: 60 days, Users: 90 days)
  - Password history (prevent reuse of last 5 passwords)
- Account lockout after 5 failed login attempts (30-minute lockout)
- Session management:
  - Maximum 3 concurrent sessions per user
  - 24-hour session expiration
  - Inactivity timeout (7 minutes)
  - Force logout capability
- User profile management
- Password change functionality
- Suspicious login detection and logging

**Out of Scope:**
- Multi-factor authentication (MFA) - future enhancement
- Biometric authentication
- Single sign-on (SSO) with government ID systems
- Social media authentication

---

**Module 2: Dashboard & Navigation**

**In Scope:**
- Role-based personalized dashboards for all 9 user roles:
  - CSCS: Executive overview
  - HHRMD: All pending requests, institution performance
  - HRMO: Assigned pending requests
  - DO: Complaints and terminations
  - HRO: Institution-specific requests and submissions
  - PO/HRRP: Analytics and planning metrics
  - ADMIN: System health and user metrics
  - EMPLOYEE: Personal profile and complaint status
- Real-time request counts by status and type
- Quick action widgets (submit request, view pending, etc.)
- Notification center with unread count
- Responsive navigation menu
- Search functionality

**Out of Scope:**
- Customizable dashboard layouts (fixed per role)
- Third-party widget integration
- Mobile app dashboard (responsive web only)

---

**Module 3: Employee Profile Management**

**In Scope:**
- Comprehensive employee profile with 40+ data fields:
  - Personal: Name, gender, date of birth, place of birth, region, country of birth
  - Identification: ZanID (unique), payroll number, ZSSF number
  - Contact: Phone number, address
  - Employment: Employment date, confirmation date, retirement date, status
  - Position: Cadre, salary scale, ministry, department, appointment type, contract type
  - Institutional: Institution, reporting office, workplace
- Profile photo upload and management
- Document repository per employee:
  - Birth certificate (birthCertificateUrl)
  - Job contract (jobContractUrl)
  - Confirmation letter (confirmationLetterUrl)
  - Ardhili Hali certificate (ardhilHaliUrl)
  - Educational certificates (separate table)
- Educational certificates management (type, name, URL)
- Employment history tracking
- Request history per employee
- Search and filtering:
  - By name, ZanID, payroll number
  - By institution, cadre, status
  - By employment date range
- Bulk employee data import from HRIMS
- Profile viewing with appropriate permissions
- Data export (Excel, PDF)

**Out of Scope:**
- Employee self-service profile editing (read-only for employees)
- Family member/dependent information
- Medical history
- Training and development records
- Performance appraisal scores (documents uploaded as PDFs)
- Leave balance tracking (except LWOP)

---

**Module 4: Employee Confirmation**

**In Scope:**
- Request submission workflow (HRO role)
- Eligibility validation:
  - Probation period ≥12 months from employment date
  - Current status = "On Probation"
  - No existing pending confirmation request
- Document upload requirements:
  - Confirmation letter (PDF, ≤2MB)
  - IPA certificate (PDF, ≤2MB)
  - Performance appraisal (PDF, ≤2MB)
- Approval workflow:
  - Routing to HHRMD or HRMO
  - Review interface with employee details and documents
  - Decision options: Approve, Reject, Send Back
- For APPROVED requests:
  - Upload decision letter (PDF, ≤2MB)
  - Set decision date and commission decision date
  - Update employee status to "Confirmed"
  - Update confirmation date
  - Store decision letter URL
- For REJECTED requests:
  - Enter rejection reason (≥20 characters)
  - Maintain employee status as "On Probation"
- For SENT_BACK requests:
  - Provide rectification instructions
  - Allow HRO to edit and resubmit
  - Retain original request ID
- Status tracking: PENDING, APPROVED, REJECTED, SENT_BACK
- Review stages: Submitted, Under Review, Decision Made
- Automated notifications (email + in-app):
  - To approver on submission
  - To HRO on approval, rejection, or send-back
- Complete audit trail
- Request ID format: CONF-[Institution]-YYYY-NNNNNN

**Out of Scope:**
- Bulk confirmation processing
- Automated confirmation based on tenure (manual submission required)
- Integration with IPA for certificate verification
- Performance score calculation (appraisal uploaded as PDF)

---

**Module 5: Promotion Requests**

**In Scope:**
- Two promotion types:
  - Education-based (new qualification acquired)
  - Performance-based (consecutive exceptional appraisals)
- Eligibility validation:
  - Employee status = "Confirmed" (not on probation)
  - Minimum 2 years in current cadre
  - No existing pending promotion request
- Document upload requirements:
  - Educational certificates (for education-based)
  - TCU verification letter (if studied outside country flag = true)
  - Performance appraisals (2+ consecutive years for performance-based)
  - Promotion request letter
- Form fields:
  - Proposed cadre
  - Promotion type (Education-Based | Performance-Based)
  - Studied outside country (Boolean)
  - Commission decision reason (optional notes)
- Approval workflow:
  - Routing to HHRMD or HRMO
  - Review, approve, reject, or send back
- For APPROVED requests:
  - Update employee cadre to proposed cadre
  - Update salary scale (if applicable)
  - Add entry to promotion history
  - Upload decision letter
- Status tracking and notifications
- Request ID format: PROM-[Institution]-YYYY-NNNNNN
- Audit trail

**Out of Scope:**
- Automated TCU verification (flag only, manual verification)
- Salary scale calculation
- Vacancy validation (position availability check)
- Promotion quota management

---

**Module 6: Leave Without Pay (LWOP)**

**In Scope:**
- Eligibility validation:
  - Employee status = "Confirmed"
  - Maximum 2 LWOP periods per employee (lifetime limit enforced)
  - Duration: 1 month ≤ duration ≤ 3 years
- Form fields:
  - Duration (string, e.g., "6 months")
  - Reason (free text)
  - Start date
  - End date
- Document upload requirements:
  - LWOP application letter
  - Justification document
  - Supporting evidence (varies by reason)
- Business rule enforcement:
  - Validate duration range
  - Count previous LWOP periods (database check)
  - Flag for manual verification: loan guarantees, prohibited reasons
- Approval workflow (HHRMD or HRMO)
- For APPROVED requests:
  - Update employee status to "On LWOP"
  - Set LWOP start and end dates
  - Increment LWOP history counter
  - (Future: Trigger payroll integration to suspend salary)
- Status tracking and notifications
- Request ID format: LWOP-[Institution]-YYYY-NNNNNN
- Audit trail

**Out of Scope:**
- Automated loan guarantee verification (manual check by approver)
- Prohibited reason list validation (manual check by approver)
- Payroll integration (future phase)
- Automatic status change upon LWOP end date (manual process)

---

**Module 7: Change of Cadre**

**In Scope:**
- Eligibility validation:
  - Employee status = "Confirmed"
  - Appropriate educational qualifications
- Form fields:
  - Original cadre (auto-populated)
  - New cadre
  - Reason/justification
  - Studied outside country (Boolean)
- Document upload requirements:
  - Cadre change request letter
  - Educational certificates supporting new cadre
  - TCU verification (if foreign qualification)
  - Organizational approval letter (optional)
- Approval authority: HHRMD ONLY (HRMO cannot approve)
- Approval workflow:
  - Routing to HHRMD exclusively
  - Review, approve, reject, or send back
- For APPROVED requests:
  - Update employee cadre to new cadre
  - Update salary scale (if applicable)
  - Update department (if cadre change involves department change)
  - Add entry to cadre change history
  - Upload decision letter
- Status tracking and notifications
- Request ID format: CADR-[Institution]-YYYY-NNNNNN
- Audit trail

**Out of Scope:**
- Automated qualification-cadre matching
- Organizational structure validation
- Vacancy management

---

**Module 8: Service Extension**

**In Scope:**
- Eligibility validation:
  - Employee must have retirement date set
  - Retirement date must be approaching (within 6 months recommended)
  - Maximum 2 lifetime extensions (enforced by system)
- Form fields:
  - Current retirement date (auto-populated)
  - Requested extension period (string, e.g., "1 year")
  - Justification (organizational need)
- Document upload requirements:
  - Service extension request letter
  - Justification document
  - Employee consent form (signed)
  - Medical fitness certificate (optional)
- Business rule enforcement:
  - Extension period: 6 months ≤ period ≤ 3 years
  - Count previous extensions (database check)
- Approval workflow (HHRMD or HRMO)
- For APPROVED requests:
  - Update employee retirement date (extend by requested period)
  - Maintain current status (e.g., "Confirmed")
  - Increment service extension history counter
  - Schedule 90-day expiration notification (automated job)
  - Upload decision letter
- 90-day notification before extension expiry
- Status tracking and notifications
- Request ID format: SEXT-[Institution]-YYYY-NNNNNN
- Audit trail

**Out of Scope:**
- Automated extension recommendation
- Performance validation for extension
- Integration with pension system

---

**Module 9: Retirement Processing**

**In Scope:**
- Three retirement types:
  - Compulsory (age-based mandatory retirement)
  - Voluntary (employee chooses early retirement)
  - Illness (medical condition prevents service)
- Eligibility validation:
  - Employee status = "Confirmed"
  - For compulsory: Employee reached retirement age
- Form fields:
  - Retirement type (Compulsory | Voluntary | Illness)
  - Illness description (required only if type = Illness)
  - Proposed retirement date
  - Delay reason (if proposed date differs from official retirement date)
- Document upload requirements:
  - All types: Retirement application letter, ID documents
  - Illness retirement: Medical certificate (mandatory)
  - Optional: Pension application documents
- Approval workflow (HHRMD or HRMO)
- For APPROVED requests:
  - Update employee status to "Retired"
  - Set retirement date to proposed date
  - Record retirement type
  - (Future: Notify pension system)
  - (Future: Trigger payroll integration for final settlement)
  - Upload decision letter
- Status tracking and notifications
- Request ID format: RETR-[Institution]-YYYY-NNNNNN
- Audit trail

**Out of Scope:**
- Pension calculation
- Pension system integration (future phase)
- Payroll final settlement automation (future phase)
- Retirement eligibility projections (planning module)

---

**Module 10: Resignation**

**In Scope:**
- Two notice types:
  - 3-month notice (standard, no payment)
  - 24-hour notice (immediate with 3-month salary payment)
- Eligibility validation:
  - Employee status = "Confirmed" (probationary employees use Dismissal process)
- Form fields:
  - Effective resignation date
  - Reason (optional, employee's stated reason)
- Document upload requirements:
  - Resignation letter (stating notice type)
  - For 24-hour notice: Payment proof (3 months' salary)
  - Exit clearance form (optional)
- Business rule enforcement:
  - For 3-month notice: Effective date ≥ 3 months from submission
  - For 24-hour notice: Payment proof required
  - Resignation cannot be withdrawn after approval
- Approval workflow (HHRMD or HRMO)
- For APPROVED requests:
  - Update employee status to "Resigned"
  - Set resignation date to effective date
  - (Future: Trigger payroll integration for final settlement)
  - Upload decision letter (optional)
- Status tracking and notifications
- Request ID format: RESN-[Institution]-YYYY-NNNNNN
- Audit trail

**Out of Scope:**
- Exit interview management
- Clearance workflow with multiple departments
- Payroll final settlement automation (future phase)

---

**Module 11: Termination and Dismissal**

**In Scope:**
- Two types:
  - Termination (for "Confirmed" employees - disciplinary action)
  - Dismissal (for "On Probation" employees - performance/conduct)
- Approval authority: DO or HHRMD ONLY (disciplinary matter)
- Form fields:
  - Type (Termination | Dismissal)
  - Reason (detailed explanation)
- Document upload requirements:
  - Disciplinary investigation report
  - Evidence documents (witness statements, violation records)
  - Employee response (if provided)
  - Disciplinary committee decision (if applicable)
- Eligibility validation:
  - For Termination: Employee status = "Confirmed"
  - For Dismissal: Employee status = "On Probation"
  - Type must match employee status
- Approval workflow:
  - Routing to DO or HHRMD exclusively (HRMO excluded)
  - Review, approve, reject, or send back
- For APPROVED requests:
  - Update employee status to "Terminated" or "Dismissed"
  - Record termination/dismissal date
  - Store termination reason
  - (Future: Trigger payroll integration)
  - Employee loses system access
  - Upload decision letter (optional)
- Decision immutability (cannot be reversed once approved)
- Status tracking and notifications
- Request ID format: TERM-[Institution]-YYYY-NNNNNN
- Audit trail

**Out of Scope:**
- Disciplinary case management workflow
- Employee appeal process
- Severance calculation
- Payroll integration (future phase)

---

**Module 12: Complaint Management**

**In Scope:**
- **Submitter:** EMPLOYEE (self-service via employee portal)
- **Authentication:** ZanID + Payroll Number + ZSSF Number (three-factor verification)
- **Portal:** Separate employee login (https://csms.zanajira.go.tz/employee-login)
- Complaint categories:
  - Unconfirmed Employees (probation-related)
  - Job-Related (work conditions, assignments, disputes)
  - Other (miscellaneous concerns)
- Form fields:
  - Complaint type (category selection)
  - Subject
  - Details (free text complaint description)
  - Incident date (optional)
  - Complainant phone number
  - Next of kin phone number
- Document upload:
  - Evidence documents (optional, PDF, 1MB max per file)
- AI enhancement (Google Genkit):
  - Analyze complaint text for clarity
  - Suggest improved/rewritten version if poorly formatted
  - Employee reviews and approves AI suggestion
  - Original text always retained
  - Employee can decline AI suggestion
- Request ID format: COMP-YYYY-NNNNNN (no institution prefix)
- Approval authority: DO or HHRMD (both have resolution authority)
- Resolution workflow:
  - Routing based on complaint category
  - Review complaint details and evidence
  - Decision options: Resolve, Reject, Escalate (DO → HHRMD)
  - For RESOLVED: Document resolution action, enter officer comments
  - For REJECTED: Enter rejection reason
- Status tracking: PENDING, UNDER_REVIEW, RESOLVED, REJECTED
- Notifications to employee on status changes
- Employee can view only their own complaints
- Internal notes field (for DO/HHRMD only, not visible to employee)
- Audit trail

**Out of Scope:**
- Anonymous complaint submission
- Complaint assignment to specific officer (auto-route by category)
- Multi-step escalation workflow
- Integration with legal case management

---

**Module 13: Reports and Analytics**

**In Scope:**
- **Standard Reports (10+):**
  1. Employee Master List (all employees with key fields)
  2. Probationary Employees (due for confirmation)
  3. Retirement Projections (employees approaching retirement)
  4. Promotion History (all promotions by period)
  5. Confirmation History (all confirmations by period)
  6. LWOP Active (employees currently on LWOP)
  7. Request Status Summary (by type and status)
  8. Institution Performance (requests by institution)
  9. Processing Time Analysis (average processing time by request type)
  10. Audit Log Summary (system activities by user/date)
- Report features:
  - Bilingual (English/Swahili labels)
  - Date range filtering
  - Institution filtering
  - Status filtering
  - Export to PDF
  - Export to Excel (XLSX)
- **Custom Report Builder:**
  - Select report type/module
  - Choose fields to include
  - Apply filters (date range, institution, status, etc.)
  - Sort options
  - Generate and export
- **Dashboard Analytics:**
  - Real-time metrics per role
  - Request counts by type and status
  - Institution-level metrics
  - Processing time trends
  - User activity summaries
- **Scheduled Reports:**
  - (Future enhancement placeholder)
- Performance target: <30 seconds for reports with 10,000+ records

**Out of Scope:**
- Advanced business intelligence (BI) visualizations
- Predictive analytics (ML models)
- Real-time charting and graphs (basic metrics only)
- Report scheduling and distribution (future phase)
- Third-party BI tool integration

---

**Module 14: Audit Trail and Activity Logging**

**In Scope:**
- **Comprehensive Logging:**
  - All user actions (login, logout, create, update, approve, reject, etc.)
  - Request submissions and status changes
  - Employee record modifications
  - Document uploads and downloads
  - User account changes
  - Role assignments
  - Password changes
  - Failed login attempts
  - Suspicious activities
- **Audit Log Fields:**
  - User ID (who performed the action)
  - Action type (LOGIN, CREATE, UPDATE, APPROVE, REJECT, etc.)
  - Timestamp (date and time, precise to second)
  - IP address
  - Before and after values (for update actions)
  - Related entity ID (request ID, employee ID, user ID, etc.)
  - Action result (success/failure)
  - Additional context (notes, reason)
- **Log Immutability:**
  - No editing or deletion of audit logs
  - Append-only log structure
  - Database constraints preventing modification
- **Log Retention:**
  - Minimum 10-year retention period
  - Automated archival of older logs
- **Audit Log Viewing:**
  - Admin: View all audit logs
  - HHRMD, CSCS: View logs related to their areas
  - Filtering by:
    - User
    - Date range
    - Action type
    - Entity type
    - IP address
  - Search functionality
  - Export to Excel/PDF
- **Compliance Reporting:**
  - Monthly audit summaries
  - Suspicious activity alerts
  - Failed login attempt reports
  - Data access reports

**Out of Scope:**
- Real-time anomaly detection (basic flagging only)
- SIEM integration
- Advanced forensic analysis tools
- Compliance certification (e.g., ISO 27001) - documentation only

---

**Module 15: System Administration**

**In Scope:**
- **User Management:**
  - Create, read, update user accounts
  - Assign roles (9 role types)
  - Assign institution (for HRO and HRRP roles)
  - Reset passwords
  - Lock/unlock accounts
  - Force logout (terminate all sessions)
  - View user activity history
  - Disable/enable user accounts
- **Institution Management:**
  - Create, read, update, delete institutions
  - Configure institution details:
    - Name (unique)
    - Email (unique)
    - Phone number
    - Vote number (unique)
    - TIN number (unique)
  - Assign HRO to institution (one per institution)
- **System Configuration:**
  - Password policy settings (complexity, expiration, history)
  - Session timeout settings
  - Account lockout settings
  - File upload size limits
  - System maintenance mode
- **System Health Monitoring:**
  - Database connection status
  - MinIO storage status
  - Redis connection status
  - System uptime
  - Disk space utilization
  - Error log viewing
- **Security Management:**
  - View failed login attempts
  - View suspicious activity logs
  - Security audit reports
  - Session management (view active sessions, force logout)
- **Backup Management:**
  - Automated daily database backups
  - Manual backup trigger
  - Backup status and history
  - Restore capability (with approval)

**Out of Scope:**
- Advanced system monitoring (APM tools)
- Infrastructure management (server, network)
- Application deployment (handled by DevOps)
- Database performance tuning (DBA responsibility)
- Integration configuration (developer responsibility)

---

#### 5.2.2 Technical Components

**Application Architecture:**
- Full-stack Next.js 14 application
- Server-side rendering (SSR) for performance
- API routes for backend services
- React components for frontend UI
- Tailwind CSS + Radix UI for styling
- TypeScript for type safety

**Database:**
- PostgreSQL 15 RDBMS
- Prisma ORM for data access
- Database schema with 25+ tables
- Indexes for performance optimization
- Foreign key constraints for data integrity
- Transaction support for ACID compliance

**Object Storage:**
- MinIO (S3-compatible) for document storage
- Bucket structure for organization
- PDF document support
- File size limits (2MB per document, 1MB for complaint attachments)
- URL-based document retrieval
- Document metadata in database

**Background Processing:**
- BullMQ with Redis for job queues
- HRIMS synchronization jobs (daily)
- Notification email jobs (asynchronous)
- Scheduled tasks (90-day service extension notifications)
- Retry mechanisms for failed jobs

**Authentication & Security:**
- JWT-based authentication
- Bcrypt password hashing (10-12 rounds)
- HTTPS/TLS 1.2+ encryption in transit
- AES-256 encryption at rest (database, documents)
- CSRF protection
- Security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, etc.)
- Rate limiting (login attempts)
- Session management (HTTP-only cookies)

**Integration:**
- HRIMS integration via background jobs
- API framework for future integrations (TCU, Pension, Payroll)
- Data synchronization with error handling
- Integration logging and monitoring

**AI/ML:**
- Google Genkit integration
- Complaint text rewriting (Gemini AI)
- Framework for future AI enhancements

---

#### 5.2.3 Deliverables

**Software Deliverables:**
- Fully functional CSMS web application
- Database with schema and seed data
- Integration with MinIO document storage
- Integration with HRIMS (background sync)
- Email notification system
- Audit logging system
- Reporting module

**Documentation Deliverables:**
- System Requirements Specification (SRS)
- System Design Document (SDD)
- Database Design Document
- API Documentation
- User Manual (bilingual: English/Swahili)
- Administrator Manual
- Training Manual
- Operations Manual
- Deployment Guide
- Disaster Recovery Plan
- Security Policy Document
- Test Plans and Test Results
- UAT Report
- Final Project Report

**Training Deliverables:**
- Role-specific training materials (9 roles)
- Training videos (optional)
- Quick start guides
- User training sessions (conducted)

**Infrastructure Deliverables:**
- Production server setup and configuration
- Database server with backups
- MinIO storage server
- Redis server for background jobs
- Nginx reverse proxy configuration
- SSL certificates
- Monitoring and logging setup

---

### 5.3 Out-of-Scope Components

The following items are explicitly **OUT OF SCOPE** for the current project:

#### 5.3.1 Functional Exclusions

**1. Payroll Processing:**
- Salary calculations
- Salary disbursement
- Payroll reports
- Tax calculations
- Deductions management
- *Rationale:* Separate system managed by Ministry of Finance
- *Future:* Integration points provided for payroll notifications

**2. Recruitment and Hiring:**
- Job vacancy posting
- Candidate application management
- Interview scheduling
- Selection process management
- Offer letter generation
- *Rationale:* Separate HR function not under CSC mandate
- *Future:* Potential future phase if scope expanded

**3. Performance Appraisal System:**
- Performance goal setting
- Mid-year reviews
- Annual appraisal scoring
- 360-degree feedback
- Performance improvement plans
- *Rationale:* Complex system requiring separate project
- *Current:* Appraisal documents uploaded as PDFs

**4. Training and Development Management:**
- Training needs assessment
- Training course catalog
- Training registration
- Training history
- Certification tracking
- *Rationale:* Out of current scope
- *Future:* Potential enhancement

**5. Regular Leave Management:**
- Annual leave requests and tracking
- Sick leave management
- Leave balances
- Leave calendar
- *Rationale:* Separate system; CSMS handles LWOP only
- *Future:* Potential integration

**6. Time and Attendance:**
- Clock in/clock out
- Timesheet management
- Overtime tracking
- Shift scheduling
- *Rationale:* Not under CSC responsibility

**7. Employee Benefits Administration:**
- Health insurance enrollment
- Pension contributions (beyond notifications)
- Allowances and benefits
- *Rationale:* Managed by separate entities

**8. Succession Planning:**
- Talent identification
- Career pathing
- Leadership development
- *Rationale:* Strategic HR function requiring separate tools

**9. Workforce Planning:**
- Organizational structure design
- Headcount planning
- Budget forecasting
- *Rationale:* CSMS provides data for planning, not planning tools
- *Current:* Reports support manual planning

---

#### 5.3.2 Technical Exclusions

**1. Mobile Native Applications:**
- iOS app
- Android app
- *Rationale:* Budget and timeline constraints
- *Current:* Responsive web design accessible on mobile browsers
- *Future:* Phase 2 mobile app development

**2. SMS Notifications:**
- SMS alerts for request status
- SMS OTP for authentication
- *Rationale:* Budget constraints and infrastructure availability
- *Current:* Email and in-app notifications

**3. Biometric Authentication:**
- Fingerprint login
- Facial recognition
- *Rationale:* Infrastructure not available
- *Current:* Username/password with strong policies

**4. Single Sign-On (SSO):**
- Integration with government SSO
- LDAP/Active Directory integration
- *Rationale:* Government SSO not yet standardized
- *Future:* Integration when government SSO available

**5. Advanced Business Intelligence (BI):**
- Interactive dashboards with drill-down
- Predictive analytics
- Machine learning models for workforce trends
- *Rationale:* Requires specialized BI tools
- *Current:* Standard reports and basic analytics

**6. Real-Time Integrations:**
- Real-time TCU qualification verification
- Real-time pension system updates
- Real-time payroll integration
- *Rationale:* External systems lack APIs
- *Current:* Batch/scheduled integrations
- *Future:* Real-time integration when APIs available

**7. Document Scanning and OCR:**
- Automated document scanning
- OCR for data extraction from documents
- *Rationale:* Complexity and cost
- *Current:* Manual document upload

**8. Workflow Automation Engine:**
- Custom workflow designer
- Business rule engine UI
- *Rationale:* Workflows are fixed per civil service regulations
- *Current:* Hard-coded workflows per process

**9. Multi-Language Support:**
- Beyond English and Swahili
- *Rationale:* Not required for Zanzibar
- *Current:* English (primary), Swahili (partial)

**10. Offline Mode:**
- Desktop application for offline access
- Data synchronization when online
- *Rationale:* Internet connectivity assumed
- *Current:* Web-based requiring internet

---

#### 5.3.3 Integration Exclusions

**Out of Scope Integrations:**
- Tanzania Commission for Universities (TCU) API (manual verification)
- Pension Authority system (manual notification)
- Payroll system (manual data transfer)
- Bank systems for payments
- Government unified ID system
- Third-party background check services

---

#### 5.3.4 Process Exclusions

**Out of Scope Processes:**
- New employee onboarding (beyond initial record creation)
- Transfer between institutions (inter-ministerial moves)
- Acting appointments (temporary assignments)
- Secondment management
- Study leave management
- Sabbatical leave
- Interdiction and suspension
- Disciplinary investigation workflow (only final action - termination/dismissal)
- Employee grievance appeal process
- Union/staff association management

---

### 5.4 Scope Management

**Change Control Process:**
Any proposed changes to the defined scope must follow the change control process:

1. Change request submitted in writing to Project Manager
2. Impact assessment (time, cost, resources, risk)
3. Review by Project Steering Committee
4. Approval/rejection decision
5. Documentation of decision and rationale
6. Communication to all stakeholders
7. Update project plan and documentation if approved

**Scope Baseline:**
This document represents the approved scope baseline. All project work will be measured against this baseline to ensure deliverables align with stakeholder requirements.

**Out-of-Scope Request Handling:**
Requests for functionality explicitly listed as out-of-scope will be:
1. Documented in a "Future Enhancements" log
2. Considered for future phases or releases
3. Not included in current project timeline or budget

---

## 6. Business Requirements

### 6.1 Business Requirement Categories

Business requirements define WHAT the business needs to achieve its objectives, independent of HOW it will be implemented. The following business requirements drive the CSMS solution.

---

### 6.2 Process Automation Requirements

**BR-PA-001: Digital Request Submission**

**Requirement:** All HR request submissions must be digitized, eliminating paper-based forms and physical document routing.

**Business Justification:** Manual paper-based processes are slow, error-prone, and lack transparency. Digital submission enables instant routing, tracking, and documentation.

**Success Criteria:**
- 100% of requests submitted through digital interface
- Zero paper forms accepted by CSC
- Immediate acknowledgment of submission with unique tracking ID
- Requests routable to appropriate approver within seconds

**Acceptance Criteria:**
- HRO can submit all 8 request types via web interface
- System generates unique request ID upon submission
- Automated routing to correct approver based on request type
- Submission confirmation displayed and emailed to HRO

---

**BR-PA-002: Automated Approval Workflows**

**Requirement:** All approval workflows must be automated with role-based routing, eliminating manual document handoffs.

**Business Justification:** Manual routing causes delays, bottlenecks, and lost documents. Automated workflows ensure predictable, fast processing.

**Success Criteria:**
- Requests automatically routed to authorized approvers
- Approval, rejection, and send-back actions captured digitally
- Automated notifications upon workflow state changes
- Workflow history maintained for audit

**Acceptance Criteria:**
- System routes confirmations/promotions/LWOP/retirements/resignations/service extensions to HHRMD or HRMO
- System routes cadre changes to HHRMD exclusively
- System routes terminations/dismissals to DO or HHRMD exclusively
- System routes complaints to DO or HHRMD
- Approvers can approve, reject, or send back with documented rationale
- All workflow transitions logged in audit trail

---

**BR-PA-003: Real-Time Status Tracking**

**Requirement:** All stakeholders must have real-time visibility into request status appropriate to their role.

**Business Justification:** Lack of status visibility causes frequent inquiries, employee anxiety, and wasted staff time.

**Success Criteria:**
- HROs can view status of all requests from their institution
- Approvers can view all pending requests in their queue
- Employees can view their own complaint status
- Status updated in real-time as approvers take action
- Status includes current stage (Submitted, Under Review, Decision Made)

**Acceptance Criteria:**
- Dashboard displays request counts by status and type
- Clicking request shows detailed status and history
- Status values: PENDING, APPROVED, REJECTED, SENT_BACK
- Review stages: Submitted, Under Review, Decision Made
- Timestamps for all status changes
- No manual status updates required

---

**BR-PA-004: Automated Notifications**

**Requirement:** System must automatically notify stakeholders of workflow events without manual intervention.

**Business Justification:** Manual notification causes delays and communication failures. Automated alerts ensure timely awareness.

**Success Criteria:**
- Approvers notified immediately upon new request submission
- HROs notified immediately upon approval, rejection, or send-back
- Employees notified of complaint status changes
- Email and in-app notifications for all events

**Acceptance Criteria:**
- Email sent within 1 minute of workflow event
- In-app notification appears in real-time (or upon next login)
- Notification includes request ID, type, and relevant details
- Notification links to request details
- Failed email notifications logged (non-blocking)

---

**BR-PA-005: Document Digitization**

**Requirement:** All supporting documents must be uploaded, stored, and retrieved digitally, eliminating physical document management.

**Business Justification:** Physical documents are slow to access, prone to loss, require storage space, and cannot be shared efficiently.

**Success Criteria:**
- All required documents uploaded as PDFs during request submission
- Documents stored in secure, centralized repository
- Documents viewable/downloadable by authorized users
- Documents retained per data retention policy

**Acceptance Criteria:**
- HRO uploads documents during request submission
- Approver uploads decision letters when approving
- All documents stored in MinIO object storage
- Document URLs stored in database linked to requests/employees
- PDF format enforced (2MB limit per file for requests, 1MB for complaints)
- Authorized users can preview and download documents
- Unauthorized users cannot access documents

---

### 6.3 Data Management Requirements

**BR-DM-001: Centralized Employee Repository**

**Requirement:** All employee data must be centralized in a single, authoritative database synchronized with HRIMS.

**Business Justification:** Fragmented data causes inconsistencies, delays, and errors. Centralized data ensures accuracy and accessibility.

**Success Criteria:**
- 50,000+ employee records in CSMS database
- Data synchronized daily with HRIMS
- Data accuracy >99%
- Search and retrieval <1 second

**Acceptance Criteria:**
- Employee table contains all required fields (40+)
- HRIMS sync job runs daily in background
- Data consistency validation between CSMS and HRIMS
- Sync errors logged and flagged for resolution
- Search by name, ZanID, payroll number, institution, cadre, status

---

**BR-DM-002: Data Integrity and Validation**

**Requirement:** All data entry must be validated to ensure accuracy, completeness, and compliance with business rules.

**Business Justification:** Invalid data causes processing errors, compliance issues, and rework.

**Success Criteria:**
- Mandatory fields enforced
- Data format validation (e.g., dates, numbers)
- Business rule validation (e.g., probation period ≥12 months)
- Validation errors presented clearly to user

**Acceptance Criteria:**
- System prevents submission with missing mandatory fields
- Date fields reject invalid dates
- ZanID uniqueness enforced
- Probation period calculated and validated before confirmation submission
- Service year requirements validated before promotion submission
- Clear error messages guide user to correct issues

---

**BR-DM-003: Data Security and Access Control**

**Requirement:** Employee data must be protected with role-based access control ensuring users see only data appropriate to their role.

**Business Justification:** Sensitive employee data requires protection from unauthorized access, disclosure, and modification.

**Success Criteria:**
- 9 distinct roles with appropriate permissions
- HROs see only their institution's employees
- Employees see only their own data
- HHRMD/HRMO/DO/CSCS/PO see all institutions
- All data access logged

**Acceptance Criteria:**
- User assigned to one role
- HRO role filtered to see only their institution
- HRRP role filtered to see only their institution
- Employee role sees only own profile and complaints
- Database queries enforce role-based filtering
- Attempts to access unauthorized data blocked and logged

---

**BR-DM-004: Data Retention and Archival**

**Requirement:** All data must be retained per regulatory requirements with automated archival of older records.

**Business Justification:** Compliance with civil service regulations and audit requirements mandates long-term data retention.

**Success Criteria:**
- Approved requests: Retained indefinitely
- Rejected requests: Retained 5 years
- Audit logs: Retained 10 years (immutable)
- Employee records: Retained 10 years post-retirement

**Acceptance Criteria:**
- Database configured with retention policies
- Automated archival jobs for older data (implementation approach TBD)
- No manual deletion of audit logs (database constraints)
- Backup and recovery procedures in place

---

### 6.4 Reporting and Analytics Requirements

**BR-RA-001: Standard Management Reports**

**Requirement:** System must provide pre-built standard reports for common HR management needs.

**Business Justification:** Consistent, standardized reports enable data-driven decision-making and trend analysis.

**Success Criteria:**
- Minimum 10 standard reports available
- Reports generated within 30 seconds for large datasets
- Export to PDF and Excel
- Bilingual (English/Swahili) labels

**Acceptance Criteria:**
- Reports include: Employee Master List, Probationary Employees, Retirement Projections, Promotion History, Confirmation History, LWOP Active, Request Status Summary, Institution Performance, Processing Time Analysis, Audit Log Summary
- All reports accessible from Reports menu
- Filters: date range, institution, status
- Export buttons generate PDF and XLSX files
- Report headers in selected language

---

**BR-RA-002: Custom Reporting Capability**

**Requirement:** Authorized users must be able to generate custom, ad-hoc reports for specific analysis needs.

**Business Justification:** Standard reports cannot cover all scenarios. Custom reporting enables flexibility for specific queries.

**Success Criteria:**
- Custom report builder available to HHRMD, CSCS, PO, HRRP
- Select fields, filters, sort order
- Generate and export custom reports

**Acceptance Criteria:**
- Report builder interface available
- Select report type (employees, requests, audit logs)
- Choose fields to include/exclude
- Apply filters (date range, institution, status, etc.)
- Sort by selected field
- Generate report and export to PDF/Excel

---

**BR-RA-003: Real-Time Dashboard Metrics**

**Requirement:** Role-based dashboards must display real-time metrics relevant to each user role.

**Business Justification:** Real-time visibility enables proactive management and timely intervention.

**Success Criteria:**
- Dashboard loads within 5 seconds
- Metrics updated in real-time (upon page refresh)
- Metrics tailored per role

**Acceptance Criteria:**
- HHRMD dashboard: All pending requests, institution performance, SLA status
- HRMO dashboard: Assigned pending requests, processing time
- DO dashboard: Pending complaints and terminations
- HRO dashboard: Institution-specific requests, submission stats
- PO/HRRP dashboard: Workforce metrics, retirement projections
- CSCS dashboard: Executive overview, institution comparison
- ADMIN dashboard: System health, user activity
- Metrics clickable to drill down

---

### 6.5 Compliance and Audit Requirements

**BR-CA-001: Comprehensive Audit Trail**

**Requirement:** All user actions must be logged in an immutable audit trail for compliance and accountability.

**Business Justification:** Regulatory compliance, audit readiness, and accountability require complete, tamper-proof activity logs.

**Success Criteria:**
- 100% of user actions logged
- Logs immutable (cannot be edited or deleted)
- Logs retained 10+ years
- Logs accessible for audit review

**Acceptance Criteria:**
- Every login, logout, create, update, approve, reject, send-back action logged
- Audit log fields: user ID, action type, timestamp, IP address, before/after values, entity ID
- Database constraints prevent audit log modification
- Admin and HHRMD can view and export audit logs
- Filter by user, date range, action type, entity type

---

**BR-CA-002: Regulatory Compliance Enforcement**

**Requirement:** System must programmatically enforce civil service regulations and HR policies through business rules.

**Business Justification:** Manual compliance checking is error-prone. Automated enforcement ensures consistent adherence to regulations.

**Success Criteria:**
- Probation period requirements (12-18 months) validated
- Service year requirements (2+ years for promotion) validated
- LWOP limits (3-year max, 2 lifetime) enforced
- Service extension limits (2 lifetime) enforced
- TCU verification requirements flagged
- Document requirements enforced

**Acceptance Criteria:**
- System prevents confirmation submission if probation <12 months
- System prevents promotion submission if service <2 years
- System prevents LWOP submission if duration >3 years or prior LWOPs ≥2
- System prevents service extension submission if prior extensions ≥2
- System flags TCU verification required if studiedOutsideCountry = true
- System prevents request submission if documents missing
- Business rule violations produce clear error messages

---

**BR-CA-003: Approval Authority Enforcement**

**Requirement:** System must enforce role-based approval authority ensuring only authorized users can approve specific request types.

**Business Justification:** Segregation of duties and approval authority per civil service regulations must be systematically enforced.

**Success Criteria:**
- HHRMD can approve all request types
- HRMO can approve confirmations, promotions, LWOP, retirements, resignations, service extensions
- HRMO CANNOT approve cadre changes, terminations/dismissals, complaints
- DO can approve terminations/dismissals and complaints
- DO CANNOT approve other request types
- HRO CANNOT approve any requests (submit only)

**Acceptance Criteria:**
- Approval interface displays only requests within user's authority
- Approval buttons disabled for unauthorized request types
- API-level authorization checks block unauthorized approvals
- Unauthorized approval attempts logged as security events

---

### 6.6 Integration Requirements

**BR-IN-001: HRIMS Data Synchronization**

**Requirement:** Employee data must be synchronized daily with HRIMS to maintain data consistency and freshness.

**Business Justification:** HRIMS is the source of truth for employee demographic and employment data. CSMS must stay synchronized.

**Success Criteria:**
- Daily automated sync job
- >99% sync success rate
- Data consistency >99%
- Sync errors logged and flagged

**Acceptance Criteria:**
- Background job runs daily (configurable time)
- Job pulls employee records from HRIMS database
- Job creates/updates employees in CSMS database
- Job logs sync results (success/failure, record counts)
- Sync errors flagged for manual review
- Data validation checks between CSMS and HRIMS
- Retry mechanism for failed syncs

---

**BR-IN-002: Email Integration**

**Requirement:** System must send automated email notifications for workflow events without manual intervention.

**Business Justification:** Email is the primary communication channel for stakeholders. Automated emails ensure timely awareness.

**Success Criteria:**
- Email sent within 1 minute of workflow event
- >95% email delivery success rate
- Email includes relevant details and link to system

**Acceptance Criteria:**
- SMTP server configured
- Email templates for each notification type
- Email job triggered by workflow events (async)
- Email includes: recipient, subject, body (HTML), request/complaint ID, link to system
- Failed emails logged (non-blocking)
- Retry mechanism for failed emails

---

**BR-IN-003: Integration Framework for Future Systems**

**Requirement:** System architecture must support future integration with external systems (TCU, Pension, Payroll) via APIs.

**Business Justification:** Future phases will require integration with external systems. Architecture must be integration-ready.

**Success Criteria:**
- RESTful API architecture
- API documentation
- Authentication/authorization for API access
- Extensible integration framework

**Acceptance Criteria:**
- Next.js API routes provide RESTful endpoints
- API endpoints documented (OpenAPI/Swagger)
- JWT-based API authentication
- Integration logging and error handling
- API versioning strategy (future)

---

### 6.7 User Experience Requirements

**BR-UX-001: Intuitive User Interface**

**Requirement:** User interface must be intuitive, requiring minimal training (<1 hour per role) for effective use.

**Business Justification:** Complex, hard-to-use systems reduce adoption and productivity. Intuitive design accelerates user proficiency.

**Success Criteria:**
- New users productive within 1 hour of training
- User satisfaction >85%
- Clear navigation and labeling
- Contextual help and guidance

**Acceptance Criteria:**
- Dashboard displays most common actions prominently
- Navigation menu organized by role-relevant modules
- Form fields labeled clearly with validation hints
- Error messages specific and actionable
- Tooltips and help text for complex fields
- Consistent UI patterns throughout application

---

**BR-UX-002: Responsive Design**

**Requirement:** User interface must be fully functional on desktop, tablet, and mobile browsers.

**Business Justification:** Users access system from various devices. Responsive design ensures usability regardless of device.

**Success Criteria:**
- Fully functional on desktop (≥1024px width)
- Usable on tablet (768px-1023px)
- Accessible on mobile browsers (≥375px)
- No horizontal scrolling

**Acceptance Criteria:**
- Tailwind CSS responsive breakpoints used
- UI tested on desktop, tablet, mobile viewports
- Touch-friendly controls on mobile
- Forms adapt to screen size
- Tables scroll horizontally on narrow screens (where necessary)

---

**BR-UX-003: Performance**

**Requirement:** System must respond quickly to user actions to maintain productivity and user satisfaction.

**Business Justification:** Slow systems frustrate users and reduce productivity.

**Success Criteria:**
- Login: <1.5 seconds
- Dashboard load: <5 seconds
- Search results: <1 second
- Report generation (10K records): <30 seconds

**Acceptance Criteria:**
- Performance testing validates targets
- Database indexes optimize queries
- Pagination for large datasets
- Async loading for reports
- Loading indicators for long operations

---

### 6.8 Security Requirements

**BR-SE-001: Authentication and Authorization**

**Requirement:** Only authenticated, authorized users can access the system and its data.

**Business Justification:** Unauthorized access risks data breach, fraud, and compliance violations.

**Success Criteria:**
- 100% of access requires authentication
- Role-based authorization enforced
- Strong password policies
- Account lockout protection
- Session security

**Acceptance Criteria:**
- Username/password authentication required
- Bcrypt password hashing (10-12 rounds)
- Password complexity: 8+ chars, mixed case, numbers, special chars
- Password expiration: Admin 60 days, Users 90 days
- Password history: Last 5 passwords cannot be reused
- Account lockout: 5 failed attempts = 30-min lockout
- Session timeout: 24 hours max, 7-min inactivity
- JWT-based session tokens
- HTTP-only cookies

---

**BR-SE-002: Data Encryption**

**Requirement:** Sensitive data must be encrypted in transit and at rest.

**Business Justification:** Data encryption protects against interception and unauthorized access.

**Success Criteria:**
- 100% of data transmission encrypted (HTTPS/TLS)
- Sensitive fields encrypted at rest (AES-256)
- Documents encrypted in storage

**Acceptance Criteria:**
- HTTPS enforced (redirect HTTP to HTTPS)
- TLS 1.2+ used
- SSL certificate installed
- Database connections encrypted
- MinIO documents encrypted at rest
- Passwords hashed (never stored plaintext)

---

**BR-SE-003: Security Monitoring**

**Requirement:** Security events must be logged and monitored for suspicious activity.

**Business Justification:** Proactive security monitoring detects and prevents security incidents.

**Success Criteria:**
- All authentication attempts logged
- Failed login attempts monitored
- Suspicious activity flagged
- Security audit logs available

**Acceptance Criteria:**
- Audit log records all login attempts (success/failure)
- Failed logins logged with username, IP, timestamp
- Account lockout events logged
- Unauthorized access attempts logged
- Security logs accessible to Admin and HHRMD
- Monthly security reports available

---

### 6.9 Availability and Reliability Requirements

**BR-AR-001: System Availability**

**Requirement:** System must be available 99.5% of the time during working hours (Monday-Friday, 8:00-17:00).

**Business Justification:** Unavailable system disrupts operations and employee services.

**Success Criteria:**
- Uptime ≥99.5% during working hours
- Scheduled maintenance during off-hours
- Disaster recovery plan in place

**Acceptance Criteria:**
- Monitoring tools track uptime
- Monthly uptime reports
- Maintenance windows announced 48 hours in advance
- Maintenance scheduled for weekends/evenings
- Backup and recovery procedures tested quarterly

---

**BR-AR-002: Data Backup and Recovery**

**Requirement:** All data must be backed up daily with recovery capability in case of disaster.

**Business Justification:** Data loss would be catastrophic. Regular backups enable recovery.

**Success Criteria:**
- Daily automated database backups
- Backup retention: 30 days
- Recovery time objective (RTO): 4 hours
- Recovery point objective (RPO): 24 hours

**Acceptance Criteria:**
- Automated backup job runs daily
- Backups stored securely (encrypted, off-server)
- Backup success/failure logged
- Recovery procedures documented and tested
- Quarterly disaster recovery drills

---

**BR-AR-003: Error Handling**

**Requirement:** System must handle errors gracefully with informative messages and logging for troubleshooting.

**Business Justification:** Poor error handling confuses users and complicates troubleshooting.

**Success Criteria:**
- User-friendly error messages (no technical jargon)
- Errors logged for troubleshooting
- No application crashes
- Graceful degradation

**Acceptance Criteria:**
- Try-catch blocks around risky operations
- Error messages displayed to user in plain language
- Technical error details logged (stack trace, context)
- Error log accessible to Admin
- Network errors display retry option
- Validation errors highlight specific fields

---

## 7. Functional Requirements

[Note: Due to length constraints, functional requirements are summarized at high level. Detailed functional requirements are documented in the System Requirements Specification (SRS) document.]

### 7.1 Functional Requirements by Module

**FR-1: Authentication Module**
- FR-1.1: User login with username/password
- FR-1.2: Password validation against policy
- FR-1.3: Account lockout after failed attempts
- FR-1.4: Session creation and management
- FR-1.5: Password change
- FR-1.6: Logout (single and all sessions)

**FR-2: Dashboard Module**
- FR-2.1: Role-based dashboard layout
- FR-2.2: Real-time request counts display
- FR-2.3: Quick action widgets
- FR-2.4: Notification center

**FR-3: Employee Management Module**
- FR-3.1: View employee profiles (role-filtered)
- FR-3.2: Search employees (name, ZanID, payroll)
- FR-3.3: Filter employees (institution, cadre, status)
- FR-3.4: View employee request history
- FR-3.5: View employee documents
- FR-3.6: Update employee profiles (Admin only)
- FR-3.7: Sync employees from HRIMS

**FR-4: Confirmation Module**
- FR-4.1: HRO submits confirmation request
- FR-4.2: System validates eligibility (probation ≥12 months, status = On Probation)
- FR-4.3: HRO uploads required documents (confirmation letter, IPA cert, appraisal)
- FR-4.4: System routes to HHRMD/HRMO
- FR-4.5: Approver reviews request
- FR-4.6: Approver approves (upload decision letter, set dates)
- FR-4.7: System updates employee status to "Confirmed"
- FR-4.8: Approver rejects (enter reason)
- FR-4.9: Approver sends back (enter instructions)
- FR-4.10: HRO rectifies and resubmits
- FR-4.11: System sends notifications
- FR-4.12: System logs all actions

**FR-5: Promotion Module**
- FR-5.1: HRO submits promotion request (education or performance based)
- FR-5.2: System validates eligibility (status = Confirmed, service ≥2 years)
- FR-5.3: HRO uploads documents (certificates, TCU verification if needed, appraisals)
- FR-5.4: System flags TCU verification required if studiedOutsideCountry = true
- FR-5.5: System routes to HHRMD/HRMO
- FR-5.6: Approver reviews and decides
- FR-5.7: On approval, system updates employee cadre
- FR-5.8: System sends notifications and logs actions

**FR-6: LWOP Module**
- FR-6.1: HRO submits LWOP request
- FR-6.2: System validates duration (1 month ≤ duration ≤ 3 years)
- FR-6.3: System checks lifetime LWOP count (max 2)
- FR-6.4: HRO uploads documents (application, justification)
- FR-6.5: System routes to HHRMD/HRMO
- FR-6.6: Approver reviews and decides
- FR-6.7: On approval, system updates employee status to "On LWOP"
- FR-6.8: System records start/end dates
- FR-6.9: System sends notifications and logs actions

**FR-7: Cadre Change Module**
- FR-7.1: HRO submits cadre change request
- FR-7.2: System validates eligibility (status = Confirmed)
- FR-7.3: HRO uploads documents (request letter, certificates, TCU if needed)
- FR-7.4: System routes to HHRMD exclusively (not HRMO)
- FR-7.5: HHRMD reviews and decides
- FR-7.6: On approval, system updates employee cadre
- FR-7.7: System sends notifications and logs actions

**FR-8: Service Extension Module**
- FR-8.1: HRO submits service extension request
- FR-8.2: System validates retirement date exists
- FR-8.3: System checks lifetime extension count (max 2)
- FR-8.4: HRO uploads documents (request letter, justification, consent)
- FR-8.5: System routes to HHRMD/HRMO
- FR-8.6: Approver reviews and decides
- FR-8.7: On approval, system extends retirement date
- FR-8.8: System schedules 90-day expiration notification
- FR-8.9: System sends notifications and logs actions

**FR-9: Retirement Module**
- FR-9.1: HRO submits retirement request (compulsory/voluntary/illness)
- FR-9.2: System validates required fields per type (illness description if illness type)
- FR-9.3: HRO uploads documents (application, ID, medical cert if illness)
- FR-9.4: System routes to HHRMD/HRMO
- FR-9.5: Approver reviews and decides
- FR-9.6: On approval, system updates employee status to "Retired"
- FR-9.7: System records retirement date and type
- FR-9.8: System sends notifications and logs actions

**FR-10: Resignation Module**
- FR-10.1: HRO submits resignation request
- FR-10.2: System validates effective date (≥3 months if 3-month notice)
- FR-10.3: HRO uploads documents (resignation letter, payment proof if 24-hr notice)
- FR-10.4: System routes to HHRMD/HRMO
- FR-10.5: Approver reviews and decides
- FR-10.6: On approval, system updates employee status to "Resigned"
- FR-10.7: System sends notifications and logs actions

**FR-11: Termination/Dismissal Module**
- FR-11.1: HRO submits termination/dismissal request
- FR-11.2: System validates type matches employee status
- FR-11.3: HRO uploads documents (investigation report, evidence)
- FR-11.4: System routes to DO or HHRMD exclusively
- FR-11.5: DO/HHRMD reviews and decides
- FR-11.6: On approval, system updates employee status to "Terminated" or "Dismissed"
- FR-11.7: System revokes employee access
- FR-11.8: System sends notifications and logs actions

**FR-12: Complaint Module**
- FR-12.1: Employee authenticates (ZanID + Payroll + ZSSF)
- FR-12.2: Employee submits complaint (type, subject, details)
- FR-12.3: Employee uploads evidence (optional)
- FR-12.4: System offers AI rewriting (Google Genkit)
- FR-12.5: Employee accepts/declines AI suggestion
- FR-12.6: System generates complaint ID (COMP-YYYY-NNNNNN)
- FR-12.7: System routes to DO or HHRMD based on type
- FR-12.8: DO/HHRMD reviews complaint
- FR-12.9: DO/HHRMD resolves (enter resolution action, comments)
- FR-12.10: DO/HHRMD rejects (enter rejection reason)
- FR-12.11: DO escalates to HHRMD (if needed)
- FR-12.12: System notifies employee of status changes
- FR-12.13: Employee views complaint status
- FR-12.14: System logs all actions

**FR-13: Reporting Module**
- FR-13.1: User selects standard report type
- FR-13.2: User applies filters (date range, institution, status)
- FR-13.3: System generates report (<30 seconds)
- FR-13.4: User exports to PDF or Excel
- FR-13.5: User accesses custom report builder
- FR-13.6: User selects fields and filters
- FR-13.7: System generates custom report
- FR-13.8: Report labels display in selected language (English/Swahili)

**FR-14: Audit Trail Module**
- FR-14.1: System logs all user actions automatically
- FR-14.2: Admin/HHRMD views audit logs
- FR-14.3: User filters audit logs (user, date, action type)
- FR-14.4: User searches audit logs
- FR-14.5: User exports audit logs to Excel/PDF
- FR-14.6: System prevents audit log modification (database constraint)

**FR-15: System Administration Module**
- FR-15.1: Admin creates user accounts
- FR-15.2: Admin assigns roles and institutions
- FR-15.3: Admin resets passwords
- FR-15.4: Admin locks/unlocks accounts
- FR-15.5: Admin forces logout (all sessions)
- FR-15.6: Admin creates/updates institutions
- FR-15.7: Admin views system health metrics
- FR-15.8: Admin triggers backup
- FR-15.9: Admin views error logs
- FR-15.10: Admin configures password policies

---

## 8. Non-Functional Requirements

### 8.1 Performance Requirements

**NFR-PERF-001: Response Time**
- Login: ≤1.5 seconds (95th percentile)
- Dashboard load: ≤5 seconds
- Search results: ≤1 second for 50,000 employees
- Report generation: ≤30 seconds for 10,000+ records
- API response: ≤2 seconds (95th percentile)

**NFR-PERF-002: Throughput**
- Support 100+ concurrent users
- Handle 1,000+ requests per day
- Process 100 HRIMS sync records per second

**NFR-PERF-003: Scalability**
- Database: Support 100,000+ employee records
- Documents: Support 500,000+ document files
- Users: Support 500+ user accounts
- Horizontal scaling capability for future growth

### 8.2 Security Requirements

**NFR-SEC-001: Authentication**
- Bcrypt password hashing (10-12 rounds)
- JWT token-based session management
- Account lockout: 5 failed attempts = 30-min lockout
- Password expiration: Admin 60 days, Users 90 days
- Password complexity enforced
- Password history: Last 5 cannot be reused

**NFR-SEC-002: Authorization**
- Role-based access control (9 roles)
- Institutional data isolation (HRO, HRRP)
- API-level authorization checks
- Least privilege principle

**NFR-SEC-003: Data Protection**
- HTTPS/TLS 1.2+ for data in transit
- AES-256 encryption for sensitive data at rest
- Database connection encryption
- Document encryption in MinIO
- Password masking in UI
- No sensitive data in logs

**NFR-SEC-004: Security Monitoring**
- Comprehensive audit logging
- Failed login attempt tracking
- Suspicious activity alerting
- Security event reporting
- Vulnerability scanning (pre-deployment)

### 8.3 Availability and Reliability Requirements

**NFR-AVAIL-001: Uptime**
- 99.5% availability during working hours (Mon-Fri 8:00-17:00)
- Scheduled maintenance during off-hours
- Downtime notifications 48 hours in advance

**NFR-AVAIL-002: Data Backup**
- Daily automated database backups
- Backup retention: 30 days
- Backups encrypted and stored off-server
- Quarterly backup restore testing

**NFR-AVAIL-003: Disaster Recovery**
- Recovery Time Objective (RTO): 4 hours
- Recovery Point Objective (RPO): 24 hours
- Documented disaster recovery procedures
- Quarterly DR drills

**NFR-AVAIL-004: Error Handling**
- Graceful error handling (no crashes)
- User-friendly error messages
- Technical errors logged for troubleshooting
- Network error retry mechanisms

### 8.4 Usability Requirements

**NFR-USA-001: User Interface**
- Intuitive navigation
- Consistent UI patterns
- Clear labeling and instructions
- Contextual help and tooltips

**NFR-USA-002: Learnability**
- New users productive within 1 hour of training
- User manual available
- In-app help documentation

**NFR-USA-003: Accessibility**
- Responsive design (desktop, tablet, mobile browsers)
- Touch-friendly controls on mobile
- Readable fonts and contrast ratios
- Keyboard navigation support

**NFR-USA-004: Multilingual Support**
- English (primary interface language)
- Swahili (report labels, selected UI elements)

### 8.5 Maintainability Requirements

**NFR-MAINT-001: Code Quality**
- TypeScript for type safety
- ESLint and Prettier for code standards
- Code comments for complex logic
- Modular architecture

**NFR-MAINT-002: Documentation**
- API documentation (OpenAPI/Swagger)
- Database schema documentation
- Code comments
- User and administrator manuals

**NFR-MAINT-003: Monitoring**
- Application logging (error, info, debug levels)
- System health monitoring
- Performance monitoring
- Error tracking and alerting

**NFR-MAINT-004: Upgradeability**
- Database migrations (Prisma Migrate)
- Backward-compatible API changes
- Version control (Git)
- Rollback capability

### 8.6 Compliance Requirements

**NFR-COMP-001: Regulatory Compliance**
- Civil Service Commission regulations enforcement
- Data protection and privacy compliance
- E-government standards (E-GAZ) compliance

**NFR-COMP-002: Audit Trail**
- Immutable audit logs
- 10-year log retention
- Comprehensive action logging
- Audit log export capability

**NFR-COMP-003: Data Retention**
- Employee records: 10 years post-retirement
- Approved requests: Indefinite
- Rejected requests: 5 years
- Audit logs: 10 years

---

## 9. Business Rules

### 9.1 System-Wide Business Rules

**BR-001: Request Uniqueness**
Each request must have a system-generated unique ID with format:
- Confirmation: CONF-[Institution]-YYYY-NNNNNN
- Promotion: PROM-[Institution]-YYYY-NNNNNN
- LWOP: LWOP-[Institution]-YYYY-NNNNNN
- Cadre Change: CADR-[Institution]-YYYY-NNNNNN
- Service Extension: SEXT-[Institution]-YYYY-NNNNNN
- Retirement: RETR-[Institution]-YYYY-NNNNNN
- Resignation: RESN-[Institution]-YYYY-NNNNNN
- Termination/Dismissal: TERM-[Institution]-YYYY-NNNNNN
- Complaint: COMP-YYYY-NNNNNN

**BR-002: Document Requirements**
- PDF format only
- Maximum 2MB per file (1MB for complaint attachments)
- Minimum one supporting document per request
- Descriptive filenames required

**BR-003: Status Transitions**
Valid transitions:
- PENDING → APPROVED
- PENDING → REJECTED
- PENDING → SENT_BACK
- SENT_BACK → PENDING (resubmission)
No reverse transitions allowed

**BR-004: Approval Authority**
- HHRMD: Can approve ALL request types
- HRMO: Can approve Confirmation, Promotion, LWOP, Retirement, Resignation, Service Extension
- HRMO CANNOT approve: Cadre Change, Termination/Dismissal, Complaints
- DO: Can approve Termination/Dismissal, Complaints
- DO CANNOT approve: Other request types
- HRO: Cannot approve any requests (submit only)

**BR-005: Institutional Data Isolation**
- HRO: View/submit only their institution's data
- HRRP: View only their institution's data
- CSC users (HHRMD, HRMO, DO, CSCS, PO): View all institutions
- Employee: View only own data

**BR-006: Notification Rules**
System automatically sends notifications:
- To approver: Request submitted (PENDING)
- To HRO: Request approved (APPROVED)
- To HRO: Request rejected (REJECTED)
- To HRO: Request sent back (SENT_BACK)
- To employee: Complaint status changes

**BR-007: Audit Logging**
All actions must log:
- User ID
- Action type
- Timestamp
- IP address
- Before/after values (updates)
- Related entity ID

### 9.2 Module-Specific Business Rules

**Confirmation Business Rules:**
- BR-CONF-001: Probation period ≥12 months from employment date
- BR-CONF-002: Only one active (PENDING/SENT_BACK) confirmation request per employee
- BR-CONF-003: Only "On Probation" employees can be confirmed
- BR-CONF-004: All three documents mandatory (confirmation letter, IPA cert, appraisal)
- BR-CONF-005: HHRMD or HRMO approval authority
- BR-CONF-006: Employee status updated to "Confirmed" ONLY when APPROVED
- BR-CONF-007: Decision letter required for APPROVED requests

**Promotion Business Rules:**
- BR-PROM-001: Employee status must be "Confirmed"
- BR-PROM-002: Minimum 2 years service in current cadre
- BR-PROM-003: TCU verification mandatory if studiedOutsideCountry = true
- BR-PROM-004: Proposed cadre must be higher than current cadre
- BR-PROM-005: Maximum one pending promotion request per employee

**LWOP Business Rules:**
- BR-LWOP-001: Duration: 1 month ≤ duration ≤ 3 years
- BR-LWOP-002: Maximum 2 LWOP periods per employee (lifetime)
- BR-LWOP-003: Reason cannot be on prohibited list (manual verification)
- BR-LWOP-004: No outstanding loan guarantees (manual verification)
- BR-LWOP-005: Start and end dates must be specified

**Cadre Change Business Rules:**
- BR-CADR-001: HHRMD approval ONLY (HRMO cannot approve)
- BR-CADR-002: TCU verification required if studiedOutsideCountry = true
- BR-CADR-003: Employee must meet educational requirements for new cadre
- BR-CADR-004: Reason field mandatory

**Service Extension Business Rules:**
- BR-SEXT-001: Employee must have retirementDate set
- BR-SEXT-002: Request must be submitted before retirement date
- BR-SEXT-003: Extension period: 6 months ≤ period ≤ 3 years
- BR-SEXT-004: Maximum 2 lifetime extensions
- BR-SEXT-005: Employee consent mandatory
- BR-SEXT-006: 90-day expiration notification automated

**Retirement Business Rules:**
- BR-RETR-001: Retirement type must be specified
- BR-RETR-002: Medical certificate mandatory for illness retirement
- BR-RETR-003: Proposed retirement date cannot be in past
- BR-RETR-004: For compulsory, employee must have reached retirement age

**Resignation Business Rules:**
- BR-RESN-001: Effective date ≥3 months from submission (3-month notice)
- BR-RESN-002: Payment proof required for 24-hour notice
- BR-RESN-003: Resignation cannot be withdrawn after approval
- BR-RESN-004: Employee must be "Confirmed" status

**Termination/Dismissal Business Rules:**
- BR-TERM-001: DO or HHRMD approval ONLY
- BR-TERM-002: Type must match employee status (Termination=Confirmed, Dismissal=Probation)
- BR-TERM-003: Evidence required (minimum 1 document)
- BR-TERM-004: Reason must be documented
- BR-TERM-005: Decision immutable once approved

**Complaint Business Rules:**
- BR-COMP-001: Only employees can submit (not HRO)
- BR-COMP-002: Authentication: ZanID + Payroll + ZSSF (all three required)
- BR-COMP-003: Complaint ID: COMP-YYYY-NNNNNN (no institution prefix)
- BR-COMP-004: DO and HHRMD both have resolution authority
- BR-COMP-005: Complaints can escalate from DO to HHRMD
- BR-COMP-006: Employee views only own complaints
- BR-COMP-007: Evidence documents optional
- BR-COMP-008: AI rewriting is optional

---

## 10. Data Requirements

### 10.1 Data Entities

**Primary Entities:**
- User (authentication and role management)
- Employee (employee master data)
- Institution (government institutions)
- ConfirmationRequest
- PromotionRequest
- LwopRequest
- CadreChangeRequest
- ServiceExtensionRequest
- RetirementRequest
- ResignationRequest
- SeparationRequest (Termination/Dismissal)
- Complaint
- EmployeeCertificate
- Notification
- AuditLog (implied, stored in logs)

### 10.2 Data Ownership

- **Employee Data:** Owned by CSC, synchronized from HRIMS
- **Request Data:** Owned by CSC via CSMS
- **User Accounts:** Owned by CSMS Admin
- **Institutions:** Owned by CSMS Admin
- **Audit Logs:** System-owned, immutable

### 10.3 Data Quality Standards

- **Accuracy:** >99% data accuracy between CSMS and HRIMS
- **Completeness:** 100% of mandatory fields populated
- **Consistency:** Data consistent across all modules
- **Timeliness:** HRIMS sync daily, data <24 hours old
- **Uniqueness:** ZanID unique across all employees

### 10.4 Data Retention

- Employee records: 10 years post-retirement
- Approved requests: Indefinite
- Rejected requests: 5 years
- Audit logs: 10 years (immutable)
- Documents: Per associated request/employee retention

### 10.5 Master Data Management

- **Employee Master Data:** HRIMS is source of truth
- **CSMS Role:** Extends HRIMS with HR workflow data
- **Synchronization:** Daily automated sync from HRIMS to CSMS
- **Data Conflicts:** HRIMS data takes precedence for demographic fields
- **CSMS-Specific Data:** Workflow status, request history, approvals (owned by CSMS)

---

## 11. Integration Requirements

### 11.1 HRIMS Integration

**Integration Type:** Batch/Scheduled (Background Jobs)

**Purpose:** Synchronize employee master data from HRIMS to CSMS

**Frequency:** Daily (configurable time, e.g., 2:00 AM)

**Data Direction:** HRIMS → CSMS (one-way read)

**Data Synchronized:**
- Employee ID, Name, Gender, Date of Birth, Place of Birth
- ZanID, Payroll Number, ZSSF Number
- Cadre, Salary Scale, Ministry, Department
- Institution, Employment Date, Confirmation Date, Retirement Date
- Status

**Integration Mechanism:**
- Background job (BullMQ with Redis)
- Direct database connection or API (depending on HRIMS capabilities)
- Upsert logic (create new, update existing employees)
- Error handling and retry for failed records
- Sync status tracking (last sync time, record counts, errors)

**Error Handling:**
- Log sync errors
- Flag failed records for manual review
- Send alert if sync failure rate >5%
- Retry mechanism for transient failures

**Data Consistency:**
- Validation checks between CSMS and HRIMS
- Data discrepancy reporting
- Manual reconciliation for conflicts

---

### 11.2 Email Integration

**Integration Type:** Asynchronous (Background Jobs)

**Purpose:** Send automated email notifications for workflow events

**Email Events:**
- Request submitted → Email to approver
- Request approved → Email to HRO
- Request rejected → Email to HRO
- Request sent back → Email to HRO
- Complaint status change → Email to employee

**SMTP Configuration:**
- SMTP server (configurable)
- Authentication (username/password or API key)
- Email templates (HTML)
- Retry mechanism for failed emails
- Email job queue (BullMQ)

**Email Content:**
- Recipient: User email address from database
- Subject: Descriptive subject line
- Body: HTML email with details and link to CSMS
- CTA: Link to view request/complaint in CSMS

---

### 11.3 Future Integration Requirements

**TCU (Tanzania Commission for Universities):**
- Purpose: Automated qualification verification
- Type: API integration (RESTful)
- Status: Future enhancement (current: manual verification with flag)

**Pension Authority:**
- Purpose: Retirement notifications and data sharing
- Type: API or batch integration
- Status: Future enhancement

**Payroll System:**
- Purpose: Salary adjustments, suspension (LWOP), final settlement
- Type: API or batch integration
- Status: Future enhancement

**Government Unified ID System:**
- Purpose: Single sign-on (SSO) authentication
- Type: OAuth2/SAML integration
- Status: Future enhancement

---

## 12. User Requirements

### 12.1 User Roles and Permissions

**Role 1: Chief Secretary Civil Service (CSCS)**
- View all requests across all institutions
- View all employees across all institutions
- View executive dashboard (institution performance, high-level metrics)
- View all reports
- No approval authority (oversight only)

**Role 2: Head of HR Management Division (HHRMD)**
- Approve/reject/send back all 8 request types + complaints
- View all requests and employees (all institutions)
- Upload decision letters
- View comprehensive dashboard
- View all reports
- Access audit logs

**Role 3: HR Management Officer (HRMO)**
- Approve/reject/send back: Confirmation, Promotion, LWOP, Retirement, Resignation, Service Extension
- CANNOT approve: Cadre Change, Termination/Dismissal, Complaints
- View all requests and employees (all institutions)
- Upload decision letters
- View comprehensive dashboard
- View reports

**Role 4: Disciplinary Officer (DO)**
- Approve/reject/send back: Termination/Dismissal, Complaints
- CANNOT approve: Other request types
- View all employees (all institutions)
- View termination/dismissal and complaint requests
- Upload decision letters (optional for terminations)
- View complaints dashboard
- Escalate complaints to HHRMD

**Role 5: HR Officer (HRO)**
- Submit all 8 request types on behalf of employees
- View requests from own institution ONLY
- View employees from own institution ONLY
- Upload supporting documents
- Rectify and resubmit sent-back requests
- View notifications
- View institution-specific reports
- CANNOT approve requests

**Role 6: Planning Officer (PO)**
- View all requests and employees (all institutions)
- View planning dashboard
- Access all reports
- Custom report builder access
- No approval authority

**Role 7: Head of Research and Planning (HRRP)**
- View requests from own institution ONLY
- View employees from own institution ONLY
- View planning dashboard
- Access reports (institution-filtered)
- No approval authority

**Role 8: System Administrator (ADMIN)**
- Create/update/delete user accounts
- Assign roles and institutions
- Reset passwords
- Lock/unlock accounts
- Force logout users
- Create/update institutions
- View system health metrics
- View audit logs
- Trigger backups
- View error logs
- Configure password policies
- No HR request approval authority

**Role 9: Employee (EMPLOYEE)**
- Submit complaints via employee portal
- View own profile (read-only)
- View own complaint status
- Cannot submit HR requests (through HRO only)
- Cannot view other employees

---

### 12.2 User Training Requirements

**Training Approach:**
- Role-specific training sessions
- Hands-on practice in training environment
- User manuals (bilingual: English/Swahili)
- Quick start guides
- On-the-job support during initial rollout

**Training Duration:**
- CSCS, HHRMD, HRMO, DO, PO, HRRP: 4 hours
- HRO: 3 hours
- ADMIN: 4 hours
- Employee: 1 hour (complaint portal)

**Training Topics:**
- System overview and navigation
- Role-specific features and workflows
- Request submission (HRO)
- Request review and approval (HHRMD, HRMO, DO)
- Reporting and analytics (PO, HRRP, HHRMD)
- System administration (ADMIN)
- Complaint submission (Employees)
- Best practices and tips

**Training Materials:**
- User Manual (comprehensive, bilingual)
- Quick Start Guide (one-page, role-specific)
- Training presentation slides
- Demo videos (optional)
- FAQs

---

## 13. Reporting Requirements

### 13.1 Standard Reports

**1. Employee Master List**
- Purpose: Comprehensive list of all employees
- Fields: Name, ZanID, Payroll, Institution, Cadre, Status, Employment Date
- Filters: Institution, Status, Cadre, Date Range
- Export: PDF, Excel

**2. Probationary Employees**
- Purpose: Employees nearing confirmation eligibility
- Fields: Name, ZanID, Institution, Employment Date, Probation Completed (months)
- Filters: Institution, Probation Period (≥12 months, ≥15 months, etc.)
- Export: PDF, Excel

**3. Retirement Projections**
- Purpose: Employees approaching retirement
- Fields: Name, ZanID, Institution, Cadre, Retirement Date, Months to Retirement
- Filters: Institution, Retirement Date Range (e.g., next 6 months)
- Export: PDF, Excel

**4. Promotion History**
- Purpose: All promotions within a period
- Fields: Employee Name, ZanID, Institution, Old Cadre, New Cadre, Promotion Date, Type
- Filters: Date Range, Institution, Promotion Type
- Export: PDF, Excel

**5. Confirmation History**
- Purpose: All confirmations within a period
- Fields: Employee Name, ZanID, Institution, Employment Date, Confirmation Date
- Filters: Date Range, Institution
- Export: PDF, Excel

**6. LWOP Active**
- Purpose: Employees currently on LWOP
- Fields: Employee Name, ZanID, Institution, LWOP Start Date, End Date, Duration, Reason
- Filters: Institution
- Export: PDF, Excel

**7. Request Status Summary**
- Purpose: Request counts by type and status
- Fields: Request Type, Status, Count, Institution
- Filters: Date Range, Institution, Request Type, Status
- Export: PDF, Excel

**8. Institution Performance**
- Purpose: Request volumes and processing times by institution
- Fields: Institution, Request Type, Total Submitted, Approved, Rejected, Sent Back, Avg Processing Time
- Filters: Date Range
- Export: PDF, Excel

**9. Processing Time Analysis**
- Purpose: Average processing time by request type
- Fields: Request Type, Total Requests, Avg Processing Days, Min Days, Max Days
- Filters: Date Range, Institution
- Export: PDF, Excel

**10. Audit Log Summary**
- Purpose: System activity summary
- Fields: User, Action Type, Count, Date Range
- Filters: Date Range, User, Action Type
- Export: PDF, Excel

---

### 13.2 Custom Reporting

**Custom Report Builder Features:**
- Select data source (Employees, Requests, Audit Logs)
- Choose fields to include/exclude
- Apply filters (date range, institution, status, type, etc.)
- Sort by selected field (ascending/descending)
- Generate preview
- Export to PDF/Excel
- Save custom report configuration (future enhancement)

---

### 13.3 Dashboard Analytics

**Role-Based Dashboards:**

**CSCS Dashboard:**
- Total employees across all institutions
- Request volumes by type (current month)
- Institution performance comparison (processing time, approval rate)
- Overdue requests (pending >10 days)
- System health status

**HHRMD Dashboard:**
- Pending requests in my queue (count by type)
- Requests reviewed this month
- Avg processing time (my reviews)
- Overdue requests
- Institution performance

**HRMO Dashboard:**
- Pending requests in my queue (count by type)
- Requests reviewed this month
- Avg processing time
- Overdue requests

**DO Dashboard:**
- Pending complaints (count by type)
- Pending terminations/dismissals
- Complaints resolved this month
- Avg complaint resolution time
- Overdue complaints

**HRO Dashboard:**
- Requests submitted (my institution, current month)
- Pending requests (my institution)
- Approved requests (current month)
- Rejected requests (current month)
- Sent-back requests awaiting rectification

**PO/HRRP Dashboard:**
- Workforce metrics (total employees, by institution if HRRP)
- Retirement projections (next 6 months)
- Promotion trends
- Confirmation trends
- LWOP active count

**ADMIN Dashboard:**
- Total users (by role)
- Active sessions
- Failed login attempts (last 24 hours)
- System uptime
- Database size
- Recent errors

**Employee Dashboard:**
- Personal profile summary
- My complaints (status)
- Quick link to submit complaint

---

## 14. Security & Compliance Requirements

### 14.1 Authentication & Access Control

**Authentication Mechanisms:**
- Username/password for users (HRO, HHRMD, HRMO, DO, PO, HRRP, CSCS, ADMIN)
- ZanID + Payroll + ZSSF for employees (complaint portal)
- JWT-based session tokens
- HTTP-only, secure cookies

**Password Policies:**
- Minimum length: 8 characters
- Complexity: Mixed case, numbers, special characters
- Expiration: Admin 60 days, Users 90 days
- History: Cannot reuse last 5 passwords
- Hashing: Bcrypt (10-12 rounds)

**Account Lockout:**
- Failed login threshold: 5 attempts
- Lockout duration: 30 minutes
- Auto-unlock after duration
- Manual unlock by Admin

**Session Management:**
- Maximum 3 concurrent sessions per user
- Session expiration: 24 hours
- Inactivity timeout: 7 minutes
- Force logout capability (Admin)

**Authorization:**
- Role-based access control (9 roles)
- Least privilege principle
- Institutional data filtering (HRO, HRRP)
- API-level authorization checks
- Unauthorized access attempts logged

---

### 14.2 Data Protection

**Encryption:**
- Data in transit: HTTPS/TLS 1.2+
- Data at rest: AES-256 (database, documents)
- Password storage: Bcrypt hashing
- Database connections: Encrypted
- MinIO document storage: Encrypted at rest

**Data Masking:**
- Passwords masked in UI (•••••)
- Sensitive fields redacted in logs
- Employee data restricted per role

**Data Backup:**
- Automated daily backups
- Backups encrypted
- Backup retention: 30 days
- Offsite backup storage
- Quarterly restore testing

**Data Disposal:**
- Secure deletion for decommissioned data
- Log retention per policy (10 years)
- No sensitive data in application logs

---

### 14.3 Audit & Compliance

**Comprehensive Audit Trail:**
- All user actions logged
- Immutable audit logs (database constraints)
- Log fields: User, Action, Timestamp, IP, Before/After, Entity ID
- Log retention: 10 years
- Audit log export capability

**Compliance Monitoring:**
- Monthly audit reports
- Failed login attempt monitoring
- Unauthorized access alerts
- Data access reports
- Suspicious activity flagging

**Regulatory Compliance:**
- Civil service regulations enforcement via business rules
- Data protection compliance (privacy)
- E-government standards (E-GAZ) compliance
- Audit readiness

---

### 14.4 Security Monitoring

**Security Events Logged:**
- Login attempts (success/failure)
- Password changes
- Account lockouts
- Role changes
- Data access (create, read, update, delete)
- Unauthorized access attempts
- Session creation/termination
- System configuration changes

**Security Alerts:**
- Multiple failed login attempts
- Unusual access patterns
- Unauthorized access attempts
- Account lockouts
- System errors

**Security Reporting:**
- Monthly security summary
- Failed login report
- Account lockout report
- Data access report
- Security incident log

---

### 14.5 Security Best Practices

**Application Security:**
- CSRF protection
- Security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options)
- Input validation (prevent injection attacks)
- Output encoding (prevent XSS)
- Rate limiting (login attempts)
- SQL injection prevention (Prisma ORM parameterized queries)
- File upload validation (PDF only, size limits)

**Infrastructure Security:**
- Firewall configuration
- Intrusion detection (IDS/IPS)
- Regular security patches
- Principle of least privilege (server access)
- Secure server configuration
- Database access restrictions

**Security Testing:**
- Vulnerability scanning (pre-deployment)
- Penetration testing (annual)
- Code security review
- Dependency vulnerability scanning
- UAT security test scenarios (72 test cases)

---

## 15. Success Criteria

### 15.1 Technical Success Criteria

**Functional Completeness:**
- ✓ All 8 HR request types fully operational
- ✓ All 9 user roles implemented with correct permissions
- ✓ HRIMS integration functional with daily sync
- ✓ Complaint management system operational
- ✓ Reporting module with 10+ standard reports
- ✓ Audit trail comprehensive and immutable
- ✓ Document management functional (upload, storage, retrieval)

**Performance Benchmarks:**
- ✓ Login response time <1.5 seconds (95th percentile)
- ✓ Dashboard load time <5 seconds
- ✓ Search results <1 second for 50,000 employees
- ✓ Report generation <30 seconds for large datasets
- ✓ System uptime ≥99.5% during working hours

**Security Validation:**
- ✓ All 72 UAT security test scenarios passed
- ✓ Penetration testing completed (no critical vulnerabilities)
- ✓ Password policies enforced across all user types
- ✓ Comprehensive audit logging operational
- ✓ Role-based access control validated

**Quality Assurance:**
- ✓ UAT pass rate ≥95% (achieved: 98%)
- ✓ Zero critical bugs in production
- ✓ All non-functional requirements met
- ✓ User acceptance sign-off obtained

---

### 15.2 User Acceptance Criteria

**User Satisfaction:**
- ✓ User satisfaction rating ≥85% (achieved: 4.2/5.0)
- ✓ Positive feedback from all user role groups
- ✓ Successful completion of role-specific training

**Operational Adoption:**
- ✓ All 41 institutions onboarded
- ✓ All HROs trained and actively using system
- ✓ CSC officers (HHRMD, HRMO, DO) processing requests digitally
- ✓ Employee self-service complaint portal utilized

**UAT Completion:**
- ✓ 244 test scenarios executed (21 test cases)
- ✓ 98% pass rate achieved
- ✓ All critical and high-priority defects resolved
- ✓ UAT sign-off obtained from CSC

---

### 15.3 Business Impact Criteria

**Process Improvement:**
- ✓ 80% reduction in HR request processing time (target: 70%)
  - Baseline: 15-25 days → Current: 3-5 days
- ✓ Real-time request status visibility for all stakeholders
- ✓ 90%+ reduction in manual data entry errors
- ✓ 100% digital processing (zero paper-based requests)

**Compliance:**
- ✓ Complete audit trails for all HR transactions
- ✓ Adherence to civil service regulations enforced by system
- ✓ Probation period requirements automatically tracked and validated
- ✓ Zero compliance violations post-implementation

**Data Management:**
- ✓ 50,234 employee records migrated and centralized
- ✓ HRIMS synchronization operational (99% success rate)
- ✓ Data consistency maintained between CSMS and HRIMS
- ✓ Search and retrieval time <1 second

**Reporting & Analytics:**
- ✓ 10+ standard reports operational
- ✓ Custom report builder functional
- ✓ Real-time dashboard metrics available
- ✓ Report generation time <30 seconds

---

### 15.4 Project Delivery Criteria

**Timeline:**
- ✓ Project completed within 31-week schedule
- ✓ All milestones met (minor 2-day delay in design phase recovered)
- ✓ Go-live on September 15, 2025 as planned

**Budget:**
- ✓ Project completed 1% under budget

**Documentation:**
- ✓ All technical documentation delivered (SRS, SDD, Database Design, API Docs)
- ✓ All user documentation delivered (User Manual, Admin Manual, Training Manual, Quick Start Guides)
- ✓ All QA documentation delivered (UAT Report, Test Results, Security Test Report)
- ✓ Operations and maintenance manuals provided
- ✓ Final project report and handover document completed

**Stakeholder Approval:**
- ✓ UAT sign-off from CSC obtained
- ✓ Production deployment approval granted
- ✓ Training completion certification
- ✓ Final project acceptance by steering committee

---

## 16. Assumptions & Constraints

### 16.1 Assumptions

**Technical Assumptions:**
1. Production server infrastructure is available and meets minimum specifications
2. PostgreSQL database server is provisioned and accessible
3. MinIO object storage is deployed and operational
4. Internet connectivity is reliable at CSC and all 41 institutions
5. Users have access to modern web browsers (Chrome, Firefox, Edge)
6. HRIMS database is accessible for integration
7. Email server (SMTP) is available for notifications

**Organizational Assumptions:**
1. CSC leadership is committed to digital transformation and system adoption
2. All HROs will transition from paper-based to digital processes
3. HROs will dedicate time to submit requests digitally on behalf of employees
4. Approvers (HHRMD, HRMO, DO) will process requests within SLA timelines
5. Stakeholders will participate in UAT and provide timely feedback
6. IT Department will provide ongoing infrastructure support
7. Budget is approved and funding is available

**Data Assumptions:**
1. HRIMS contains accurate employee master data for 50,000+ employees
2. Employee data in HRIMS is reasonably up-to-date
3. Data migration from HRIMS to CSMS is feasible
4. Data quality issues in HRIMS can be resolved through cleansing
5. ZanID is unique and reliable identifier for employees

**Process Assumptions:**
1. Current manual HR processes are well-understood and documented
2. Civil service regulations are stable and documented
3. Approval workflows will not change significantly during project
4. Document requirements (PDFs) are acceptable to all stakeholders
5. Employees will accept digital complaint submission (vs. in-person)

**User Assumptions:**
1. HROs have basic computer literacy
2. Approvers are comfortable with web-based applications
3. Users will complete training before go-live
4. Users will adopt the new system with appropriate change management
5. Admin will be available for user support post-go-live

---

### 16.2 Constraints

**Technical Constraints:**
1. **Technology Stack:** Next.js 14, PostgreSQL, Prisma, MinIO (pre-selected)
2. **Document Format:** PDF only (no Word, Excel, images)
3. **File Size Limits:** 2MB per request document, 1MB per complaint attachment
4. **Browser Support:** Modern browsers only (Chrome, Firefox, Edge)
5. **Network Dependency:** System requires internet connectivity (no offline mode)
6. **Integration Limitations:** HRIMS lacks APIs (requires direct database access or batch processing)

**Organizational Constraints:**
1. **Budget:** Fixed budget with minimal contingency
2. **Timeline:** 31-week project schedule (non-negotiable go-live date)
3. **Team Size:** 9 FTE maximum
4. **User Availability:** Stakeholders have limited time for requirements, UAT, and training
5. **Change Management:** Limited change management resources

**Regulatory Constraints:**
1. **Civil Service Regulations:** System must adhere to existing regulations (cannot change regulations)
2. **Data Protection:** Must comply with Zanzibar data protection requirements
3. **E-Government Standards:** Must meet E-GAZ quality assurance standards
4. **Audit Requirements:** 10-year audit trail retention mandated

**Data Constraints:**
1. **Data Ownership:** HRIMS is authoritative source for employee master data (CSMS cannot modify)
2. **Data Access:** Limited access to HRIMS for integration
3. **Data Quality:** HRIMS data quality issues may impact migration
4. **Data Volume:** 50,000+ employee records require efficient storage and retrieval

**Process Constraints:**
1. **Approval Authority:** Cannot change approval authority (defined by civil service regulations)
2. **Workflow Rigidity:** Workflows are fixed per regulations (no ad-hoc workflow customization)
3. **Manual Verifications:** Some verifications remain manual (loan guarantees, TCU, prohibited reasons)

**User Constraints:**
1. **Digital Literacy:** Varying levels of computer skills among HROs
2. **Language Preference:** Some users prefer Swahili (partial bilingual support only)
3. **Training Time:** Limited time for user training (1-4 hours per role)
4. **Resistance to Change:** Potential resistance from users comfortable with paper processes

**Infrastructure Constraints:**
1. **Server Resources:** Shared infrastructure with other government systems
2. **Backup Storage:** Limited offsite storage capacity
3. **Internet Bandwidth:** Variable internet speeds at some institutions

---

### 16.3 Dependencies

**External Dependencies:**
1. **HRIMS Team:** Cooperation for data integration and access
2. **IT Department:** Server infrastructure, database setup, network configuration
3. **E-GAZ Authority:** Compliance approval and certification
4. **CSC Leadership:** Decision-making and stakeholder coordination
5. **Email Infrastructure:** SMTP server for notifications
6. **TCU (Future):** Qualification verification integration

**Internal Dependencies:**
1. **Requirements Finalization:** Design depends on approved requirements
2. **Database Design:** Development depends on database schema
3. **API Development:** Frontend depends on API completion
4. **Testing Environment:** UAT depends on test environment setup
5. **User Training:** Go-live depends on training completion
6. **Data Migration:** System launch depends on employee data migration

**Risk Dependencies:**
1. **Stakeholder Availability:** Delays in requirements gathering or UAT feedback impact schedule
2. **HRIMS Data Quality:** Poor data quality delays migration
3. **Infrastructure Readiness:** Infrastructure delays impact deployment
4. **Change Management:** Insufficient change management impacts adoption

---

## 17. Risk Assessment

### 17.1 Risk Categories

**High-Impact, High-Probability Risks:**

**Risk 1: User Adoption Challenges**
- **Description:** Users resist transition from familiar paper-based processes to digital system
- **Probability:** Medium-High
- **Impact:** High (system underutilization, continued manual processes)
- **Mitigation:**
  - Comprehensive change management and communication plan
  - Executive sponsorship and mandate for digital adoption
  - User-friendly interface design
  - Role-specific training with hands-on practice
  - Ongoing support during initial rollout
  - Quick wins and success stories to build confidence

**Risk 2: HRIMS Integration Complexity**
- **Description:** Technical challenges in integrating with legacy HRIMS system
- **Probability:** Medium
- **Impact:** High (data inconsistency, incomplete employee records)
- **Mitigation:**
  - Early integration spike/proof-of-concept
  - Fallback to batch file import if API unavailable
  - Data quality assessment and cleansing before migration
  - Phased integration approach
  - Retry and error handling mechanisms
  - Manual reconciliation processes

---

**High-Impact, Low-Probability Risks:**

**Risk 3: Data Loss or Corruption**
- **Description:** Critical data lost or corrupted due to system failure or human error
- **Probability:** Low
- **Impact:** Very High (data integrity, business continuity)
- **Mitigation:**
  - Daily automated backups
  - Database transaction integrity (ACID compliance)
  - Disaster recovery plan and procedures
  - Quarterly backup restore testing
  - Immutable audit logs
  - Data validation and consistency checks

**Risk 4: Security Breach**
- **Description:** Unauthorized access, data breach, or cyberattack
- **Probability:** Low
- **Impact:** Very High (data confidentiality, legal liability, reputation)
- **Mitigation:**
  - Comprehensive security controls (encryption, authentication, authorization)
  - Penetration testing and vulnerability scanning
  - Security monitoring and alerting
  - Incident response plan
  - Regular security audits
  - User security training

---

**Medium-Impact, Medium-Probability Risks:**

**Risk 5: Scope Creep**
- **Description:** Uncontrolled expansion of project scope beyond defined requirements
- **Probability:** Medium
- **Impact:** Medium (budget overrun, schedule delay, team burnout)
- **Mitigation:**
  - Formal change control process
  - Documented scope baseline (this BRD)
  - Regular scope review and validation
  - Stakeholder alignment on priorities
  - Future enhancement backlog for out-of-scope requests

**Risk 6: Performance Issues**
- **Description:** System performance degrades under load or with large datasets
- **Probability:** Medium
- **Impact:** Medium (user frustration, productivity loss)
- **Mitigation:**
  - Database indexing strategy
  - Pagination for large datasets
  - Performance testing with realistic data volumes
  - Query optimization
  - Caching strategies
  - Scalable infrastructure

**Risk 7: Stakeholder Availability**
- **Description:** Key stakeholders unavailable for requirements, UAT, or decisions
- **Probability:** Medium
- **Impact:** Medium (schedule delays, requirement gaps)
- **Mitigation:**
  - Early stakeholder commitment and scheduling
  - Designated alternates for key stakeholders
  - Flexible meeting scheduling
  - Asynchronous feedback mechanisms (email, shared docs)
  - Escalation to executive sponsor if needed

---

**Low-Impact, Low-Probability Risks:**

**Risk 8: Technology Obsolescence**
- **Description:** Selected technology stack becomes outdated during project
- **Probability:** Low
- **Impact:** Low (current tech stack is modern and well-supported)
- **Mitigation:**
  - Selected mature, widely-adopted technologies (Next.js, PostgreSQL)
  - Long-term support (LTS) versions
  - Active communities and regular updates
  - Modular architecture enabling future upgrades

---

### 17.2 Risk Mitigation Summary

| Risk | Probability | Impact | Mitigation Strategy | Contingency Plan |
| --- | --- | --- | --- | --- |
| **User Adoption** | Medium-High | High | Change management, training, executive support | Phased rollout, extended support period |
| **HRIMS Integration** | Medium | High | Early POC, fallback options, error handling | Manual data import, batch processing |
| **Data Loss** | Low | Very High | Backups, DR plan, testing | Restore from backup, manual reconciliation |
| **Security Breach** | Low | Very High | Comprehensive security controls, monitoring | Incident response, forensic investigation |
| **Scope Creep** | Medium | Medium | Change control process, scope baseline | Prioritize core features, defer enhancements |
| **Performance Issues** | Medium | Medium | Indexing, pagination, performance testing | Infrastructure scaling, query optimization |
| **Stakeholder Availability** | Medium | Medium | Early scheduling, alternates, async feedback | Escalation to sponsor, assumptions documented |
| **Tech Obsolescence** | Low | Low | Modern stack, LTS versions | Future upgrade path planned |

---

## 18. Approval & Sign-Off

### 18.1 Document Reviewers

This Business Requirements Document has been reviewed and validated by:

| Reviewer Name | Title | Organization | Date | Signature |
| --- | --- | --- | --- | --- |
| _____________ | Chief Secretary Civil Service | CSC | ________ | __________ |
| _____________ | Head of HR Management Division | CSC | ________ | __________ |
| _____________ | Director of Operations | CSC | ________ | __________ |
| _____________ | Project Manager | Project Team | ________ | __________ |
| _____________ | Business Analyst | Project Team | ________ | __________ |

---

### 18.2 Document Approvers

This Business Requirements Document is approved for implementation by:

| Approver Name | Title | Organization | Date | Signature |
| --- | --- | --- | --- | --- |
| _____________ | Chief Secretary Civil Service | CSC | ________ | __________ |
| _____________ | Civil Service Commission Secretary | CSC | ________ | __________ |
| _____________ | Project Sponsor | CSC | ________ | __________ |

---

### 18.3 Acknowledgment

By signing this document, the approvers acknowledge that:

1. They have reviewed and understand the business requirements, scope, objectives, and success criteria defined in this document
2. The requirements accurately reflect the business needs of the Civil Service Commission
3. They authorize the project team to proceed with system design, development, testing, and deployment based on these requirements
4. Any changes to scope, requirements, or objectives will follow the formal change control process
5. They commit to providing necessary resources, stakeholder participation, and timely decision-making to support project success

---

### 18.4 Change History

| Change # | Date | Description | Requested By | Approved By | Impact (Cost/Schedule) |
| --- | --- | --- | --- | --- | --- |
| - | - | (No changes to baseline since v1.0 approval) | - | - | - |

---

## Appendices

### Appendix A: Glossary of Terms

| Term | Definition |
| --- | --- |
| **ADMIN** | System Administrator role |
| **Approver** | HHRMD, HRMO, or DO authorized to approve requests |
| **Audit Trail** | Immutable log of all system activities |
| **BRD** | Business Requirements Document (this document) |
| **CSC** | Civil Service Commission |
| **CSCS** | Chief Secretary Civil Service |
| **CSMS** | Civil Service Management System |
| **Decision Letter** | Official PDF document confirming approval of HR request |
| **DO** | Disciplinary Officer |
| **E-GAZ** | E-Government Authority (Zanzibar) |
| **HHRMD** | Head of HR Management Division |
| **HRO** | HR Officer (institution-level) |
| **HRIMS** | HR Information Management System (legacy system) |
| **HRMO** | HR Management Officer |
| **HRRP** | Head of Research and Planning |
| **LWOP** | Leave Without Pay |
| **MinIO** | S3-compatible object storage system |
| **PO** | Planning Officer |
| **Probation Period** | Initial 12-18 month evaluation period for new employees |
| **Rectification** | Corrections made by HRO after request sent back |
| **Review Stage** | Granular tracking within status (Submitted, Under Review, Decision Made) |
| **Send Back** | Approver returns request to HRO for corrections |
| **SRS** | System Requirements Specification |
| **TCU** | Tanzania Commission for Universities |
| **UAT** | User Acceptance Testing |
| **ZanID** | Zanzibar National ID Number |
| **ZSSF** | Zanzibar Social Security Fund Number |

---

### Appendix B: Acronyms

| Acronym | Full Form |
| --- | --- |
| **API** | Application Programming Interface |
| **CSRF** | Cross-Site Request Forgery |
| **CSP** | Content Security Policy |
| **FTE** | Full-Time Equivalent |
| **HSTS** | HTTP Strict Transport Security |
| **HTTPS** | Hypertext Transfer Protocol Secure |
| **JWT** | JSON Web Token |
| **MFA** | Multi-Factor Authentication |
| **MFA** | Multi-Factor Authentication |
| **ORM** | Object-Relational Mapping |
| **PDF** | Portable Document Format |
| **RBAC** | Role-Based Access Control |
| **REST** | Representational State Transfer |
| **ROI** | Return on Investment |
| **RPO** | Recovery Point Objective |
| **RTO** | Recovery Time Objective |
| **SDD** | System Design Document |
| **SLA** | Service Level Agreement |
| **SMTP** | Simple Mail Transfer Protocol |
| **SSO** | Single Sign-On |
| **TLS** | Transport Layer Security |
| **XSS** | Cross-Site Scripting |

---

### Appendix C: Reference Documents

**Project Documentation:**
1. Concept Note (v1.0)
2. Inception Report (v1.0)
3. System Requirements Specification (v1.0)
4. System Design Document (v1.0)
5. Database Design Document (v1.0)
6. Business Process Document (v1.0)
7. User Manual (v1.0)
8. Administrator Manual (v1.0)
9. UAT Report (v1.0)
10. Final Project Report & Handover (v1.0)

**Technical Documentation:**
11. High-Level Design Document (v2.0)
12. Low-Level Design Document (v1.0)
13. Technical Architecture Document (v1.0)
14. Interface Design Document (v1.0)
15. API Documentation

**Quality & Security:**
16. Quality Assurance Plan (v1.0)
17. Security Assessment Report (v3.0)
18. Security Policy Document (v2.0)
19. UAT Security Testing Report (v1.0)
20. Performance Test Report (v1.0)

**Operations:**
21. Operations Manual (v1.0)
22. Deployment Plan (v1.0)
23. Backup and Recovery Plan (v1.0)
24. Disaster Recovery Plan (v1.0)

**Regulations & Standards:**
25. Civil Service Commission Regulations
26. E-Government Quality Assurance Standards (E-GAZ)
27. Data Protection Guidelines (Zanzibar)

---

### Appendix D: Stakeholder Contact List

| Name | Role | Email | Phone | Organization |
| --- | --- | --- | --- | --- |
| [Name] | Chief Secretary Civil Service | [email] | [phone] | CSC |
| [Name] | Head of HR Management Division | [email] | [phone] | CSC |
| [Name] | HR Management Officer | [email] | [phone] | CSC |
| [Name] | Disciplinary Officer | [email] | [phone] | CSC |
| [Name] | Planning Officer | [email] | [phone] | CSC |
| [Name] | Project Manager | [email] | [phone] | Project Team |
| [Name] | Business Analyst | [email] | [phone] | Project Team |
| [Name] | Lead Developer | [email] | [phone] | Project Team |

---

### Appendix E: Request Type Summary

| Request Type | Abbreviation | Approvers | Min Service/Time | Max Frequency | Status Change |
| --- | --- | --- | --- | --- | --- |
| **Confirmation** | CONF | HHRMD, HRMO | 12 months probation | Once | On Probation → Confirmed |
| **Promotion** | PROM | HHRMD, HRMO | 2 years in cadre | Multiple | Cadre updated |
| **LWOP** | LWOP | HHRMD, HRMO | 1 month | 2 lifetime | Confirmed → On LWOP |
| **Cadre Change** | CADR | HHRMD only | - | Multiple | Cadre updated |
| **Service Extension** | SEXT | HHRMD, HRMO | 6 months | 2 lifetime | Retirement date extended |
| **Retirement** | RETR | HHRMD, HRMO | - | Once | Confirmed → Retired |
| **Resignation** | RESN | HHRMD, HRMO | 3 months notice | Once | Confirmed → Resigned |
| **Termination/Dismissal** | TERM | DO, HHRMD | - | - | → Terminated/Dismissed |
| **Complaint** | COMP | DO, HHRMD | - | Unlimited | No status change |

---

## Document End

**Classification:** Official - Government of Zanzibar
**Distribution:** Civil Service Commission, Project Stakeholders, E-Government Authority
**Next Review:** As needed for change requests or future phases

---

_This Business Requirements Document has been prepared for the Civil Service Management System (CSMS) project to provide comprehensive business context, objectives, requirements, and success criteria for all stakeholders._

**Document Version:** 1.0
**Date:** February 2, 2026
**Status:** Final for Approval
