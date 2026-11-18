# GuessMoji – AI Agent Instructions

**Project:** GuessMoji  
**Course:** SEIS 606 – Vibe Coding  
**Team Members:** Ezana Asfaw and Uchenna Obidiegwu  
**Date:** November 18, 2026

## 1. Project Overview

We are building GuessMoji, an emoji guessing game where users identify movies or countries based on emoji clues.

We selected the Platform Bake-off approach. Ezana will use ChatGPT Pro, and Uchenna will use Claude Pro to develop separate versions of the application.

Both versions must follow the same project specification and contract.

## 2. Instructions for AI Agents

Our AI agents may help us:

- Generate and improve code.
- Identify and fix bugs.
- Suggest application features.
- Write and run tests.
- Review documentation for inconsistencies.
- Recommend improvements to the user interface.

However, AI agents cannot make final project decisions without our approval.

## 3. Actions Requiring Human Approval

Our AI agents must request approval before:

- Changing the project's core requirements.
- Deleting important files or stored data.
- Merging pull requests.
- Deploying the application.
- Adding paid services.
- Making significant architectural changes.
- Changing the project's evaluation criteria.

Ezana and Uchenna are responsible for reviewing and approving these decisions.

## 4. Project Requirements

All AI-generated changes must follow the requirements described in `spec.md` and `contract.md`.

The application must support:

- User registration and login.
- Movie and country emoji puzzles.
- Answer submission and validation.
- Points for correct answers.
- Persistent scores and player progress.
- Protection of private user information.

Agents must not introduce features that conflict with these requirements.

## 5. Security and Data Protection

AI agents must follow these rules:

- Never expose passwords, API keys, or private credentials.
- Never add secrets to the GitHub repository.
- Protect user account information.
- Prevent users from accessing another user's private data.
- Avoid collecting unnecessary personal information.
- Use fictional or non-sensitive data during testing.

## 6. Code Quality and Licensing

Before accepting AI-generated code, we will:

- Review important code changes.
- Test the affected features.
- Check external libraries and dependencies for license compatibility.
- Avoid copying code with unclear or incompatible licensing.
- Confirm that changes do not break existing functionality.

We will not use movie posters, logos, or other copyrighted materials without appropriate permission.

## 7. Specification and Contract Compliance

Before proposing a significant change, an AI agent should:

1. Read `spec.md`.
2. Read `contract.md`.
3. Identify which requirements the change affects.
4. Compare the proposed change with the existing requirements.
5. Identify any inconsistencies.
6. Suggest updates to the documentation or tests if necessary.
7. Report the findings to us for human review.

The agents may help identify inconsistencies, but Ezana and Uchenna will make the final decisions.

## 8. Testing Requirements

Both versions of GuessMoji must be evaluated using the acceptance tests defined in `spec.md` and `contract.md`.

Agents should check:

- Account registration and login.
- Correct and incorrect answers.
- Empty answers.
- Capitalization and extra spaces.
- Duplicate scoring.
- Saved player progress.
- Unauthorized access to private account information.

We will review the test results before accepting significant changes.

## 9. GitHub Workflow

We will use GitHub to track our work.

Our rules are:

- Use separate branches for significant changes.
- Write descriptive commit messages.
- Use pull requests for important updates.
- Review changes before merging them into `main`.
- Update changelogs when requirements change.
- Keep the specification and contract consistent.

AI agents may recommend changes, but human approval is required for merges and deployment.

## 10. Agent Log

We will maintain an agent log throughout development.

The log will record:

- Important tasks assigned to AI agents.
- Mistakes or unexpected behavior.
- How we identified problems.
- Corrections we made.
- Lessons learned from using AI tools.

We will write our reflections in our own words.

## 11. Final Responsibility

We are responsible for the applications we develop and submit.

AI agents are tools that support our work. They do not replace our responsibility to review, test, and approve the final application.
