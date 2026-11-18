# GuessMoji – Project Contract

**Course:** SEIS 606 – Vibe Coding  
**Project:** Project 2  
**Team Members:** Ezana Asfaw and Uchenna Obidiegwu  
**Project Approach:** Platform Bake-off  
**Version:** 0.2 – Peer Review Draft  
**Date:** November 18, 2026

## 1. Project Overview

GuessMoji is an emoji guessing game where players identify movies or countries based on emoji clues.

We chose the Platform Bake-off approach because of our different schedules. Uchenna will be out of the country, so working independently gives us more flexibility.

We will each develop our own version of GuessMoji using different AI development tools. We will compare the two versions using the same requirements and evaluation criteria.

## 2. Roles and Responsibilities

We clarified our responsibilities after receiving feedback from Adam and Ryan.

| Team Member | AI Tool | Responsibilities |
|---|---|---|
| Ezana Asfaw | ChatGPT Pro | Develop the ChatGPT-assisted version, review generated code, test features, document agent activity, and fix problems in his build. |
| Uchenna Obidiegwu | Claude Pro | Develop the Claude-assisted version, review generated code, test features, document agent activity, and fix problems in his build. |
| Both | Human review | Approve shared requirements, review important documentation changes, compare both versions, and select the final application. |

Each of us is responsible for reviewing the changes made to our own application.

Neither AI agent has final decision-making authority over the project.

We will document our specific frameworks and platforms before conducting the final comparison.

## 3. Shared Project Requirements

Both versions must follow the same specification.

| ID | Required Feature |
|---|---|
| F1 | Users can register, log in, and log out. |
| F2 | Users can select Movies or Countries. |
| F3 | The game displays emoji clues for players to solve. |
| F4 | Users can enter and submit answers. |
| F5 | Correct and incorrect answers produce appropriate feedback. |
| F6 | Players earn points for correct answers without receiving duplicate points for completed puzzles. |
| F7 | Scores and progress are saved between sessions. |
| F8 | Players can use text hints for unclear puzzles. |

Both applications must also follow the answer-validation rules and data requirements described in `spec.md`.

## 4. Fairness Rules

We want our comparison to be fair and consistent.

**What must stay the same:**

- Core features and game rules.
- Starting emoji puzzles and accepted answers.
- Acceptance tests.
- Data protection requirements.
- Evaluation criteria and scoring weights.
- An agreed development time budget.

**What may differ:**

- AI development tools.
- Implementation platforms and frameworks.
- Code structure.
- User interface design.
- Development prompts and workflows.

We will agree on the shared puzzle dataset and time budget before comparing our builds.

We will also record our development time and major AI-generated errors requiring correction.

## 5. Acceptance Tests

We updated our acceptance tests to match the revised specification and address additional edge cases.

| Test | Action | Expected Result |
|---|---|---|
| AT-01 | Register with valid information | Account is created successfully. |
| AT-02 | Register with an existing email | Duplicate account is rejected. |
| AT-03 | Log in with valid credentials | User can access their account. |
| AT-04 | Log in with incorrect credentials | Login is rejected with an appropriate message. |
| AT-05 | Select Movies | Movie emoji puzzles appear. |
| AT-06 | Select Countries | Country emoji puzzles appear. |
| AT-07 | Submit a correct answer | Points are awarded. |
| AT-08 | Submit an incorrect answer | A message appears and no points are awarded. |
| AT-09 | Submit an answer with different capitalization or extra spaces | Answer is evaluated correctly. |
| AT-10 | Submit a blank answer | Submission is rejected. |
| AT-11 | Attempt to earn points again for a completed puzzle | Duplicate points are not awarded. |
| AT-12 | Log out and log back in | Saved scores and progress remain available. |
| AT-13 | Attempt to access another user's private progress | Access is denied. |

We will test both applications using the same starting conditions and document the results.

## 6. Comparison Criteria

We will evaluate both versions using a shared scoring system.

| Criterion | Weight | Evaluation Method |
|---|---:|---|
| Functionality | 30% | Percentage of the 13 acceptance tests passed. |
| Security | 20% | Review authentication, private data protection, and identified security issues using the same checklist. |
| Maintainability | 20% | Review code organization and measure the effort required to make the same small change in each build. |
| Development Effort | 15% | Compare human development hours and the number of AI corrections required. |
| Usability | 15% | Ask classmates to complete the same tasks and record completion rates and feedback. |
| **Total** | **100%** | |

We will score both applications consistently.

The weights and evaluation methods are proposed for team approval. Once agreed, we will not change them after the comparison begins.

The higher-scoring build will be our proposed starting point for the final application. We may incorporate useful features from the other version if they do not break the shared requirements.

## 7. AI Agent Rules

Adam and Ryan pointed out that our original agreement did not clearly explain how much decision-making authority we would give our agents.

We want our agents to help us develop GuessMoji, but we will keep human oversight over important decisions.

**Agents may:**

- Generate and suggest code.
- Recommend improvements.
- Identify bugs.
- Suggest tests.
- Review documentation for inconsistencies.

**Human approval is required before:**

- Merging significant changes.
- Deploying a new version.
- Changing shared requirements.
- Deleting important data or files.
- Adding paid services.
- Making major architectural decisions.

We will also follow these rules:

- We will not place passwords or API keys in prompts or repositories.
- We will review external dependencies and their licenses.
- We will test important features before accepting changes.
- We will document meaningful agent mistakes and corrections.

We plan to add an `AGENTS.md` file containing shared instructions and constraints for our coding agents.

## 8. Repository Workflow

We will use GitHub to manage our documentation and code.

Our workflow is:

1. Keep agreed project requirements on the `main` branch.
2. Create separate branches for proposed changes.
3. Use descriptive commit messages.
4. Create pull requests for significant updates.
5. Review changes before merging them.
6. Check whether changes affect the specification or contract.
7. Update the changelog when requirements or important decisions change.

For this peer-review update, we are using the `nov11-peer-review-updates` branch.

Both partners should review shared documentation changes before they are merged into `main`.

## 9. Contract Compliance

We will check that our specification, contract, and implementation remain consistent.

Before merging changes that affect project behavior, we will:

1. Review the changed requirements.
2. Compare them with the contract and specification.
3. Check whether acceptance tests need to change.
4. Run the relevant tests.
5. Record significant corrections.

An AI agent may help identify discrepancies, but we will review its findings ourselves.

We will not rely only on an AI-generated statement that the application meets the contract.

## 10. Disagreements and Final Decisions

We will first discuss disagreements and compare the available evidence.

If we disagree about which implementation is better, we will use our shared evaluation criteria.

We may ask a third-party AI tool for an additional review, but its recommendation will not automatically decide the outcome.

We will make final decisions together.

If we cannot reach an agreement, we will document the unresolved issue and consult our professor when necessary.

## 11. Costs and Data

Our current AI tools are:

- Uchenna: Claude Pro, approximately $20 per month.
- Ezana: ChatGPT Pro, accessed through a student discount.

We will avoid additional paid services unless we both approve the cost.

For testing, we will use fictional or non-sensitive information.

We will not commit passwords, API keys, or private credentials to GitHub.

Our application will require persistent storage for user accounts, scores, and progress. We will restrict access to private user information.

## 12. Contract Changes

We will document changes to shared requirements and evaluation rules.

Each significant contract revision should include:

- The date.
- The version number.
- What changed.
- The reason for the change.
- Who proposed or approved it.

We will use GitHub pull requests to preserve a reviewable history of changes.

## 13. Changelog

| Version | Date | Author | Changes |
|---|---|---|---|
| 0.1 | November 18, 2026 | Ezana & Uchenna| Created initial Bake-off contract with shared requirements, roles, fairness rules, acceptance tests, and evaluation criteria. |
| 0.2 | November 18, 2026 | Ezana & Uchenna| Clarified partner responsibilities and AI oversight, aligned acceptance tests with the revised specification, expanded repository workflow, added contract-compliance checks, and clarified the comparison and decision-making process following Adam and Ryan's peer review. |

We will review this revised contract together before treating it as the final agreed version.
