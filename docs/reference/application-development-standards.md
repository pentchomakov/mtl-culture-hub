---
title: "Application Development — General Standards & Guides"
source: https://github.com/compassanalytics/compass-standards/blob/176af68a7bea4e470dfac9fb88e93aa658c3057e/standards/application-development/general/application-development-standards.md
repo: compassanalytics/compass-standards
path: standards/application-development/general/application-development-standards.md
ref: 176af68a7bea4e470dfac9fb88e93aa658c3057e
retrieved: '2026-11-22'
docType: reference
group: Reference
---

> **Mirrored from `compassanalytics/compass-standards` at `176af68`, retrieved 2026-11-22.** The standard is the source of truth; edit it there and run `/standards-sync`. Reference, not evidence: cite it for how Compass builds things, never as a fact about the client.
# Application Development — General Standards & Guides

> **Status:** Draft
> **Owner:** Ethan Pirso
> **Last updated:** 2026-07-21
> **Source:** [Application Development Best Practices and Standards](../../../Compass%20Analytics/Compass%20Analytics%20Home/Engineering%20&%20IT/Best%20Practices,%20Standards%20and%20Guides/Application%20Development%20Best%20Practices%20and%20Standards.md) _(imported Confluence mirror)_
> **Applies to:** Application Development (Full Stack) — platform-neutral process, ways of working, architecture, and delivery

---

## Table of Contents

- [1. Overview](#1-overview)
- [2. App Building Process](#2-app-building-process)
- [3. Platforms & Architecture](#3-platforms--architecture)
- [4. Ways of Working](#4-ways-of-working)
- [5. Coding Standards](#5-coding-standards)
- [6. Data Engineering for Apps](#6-data-engineering-for-apps)
- [7. Deployment and Infrastructure](#7-deployment-and-infrastructure)
- [8. Internal vs. Client Apps](#8-internal-vs-client-apps)
- [9. Additional Resources](#9-additional-resources)
- [10. Reference Examples](#10-reference-examples)
- [Related Standards](#related-standards)
- [Change Log](#change-log)

---

## 1. Overview

Application building standards are essential for ensuring that systems, processes, and workflows are consistent, efficient, and scalable. Well-defined standards allow teams to build robust, maintainable, and high-quality applications that support business goals, reduce operational risks, and deliver high-value outcomes. However, these standards only provide benefits when they are consistently adhered to across the organization. Alignment and commitment from all team members are critical to ensuring their successful application.

### 1.1 Benefits of Standards

**Consistency Across the Organization.** Everyone follows the same practices, conventions, and tools, reducing errors and ensuring smoother handoffs.

**High Code Quality and Maintainability.** Standards promote modularity, reusability, and proper documentation, making systems easier to update and extend.

**Reliability and Quality.** Defined validation, logging, and error-handling practices ensure applications behave predictably and accurately.

**Scalability.** Processes and architectures are designed to handle growth without rework or instability.

**Onboarding and Knowledge Transfer.** New contributors can quickly align with established practices, reducing ramp-up time.

**Automation and Continuous Improvement.** Standards support reliable CI/CD pipelines, automated testing, and reproducible builds.

**Cost Efficiency.** Standardized use of infrastructure and cloud resources avoids waste and minimizes costs.

### 1.2 Scope of Document

This document defines the standards and practices for building, maintaining, and operating applications across the organization. It establishes a unified approach to development workflows, platform usage, architecture, quality expectations, and delivery processes. The goal is to ensure that all teams build applications in a consistent, scalable, and maintainable way.

The standards apply to applications developed on approved platforms, including Dataiku, Databricks, AWS/Azure cloud services, and other sanctioned application frameworks. For these platforms, the document outlines how they should be used, when they are appropriate, and the required development lifecycle—from requirement gathering and design through implementation, testing, and deployment.

When a new application is being built on an included platform, teams are expected to follow the standards described in each section. This ensures predictable development cycles, aligned design practices, and proper integration with organizational tooling such as CI/CD pipelines, repositories, and operational monitoring.

If an application must be developed outside the platforms covered here (e.g., an on-premises or locally hosted solution), additional evaluation is required. In these cases, the team must work with tech leads or platform owners to confirm:

- The rationale for using an unlisted environment
- Security, supportability, and architectural impacts
- Deployment and maintenance expectations
- Whether existing standards can be adapted or extended

The document serves as the central reference for:

- Which platforms to use
- How to follow the required workflows
- How to engage stakeholders and technical reviewers
- How to ensure an application meets organizational quality and operational readiness standards

Overall, these guidelines ensure that applications—regardless of platform—are built responsibly, sustainably, and in alignment with organizational goals.

## 2. App Building Process

This section describes the universal Software Development Life Cycle (SDLC) for building applications at Compass, independent of platform. Every application follows these phases, though the specific implementation details vary based on the platform and project context.

![app-building-lifecycle.png](assets/7152c462-237f-44f1-838b-8e8c331c958b.png)

### 2.1 Requirements & Discovery

Every application begins with understanding what needs to be built and why. Requirements gathering ensures the team has a clear picture of business objectives, user needs, and success criteria before design work begins.

**User Requirements Specification (URS).** Requirements should be documented as a URS, typically in Confluence. The initial URS often comes from the client, describing their needs and expectations. The Compass team then reviews, refines, and proposes adjustments through collaborative discussion. This back-and-forth process ensures alignment before committing to scope.

**Ownership.** Tech Leads and Engagement Managers (typically a Partner) own the requirements gathering process. They are responsible for ensuring requirements are complete, feasible, and properly scoped.

**Sign-off.** Before development begins, stakeholders and the Tech Lead or Engagement Manager must agree on the final requirements and scope. This agreement serves as the baseline for the project and helps prevent scope creep during implementation.

**Key outputs from this phase:**

- Documented URS in Confluence
- Agreed scope and success criteria
- Identified constraints (technical, timeline, budget)
- Stakeholder sign-off

**URS Document Template.** The URS is typically maintained as an Excel workbook with two sheets: a Document Overview and a Requirements Table.

*Document Overview Sheet:*

|  Field                          |  Value                                                             |
|:--------------------------------|:-------------------------------------------------------------------|
| **Document Title**              | [Project Name] – Comprehensive Requirements                        |
| **Version**                     | 1                                                                  |
| **Date**                        | [YYYY-MM-DD]                                                       |
| **Tech Lead**                   | [Name]                                                             |
| **Business Owner**              | [Name]                                                             |
|                                 |                                                                    |
| **INTRODUCTION**                |                                                                    |
| Purpose                         | [Describe the purpose of the application]                          |
| Scope                           | [Define what is included and excluded from scope]                  |
| Background                      | [Provide context on current state and why this is needed]          |
|                                 |                                                                    |
| **SYSTEM OVERVIEW**             |                                                                    |
| Overview                        | [High-level description of the system architecture and components] |
| Architecture Diagram            | [Include or reference an architecture diagram if applicable]       |
|                                 |                                                                    |
| **CONSTRAINTS**                 |                                                                    |
| Constraint                      | [Detail technical, timeline, or resource constraints]              |
|                                 |                                                                    |
| **ACCEPTANCE CRITERIA SUMMARY** |                                                                    |
| Criteria                        | [Define the overall go-live acceptance conditions]                 |
|                                 |                                                                    |
| **APPROVAL SIGN-OFF**           |                                                                    |

|  Role           |  Name    |  Signature    |  Date    |
|:----------------|:---------|:--------------|:---------|
| Project Manager | [Name]   |               |          |
| Partner         | [Name]   |               |          |
| Tech Lead       | [Name]   |               |          |
| Business Owner  | [Name]   |               |          |

*Requirements Table Sheet:*

|  Requirement       |  Description               |  Domain                        |  Effort (Days)    |
|:-------------------|:---------------------------|:-------------------------------|:------------------|
| [Requirement name] | [Describe the requirement] | [UI/UX, Backend, or Analytics] | [Number]          |

*Example:*

|  Requirement        |  Description                |  Domain    |    Effort (Days)  |
|:--------------------|:----------------------------|:-----------|------------------:|
| User Authentication | Users can log in via SSO    | Backend    |                3  |
| Dashboard View      | Display KPIs in card layout | UI/UX      |                5  |
| Data Export         | Export filtered data to CSV | Analytics  |                2  |

The **Domain** column categorizes requirements by technical area: UI/UX (frontend design and interactions), Backend (APIs, services, data layer), or Analytics (data processing, reports, ML models). This helps teams estimate effort and assign work appropriately.

These are the minimum required fields for a URS. Depending on project complexity and client needs, additional columns may be required such as Requirement ID, Priority, Application Version, Status, or Acceptance Criteria per requirement.

### 2.2 Design

Once requirements are validated, design work begins. The goal is to establish a clear, shared understanding of what will be built before writing code.

**UI/UX Design.** All application user interface work is designed in Figma. Designers create wireframes and mockups that visualize user flows, interactions, and visual patterns. For process mapping or system diagramming, Miro is available as an alternative tool.

**Component Library.** All Compass applications should use the Shadcn-based component library, which forms the foundation for the future True North design system. This ensures visual consistency across applications and reduces design-to-development friction.

**Design Ownership.** Jerry Zhu owns all design and UI/UX standards at Compass. While Tech Leads orchestrate the design review process and ensure technical feasibility, final design decisions align with established design standards.

**Approval Flow.** Stakeholders submit feature requests, designers create wireframes, and the team reviews for sign-off. Design approval is required before engineering begins implementation. This gate prevents wasted effort on features that don't meet stakeholder expectations.

For the complete designer-developer collaboration workflow, including how to use Figma annotations, comments, and prototypes during handoff, see [Design Driven Development](coding-standards.md#23-design-driven-development).

### 2.3 Implementation

With approved designs in hand, development begins. Implementation involves translating designs into working code while adhering to coding standards and platform constraints.

**Team Structure.** Every application project should have at least one full-stack engineer to unify frontend and backend work. Depending on project scope, timeline, and staffing, teams may include a designer working with a full-stack developer, or more separation with dedicated frontend and backend engineers. Data engineering work is often completed before application development begins, though backend developers sometimes collaborate on or handle data engineering tasks themselves.

**Coding Standards.** All implementation work follows the coding standards defined in [Coding Standards](coding-standards.md). Frontend developers should follow the Design Driven Development workflow in [Design Driven Development](coding-standards.md#23-design-driven-development), which prescribes how to translate Figma designs into code using AI-assisted tools. Backend development is requirements-driven, following the URS and [Backend Standards](coding-standards.md#4-backend-standards) standards. This includes language conventions, framework patterns, security practices, and testing expectations.

**AI-Assisted Development.** Claude Code is a supported workflow for implementation. Developers may use AI assistance for coding tasks while remaining fully accountable for all code produced. See [AI-Driven Development](#46-ai-driven-development) for standards on responsible AI-assisted development.

**Platform Integration.** Implementation must account for platform-specific constraints and patterns. See [Platforms & Architecture](#3-platforms--architecture) for guidance on building for Dataiku, Databricks, cloud, or on-premises environments.

### 2.4 Testing & Validation

Testing ensures the application meets requirements and behaves correctly before deployment. This phase includes both automated testing and stakeholder validation.

**Automated Testing.** Developers write unit, integration, and end-to-end tests as part of implementation. See [Testing Standards](coding-standards.md#5-testing-standards) for testing standards, frameworks, and expectations.

**Stakeholder Validation.** Before go-live, stakeholders have the opportunity to validate the application in a QA environment. This may include demos, pilot programs, or early user onboarding. While Compass performs internal quality assurance, clients are responsible for their own QA and should report bugs as soon as they are discovered.

**Bug Resolution.** Issues discovered during testing are addressed before deployment. Critical bugs block deployment; lower-priority issues may be tracked for post-launch resolution.

### 2.5 Deployment

Deployment promotes the application from development through to production. The specific process varies by platform, but the principles remain consistent.

**Environment Progression.** Applications typically move through environments before reaching production. Internal Compass projects often use a simple dev → prod path. Client engagements follow the client's environment structure, commonly dev → QA → prod, with migration requests and testing gates between stages. See [Environment Management](#72-environment-management) for environment management details.

**Deployment Authority.** Developers handle deployments directly, as they are closest to the code. Tech Leads provide oversight but are not typically hands-on with deployment execution.

**Communication.** Email is the standard protocol for communicating releases to clients. Internal coordination happens through Microsoft Teams project group chats.

**Platform-Specific Processes.** Each platform has its own deployment patterns. See [Deployment and Infrastructure](#7-deployment-and-infrastructure) for Dataiku, Databricks, cloud, and on-premises deployment guidance.

### 2.6 Iteration & Maintenance

Applications are living systems. After initial deployment, they continue to evolve through feedback, bug fixes, and feature enhancements.

**Feedback Collection.** Post-deployment feedback comes through various channels depending on the client and project. Common approaches include post-mortem meetings after go-live, regular project check-ins with stakeholders, and ongoing user feedback. Engagement Managers schedule and facilitate these touchpoints.

**Iterative Development.** Many applications are built and released iteratively, with features rolling out as they are completed rather than in a single big-bang release. Project meetings serve as opportunities to review progress, gather feedback, and adjust priorities.

**Bug Fixes and Enhancements.** Issues discovered post-deployment are triaged and addressed based on severity and business impact. Feature requests follow the process defined in [Feature Request Process](#42-feature-request-process).

**Ongoing Maintenance.** Applications require ongoing attention even after active development slows. This includes dependency updates, security patches, and occasional enhancements. Teams should factor maintenance into long-term planning.

## 3. Platforms & Architecture

Compass builds applications on several platforms depending on client infrastructure, project requirements, and data engineering needs. This section provides guidance on when to use each platform, how they work, and the architectural patterns teams should follow.

The general principle is to work with what the client has. If the client uses Dataiku, build on Dataiku. If they use Databricks, build on Databricks. If they only have cloud infrastructure without a data platform, cloud-native applications are appropriate. On-premises deployments are rare and require special consultation.


> Per-platform overviews (Dataiku, Databricks, Cloud) live in the platform standards linked under [Related Standards](#related-standards). On-premises and platform selection are covered here.

### 3.1 On-Premises

On-premises deployments are not recommended and are outside Compass's standard delivery model. However, some client requirements—particularly around compliance, data residency, or regulatory constraints—may necessitate on-prem solutions.

**When On-Prem is Required.** On-premises deployments typically arise from strict data residency requirements, regulatory compliance that prohibits cloud hosting, or client IT policies that mandate internal infrastructure. These situations are rare but do occur in highly regulated industries.

**Consultation Required.** If a project requires on-premises deployment, teams must consult with Pentcho Tchomakov (CTO) before proceeding. This consultation ensures proper architectural guidance, risk assessment, and alignment with Compass capabilities.

**Key Constraints.** On-prem deployments introduce operational complexity that cloud and platform solutions handle automatically, including infrastructure provisioning, security patching, backup and recovery, and monitoring. Teams should expect longer timelines and additional planning for on-prem projects.

### 3.2 Choosing the Right Platform

![platform-decision-flow.png](assets/c9864eaa-c772-4efa-88ac-8c41c29af76b.png)

Platform selection should follow a straightforward principle: work with what the client has. The decision is rarely about which platform is technically superior—it's about leveraging existing infrastructure to deliver value efficiently.

**Decision Framework.** When evaluating platforms, consider these factors in order of priority:

1. **Client Infrastructure.** What platforms does the client already have? If they have Dataiku, use Dataiku. If they have Databricks, use Databricks. Avoid introducing new platforms unless there's a compelling reason.
2. **Data Engineering Requirements.** Applications with deep data lake integration or heavy ML components benefit from Dataiku or Databricks. If the project involves minimal data engineering or no existing lake, cloud may be appropriate.
3. **Application Type.** User-facing analytics applications with complex UIs work well on Dataiku. Backend-only services like FastMCP servers or API-only applications may be better suited for Databricks Apps. Custom architectures with specific scalability needs point toward cloud.
4. **Team Capabilities.** Consider the team's familiarity with each platform. Learning curves affect delivery timelines.

**Who Makes the Decision.** Platform constraints are typically established during scoping and documented in the Statement of Work (SOW). The Partner responsible for the engagement communicates these constraints to the Tech Lead, who then works within the available and preferred platforms. Tech Leads and Engagement Managers may make recommendations, but the client's existing infrastructure and preferences ultimately drive the choice.

## 4. Ways of Working

This section defines how teams collaborate, plan, and deliver work.

### 4.1 GitHub

Below is the recommended GitHub workflow for building, reviewing, and maintaining application code. This approach ensures predictable releases, high code quality, and effective collaboration across teams.

#### 4.1.1 Branching Strategy

A clear branching strategy reduces merge conflicts, improves release reliability, and helps developers understand where work belongs.

**Main branch (**`main`). Always stable and deployable. Represents production-ready code.

**Development branch (**`dev`). Primary integration branch. All feature work should merge into `dev` first to ensure changes integrate smoothly before being promoted to `main`.

**Feature branches (**`feature/<name>`). Used for building new functionality off `dev` branches. Keeps work isolated and easy to review.

**Bugfix branches (**`bugfix/<name>`). Handles non-critical issues discovered during development.

**Hotfix branches (**`hotfix/<name>`). Reserved for urgent production fixes that branch off `main`.

**Release branches (**`release/<version>`). Optional. Used for final stabilization and testing before merging into `main`.

**Principles:**

- Branches should stay short-lived and focused to prevent drift and reduce merge complexity
- Only one purpose per branch to make PRs small and reviewable
- Sync frequently with `dev` (and occasionally `main`) to reduce conflicts
- `main` stays production-ready; `dev` stays integration-ready

#### 4.1.2 Pull Requests

Pull Requests (PRs) are the primary mechanism for code discussion, quality control, and knowledge sharing.

**Flow:**

1. Branch off `dev` (or `main` only for hotfixes)
2. Push changes early and often to avoid large, risky merges
3. Open a PR into `dev` (or into `main` for release/hotfix work)
4. Provide a clear summary explaining what changed, why it changed, and how to test it
5. Link any related issues or tickets for traceability
6. Ensure all CI checks (tests, linting, builds) pass
7. Obtain required approvals
8. Merge the PR and delete the branch after completion

**PR Quality Standards:**

- Keep PRs small, focused, and easy to review
- Write clear commit messages and maintain readable diffs
- Do not include unrelated changes or unplanned refactors
- All automated checks must pass before merging

#### 4.1.3 Code Review Expectations

Code reviews strengthen code quality, improve shared understanding, and support consistent engineering practices.

**For Developers:**

- Review PRs promptly and provide constructive feedback
- Validate logic, naming, readability, potential edge cases, and appropriate test coverage
- Ensure changes align with architecture and established coding patterns
- Ask questions rather than assuming intent
- Request clarification when a design or implementation choice is unclear
- Suggest improvements when beneficial, focusing on clarity and maintainability
- Tag your Tech Lead and/or Engagement Manager in PRs for "Review Requested"

**For Tech Leads:**

- Maintain and refine the branching and PR workflow to keep engineering velocity high
- Ensure consistent code quality across the codebase
- Guide architectural alignment across PRs
- Coordinate merges for major or cross-team features
- Protect `main` and `dev` with required review and CI rules
- Monitor review throughput and prevent bottlenecks
- Unblock developers and provide direction when needed

#### 4.1.4 Commit Best Practices

Clear, intentional commits make the history understandable and simplify debugging.

**Guidelines:**

- Use action-oriented messages that describe intent, not just changes

  - Examples: `Add authentication middleware`, `Fix race condition in scheduler`
- Group logically related changes in a single commit
- Do not commit secrets, generated files, or large binaries
- Write commits with future readers in mind — clarity is key

#### 4.1.5 Repository Structure & Hygiene

A clean, predictable repository structure improves onboarding and prevents confusion.

**Guidelines:**

- Maintain a logical folder structure that reflects the architecture
- Include a strong README with setup instructions, test commands, and deployment information
- Add a CONTRIBUTING.md for teams with multiple collaborators
- Use CI to automate testing, linting, and build validation
- Keep `.gitignore` strict to prevent noise in the repo
- Do not store generated or compiled artifacts

#### 4.1.6 Merge Policies

Consistent merge policies ensure high-quality, stable code.

**Guidelines:**

- Protect `main` and `dev` with required reviews and CI checks
- Require at least one approval (or more for sensitive systems)
- Do not allow merges when checks fail
- Prefer squash merges to keep commit history clean and easy to follow
- Use release branches for staging and validation before production releases

#### 4.1.7 Documentation Expectations

Good documentation reduces friction, prevents confusion, and supports long-term maintainability.

Update documentation when changes affect:

- APIs
- Configurations
- Environment variables
- Architecture or system interactions
- Developer or operational workflows

Documentation should stay aligned with current code to avoid misinformation.

#### 4.1.8 Team Collaboration & Workflow

Smooth collaboration reduces friction and helps the team deliver consistently.

**Guidelines:**

- Communicate early when changes affect other components or teams
- Use draft PRs to gather early feedback and validate direction
- Sync frequently with `dev` to avoid large merges and conflicts
- Support teammates by reviewing their work, not just submitting your own
- Flag large or complex changes early to ensure alignment

#### 4.1.9 Summary Checklist

**Developers:**

- Small, focused PRs
- Clear, meaningful commits
- Updated documentation
- Passing CI checks
- Respectful, thoughtful code reviews

**Tech Leads:**

- Own and refine the workflow
- Maintain release and branch health
- Enforce quality and architectural standards
- Ensure CI + branch protections remain effective
- Coordinate work across teams when necessary

### 4.2 Feature Request Process

The feature request process ensures that new ideas are evaluated, prioritized, and implemented in a structured and predictable way. This helps maintain alignment with stakeholder needs while keeping engineering focused on the most valuable work.

![feature-request-process.png](assets/ea85b2b0-e3d4-433d-a159-3a76ada73c08.png)

**Source of Requests.** Feature requests originate from stakeholders such as product owners, engagement managers, business partners, or end users. These requests describe new functionality, enhancements, or changes that support business objectives.

**Validation and Prioritization.** All feature requests must be reviewed by a Tech Lead or Engagement Manager before they can be added to a sprint or included in the active project workstream. This validation step confirms feasibility, scope, alignment with the roadmap, and the expected impact. Validated requests are prioritized and scheduled as part of an upcoming sprint or added to the project's current epoch.

**Design Phase.** Before implementation begins, every approved feature starts with a design. Design work is typically done in Figma or a similar tool. The goal is to establish a clear, shared understanding of user flow, UI patterns, interactions, and expectations. The design must be reviewed and validated with stakeholders to ensure correctness and reduce rework. Approval of the design is required before engineering begins development.

**Implementation.** Once the design is approved, development begins. Depending on the feature, work may be handled by a full-stack engineer, or a front-end engineer and a back-end engineer working together. Implementation includes integration with existing systems, adherence to standards, and alignment with application architecture.

**Agile Development Lifecycle Alignment.** The overall process follows an agile loop: gather requirements → design → implement → test → deploy and/or iterate. This ensures continuous feedback, transparency, and the ability to refine features through subsequent iterations.

**End-to-End Flow Summary:**

1. Stakeholder submits feature request
2. Tech Lead or Engagement Manager validates and prioritizes
3. Request is added to sprint or project epoch
4. Design is created (Figma)
5. Stakeholders validate and approve the design
6. Engineers implement the approved design
7. Feature is tested, deployed, and iterated as needed

### 4.3 Project Tracking

Project tracking at Compass balances structure with flexibility. Rather than rigid sprint cycles, teams plan timelines at project inception and adapt as work progresses. This approach promotes ownership and autonomy while ensuring visibility into progress and risks.

**Tools.** Jira is the standard tool internally for project tracking. Each project is organized under a client space, with tickets representing features, tasks, and bugs. Confluence integrates with Jira to centralize project documentation—requirements, technical specs, and meeting notes link directly to related tickets for traceability.

**Timeline Planning.** At project kickoff, the Tech Lead or Engagement Manager (EM) creates a timeline or Gantt chart outlining major milestones and deliverables. This plan serves as the baseline for tracking progress. Timelines are updated as necessary when scope changes or risks materialize.

**Day-to-Day Tracking.** Once the Tech Lead establishes the project structure and standards, team members own their individual tickets and manage their own work. This self-management model promotes accountability—developers, designers, and consultants are expected to keep their tickets current, communicate blockers early, and flag risks as soon as they arise.

**Risk Communication.** Risk tracking is informal but immediate. When team members identify a risk or blocker, they communicate directly with the Tech Lead or EM as soon as possible. The Tech Lead or EM then manages the risk, determines mitigation strategies, and escalates to stakeholders if necessary. The key principle is speed—raise issues early rather than waiting for them to become critical.

**Stakeholder Updates.** Weekly status updates are the standard mechanism for communicating progress to clients. These updates are typically prepared and delivered by the Tech Lead or EM, summarizing completed work, upcoming milestones, and any risks or blockers. Status updates keep stakeholders informed without requiring them to dig through project tracking tools.

**Ownership Model.** The Tech Lead (who often also serves as the EM) is responsible for setting up the project space, defining tracking standards, and maintaining overall visibility. However, the staff on the project own their work. This distributed ownership model ensures that tracking stays current without creating bottlenecks around a single person updating all artifacts.

### 4.4 Design / Frontend / Backend / ML+AI Responsibilities

Compass teams are intentionally cross-functional. Rather than strict role boundaries, team members wear multiple hats and overlap where it makes sense. This section clarifies typical responsibilities while acknowledging that staffing and scope determine how work is divided on any given project.

**Collaboration Principles.** The most important awareness is where responsibilities overlap: designers can develop frontend, backend engineers can integrate ML and data engineering work, and at least one person on the team should be comfortable spanning frontend and backend. Flexibility and communication matter more than rigid role definitions.

**Design Responsibilities.** Designers own the visual and interaction design of applications. All UI work is created in Figma, establishing user flows, component layouts, and visual patterns. Designers at Compass should also be capable of building frontend code—using tools like Claude Code with Figma and Shadcn MCPs, designers can generate the base React project structure directly from their designs. This reduces handoff friction and ensures design intent carries through to implementation.

**Frontend Responsibilities.** Frontend developers implement the user interface, either building from designer-generated code or translating Figma designs directly. Regardless of who starts the frontend work, all projects must use the Shadcn component library to ensure consistency.

Frontend developers should build with mock data and establish data model contexts that define the data structures the application will handle. This approach allows frontend development to proceed independently while the backend is still being built.

> **What is a Context?** Context is React's built-in mechanism for sharing data across components without manually passing props down through every level of the component tree—essentially a shared data container that any child component can access directly.

The planned True North design system will eventually provide a complete component library with Figma assets linked directly to React/TypeScript components in a GitHub repository, further streamlining this handoff.

**Backend Responsibilities.** Backend developers build APIs, handle data integration, and connect the application to platform services (Dataiku datasets, Databricks tables, cloud resources). Backend engineers often integrate ML model outputs—either by wrapping model serving endpoints in the application API or by reading prediction outputs from datasets for batch processing scenarios. Backend developers frequently handle the full-stack integration, connecting the independently-developed frontend to backend services.

**ML/AI Responsibilities.** ML engineers are responsible for model development, training, and deployment. The handoff to application developers typically happens at the API or dataset level: models are deployed as serving endpoints that the backend wraps, or batch predictions are written to datasets that the application reads. ML engineers are not typically responsible for application-level integration—that falls to backend developers.

**Full-Stack Integration.** A key pattern at Compass is having a full-stack developer (often the backend engineer, sometimes the frontend engineer) own the integration layer. This person connects the frontend to the backend, ensures API contracts are satisfied, and handles the end-to-end data flow. This model works well because frontend and backend can be developed in parallel, then unified by someone who understands both sides.

### 4.5 CI/CD Philosophy & Strategy

Continuous Integration and Continuous Deployment (CI/CD) automates the path from code changes to production, catching bugs early and accelerating releases. This section covers the philosophy and principles; platform-specific implementation details are in [Deployment and Infrastructure](#7-deployment-and-infrastructure).

**Why CI/CD Matters.** Continuous Integration automates testing and validation, catching bugs before they reach production. When tests run automatically on every change, issues surface early—when they're cheapest to fix. Continuous Deployment automates the preparation (compilation, bundling) and optionally the deployment of validated code, reducing manual steps and human error. Together, CI/CD speeds up releases while improving quality.

**Automation Expectations.** Automated tests should run before deploying to any environment. The standard recommendation is to use GitHub Actions for CI/CD workflows where possible—it integrates directly with the repository and provides visibility into build and test status. However, deployment automation depends on the environment and client IT constraints or governance requirements. Some clients require manual approval gates; others allow fully automated deployment to lower environments.

**Quality Gates.** Before code can be merged, the following gates should pass:

- **Unit tests** — Automated tests validating individual components
- **Linting** — Code style and formatting checks
- **Code review** — Manual review by another developer or Tech Lead (assigned through the PR process)

Security scans are not currently required but may be added in the future. Automated AI-assisted code review is a potential future enhancement but is not yet standard practice.

**Release Cadence.** Release frequency varies by project and client requirements. Some projects use continuous delivery, deploying changes as they're ready. Others follow scheduled releases aligned with client processes. Ad-hoc releases based on feature completion are also common. The key is to establish a cadence that works for the project and communicate it clearly to stakeholders.

**Minimum Standards.** While CI/CD implementation varies by project complexity, all projects should deliver bug-free code on the timeline established at project kickoff. The specific tooling and automation level may flex, but the quality expectation does not.

### 4.6 AI-Driven Development

Compass is an AI-First company. Our strategy embraces AI as a force multiplier across three tiers: AI-assisted workflows (productivity augmentation), AI-generated content (code, documentation, analysis), and AI agents (autonomous task execution). This section establishes standards for AI-driven development, ensuring teams leverage AI effectively while maintaining accountability and quality.

**AI Policy Foundation.** All AI-assisted work follows Compass AI policy principles:

- Treat AI-generated content as a draft requiring human review
- Respect data classifications—do not expose sensitive or confidential data to AI tools without appropriate safeguards
- Use vetted and approved tools; the tools described in this section are approved for development work
- Developers are accountable for all output, regardless of how it was generated

The complete AI Policy can be found here: [Compass Artificial Intelligence Usage Policy](https://compassdataanalytics.atlassian.net/wiki/spaces/CA/pages/717651988/Compass+Artificial+Intelligence+Usage+Policy).

Claude Code is the primary AI-assisted development tool at Compass. It integrates directly with the development workflow through VS Code and terminal interfaces, providing coding assistance, code generation, and automated task execution.

#### 4.6.1 Recommended Tools

**Claude Code.** Claude Code is Anthropic's official CLI and VS Code extension for AI-assisted development. It supports both interactive coding sessions and autonomous task execution. Two usage methods are supported at Compass:

1. **VS Code Extension** — Install the Claude Code extension from the VS Code marketplace. This provides inline coding assistance, chat-based interaction, and direct integration with your editor workspace.
2. **Terminal-based Claude Code** — Run Claude Code from the command line for terminal-native workflows. Useful for autonomous tasks, scripting, and headless environments.

**Compass Superpowers Plugin.** The Compass Claude Code plugin extends Claude Code with internal capabilities. Located at

<https://github.com/compassanalytics/claude-compass-superpowers>

(maintained by Julien Hovan), this plugin provides Compass-specific tools and integrations. All developers should install this plugin when setting up their Claude Code environment.

**Model Context Protocol (MCP) Servers.** MCPs extend Claude Code's capabilities by connecting it to external services and data sources. Compass recommends the following MCPs for development work:

- **Figma MCP** — Connects Claude Code to Figma designs, enabling AI to read and understand design files during implementation. Essential for design-to-code workflows.
- **Shadcn MCP** — Provides Claude Code access to shadcn/ui component documentation, examples, and metadata. Ensures generated code uses the approved component library correctly.
- **Context7 MCP** — Fetches up-to-date, version-specific documentation for any library directly into Claude Code prompts. Eliminates hallucinated APIs and outdated code patterns by grounding AI responses in current documentation.
- **GitHub MCP** — Connects Claude Code to GitHub for repository management, issue tracking, and PR operations.

**Why Context7?** Context7 solves a fundamental problem with AI coding assistants: LLMs are trained on data with a cutoff date, meaning they may generate code using deprecated APIs, outdated patterns, or entirely hallucinated function signatures. Context7 fetches current documentation on-demand, ensuring Claude Code generates code that matches the actual library versions in your project.

**Other AI Tools.** ChatGPT Teams subscriptions are available but are not recommended for code-generating development work. ChatGPT is appropriate for research, brainstorming, and non-code tasks but lacks the development-specific integrations that make Claude Code effective.

**Sharing and Discovery.** When you discover useful MCPs or AI tooling, share them in the AI Nerds channel on Teams. This helps the team collectively improve their AI-assisted workflows.

#### 4.6.2 Accountability & Responsibility

**Full Accountability.** The developer using AI is fully accountable for all code produced. AI is a tool—like a compiler, linter, or IDE autocomplete—not a replacement for engineering judgment, testing, and code review.

**What Accountability Means:**

- You must understand any code you commit, regardless of who or what generated it
- AI-generated code must pass the same quality gates as human-written code (tests, linting, code review)
- If AI-generated code causes bugs, the developer who committed it owns the fix
- "The AI wrote it" is never an acceptable explanation for defects

**Review Before Commit.** Never commit AI-generated code without reviewing it. AI can produce plausible-looking code that is subtly incorrect, insecure, or inefficient. Treat AI output as a first draft that requires your expert review.

**Testing Requirements.** AI-generated code must have appropriate test coverage. If the AI generates a function, you are responsible for ensuring that function is tested. Do not assume AI-generated tests are sufficient—verify they actually exercise the code paths they claim to test.

**Security Awareness.** AI models can generate insecure code patterns, including SQL injection vulnerabilities, improper input validation, and credential exposure. Apply the same security scrutiny to AI-generated code as you would to code from an unfamiliar contributor.

#### 4.6.3 Best Practices for AI-Assisted Development

**Effective Prompting.** Clear, specific prompts produce better results. Include context about the codebase, the problem you're solving, and any constraints. Reference existing patterns in the codebase you want the AI to follow.

**Iterative Refinement.** AI rarely produces perfect code on the first attempt. Use iterative prompts to refine output—ask for modifications, request explanations, and guide the AI toward the solution you need.

**Leverage MCPs.** Configure the recommended MCPs (Figma, Shadcn, Context7, GitHub) before starting development. These integrations dramatically improve AI output quality by grounding responses in actual documentation and design assets.

**Context Management.** Provide Claude Code with relevant context by:

- Opening relevant files in your editor before asking questions
- Using `@file` references to point Claude at specific code
- Creating a `CLAUDE.md` file in your repository with project-specific instructions, patterns, and conventions
- Keeping prompts focused on specific tasks rather than broad, ambiguous requests

**Code Review of AI Output.** When reviewing AI-generated code:

- Verify the logic matches your intent, not just your prompt
- Check for edge cases the AI may have missed
- Ensure error handling is appropriate
- Validate that imports and dependencies are correct for your project
- Confirm the code follows your project's existing patterns and conventions

**When to Use AI (and When Not To).** AI-assisted development excels at:

- Boilerplate code generation
- Implementing well-defined features from clear designs
- Refactoring and code transformation
- Writing tests for existing code
- Documentation and comment generation
- Exploring unfamiliar APIs or libraries

AI assistance is less reliable for:

- Complex architectural decisions
- Security-critical code paths
- Performance-critical optimizations
- Code requiring deep domain knowledge not in the training data

**Continuous Learning.** AI capabilities evolve rapidly. Stay current with Claude Code updates, new MCPs, and improved workflows. Share what works with your team through the AI Nerds channel.

## 5. Coding Standards

Language, design, frontend, backend, testing, security, and observability standards have moved to their own document: [Coding Standards](coding-standards.md).

## 6. Data Engineering for Apps

This section defines how applications consume and manage data reliably. While Compass has dedicated data engineering practices, application developers need to understand how their applications integrate with data infrastructure.

### 6.1 Data Architecture Patterns

Compass applications follow one of two primary data integration patterns, determined by the client's existing infrastructure and project requirements. Understanding which pattern applies to your project is essential for making correct architectural decisions.

**Pattern 1: Data Lake Integrated (Enterprise).** The application integrates with an existing enterprise data lake and consumes data prepared by data engineering pipelines. The app reads from curated datasets—it does not manage raw data ingestion or transformations. This pattern is common in engagements where clients have mature data platforms (Dataiku, Databricks, Snowflake) with established medallion architectures.

**Pattern 2: App-Native OLTP (Online Transaction Processing) (Standalone).** The application manages its own data lifecycle using a traditional database such as PostgreSQL, MongoDB, or similar. The app handles data ingestion, storage, and serving independently. This pattern suits projects where no enterprise data lake exists or where the application's data is self-contained.

**How to Determine the Pattern.** The choice is usually apparent from the project context:

|  Indicator                                                     |  Data Lake Integrated    |  App-Native OLTP    |
|:---------------------------------------------------------------|:-------------------------|:--------------------|
| Client has Dataiku/Databricks with existing pipelines          | Yes                      | —                   |
| Data flows through medallion architecture (bronze/silver/gold) | Yes                      | —                   |
| Application needs operational database (CRUD, transactions)    | —                        | Yes                 |
| No existing data engineering infrastructure                    | —                        | Yes                 |
| Data comes from multiple enterprise sources                    | Yes                      | —                   |
| Application generates and manages its own data                 | —                        | Yes                 |

**Hybrid Scenarios.** Some applications use both patterns. For example, an application might read analytics data from a data lake while maintaining its own operational database for user-generated content, configurations, or application state. In these cases, clearly separate the two data domains and apply the appropriate pattern to each.

**Who Decides.** The Tech Lead determines the data architecture during project scoping, in consultation with data engineering leads if applicable. This decision affects technology choices, team composition, and development workflows.

### 6.2 Data Lake Integrated (Enterprise)

Data Lake Integrated applications consume data from an established enterprise data pipeline rather than managing raw data ingestion themselves. These applications integrate with a medallion architecture (Bronze → Silver → Gold), reading curated datasets and writing application-generated data back into the lake as a source system.

![medallion-architecture.png](assets/331b4031-6634-448d-ac7a-65c7c7e0cbb8.png)

#### 6.2.1 Medallion Architecture Overview

The medallion architecture organizes data into progressively refined layers:

**Bronze Layer (Raw Data).** The landing zone for all source system data. Data arrives here in its original form—potentially messy, duplicated, or incomplete. Bronze preserves the raw record for auditability and reprocessing. Source systems include ERPs, CRMs, APIs, flat files, and importantly, applications themselves when they write data back to the lake.

**Silver Layer (Type 2 SCD).** The curated, historized layer where data is cleaned, deduplicated, and enriched. Silver implements Type 2 Slowly Changing Dimensions (SCD) to maintain complete history of all records.

Type 2 SCD tracks changes over time by creating new rows when data changes rather than overwriting existing records. Each row includes:

- `current_flag` (Y/N) — Indicates whether this is the active version of the record
- `start_date` — When this version became active
- `end_date` — When this version was superseded (null for current records)

This pattern enables point-in-time analysis and full audit trails. Applications querying Silver can filter by `current_flag = 'Y'` for current state or join across historical versions for trend analysis.

**Gold Layer (Analytics Ready).** The consumption layer optimized for analytics and reporting. Gold contains aggregated, denormalized datasets designed for specific business use cases. Data here is read-only from the application perspective—Gold serves dashboards, reports, and analytics views.

#### 6.2.2 Application Data Layer

Applications integrate with the data lake through a dedicated Application Data Layer that provides both read-write and read-only access patterns:

**Staging Data (Read-Write).** The application staging layer receives data from Silver, typically 360-degree or master data views that the application needs to enrich or modify. Users interact with this data through the application UI—adding context, making corrections, or entering new information. This is the primary workspace for application-driven data operations.

**Analytics Views (Read-Only).** The application also consumes data from Gold for display purposes—dashboards, reports, and analytics visualizations. This data flows one way into the application and is never modified by application logic.

#### 6.2.3 Write-Back Pattern

A critical feature of enterprise-integrated applications is the write-back pattern. When users modify data in the application staging layer, those changes flow back to Bronze as a new source:

1. User makes changes in the application (e.g., enriches a customer record, corrects an address, adds metadata)
2. Application writes the modified data to Bronze, treating itself as a source system
3. Data engineering pipelines pick up the new Bronze data
4. Silver layer processes the changes, creating new Type 2 SCD rows with updated `current_flag` values
5. Changes propagate to Gold for analytics consumption

This circular flow ensures the data lake remains the single source of truth while allowing applications to contribute data back into the ecosystem.

#### 6.2.4 Reverse ETL Considerations

In some architectures, application changes may also flow to other source systems through reverse ETL patterns. For example, enrichments made in an analytics application might need to sync back to the originating CRM or ERP. This is typically handled by dedicated data engineering pipelines rather than application code, but application developers should be aware of these downstream effects when designing data modification workflows.

#### 6.2.5 Implementation Guidelines

**Reading from the Lake.** Applications should connect to Silver or Gold layers through established data access patterns—typically Spark/Databricks SQL, Dataiku datasets, or API endpoints provided by the data platform. Avoid direct Bronze access except for debugging or reprocessing scenarios.

**Writing to the Lake.** All application writes should target Bronze. The application acts as a source system, providing raw data that flows through the standard medallion processing. Never write directly to Silver or Gold—these layers are managed by data engineering pipelines.

**Schema Coordination.** Changes to application data models that affect lake integration require coordination with data engineering. New fields, changed types, or structural modifications may require pipeline updates before deployment.

**Timestamp and Audit Fields.** Records written to Bronze should typically include:

- `timestamp_change` — When the business change occurred (the actual event time)
- `upload_date` — When the record was added to Bronze

In Silver, these fields are preserved alongside the SCD fields (`timestamp_change`, `upload_date`, `start_date`, `end_date`, `current_flag`). Note that specific field names and patterns may vary depending on client data engineering practices—the above reflects patterns used in engagements like Novartis. Always align with the established data engineering conventions for the specific engagement.

**Idempotency.** Application writes should be idempotent where possible. If the same operation runs twice, the result should be consistent. This protects against duplicate data in Bronze caused by retry logic or failed transactions.

### 6.3 App-Native OLTP (Standalone)

App-Native OLTP applications manage their own data lifecycle independently, without relying on an external data lake or enterprise data engineering pipelines. The application owns ingestion, storage, transformation, and serving—typically backed by a relational database like PostgreSQL or a document store like MongoDB.

#### 6.3.1 When to Use This Pattern

This pattern is appropriate when:

- No enterprise data lake exists or the client has not invested in centralized data engineering
- The application is self-contained and does not need to integrate with external analytics pipelines
- Data volumes are moderate and do not require distributed processing
- The team needs full control over the data model without external dependencies
- Rapid iteration on data structures is required without coordinating with data engineering teams

Examples include internal tools, standalone client applications, and engagements where the application is the primary system of record rather than a consumer of existing data infrastructure.

#### 6.3.2 Database Selection

**PostgreSQL** is the default choice for relational data. It provides robust ACID transactions, excellent performance for typical application workloads, strong ecosystem support, and broad hosting options (AWS RDS, Azure Database, Dataiku-managed, or self-hosted).

**MongoDB** is appropriate when the data model is highly variable, document-oriented, or when schema flexibility is prioritized over relational integrity. Consider MongoDB for applications with nested data structures, rapidly evolving schemas, or content management use cases.

**SQLite** may be used for lightweight, single-user, or embedded scenarios—such as local development, prototypes, or desktop applications. It is not appropriate for production multi-user web applications.

#### 6.3.3 Schema Design Principles

**Normalize Appropriately.** Follow standard normalization practices (typically 3NF) to reduce redundancy and maintain data integrity. Denormalize selectively for performance-critical read paths, but document the tradeoffs.

**Use Migrations.** All schema changes should be managed through migration scripts (e.g., Alembic for Python/SQLAlchemy, Prisma Migrate for TypeScript). Never modify production schemas manually. Migrations should be version-controlled alongside application code.

**Audit Fields.** Include standard audit fields on all tables:

- `id` — Primary key (UUID or auto-increment depending on requirements)
- `created_at` — Timestamp when the record was created
- `updated_at` — Timestamp of the last modification
- `created_by` / `updated_by` — User or system identifier (if applicable)

**Soft Deletes.** Consider soft deletes (`deleted_at` timestamp or `is_deleted` flag) for data that may need recovery or audit trails. Hard deletes are appropriate for transient data or when compliance requires true deletion.

#### 6.3.4 Data Access Patterns

**Use an ORM or Query Builder.** Applications should use SQLAlchemy (Python) or Prisma (TypeScript) for database access. Raw SQL is acceptable for complex queries that ORMs handle poorly, but should be parameterized to prevent SQL injection.

**Connection Pooling.** Configure connection pooling appropriately for the deployment environment. Avoid opening new connections per request—use a connection pool managed by the ORM or a dedicated pooler like PgBouncer for high-concurrency scenarios.

**Transactions.** Use database transactions for operations that must be atomic. Ensure transactions are scoped appropriately—neither too broad (holding locks unnecessarily) nor too narrow (leaving data inconsistent).

#### 6.3.5 Backup and Recovery

**Automated Backups.** Production databases must have automated backups configured. For managed services (RDS, Azure Database), enable automated snapshots with appropriate retention. For self-managed databases, implement backup scripts with off-site storage.

**Point-in-Time Recovery.** For critical applications, configure point-in-time recovery (PITR) to restore to any moment within the retention window. This protects against accidental data corruption or deletion.

**Test Restores.** Periodically verify that backups can be restored successfully. A backup that cannot be restored is not a backup.

#### 6.3.6 Future Data Lake Integration

Standalone applications may eventually need to integrate with a data lake for analytics, reporting, or cross-system data sharing. Design with this possibility in mind:

- Maintain clean, well-documented schemas that could be exported
- Include timestamps that enable incremental extraction
- Avoid application-specific encoding that would require complex transformation
- Consider CDC (Change Data Capture) compatibility if real-time sync may be needed

When integration becomes necessary, the application becomes a source system feeding Bronze in the medallion architecture described in [Data Lake Integrated (Enterprise)](#62-data-lake-integrated-enterprise).

### 6.4 AI/ML Integration in Analytics Applications

This section provides guidance for application developers who need to integrate AI or ML models into analytics applications. It focuses on the app developer's perspective—how to consume models, collaborate with ML engineers, and maintain integrations over time. This is not a comprehensive ML/MLOps standard; ML engineering practices are owned by the AI/ML team (Ethan Pirso and Julien Hovan).

#### 6.4.1 Collaboration Model

**Ownership Boundaries.** ML engineers own model development, training, evaluation, and optimization. Application developers own the integration layer—how the model is called, how predictions are displayed, and how the application handles model outputs. The handoff point is typically a deployed model endpoint or a registered model artifact.

**Communication.** Establish clear communication channels between app and ML teams. Model changes (new versions, input/output schema changes, performance characteristics) should be communicated before deployment. Application developers should provide feedback on integration challenges, latency requirements, and user-facing issues.

**Shared Contracts.** Define and document the interface contract between the application and the model:

- Input schema (required fields, types, constraints)
- Output schema (prediction format, confidence scores, metadata)
- Performance expectations (latency, throughput)
- Error handling (what happens when the model fails or returns low-confidence results)

#### 6.4.2 Model Serving Patterns

**MLflow Model Registry.** Both Databricks and Dataiku integrate with MLflow for model versioning and deployment. Applications should consume models through the MLflow serving layer or platform-native endpoints rather than loading model artifacts directly.

**Batch Inference.** For use cases where real-time predictions are not required, batch inference is often more efficient. The application triggers or schedules batch scoring jobs, and results are written to a database or data lake for later consumption.

**Real-Time Inference.** For interactive features requiring immediate predictions, use model serving endpoints. Design the application to handle latency gracefully—show loading states, use timeouts, and provide fallback behavior.

**Embedded Models.** Small, fast models may be embedded directly in the application for use cases requiring minimal latency. This approach trades off model update flexibility for performance. Coordinate with ML engineering on when embedding is appropriate.

#### 6.4.3 LLM Integration

For applications integrating Large Language Models (LLMs):

**API Integration.** LLMs are typically accessed through API endpoints (Azure OpenAI, Anthropic, or self-hosted models). Use the patterns described in [AI/LLM Input & Output Sanitization](coding-standards.md#64-aillm-input--output-sanitization) for input/output sanitization and prompt injection prevention.

**Prompt Management.** Store prompts as configuration rather than hardcoding them. This enables prompt iteration without code changes. Consider versioning prompts alongside model versions.

**Context Windows.** Be aware of token limits. Design the application to handle context truncation gracefully, summarize inputs when necessary, and chunk large documents appropriately.

**Cost Management.** LLM API calls can be expensive at scale. Implement caching for repeated queries, batch requests where possible, and monitor usage to avoid unexpected costs.

#### 6.4.4 Versioning and Updates

**Model Versioning.** Track which model version the application is using. MLflow provides version management—applications should reference specific versions rather than "latest" in production to prevent unexpected behavior changes.

**Staged Rollouts.** When updating to a new model version, consider staged rollouts—deploy to a subset of users or traffic first, monitor for issues, then expand. This is especially important for models that affect critical user-facing features.

**A/B Testing.** For significant model changes, A/B testing allows comparison of the new model against the existing one. The application may need to support routing users to different model versions and tracking outcomes.

**Rollback Plan.** Always have a rollback plan. If a new model version causes issues, the application should be able to quickly revert to the previous version.

#### 6.4.5 Error Handling and Graceful Degradation

**Model Failures.** Design for model unavailability. If the model endpoint is down or returns errors, the application should degrade gracefully—show cached results, hide ML-powered features, or display informative error messages rather than crashing.

**Low-Confidence Predictions.** When models return confidence scores, establish thresholds for action. Low-confidence predictions might trigger human review, display warnings to users, or fall back to rule-based logic.

**Timeout Handling.** Set appropriate timeouts for model calls. Long-running predictions should not block the user interface. Use async patterns and loading indicators for real-time inference.

#### 6.4.6 Monitoring and Feedback

**Prediction Logging.** Log model predictions along with inputs (appropriately anonymized) and outcomes when available. This data supports model monitoring and retraining. Coordinate with ML engineering on logging requirements.

**Drift Detection.** Model performance can degrade over time as input data distributions shift. While drift detection is primarily an ML engineering concern, application developers should surface metrics that indicate potential drift (e.g., increasing error rates, declining user satisfaction with predictions).

**User Feedback.** Build mechanisms for users to provide feedback on predictions (thumbs up/down, corrections, explicit ratings). This feedback is valuable for model improvement and should flow back to ML engineering.

## 7. Deployment and Infrastructure

This section ensures predictable, secure, and repeatable deployments.


> Per-platform deployment guidance (Dataiku, Databricks, Cloud) lives in the platform standards linked under [Related Standards](#related-standards). On-premises deployment and environment management are covered here.

### 7.1 On-Prem

On-premises deployments are outside Compass's standard delivery model. Compass has not yet executed an on-prem deployment, so established patterns do not exist.

#### 7.1.1 When On-Prem May Be Required

On-premises deployments typically arise from:

- Strict data residency requirements
- Regulatory compliance prohibiting cloud hosting
- Client IT policies mandating internal infrastructure
- Air-gapped or disconnected network environments

#### 7.1.2 Consultation Required

**All on-premises deployments require consultation with** Pentcho Tchomakov **(CTO) before proceeding.** This consultation ensures:

- Proper architectural guidance for the specific environment
- Risk assessment and mitigation planning
- Alignment with Compass capabilities and support model
- Clear expectations for operational responsibilities

Contact the CTO early in the scoping phase if on-prem deployment is a possibility. Do not commit to on-prem delivery without this consultation.

#### 7.1.3 Expected Challenges

On-prem deployments introduce complexity that cloud and platform solutions handle automatically:

- Infrastructure provisioning and configuration
- Security patching and updates
- Backup and disaster recovery
- Monitoring and alerting setup
- Network configuration and access control
- Dependency management without internet access

Teams should expect longer timelines and additional planning compared to standard platform deployments.

### 7.2 Environment Management

Environment management patterns are covered throughout this document in platform-specific contexts. This section provides a consolidated reference.

#### 7.2.1 Environment Progression

**Internal Compass Projects.** Typically use a simplified two-environment model:

- **Dev:** Active development and testing
- **Prod:** Production deployment

**Client Engagements.** Follow the client's environment structure, commonly:

- **Dev:** Development and initial testing
- **QA:** Stakeholder validation and user acceptance testing
- **Prod:** Production deployment

Migration between environments typically requires formal requests and testing gates defined by the client's IT governance.

#### 7.2.2 Platform-Specific Environment Patterns

Environment management details are covered in each platform section:

- **Dataiku:** Node architecture (Design → Automation) and bundle promotion. See [Node Architecture](../dataiku/dataiku-standards.md#21-node-architecture) and 6.1.11.
- **Databricks:** Workspace separation and Unity Catalog governance. See [Environment Separation](../databricks-apps/databricks-apps-standards.md#26-environment-separation).
- **Cloud:** Terraform workspaces or separate accounts per environment. See [Deployment & Infrastructure](../cloud-native/cloud-native-standards.md#2-deployment--infrastructure).

#### 7.2.3 Configuration Management

Environment-specific configuration should be externalized from code:

- Use environment variables for runtime configuration
- Store secrets in platform-provided secret management (Dataiku connections, Databricks Secrets, AWS Secrets Manager)
- Never commit environment-specific values to repositories
- Use `.env` files for local development only

CI/CD workflows inject environment-specific configuration from GitHub Secrets or platform-native secret stores. See [CI/CD Philosophy & Strategy](#45-cicd-philosophy--strategy) for CI/CD philosophy and [Secrets Management](coding-standards.md#62-secrets-management) for secrets management standards.

## 8. Internal vs. Client Apps

This section distinguishes standards based on audience and delivery model.

### 8.1 What Makes an App Dynamic

A dynamic application is one designed to serve multiple contexts—different clients, environments, or use cases—without requiring code changes. Rather than building a single-purpose application tied to one deployment, dynamic applications externalize the elements that vary between deployments, making them configurable at runtime.

#### 8.1.1 Philosophy of Configurability

The goal is to build applications that can be deployed as a Compass internal tool (True North branded), adapted for a client engagement with their data and branding, and later whitelabeled for an entirely different client—all from the same codebase. This approach maximizes the investment in application development while enabling rapid customization.

**Build Once, Deploy Many.** When building a new application, consider from the start which elements should be hardcoded and which should be configurable. A well-designed application separates concerns so that deploying to a new context requires only configuration changes, not code modifications.

**MT² as Reference.** The MT² application demonstrates this pattern in practice. The same application codebase serves multiple deployments with different data sources, branding, and feature configurations. When evaluating whether an application is sufficiently dynamic, MT² serves as the benchmark.

#### 8.1.2 Configurable Elements

Dynamic applications externalize the following categories of configuration:

**Visual Identity**

- Logos (primary, favicon, loading screens)
- Color schemes and theme tokens
- Typography choices where brand guidelines differ
- White-label footer and header content

**Data Sources**

- Connection strings and endpoints
- Dataset names and table references
- Authentication credentials (stored in secrets, not config)
- API base URLs for external services

**Feature Flags**

- Module visibility (show/hide entire features)
- Permission-based access controls
- Beta features enabled for specific deployments
- Client-specific customizations

**Content and Labels**

- Application title and descriptions
- Custom terminology (some clients use different business language)
- Help text and documentation links
- Notification messages

#### 8.1.3 Configuration Management Patterns

Configuration should be loaded at application startup and accessible throughout the codebase without scattering environment checks.

**Environment Variables.** The simplest approach for small configuration sets. Use `.env` files locally and environment-specific secrets in deployment.

```py
# backend/config.py
import os
from dataclasses import dataclass

@dataclass
class AppConfig:
    client_name: str = os.getenv("CLIENT_NAME", "Compass")
    api_base_url: str = os.getenv("API_BASE_URL", "https://api.compass.com")
    feature_advanced_analytics: bool = os.getenv("FEATURE_ADVANCED_ANALYTICS", "false").lower() == "true"

config = AppConfig()
```

**Configuration Files.** For complex configuration, use structured files that can be swapped per deployment.

```java
// config/client-acme.json
{
  "client": {
    "name": "ACME Corp",
    "logo": "/assets/acme-logo.svg",
    "primaryColor": "#1a365d"
  },
  "features": {
    "advancedAnalytics": true,
    "exportToPdf": false
  },
  "data": {
    "datasetPrefix": "acme_prod"
  }
}
```

**Frontend Theme Configuration.** Use CSS custom properties or theme context to propagate visual configuration.

```java
// src/config/theme.ts
export interface ThemeConfig {
  primaryColor: string;
  logoUrl: string;
  clientName: string;
}

export const loadTheme = async (): Promise<ThemeConfig> => {
  const response = await fetch('/api/config/theme');
  return response.json();
};
```

#### 8.1.4 What Should Not Be Configurable

Not everything should be externalized. Over-configuration creates complexity without benefit.

**Keep hardcoded:**

- Core business logic and algorithms
- Security controls and validation rules
- API contract structure (endpoints, request/response shapes)
- Database schema and data models
- Application architecture and component structure

**Rule of thumb:** If changing something would require testing to validate correctness, it belongs in code with version control, not configuration.

### 8.2 How to Whitelabel an App

Whitelabeling is the process of adapting an existing application for a new context—typically a different client—while maintaining a single codebase. At Compass, whitelabeling follows a deliberate lifecycle that maximizes reuse and ensures quality.

#### 8.2.1 The Whitelabeling Lifecycle

**Phase 1: Client Engagement → Production Application**

Most applications begin as client-specific projects. During initial development, focus on solving the client's problem first. Build the application to meet their requirements, using their data and branding. The application goes to production serving that client.

**Phase 2: Production → Compass Demo (True North)**

Once an application proves valuable, it becomes a candidate for the True North portfolio—Compass's internal product suite. To whitelabel for Compass:

1. Extract client-specific configuration into external files or environment variables (see [What Makes an App Dynamic](#81-what-makes-an-app-dynamic))
2. Replace client data with synthetic data (see [Creating Synthetic Data](#83-creating-synthetic-data))
3. Apply True North branding (logos, colors, terminology)
4. Deploy to Compass infrastructure (Dataiku DSS, Databricks, or AWS—owned by platform leads)

The True North version serves as a demo environment for sales, training, and internal experimentation.

**Phase 3: Compass Demo → New Client Engagement**

When a new client needs similar functionality, the whitelabeled application becomes the starting point:

1. Fork or branch the True North version
2. Configure for the new client's data sources
3. Apply client branding
4. Customize features based on their specific requirements
5. Deploy to client environment

This cycle repeats: each client deployment may introduce features that flow back into the core application, benefiting all future deployments.

#### 8.2.2 Infrastructure and Platform Ownership

Internal Compass applications run on shared infrastructure managed by platform owners:

|  Platform    |  Owner       |  Use Case                              |
|:-------------|:-------------|:---------------------------------------|
| Dataiku DSS  | Ethan Pirso  | Data science workflows, analytics apps |
| Databricks   | Tyler Nagano | Heavy data processing, ML training     |
| Snowflake    | Tyler Nagano | Data warehousing, analytics            |
| AWS          | Tyler Nagano | Custom cloud applications              |

Contact the appropriate platform owner to provision resources for new True North applications or to get access to existing infrastructure (Ethan Pirso, Tyler Nagano).

#### 8.2.3 Technical Implementation

Whitelabeling requires separating the application into layers: core functionality, configurable behavior, and deployment-specific assets.

**Repository Structure for Whitelabelable Apps**

```java
app-name/
├── src/                      # Core application code (shared)
│   ├── components/
│   ├── services/
│   └── pages/
├── config/                   # Deployment configurations
│   ├── compass.json          # True North defaults
│   ├── client-acme.json      # ACME Corp config
│   └── client-beta.json      # Another client
├── assets/                   # Default assets
│   └── logos/
├── deployments/              # Deployment-specific overrides
│   ├── compass/
│   │   └── assets/           # True North logos, etc.
│   ├── acme/
│   │   └── assets/           # ACME assets
│   └── beta/
│       └── assets/
├── scripts/
│   └── build-for-client.sh   # Build script that selects config
└── README.md
```

**Build-Time Configuration Selection**

```bash
#!/bin/bash
# scripts/build-for-client.sh

CLIENT=${1:-compass}

echo "Building for client: $CLIENT"

# Copy client-specific config
cp "config/${CLIENT}.json" src/config/active-config.json

# Copy client assets
cp -r "deployments/${CLIENT}/assets/"* public/assets/

# Run build
npm run build

echo "Build complete for $CLIENT"
```

**Runtime Configuration Loading**

```py
# backend/config.py
import os
import json
from pathlib import Path

def load_client_config():
    """Load configuration based on deployment context."""
    client = os.getenv("CLIENT_ID", "compass")
    config_path = Path(f"config/{client}.json")

    if not config_path.exists():
        config_path = Path("config/compass.json")  # Fallback to defaults

    with open(config_path) as f:
        return json.load(f)

CLIENT_CONFIG = load_client_config()
```

#### 8.2.4 Branding Implementation

Visual identity should be configurable through a theme system, not scattered throughout the codebase.

**CSS Custom Properties for Theming**

```css
/* src/styles/theme.css */
:root {
  /* These are overridden by client config */
  --color-primary: var(--client-primary, #0066cc);
  --color-secondary: var(--client-secondary, #004499);
  --color-background: var(--client-background, #ffffff);
  --logo-url: var(--client-logo, url('/assets/compass-logo.svg'));
}
```

**React Theme Context**

```java
// src/context/ThemeContext.tsx
import { createContext, useContext, useEffect, useState } from 'react';

interface ClientTheme {
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string;
  clientName: string;
}

const ThemeContext = createContext<ClientTheme | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ClientTheme | null>(null);

  useEffect(() => {
    fetch('/api/config/theme')
      .then(res => res.json())
      .then(setTheme);
  }, []);

  useEffect(() => {
    if (theme) {
      document.documentElement.style.setProperty('--client-primary', theme.primaryColor);
      document.documentElement.style.setProperty('--client-secondary', theme.secondaryColor);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useClientTheme = () => useContext(ThemeContext);
```

#### 8.2.5 Data Source Abstraction

Whitelabeled applications must work with different data sources without code changes.

**Data Source Configuration**

```java
{
  "dataSources": {
    "primary": {
      "type": "dataiku",
      "dataset": "client_sales_data",
      "connection": "client_warehouse"
    },
    "analytics": {
      "type": "api",
      "baseUrl": "https://client-analytics.example.com/api/v1"
    }
  }
}
```

**Abstract Data Access Layer**

```py
# backend/services/data_source.py
from abc import ABC, abstractmethod

class DataSource(ABC):
    @abstractmethod
    def query(self, query: str) -> list[dict]:
        pass

class DataikuDataSource(DataSource):
    def __init__(self, dataset_name: str):
        import dataiku
        self.dataset = dataiku.Dataset(dataset_name)

    def query(self, query: str) -> list[dict]:
        df = self.dataset.get_dataframe()
        # Apply query filters
        return df.to_dict('records')

class ApiDataSource(DataSource):
    def __init__(self, base_url: str):
        self.base_url = base_url

    def query(self, query: str) -> list[dict]:
        import requests
        response = requests.get(f"{self.base_url}/data", params={"q": query})
        return response.json()

def get_data_source(config: dict) -> DataSource:
    """Factory function to create appropriate data source."""
    source_type = config.get("type")
    if source_type == "dataiku":
        return DataikuDataSource(config["dataset"])
    elif source_type == "api":
        return ApiDataSource(config["baseUrl"])
    else:
        raise ValueError(f"Unknown data source type: {source_type}")
```

#### 8.2.6 Feature Customization

Different clients may need different feature sets from the same application.

**Feature Flag Configuration**

```java
{
  "features": {
    "advancedAnalytics": true,
    "exportToPdf": false,
    "customDashboards": true,
    "aiInsights": false
  }
}
```

**Feature Gate Component**

```java
// src/components/FeatureGate.tsx
import { useClientConfig } from '../hooks/useClientConfig';

interface FeatureGateProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const FeatureGate: React.FC<FeatureGateProps> = ({
  feature,
  children,
  fallback = null
}) => {
  const config = useClientConfig();

  if (config?.features?.[feature]) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};

// Usage
<FeatureGate feature="advancedAnalytics">
  <AdvancedAnalyticsDashboard />
</FeatureGate>
```

#### 8.2.7 Testing Whitelabeled Applications

Test the application across all client configurations to ensure changes don't break existing deployments.

**Multi-Configuration Testing**

```bash
#!/bin/bash
# scripts/test-all-clients.sh

CLIENTS=("compass" "acme" "beta")

for client in "${CLIENTS[@]}"; do
    echo "Testing configuration: $client"
    CLIENT_ID=$client npm test

    if [ $? -ne 0 ]; then
        echo "Tests failed for $client"
        exit 1
    fi
done

echo "All client configurations passed tests"
```

**Configuration Validation**

```py
# tests/test_config_validity.py
import pytest
import json
from pathlib import Path

CONFIG_DIR = Path("config")
REQUIRED_KEYS = ["client", "features", "dataSources"]

@pytest.fixture(params=list(CONFIG_DIR.glob("*.json")))
def client_config(request):
    with open(request.param) as f:
        return json.load(f), request.param.name

def test_config_has_required_keys(client_config):
    config, filename = client_config
    for key in REQUIRED_KEYS:
        assert key in config, f"{filename} missing required key: {key}"

def test_config_has_valid_colors(client_config):
    config, filename = client_config
    if "primaryColor" in config.get("client", {}):
        color = config["client"]["primaryColor"]
        assert color.startswith("#"), f"{filename} has invalid color format"
```

### 8.3 Creating Synthetic Data

Synthetic data enables demonstrations, testing, and training without exposing real client data. When whitelabeling a client application for True North, the original data must be replaced with realistic but fictional alternatives that maintain the application's analytical value while protecting confidentiality.

#### 8.3.1 When to Use Synthetic Data

**True North Demos.** Internal Compass applications used for sales demonstrations, training, or experimentation must not contain real client data. Synthetic data should be realistic enough to showcase application capabilities.

**Development and Testing.** Engineers need representative data to develop and test features. Synthetic data allows testing edge cases, performance characteristics, and data validation without access to production data.

**Training Materials.** Documentation, tutorials, and onboarding materials should use synthetic datasets that illustrate concepts without revealing client information.

#### 8.3.2 Approaches to Generating Synthetic Data

**Manual Creation.** For small datasets or specific test cases, manually create records. This approach gives precise control but doesn't scale.

**Rule-Based Generation.** Use libraries like Faker to generate realistic values following patterns. Good for names, addresses, dates, and other structured fields.

**LLM-Assisted Generation.** Use language models to generate realistic, contextually appropriate data at scale. Particularly useful for:

- Complex relational data with realistic patterns
- Domain-specific terminology and values
- Natural language fields (descriptions, comments, notes)
- Data that needs to "make sense" together across tables

#### 8.3.3 API Access for LLM Generation

Compass provides API access to language models for synthetic data generation:

|  Service                   |  Owner      |  Access                      |
|:---------------------------|:------------|:-----------------------------|
| OpenAI API                 | Ethan Pirso | Request API key provisioning |
| Claude Console (Anthropic) | Ethan Pirso | Request workspace access     |

Contact Ethan Pirso to provision API access if you don't have it. For interactive exploration, ChatGPT Teams is available for smaller-scale data generation tasks.

#### 8.3.4 Prompt Engineering for Synthetic Data

Effective prompts for synthetic data generation should specify the schema, relationships, and domain context.

**Example Prompt for Pharmaceutical Sales Data**

```java
Generate synthetic pharmaceutical sales data for a demo application. The data should be realistic but entirely fictional.

CONTEXT:
- This is for a medical territory management application
- The data represents sales performance across therapeutic areas
- All company names, drug names, and personnel should be fictional

SCHEMA:
1. territories (id, name, region, manager_name)
2. products (id, name, therapeutic_area, launch_date)
3. sales (territory_id, product_id, month, units_sold, revenue)

REQUIREMENTS:
- Generate 10 territories across 4 regions (Northeast, Southeast, Midwest, West)
- Generate 8 fictional drug products across 3 therapeutic areas (Oncology, Cardiology, Neurology)
- Generate 12 months of sales data (Jan 2024 - Dec 2024)
- Sales should show realistic patterns:
  - Seasonal variation
  - New product ramp-up curves for products launched mid-year
  - Territory performance variation (some territories outperform others)
  - Therapeutic area trends

OUTPUT FORMAT:
Return as JSON with three arrays: territories, products, sales.
Ensure referential integrity (all foreign keys reference valid IDs).
```

**Key Prompt Elements:**

1. **Context** — What the data represents and why it's being generated
2. **Schema** — Explicit field definitions and relationships
3. **Requirements** — Business rules, patterns, and constraints
4. **Output Format** — How to structure the response for easy parsing

#### 8.3.5 LLM Processing for Data Transformation

For larger datasets or complex transformations, use the OpenAI API programmatically. This example demonstrates transforming a data model on Databricks—identifying primary keys, anonymizing sensitive fields, and maintaining consistency across related tables.

**Databricks Notebook: Synthetic Data Transformation**

```py
# Databricks notebook for transforming client data to synthetic data
# Uses OpenAI API for intelligent anonymization and data generation

from openai import OpenAI
import json
import hashlib
from pyspark.sql import DataFrame
from pyspark.sql.functions import udf, col, lit
from pyspark.sql.types import StringType
from typing import Dict, List

# Initialize OpenAI client (API key from Databricks secrets)
client = OpenAI(
    api_key=dbutils.secrets.get(scope="llm-keys", key="openai-api-key")
)

def analyze_schema_for_pii(df: DataFrame, table_name: str) -> Dict:
    """Use LLM to identify PII columns and primary keys in a table."""

    schema_description = "\n".join([
        f"- {field.name}: {field.dataType.simpleString()}"
        for field in df.schema.fields
    ])

    # Get sample values for context (first 5 rows, limited columns)
    sample_data = df.limit(5).toPandas().head().to_dict('records')

    prompt = f"""Analyze this database table schema and identify:
1. The likely primary key column(s)
2. Columns containing PII (personally identifiable information) that need anonymization
3. Columns containing sensitive business data that should be transformed
4. Columns that are safe to keep as-is (IDs, dates, numeric metrics)

Table: {table_name}
Schema:
{schema_description}

Sample data (for context only):
{json.dumps(sample_data[:2], indent=2, default=str)}

Return a JSON object with:
{{
  "primary_keys": ["column_name"],
  "pii_columns": ["column_name"],
  "sensitive_business": ["column_name"],
  "safe_columns": ["column_name"],
  "transformation_notes": "any special considerations"
}}
"""

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"}
    )

    return json.loads(response.choices[0].message.content)


def generate_anonymization_mapping(
    original_values: List[str],
    field_type: str,
    context: str
) -> Dict[str, str]:
    """Generate realistic synthetic replacements for a set of values."""

    prompt = f"""Generate synthetic replacements for these {field_type} values.
The replacements should be:
- Realistic and contextually appropriate
- Consistent in format with the originals
- Completely fictional (no real {field_type})

Context: {context}

Original values to replace:
{json.dumps(original_values, indent=2)}

Return a JSON object mapping each original value to its synthetic replacement:
{{"original_value": "synthetic_replacement", ...}}
"""

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"}
    )

    return json.loads(response.choices[0].message.content)


def create_consistent_mapping(
    tables: Dict[str, DataFrame],
    shared_columns: List[str]
) -> Dict[str, Dict[str, str]]:
    """Create anonymization mappings that are consistent across tables.

    For example, if 'customer_name' appears in both orders and contacts tables,
    the same original name should map to the same synthetic name everywhere.
    """

    mappings = {}

    for column in shared_columns:
        # Collect all unique values across all tables
        all_values = set()
        for table_name, df in tables.items():
            if column in df.columns:
                values = [row[column] for row in df.select(column).distinct().collect()]
                all_values.update(v for v in values if v is not None)

        if all_values:
            # Determine field type from column name
            field_type = "names" if "name" in column.lower() else "values"
            context = f"Column '{column}' appearing across multiple related tables"

            mappings[column] = generate_anonymization_mapping(
                list(all_values),
                field_type,
                context
            )

    return mappings


def anonymize_dataframe(
    df: DataFrame,
    column_mappings: Dict[str, Dict[str, str]]
) -> DataFrame:
    """Apply anonymization mappings to a DataFrame."""

    result_df = df

    for column, mapping in column_mappings.items():
        if column in df.columns:
            # Create a UDF that applies the mapping
            mapping_broadcast = spark.sparkContext.broadcast(mapping)

            @udf(StringType())
            def apply_mapping(value):
                if value is None:
                    return None
                m = mapping_broadcast.value
                return m.get(value, value)

            result_df = result_df.withColumn(
                column,
                apply_mapping(col(column))
            )

    return result_df


# Example usage: Transform a set of related tables
def transform_dataset_to_synthetic(table_configs: Dict[str, str]) -> Dict[str, DataFrame]:
    """
    Transform a set of related tables to synthetic data.

    Args:
        table_configs: Dict mapping table names to their source paths
                      e.g., {"customers": "catalog.schema.customers", ...}

    Returns:
        Dict of transformed DataFrames ready to write
    """

    # Load all tables
    tables = {
        name: spark.table(path)
        for name, path in table_configs.items()
    }

    # Analyze each table for PII
    print("Analyzing schemas for PII...")
    analyses = {}
    for table_name, df in tables.items():
        analyses[table_name] = analyze_schema_for_pii(df, table_name)
        print(f"  {table_name}: {len(analyses[table_name]['pii_columns'])} PII columns identified")

    # Find columns that appear in multiple tables (need consistent mapping)
    all_pii_columns = []
    for analysis in analyses.values():
        all_pii_columns.extend(analysis['pii_columns'])

    shared_pii = [col for col in set(all_pii_columns) if all_pii_columns.count(col) > 1]

    # Generate consistent mappings for shared columns
    print(f"Generating consistent mappings for {len(shared_pii)} shared columns...")
    consistent_mappings = create_consistent_mapping(tables, shared_pii)

    # Generate table-specific mappings for non-shared PII
    print("Generating table-specific mappings...")
    table_mappings = {}
    for table_name, df in tables.items():
        table_pii = [c for c in analyses[table_name]['pii_columns'] if c not in shared_pii]
        table_mappings[table_name] = {}

        for column in table_pii:
            values = [row[column] for row in df.select(column).distinct().collect()]
            values = [v for v in values if v is not None]

            if values:
                field_type = "names" if "name" in column.lower() else "values"
                table_mappings[table_name][column] = generate_anonymization_mapping(
                    values, field_type, f"Column '{column}' in {table_name}"
                )

    # Apply transformations
    print("Applying transformations...")
    transformed = {}
    for table_name, df in tables.items():
        # Combine consistent and table-specific mappings
        all_mappings = {**consistent_mappings, **table_mappings.get(table_name, {})}
        transformed[table_name] = anonymize_dataframe(df, all_mappings)
        print(f"  {table_name}: transformed {len(all_mappings)} columns")

    return transformed


# Run transformation
source_tables = {
    "customers": "client_catalog.sales.customers",
    "orders": "client_catalog.sales.orders",
    "contacts": "client_catalog.sales.contacts"
}

synthetic_tables = transform_dataset_to_synthetic(source_tables)

# Write to synthetic catalog
for table_name, df in synthetic_tables.items():
    output_path = f"compass_catalog.synthetic.{table_name}"
    df.write.mode("overwrite").saveAsTable(output_path)
    print(f"Wrote synthetic {table_name} to {output_path}")
```

#### 8.3.6 Key Considerations

**Referential Integrity.** When anonymizing related tables, ensure foreign key relationships remain valid. The same original value must map to the same synthetic value across all tables.

**Statistical Properties.** For analytics applications, synthetic data should preserve statistical distributions, trends, and patterns from the original data while changing individual values.

**Performance.** LLM API calls add latency. For large datasets:

- Process in batches
- Cache mappings to avoid regenerating
- Use deterministic hashing for simple transformations, reserving LLM for complex fields

**Validation.** After generating synthetic data, validate that:

- All foreign keys resolve correctly
- Required fields are populated
- Data types and formats are preserved
- The application functions correctly with the synthetic data

#### 8.3.7 Hybrid Approach

For most applications, combine approaches:

1. **Rule-based** for simple structured fields (dates, IDs, numeric ranges)
2. **LLM-assisted** for names, addresses, and natural language content
3. **Statistical sampling** for preserving distributions in large datasets

```py
# Example: Hybrid synthetic data generation
from faker import Faker

fake = Faker()

def generate_hybrid_record(schema_analysis: Dict) -> Dict:
    """Generate a single synthetic record using hybrid approach."""
    record = {}

    for column in schema_analysis['safe_columns']:
        # Keep original logic for IDs and metrics
        record[column] = None  # Will be filled from original

    for column in schema_analysis['pii_columns']:
        if 'email' in column.lower():
            record[column] = fake.email()
        elif 'phone' in column.lower():
            record[column] = fake.phone_number()
        elif 'name' in column.lower():
            record[column] = fake.name()
        elif 'address' in column.lower():
            record[column] = fake.address()
        else:
            # Use LLM for complex fields
            record[column] = None  # Mark for LLM processing

    return record
```

This hybrid approach balances speed (rule-based generation is instant) with quality (LLM handles nuanced transformations) and cost (minimize API calls to what truly needs intelligence).

## 9. Additional Resources

This section provides ongoing learning and reference material.

### 9.1 Books

*Content to be written — recommended foundational and advanced reading.*

### 9.2 Websites

**Platform Documentation**

- [Dataiku DSS Documentation](https://doc.dataiku.com/dss/latest/) — Official documentation for Dataiku Data Science Studio, including webapps, APIs, and dataset management
- [Dataiku Python API Reference](https://doc.dataiku.com/dss/latest/python-api/index.html) — Reference for the `dataiku` Python package used in webapp backends and recipes
- [Dataiku API Client (dataikuapi)](https://developer.dataiku.com/latest/api-reference/python/dataikuapi.html) — Python client for the Dataiku public API, used for programmatic deployments and automation
- [Dataiku Webapps Guide](https://doc.dataiku.com/dss/latest/webapps/index.html) — Comprehensive guide to building and deploying webapps on Dataiku DSS
- [Dataiku Bundles and Deployment](https://doc.dataiku.com/dss/latest/deployment/index.html) — Guide to project bundles, deployer nodes, and promotion workflows
- [Dataiku Automation Node](https://doc.dataiku.com/dss/latest/operations/index.html) — Documentation for production operations on Automation nodes
- [Databricks Documentation](https://docs.databricks.com/) — Comprehensive documentation for Databricks, including Apps, Unity Catalog, and MLflow
- [Databricks Apps Documentation](https://docs.databricks.com/en/dev-tools/databricks-apps/index.html) — Guide to building and deploying custom applications on Databricks Apps
- [Databricks Apps Cookbook](https://github.com/databricks-solutions/databricks-apps-cookbook) — Code snippets and recipes for building applications on Databricks Apps with FastAPI, Streamlit, and Dash
- [Databricks SDK for Python](https://docs.databricks.com/en/dev-tools/sdk-python.html) — Official Python SDK for programmatic management of Databricks resources, jobs, and apps
- [Databricks Connect](https://docs.databricks.com/en/dev-tools/databricks-connect/index.html) — Run Spark code locally that connects to a remote Databricks cluster
- [Databricks Asset Bundles](https://docs.databricks.com/en/dev-tools/bundles/index.html) — Declarative deployment tool for managing Databricks resources as code
- [Unity Catalog Documentation](https://docs.databricks.com/en/data-governance/unity-catalog/index.html) — Unified governance for data and AI assets across Databricks workspaces

**Cloud Providers**

- [AWS Documentation](https://docs.aws.amazon.com/) — AWS service documentation, best practices, and reference architectures
- [Azure Documentation](https://docs.microsoft.com/en-us/azure/) — Microsoft Azure documentation and architectural guidance
- [Terraform Documentation](https://developer.hashicorp.com/terraform/docs) — Infrastructure as code documentation for managing cloud resources

**Programming Languages & Libraries**

- [Python 3.12 Release](https://www.python.org/downloads/release/python-31212/) — Recommended Python version for Compass projects
- [Polars Documentation](https://docs.pola.rs/) — High-performance DataFrame library for Python, recommended for large dataset processing
- [Black Documentation](https://black.readthedocs.io/) — Python code formatter used at Compass

**Frontend & Build Tools**

- [Vite Documentation](https://vite.dev/) — Next-generation frontend build tool for fast development and optimized production builds
- [vite-plugin-singlefile](https://github.com/richardtallent/vite-plugin-singlefile) — Vite plugin that bundles entire frontend applications into a single HTML file, required for Dataiku webapp deployments
- [vite-svg-loader](https://github.com/jpkleemans/vite-svg-loader) — Vite plugin for importing SVG files as Vue/React components or URL references

**Backend Frameworks**

- [Flask Documentation](https://flask.palletsprojects.com/) — Lightweight Python web framework, native to Dataiku webapps
- [FastAPI Documentation](https://fastapi.tiangolo.com/) — Modern, high-performance Python web framework with automatic API documentation
- [Mangum Documentation](https://mangum.io/) — ASGI adapter for running FastAPI and other ASGI applications on AWS Lambda
- [FastMCP Documentation](https://gofastmcp.com/) — Python framework for building Model Context Protocol servers for AI agent integrations
- [Pydantic Documentation](https://docs.pydantic.dev/) — Data validation library used with FastAPI for request/response models
- [Dataiku Authentication Info](https://developer.dataiku.com/latest/concepts-and-examples/authinfo.html) — Guide to accessing authenticated user information in Dataiku webapps

**Testing Frameworks**

- [pytest Documentation](https://docs.pytest.org/) — Full-featured Python testing framework for unit and integration tests
- [Vitest Documentation](https://vitest.dev/) — Vite-native unit testing framework for frontend applications
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) — Testing utilities for React components focused on user behavior
- [Playwright Documentation](https://playwright.dev/) — Cross-browser end-to-end testing and component testing framework
- [GitHub Actions Documentation](https://docs.github.com/en/actions) — CI/CD automation for running tests on push and pull requests

**AI-Assisted Development**

- [Claude Code Documentation](https://docs.anthropic.com/en/docs/claude-code) — Official documentation for Anthropic's Claude Code CLI and VS Code extension
- [Model Context Protocol Specification](https://modelcontextprotocol.io/specification) — Official MCP specification for building and integrating MCP servers
- [OpenAI API Documentation](https://platform.openai.com/docs) — Official OpenAI API reference for GPT models, chat completions, and structured outputs
- [OpenAI Python Library](https://github.com/openai/openai-python) — Official Python client for the OpenAI API
- [Anthropic API Documentation](https://docs.anthropic.com/en/api) — Official Anthropic API reference for Claude models
- [Anthropic Python SDK](https://github.com/anthropics/anthropic-sdk-python) — Official Python client for the Anthropic API

**Synthetic Data Generation**

- [Faker Documentation](https://faker.readthedocs.io/) — Python library for generating realistic fake data (names, addresses, dates, etc.)
- [SDV (Synthetic Data Vault)](https://docs.sdv.dev/) — Python library for generating synthetic tabular data that preserves statistical properties

**MCP Servers**

- [Context7 MCP](https://github.com/upstash/context7) — Fetches up-to-date, version-specific library documentation directly into AI prompts to prevent hallucinated APIs
- [Figma MCP](https://help.figma.com/hc/en-us/articles/32132100833559-Guide-to-the-Figma-MCP-server) — Provides AI coding agents access to Figma design data for accurate design-to-code implementation
- [GitHub MCP Server](https://github.com/github/github-mcp-server) — Official GitHub MCP server for repository management, issues, PRs, and code analysis
- [Shadcn UI MCP Server](https://github.com/jpisnice/shadcn-ui-mcp-server) — MCP server providing access to shadcn/ui component documentation, examples, and metadata

**Security**

- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/) — Concise security guidance covering authentication, input validation, secrets management, and more
- [OWASP Top 10](https://owasp.org/www-project-top-ten/) — Most critical web application security risks and how to prevent them
- [GitHub Dependabot Documentation](https://docs.github.com/en/code-security/dependabot) — Automated dependency updates and security vulnerability alerts
- [detect-secrets](https://github.com/Yelp/detect-secrets) — Pre-commit hook tool for preventing secrets from being committed to repositories
- [pip-audit Documentation](https://pypi.org/project/pip-audit/) — Python dependency vulnerability scanner
- [AWS Secrets Manager](https://docs.aws.amazon.com/secretsmanager/) — AWS service for managing application secrets and credentials
- [Azure Key Vault](https://learn.microsoft.com/en-us/azure/key-vault/) — Azure service for safeguarding cryptographic keys and secrets
- [Databricks Secrets](https://docs.databricks.com/en/security/secrets/index.html) — Databricks secret management for storing sensitive configuration

**Observability & Logging**

- [MLflow Documentation](https://mlflow.org/docs/latest/) — Open-source platform for ML experiment tracking, model versioning, and deployment
- [MLflow Tracing](https://mlflow.org/docs/latest/llms/tracing/index.html) — LLM observability with automatic tracing for prompts, responses, and token usage
- [Python Logging Documentation](https://docs.python.org/3/library/logging.html) — Standard library logging module for Python applications
- [AWS CloudWatch Documentation](https://docs.aws.amazon.com/cloudwatch/) — AWS monitoring and observability service for logs, metrics, and alarms
- [Azure Monitor Documentation](https://learn.microsoft.com/en-us/azure/azure-monitor/) — Azure monitoring service for application insights and log analytics

### 9.3 Research Papers

*Content to be written — relevant academic and industry research.*

## 10. Reference Examples

### `synthetic_data_generator.py`

LLM-based synthetic data generator (anonymises client data via the OpenAI API).

```python
# Databricks notebook for transforming client data to synthetic data
# Uses OpenAI API for intelligent anonymization and data generation

from openai import OpenAI
import json
import hashlib
from pyspark.sql import DataFrame
from pyspark.sql.functions import udf, col, lit
from pyspark.sql.types import StringType
from typing import Dict, List

# Initialize OpenAI client (API key from Databricks secrets)
client = OpenAI(
    api_key=dbutils.secrets.get(scope="llm-keys", key="openai-api-key")
)

def analyze_schema_for_pii(df: DataFrame, table_name: str) -> Dict:
    """Use LLM to identify PII columns and primary keys in a table."""

    schema_description = "\n".join([
        f"- {field.name}: {field.dataType.simpleString()}"
        for field in df.schema.fields
    ])

    # Get sample values for context (first 5 rows, limited columns)
    sample_data = df.limit(5).toPandas().head().to_dict('records')

    prompt = f"""Analyze this database table schema and identify:
1. The likely primary key column(s)
2. Columns containing PII (personally identifiable information) that need anonymization
3. Columns containing sensitive business data that should be transformed
4. Columns that are safe to keep as-is (IDs, dates, numeric metrics)

Table: {table_name}
Schema:
{schema_description}

Sample data (for context only):
{json.dumps(sample_data[:2], indent=2, default=str)}

Return a JSON object with:
{{
  "primary_keys": ["column_name"],
  "pii_columns": ["column_name"],
  "sensitive_business": ["column_name"],
  "safe_columns": ["column_name"],
  "transformation_notes": "any special considerations"
}}
"""

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"}
    )

    return json.loads(response.choices[0].message.content)


def generate_anonymization_mapping(
    original_values: List[str],
    field_type: str,
    context: str
) -> Dict[str, str]:
    """Generate realistic synthetic replacements for a set of values."""

    prompt = f"""Generate synthetic replacements for these {field_type} values.
The replacements should be:
- Realistic and contextually appropriate
- Consistent in format with the originals
- Completely fictional (no real {field_type})

Context: {context}

Original values to replace:
{json.dumps(original_values, indent=2)}

Return a JSON object mapping each original value to its synthetic replacement:
{{"original_value": "synthetic_replacement", ...}}
"""

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"}
    )

    return json.loads(response.choices[0].message.content)


def create_consistent_mapping(
    tables: Dict[str, DataFrame],
    shared_columns: List[str]
) -> Dict[str, Dict[str, str]]:
    """Create anonymization mappings that are consistent across tables.

    For example, if 'customer_name' appears in both orders and contacts tables,
    the same original name should map to the same synthetic name everywhere.
    """

    mappings = {}

    for column in shared_columns:
        # Collect all unique values across all tables
        all_values = set()
        for table_name, df in tables.items():
            if column in df.columns:
                values = [row[column] for row in df.select(column).distinct().collect()]
                all_values.update(v for v in values if v is not None)

        if all_values:
            # Determine field type from column name
            field_type = "names" if "name" in column.lower() else "values"
            context = f"Column '{column}' appearing across multiple related tables"

            mappings[column] = generate_anonymization_mapping(
                list(all_values),
                field_type,
                context
            )

    return mappings


def anonymize_dataframe(
    df: DataFrame,
    column_mappings: Dict[str, Dict[str, str]]
) -> DataFrame:
    """Apply anonymization mappings to a DataFrame."""

    result_df = df

    for column, mapping in column_mappings.items():
        if column in df.columns:
            # Create a UDF that applies the mapping
            mapping_broadcast = spark.sparkContext.broadcast(mapping)

            @udf(StringType())
            def apply_mapping(value):
                if value is None:
                    return None
                m = mapping_broadcast.value
                return m.get(value, value)

            result_df = result_df.withColumn(
                column,
                apply_mapping(col(column))
            )

    return result_df


# Example usage: Transform a set of related tables
def transform_dataset_to_synthetic(table_configs: Dict[str, str]) -> Dict[str, DataFrame]:
    """
    Transform a set of related tables to synthetic data.

    Args:
        table_configs: Dict mapping table names to their source paths
                      e.g., {"customers": "catalog.schema.customers", ...}

    Returns:
        Dict of transformed DataFrames ready to write
    """

    # Load all tables
    tables = {
        name: spark.table(path)
        for name, path in table_configs.items()
    }

    # Analyze each table for PII
    print("Analyzing schemas for PII...")
    analyses = {}
    for table_name, df in tables.items():
        analyses[table_name] = analyze_schema_for_pii(df, table_name)
        print(f"  {table_name}: {len(analyses[table_name]['pii_columns'])} PII columns identified")

    # Find columns that appear in multiple tables (need consistent mapping)
    all_pii_columns = []
    for analysis in analyses.values():
        all_pii_columns.extend(analysis['pii_columns'])

    shared_pii = [col for col in set(all_pii_columns) if all_pii_columns.count(col) > 1]

    # Generate consistent mappings for shared columns
    print(f"Generating consistent mappings for {len(shared_pii)} shared columns...")
    consistent_mappings = create_consistent_mapping(tables, shared_pii)

    # Generate table-specific mappings for non-shared PII
    print("Generating table-specific mappings...")
    table_mappings = {}
    for table_name, df in tables.items():
        table_pii = [c for c in analyses[table_name]['pii_columns'] if c not in shared_pii]
        table_mappings[table_name] = {}

        for column in table_pii:
            values = [row[column] for row in df.select(column).distinct().collect()]
            values = [v for v in values if v is not None]

            if values:
                field_type = "names" if "name" in column.lower() else "values"
                table_mappings[table_name][column] = generate_anonymization_mapping(
                    values, field_type, f"Column '{column}' in {table_name}"
                )

    # Apply transformations
    print("Applying transformations...")
    transformed = {}
    for table_name, df in tables.items():
        # Combine consistent and table-specific mappings
        all_mappings = {**consistent_mappings, **table_mappings.get(table_name, {})}
        transformed[table_name] = anonymize_dataframe(df, all_mappings)
        print(f"  {table_name}: transformed {len(all_mappings)} columns")

    return transformed


# Run transformation
source_tables = {
    "customers": "client_catalog.sales.customers",
    "orders": "client_catalog.sales.orders",
    "contacts": "client_catalog.sales.contacts"
}

synthetic_tables = transform_dataset_to_synthetic(source_tables)

# Write to synthetic catalog
for table_name, df in synthetic_tables.items():
    output_path = f"compass_catalog.synthetic.{table_name}"
    df.write.mode("overwrite").saveAsTable(output_path)
    print(f"Wrote synthetic {table_name} to {output_path}")
```

### `synthetic_data_hybrid.py`

Hybrid synthetic data generation example.

```python
# Example: Hybrid synthetic data generation
from faker import Faker

fake = Faker()

def generate_hybrid_record(schema_analysis: Dict) -> Dict:
    """Generate a single synthetic record using hybrid approach."""
    record = {}

    for column in schema_analysis['safe_columns']:
        # Keep original logic for IDs and metrics
        record[column] = None  # Will be filled from original

    for column in schema_analysis['pii_columns']:
        if 'email' in column.lower():
            record[column] = fake.email()
        elif 'phone' in column.lower():
            record[column] = fake.phone_number()
        elif 'name' in column.lower():
            record[column] = fake.name()
        elif 'address' in column.lower():
            record[column] = fake.address()
        else:
            # Use LLM for complex fields
            record[column] = None  # Mark for LLM processing

    return record
```


## Related Standards

- [Coding Standards](coding-standards.md)
- [Dataiku standards](../dataiku/dataiku-standards.md)
- [Databricks Apps standards](../databricks-apps/databricks-apps-standards.md)
- [Cloud-Native (AWS/Azure) standards](../cloud-native/cloud-native-standards.md)
- [Data Engineering — Development Standards](../../data-engineering/general/development-standards.md)

## Change Log

| Date | Author | Change |
|---|---|---|
| 2026-07-21 | Ethan-Pirso | Populated from the Confluence "Application Development Best Practices and Standards" page; platform-neutral content moved here verbatim, on-premises and platform selection folded in, coding standards split out, sections renumbered sequentially and cross-references converted to links. |
