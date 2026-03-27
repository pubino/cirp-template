/**
 * CIRP Markdown template generator.
 * All placeholders are resolved from the merged config + form data object.
 */

export function generateCIRP(d) {
  // safe defaults for nested objects
  d.severity_response_times = d.severity_response_times || {};
  d.training_schedule = Object.assign({
    awareness_training: 'Each Semester',
    cirp_review: 'Annually and upon hire',
    phishing_drills: 'Continuous',
    data_protection: 'Opportunistic',
  }, d.training_schedule);
  d.maintenance_schedule = Object.assign({
    full_review: 'Annually (or after any Severity 1/2 incident)',
    contact_verification: 'Quarterly',
    iso_alignment: 'Annually',
  }, d.maintenance_schedule);

  const fileSystems = (d.file_sharing_systems || []).join(', ');
  const personnelTypes = (d.personnel_types || []).map(t => `- ${t}`).join('\n');
  const admins = (d.program_administrators || [])
    .filter(a => a.name)
    .map(a => a.name)
    .join(', ');
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const effectiveDate = d.effective_date || today;
  const lastReviewed = d.last_reviewed || today;
  const srt = {
    critical: d.severity_response_times.critical || 'Immediately',
    high: d.severity_response_times.high || 'Within 1 hour',
    medium: d.severity_response_times.medium || 'Within 8 hours',
    low: d.severity_response_times.low || 'Within 2 business days',
  };

  return `# Cybersecurity Incident Response Plan (CIRP)
## ${d.department_name}
### ${d.school_name}, ${d.university_name}

**Location:** ${d.location}${'  '}
**Effective Date:** ${effectiveDate}${'  '}
**Last Reviewed:** ${lastReviewed}${'  '}
**Classification:** ${d.classification_level}

---

> **NOTICE:** This document is ${d.classification_level} and is intended solely for the staff and faculty of the ${d.department_name}. Unauthorized disclosure, reproduction, or distribution is strictly prohibited. All recipients are bound by the confidentiality obligations described in Section 10 of this plan.

---

## Table of Contents

1. Purpose and Scope
2. Timing
3. Incident Response Liaisons
4. Roles and Responsibilities
5. Incident Severity Classification
6. Incident Identification — How to Recognize an Incident
7. Incident Reporting Procedures
8. Unit-Level Support and Escalation
9. Communication Protocols
10. Confidentiality Requirements
11. Post-Incident Review
12. Training and Awareness
13. Plan Maintenance

---

## 1. Purpose and Scope

This Cybersecurity Incident Response Plan (CIRP) establishes how the ${d.department_name} (${d.department_abbr}) identifies, reports, and supports the response to cybersecurity incidents affecting departmental systems, data, and personnel.

**Scope.** This plan covers all ${d.department_abbr} information assets, including but not limited to:

- The ${d.department_abbr} departmental website (${d.website_url}) and intranet (${d.intranet_url}), both running on the ${d.website_platform} platform.
- ${fileSystems} folders and file-sharing systems.
- Department devices used by faculty, staff, and researchers.
- ${d.university_name} authenticated accounts and Active Directory group memberships.
- Research computing resources and data (${d.research_computing}), including those managed for faculty and postdoctoral researchers.
- Accounts and calendar systems.
- Webform and web app systems collecting or reporting directory information, personnel data, media, and other content.
- Any data classified under [${d.university_name}'s information classification standards](${d.classification_standards_url}).

**Applicability.** This plan applies to all ${d.department_abbr} personnel, including but not limited to:

${personnelTypes}

This plan operates **subordinate to and in coordination with** the ${d.university_name} Information Security Office (ISO).

The ISO leads formal incident response; ${d.department_abbr} provides timely, academic unit-level detection, reporting, and support.

---

## 2. Timing

${d.department_abbr} Personnel are directed to **report suspected or identified cybersecurity incident or suspicious activity immediately** and not to wait to confirm or independently investigate a problem before raising Information Security Office (ISO) awareness.

There are no penalties for false alarms.

---

## 3. Incident Response Liaisons & Contacts

${d.department_abbr} designates two Incident Response Liaisons (IRLs) who serve as the department's points of contact with the ${d.university_name} ISO during any cybersecurity incident.

| Role | Name | Title |
|------|------|-------|
| **Primary IRL** | ${d.primary_irl_name} | ${d.primary_irl_title} |
| **Secondary IRL** | ${d.secondary_irl_name} | ${d.secondary_irl_title} |

**IRL responsibilities:**

- Receive and triage all incident reports from ${d.department_abbr} personnel.
- Notify the Information Security Office (ISO) via the established reporting channels ([Section 7](#7-incident-reporting-procedures)).
- Join an incident room ([Section 8](#8-unit-level-support-and-escalation)) or equivalent communications channel(s).
- Coordinate ${d.department_abbr}'s internal response actions under ISO direction.
- Serve as the communication conduit between ${d.department_abbr} and the ISO.
- Maintain the confidentiality of all incident details.
- Coordinate post-incident departmental review.

**Escalation.** If neither IRL can be reached within ${d.escalation_timeout_minutes} minutes, any ${d.department_abbr} staff member should report directly to the ${d.university_name} ISO ([Section 7](#7-incident-reporting-procedures)) and notify the Department Chair.

---

## 4. Roles and Responsibilities

### 4.1 All ${d.department_abbr} Personnel

Everyone in the department is responsible for:

- Remaining vigilant for signs of cybersecurity incidents (see Section 6)
- **Reporting suspected incidents immediately** to the Primary IRL or Secondary IRL.
- Following instructions issued during an active incident.
- Preserving evidence (e.g., email, logs, systems and state).
- Maintaining strict confidentiality about incident details (see Section 10).
- Completing cybersecurity awareness training.

### 4.2 Department Chair

- Authorizes departmental decisions during incident response (e.g., resource reallocation and prioritization).
- Receives status briefings from the Primary IRL.
- Coordinates with other university leadership as needed.
- Approves external communications related to incidents, if any.

### 4.3 Primary IRL

- First point of contact for all incident reports within ${d.department_abbr}.
- Performs initial technical triage to classify severity ([Section 5](#incident-severity-classification)).
- Reports to the ${d.university_name} ISO immediately upon receiving a credible report.
- Joins the ISO-led incident room or equivalent communications channel(s) and represents ${d.department_abbr}'s technical interests.
- Manages group access, can emergency-revoke.
- Coordinates with OIT Service Desk for account lockouts, password resets, and device isolation.
- Directs preservation of departmental logs and system evidence.
- Leads ${d.department_abbr}'s internal technical response under ISO guidance.
- Documents all actions taken and timeline of events.

### 4.4 Secondary IRL

- Assumes all Primary IRL responsibilities if the Primary is unavailable.
- Manages administrative and operational continuity during incidents.
- Coordinates with ${d.school_name} (${schoolAbbr(d.school_name)}) administration.
- Manages personnel notifications and logistics.
- Tracks financial and operational impact of incidents.
- Supports compliance documentation and regulatory notifications.

### 4.5 Administrative Staff

- Report any suspicious communications, system behaviors, or physical security concerns.
- Assist with logistics during incident response (scheduling, facility access, communications).
- Assesses potential impact on student records, academic data (FERPA), sponsored research data and funded projects.
- Assist with communications to affected parties.
- Notifies investigators and funding agencies.
- Documents any impact on deliverables or timelines.

### 4.6 Research Staff and Postdoctoral Researchers

- Redirect public inquiries to the appropriate IRL.
- Report any anomalies in research computing environments immediately.
- Assist with identifying the scope of compromised research data, if applicable.
- Follow IRL instructions regarding isolation of research workstations or data.

### 4.7 Faculty

All faculty are responsible for:

- Reporting suspected incidents to an IRL.
- Cooperating with account-level remediation (password changes, etc).
- Advising on the sensitivity and classification of research data in their groups.
- Notifying their research group members of any instructions from the IRL.

---

## 5. Incident Severity Classification

${d.department_abbr} uses a four-level severity classification aligned with ${d.university_name} ISO standards. The Primary IRL performs the initial classification; the ISO may reclassify after its own assessment.

### Severity 1 — Critical

**Definition:** Active, confirmed compromise with broad impact or involving highly sensitive data.

**Examples:**
- Ransomware detected on ${d.department_abbr} systems.
- Confirmed unauthorized access to Confidential or Restricted data (student records, SSNs, financial data, export-controlled research).
- Compromise of multiple faculty or staff accounts.
- Active attacker presence on departmental infrastructure.

**Response:** Report to ISO ${srt.critical.toLowerCase()}. Primary IRL joins ISO incident room.

### Severity 2 — High

**Definition:** Confirmed or highly probable compromise with limited scope, or involving sensitive systems.

**Examples:**
- Single compromised account with evidence of unauthorized use.
- Malware confirmed on a departmental device.
- Unauthorized access to ${fileSystems}, Research Computing, or Library systems (${d.research_computing}) containing research or personnel data.
- Phishing campaign specifically targeting ${d.department_abbr} members.
- Compromise of the ${d.department_abbr} websites (${d.website_url}).

**Response:** Report to ISO **${srt.high.toLowerCase()}**. Primary IRL prepares to join incident room if escalated.

### Severity 3 — Medium

**Definition:** Suspected or attempted security event with no confirmed compromise.

**Examples:**
- Suspicious emails received by multiple ${d.department_abbr} members.
- Unusual account activity.
- Unauthorized physical access to server areas.
- Suspicious behavior of a departmental device.

**Response:** Report to Primary IRL **${srt.medium.toLowerCase()}**. IRL triages and reports to ISO as appropriate.

### Severity 4 — Low / Informational

**Definition:** Minor events, policy violations, or observations that do not indicate active compromise.

**Examples:**
- Generic phishing email.
- User accidentally visiting a suspicious website.
- Lost or misplaced encrypted device.
- Minor policy non-compliance.

**Response time:** Report to Primary IRL **${srt.low.toLowerCase()}**. IRL logs and monitors for patterns.

---

## 6. Incident Identification — How to Recognize an Incident

Cybersecurity incidents are not always obvious. Below are indicators organized for both technical and non-technical staff.

### 6.1 For Everyone (No Technical Background Required)

**You should report if you observe any of the following:**

- **Unexpected emails:** You receive email from a colleague that seems out of character, contains unexpected attachments or links, or asks you to take unusual actions (wire money, share passwords, click links urgently)
- **Account anomalies:** You are locked out of your account, see login notifications from locations you have not visited, or notice emails in your Sent folder that you did not write
- **Strange system behavior:** Your computer is unusually slow, displays unfamiliar pop-up windows, has programs you did not install, or your web browser redirects to unexpected sites
- **Requests for sensitive information:** Anyone — by email, phone, in person, or via chat — asks for your password, credentials, Social Security Number, or other sensitive data, even if they claim to be from IT
- **Missing or altered files:** Documents on shared drives are missing, renamed, encrypted, or modified without explanation
- **Physical security concerns:** Unfamiliar individuals in restricted areas of ${d.location.split(',')[0]}, unlocked offices with sensitive materials exposed, or evidence of tampering with workstations or network equipment
- **Suspicious phone calls or texts:** Calls claiming to be from IT support, law enforcement, or vendors asking for access credentials or remote access to your computer

### 6.2 For Technical Staff and Researchers

**In addition to the above, report if you observe:**

- Unexpected processes, services, or network connections on workstations or servers
- Unfamiliar user accounts, especially privileged accounts, appearing in systems
- Unexpected changes to system configurations, firewall rules, or scheduled tasks
- Alerts or anomalies from endpoint protection, intrusion detection, or monitoring tools
- Unexpected data transfers or large outbound data flows
- Changes to website content on ${d.website_url} or ${d.intranet_url} that were not authorized
- Unexpected additions or changes to the ${d.ad_group_name} Active Directory group
- Database or log anomalies suggesting unauthorized queries or data access
- Failed authentication attempts at volumes suggesting a brute-force attack
- Unauthorized or unexpected changes to ${d.cms_platform} configurations, user roles, or webform submissions

---

## 7. Incident Reporting Procedures

### Step 1: Recognize and Stop

If you suspect an incident, **stop what you are doing** on the affected system. Do not try to fix the problem, delete files, or investigate further. If the issue involves a workstation, leave it powered on — do not shut it down (shutting down can destroy volatile evidence in memory).

### Step 2: Report to the ${d.department_abbr} IRL

Contact the Primary IRL immediately:

| Priority | Contact | Method |
|----------|---------|--------|
| **First** | Primary IRL | In person (${d.location.split(',')[0]}), phone, or email |
| **Second** | Secondary IRL | In person (${d.location.split(',')[0]}), phone, or email |
| **If neither available** | ${d.university_name} ISO directly | Email: ${d.iso_email}, Phone: ${d.iso_phone}, or ${d.university_name} Service Portal |

When reporting, provide as much of the following as you can. Do not delay your report because you lack some details:

- **Your name and contact information**
- **Date and time** you noticed the issue
- **What happened** — describe what you observed in plain language
- **What system(s) are affected** — your workstation, a shared drive, email, a specific website, etc.
- **What actions you have taken**, if any (e.g., "I clicked a link in an email," "I changed my password")
- **Whether anyone else may be affected** — did other people receive the same email? Do others share the affected system?

### Step 3: IRL Initial Triage

Upon receiving a report, the Primary IRL will:

1. Assign an initial severity level (Section 5)
2. Report to the ${d.university_name} ISO per the required timeframes
3. Take immediate containment actions as appropriate and directed, which may include:
   - Requesting OIT Service Desk lock a compromised account
   - Removing a compromised device from the network
   - Revoking access from the ${d.ad_group_name} Active Directory group
   - Preserving relevant logs from departmental systems
4. Notify the Department Chair for Severity 1 or 2 incidents
5. Begin the department's incident log documenting all actions and communications

### Step 4: ISO Notification and Handoff

The Primary IRL notifies the ${d.university_name} ISO with:

- Incident description and timeline
- Affected systems and data (including data classification if known)
- Number of users potentially impacted
- Containment actions already taken
- ${d.department_abbr}'s point of contact for continued coordination

**The ISO assumes authority over the investigation and response upon notification.** ${d.department_abbr} acts in a supporting role from this point forward.

---

## 8. Unit-Level Support and Escalation

### 8.1 Joining the ISO-Led Incident Room

**When the ${d.university_name} ISO establishes a formal incident room (virtual or physical), the affected ${d.department_abbr} unit is required to participate.** This is not optional.

- The **Primary IRL** (or Secondary if Primary is unavailable) **must join the ISO-led incident room** as the ${d.department_abbr} representative
- The Department Chair or designee joins for Severity 1 incidents
- Additional ${d.department_abbr} technical or administrative staff join as requested by the ISO
- The IRL remains in the incident room for the duration of the incident, providing departmental context, executing containment actions within ${d.department_abbr}'s scope, and relaying ISO instructions to ${d.department_abbr} personnel

### 8.2 What ${d.department_abbr} Provides During an Incident

Under ISO direction, ${d.department_abbr} supports the response by:

- **Access control actions:** Disabling accounts, revoking Active Directory memberships, resetting credentials
- **System isolation:** Disconnecting affected workstations or systems from the network
- **Evidence preservation:** Maintaining and providing logs from departmental systems (${d.cms_platform} logs, file access logs, email logs)
- **Impact assessment:** Identifying what data was on affected systems, its classification, and who had access
- **Personnel coordination:** Ensuring affected individuals are available for interviews and follow-up, and that operational continuity is maintained
- **Physical security:** Securing ${d.location.split(',')[0]} areas if physical access is part of the incident

---

## 9. Communication Protocols

### 9.1 During an Active Incident

- **All external communications** about an incident (to media, parents, peer institutions, vendors) are handled by the ${d.university_name} ISO and University Communications. No ${d.department_abbr} member may issue external statements.
- **Internal ${d.department_abbr} communications** are issued only by the Primary IRL or Department Chair. Do not discuss incident details with colleagues unless they have a demonstrated need to know.
- **Communication channels:** Use ${d.university_name} email for routine incident coordination. For Severity 1 incidents, use phone calls or in-person communication for sensitive details — do not send highly sensitive specifics over email or chat unless directed by the ISO.
- **Status updates:** The Primary IRL provides periodic status updates to the Department Chair and to affected ${d.department_abbr} staff as appropriate and as cleared by the ISO.

### 9.2 Notifying Affected Individuals

If an incident compromises personal data of students, staff, or faculty:

- The ISO, in coordination with the Office of General Counsel, determines notification obligations.${admins ? `\n- ${d.department_abbr} Program Administrators (${admins}) assist with student notifications.` : ''}
- The Department Manager${d.department_manager ? ` (${d.department_manager})` : ''} assists with staff and faculty notifications.
- **No notifications are sent without ISO and legal counsel approval**

### 9.3 Third Parties and Vendors

- If the incident involves a third-party service (Google Drive, Dropbox, Zoom), the ISO coordinates vendor notification.
- If sponsored research data is involved, the Grants Manager${d.grants_manager ? ` (${d.grants_manager})` : ''} and the relevant PI coordinate with the Office of Research and Project Administration (ORPA).
- The IRL does not contact vendors independently during an incident without ISO authorization.

---

## 10. Confidentiality Requirements

**All information related to a cybersecurity incident is ${d.classification_level}.**

### 10.1 Obligations

All ${d.department_abbr} members who become aware of a cybersecurity incident — whether as the reporter, a responder, or someone briefed during the response — are bound by the following:

1. **Do not discuss** incident details with anyone who does not have a direct, authorized role in the response. This includes family members, colleagues not involved in the incident, students, external collaborators, and social media contacts.
2. **Do not post** about the incident on social media, personal blogs, mailing lists, or any public or semi-public forum.
3. **Do not share** technical details of the incident (attack vectors, vulnerabilities, affected systems, compromised data) with anyone outside the incident response team without explicit ISO authorization.
4. **Do not speculate** publicly or privately about the source, motive, or scope of the incident.
5. **Protect incident documentation.** Reports, logs, emails, and notes related to the incident must be stored securely and shared only through approved channels. Do not store incident documentation on personal devices or consumer cloud services.
6. **Comply with legal holds.** If instructed by the ISO or the Office of General Counsel, preserve all relevant communications and data — do not delete anything.

### 10.2 Rationale

Confidentiality protections exist to:

- Protect the integrity of the investigation (premature disclosure can tip off an attacker or compromise evidence)
- Comply with legal and regulatory obligations (FERPA, N.J. breach notification law, sponsored research agreements)
- Protect the privacy of individuals whose data may be involved
- Prevent reputational harm to the department and university
- Maintain trust with funding agencies, research partners, and the broader academic community

### 10.3 Violations

Unauthorized disclosure of incident information may result in disciplinary action under ${d.university_name} policies, up to and including termination. Violations involving legally protected data may also carry legal consequences. These and other undocumented consequences of violations are outside the scope of this document.

---

## 11. Post-Incident Review

After every Severity 1 or 2 incident (and at the Primary IRL's discretion for lower severities), ${d.department_abbr} conducts a post-incident review:

### 11.1 Timeline

- **Within ${d.post_incident_report_days} business days** of incident closure: Primary IRL completes the ${d.department_abbr} incident report
- **Within ${d.post_incident_review_days} business days:** Post-incident review meeting held with relevant ${d.department_abbr} staff (attendance determined by the IRL and Department Chair)
- **Within ${d.lessons_learned_days} business days:** Lessons-learned summary and action items documented and filed

### 11.2 Review Content

- Chronological timeline of events (detection through resolution)
- What worked well in the response
- What could be improved (detection, reporting speed, communication, containment)
- Root cause analysis (to the extent known and shared by ISO)
- Action items with owners and deadlines (e.g., additional training, configuration changes, policy updates)
- Whether this CIRP needs revision based on lessons learned

### 11.3 Continuous Improvement

Action items from post-incident reviews are tracked by the Primary IRL and reported to the Department Chair monthly until resolved. Recurring themes across incidents inform annual updates to this CIRP and to ${d.department_abbr}'s security posture.

---

## 12. Training and Awareness

### 12.1 Required Training

| Audience | Training | Frequency |
|----------|----------|-----------|
| All ${d.department_abbr} personnel | ${d.university_name} cybersecurity awareness training | ${d.training_schedule.awareness_training} |
| All ${d.department_abbr} personnel | Review of this CIRP (Sections 2, 6, 7, and 10 at minimum) | ${d.training_schedule.cirp_review} |
| Administrative staff | Phishing identification and reporting drill | ${d.training_schedule.phishing_drills} |
| Faculty and researchers | Research data protection and classification | ${d.training_schedule.data_protection} |

### 12.2 Awareness Activities

- **New hire orientation:** Every new ${d.department_abbr} employee (faculty, staff, researcher) receives a copy of and access this CIRP and a briefing on reporting procedures.
- **Quarterly reminders:** All ${d.department_abbr} personnel receive reminders via email, covering seasonal threats, recent university-wide alerts, and a reminder of how to report.
- **Simulated phishing:** ${d.department_abbr} participates in university-wide simulated phishing campaigns; results are used to identify staff who would benefit from additional training.

---

## 13. Plan Maintenance

| Activity | Responsibility | Frequency |
|----------|---------------|-----------|
| Full CIRP review and update | Primary IRL + Department Chair | ${d.maintenance_schedule.full_review} |
| Contact information verification | Primary IRL | ${d.maintenance_schedule.contact_verification} |
| Alignment check with ${d.university_name} ISO policies | Primary IRL | ${d.maintenance_schedule.iso_alignment} |
| Distribution to new hires | Secondary IRL / Dept. onboarding coordinator | Upon hire |
| Approval of revisions | Department Chair | As needed |

**Version History**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | ${effectiveDate} | ${d.version_author || d.primary_irl_name + ' / ' + d.department_abbr} | Initial release |

---

*This document is the property of the ${d.department_name}, ${d.university_name}. It is classified as ${d.classification_level} and must not be distributed outside the department without the written authorization of the Department Chair.*
`;
}

/** Try to extract a school abbreviation from its full name */
function schoolAbbr(name) {
  if (!name) return '';
  const match = name.match(/\(([^)]+)\)/);
  if (match) return match[1];
  return name.split(/\s+/).filter(w => w.length > 2 && w[0] === w[0].toUpperCase()).map(w => w[0]).join('');
}
