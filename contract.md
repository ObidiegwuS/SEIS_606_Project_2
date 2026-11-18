# GuessMoji – Project Contract

**Course:** SEIS 606 – Vibe Coding  
**Project:** Project 2  
**Team Members:** Ezana Asfaw and Uchenna Obidiegwu  
**Project Approach:** Platform Bake-off  
**Version:** 0.1 (Initial Draft)  
**Date:** November 18, 2026

## 1. Project Overview

GuessMoji is an emoji guessing game where players try to identify movies or countries based on emoji clues.

We chose the Platform Bake-off approach because of our different schedules. Uchenna will be out of the country, so working independently gives us more flexibility.

We will each build a version of GuessMoji using a different AI development tool. After completing our builds, we will compare them and decide which features work best for the final application.

## 2. Roles and Responsibilities

| Team Member | AI Tool | Responsibilities |
|---|---|---|
| Ezana Asfaw | ChatGPT Pro | Build one version of GuessMoji, review AI-generated code, test features, and document development decisions. |
| Uchenna Obidiegwu | Claude Pro | Build another version of GuessMoji, review AI-generated code, test features, and document development decisions. |

We will both contribute to the specification, contract, testing, and final evaluation.

We will document our development platforms and frameworks before comparing the two versions.

## 3. Shared Project Requirements

To make the comparison fair, both versions must support the same core features.

| ID | Required Feature |
|---|---|
| F1 | Users can create an account and log in or log out. |
| F2 | Users can select either Movies or Countries. |
| F3 | The game displays emoji clues for players to solve. |
| F4 | Users can enter and submit their answers. |
| F5 | The application checks answers and displays whether they are correct or incorrect. |
| F6 | Players receive points for correct answers without earning duplicate points for the same completed puzzle. |
| F7 | Users' scores and progress are saved between sessions. |

Both versions must follow the same specification and game rules.

Features such as real-time multiplayer, paid services, and external APIs are outside our initial scope.

## 4. Fairness Rules

We want both versions to have a fair comparison.

**What must remain the same:**
- Core features and requirements.
- Game rules and answer-validation expectations.
- The starting set of emoji puzzles and accepted answers.
- Acceptance tests.
- An equal, agreed development time budget.

**What may differ:**
- AI development tools.
- Implementation platforms and frameworks.
- Code structure and architecture.
- User interface and visual design.
- Prompts and development workflows.

We will document how much time we spend developing each version and record issues that require human corrections.

## 5. Acceptance Tests

We will use the following tests to evaluate both applications.

| Test | Action | Expected Result |
|---|---|---|
| AT-01 | Register with valid account information | An account is created successfully. |
| AT-02 | Attempt to register with an existing email | The application rejects the duplicate account. |
| AT-03 | Log in with valid credentials | The user can access their account. |
| AT-04 | Select Movies or Countries | The appropriate emoji puzzles appear. |
| AT-05 | Submit a correct answer | The application accepts the answer and awards points. |
| AT-06 | Submit an incorrect answer | The application displays an appropriate message. |
| AT-07 | Submit an answer using different capitalization or extra spaces | The answer is evaluated consistently with the specification. |
| AT-08 | Log out and log back in | Previously saved progress and scores remain available. |
| AT-09 | Attempt to earn points again for a completed puzzle | Duplicate points are not awarded. |
| AT-10 | Access another user's progress | Users cannot access private account data belonging to another user. |

We will record whether each test passes or fails for both builds.

## 6. Comparison Criteria

After developing both versions, we will use the same scoring system to evaluate them.

| Criterion | Weight | How We Will Evaluate It |
|---|---:|---|
| Functionality | 30% | Percentage of acceptance tests passed. |
| Security | 20% | Account protection, data handling, and identified security issues. |
| Maintainability | 20% | Code organization, readability, and ease of making changes. |
| Development Effort | 15% | Time spent and number of AI-generated errors requiring correction. |
| Usability | 15% | Ease of navigation, clarity, and player feedback. |
| **Total** | **100%** | |

We will score both applications using the same criteria and record the results.

These weights are proposed for our initial contract and will be finalized together before the comparison begins.

## 7. AI Agent Rules

Since this is a Vibe Coding course, we want to explore how AI agents can help us develop applications.

However, we are responsible for reviewing the work they produce.

Our rules are:

- AI agents may generate code, suggest changes, and help identify problems.
- We will review significant code changes before committing them.
- We will test AI-generated features before accepting them.
- Agents will not receive passwords, API keys, or other private credentials.
- We will document important agent mistakes and corrections in our agent logs.
- Deployment and major project decisions require human approval.

## 8. Repository Workflow

We will use GitHub to manage and track our project.

Our planned workflow is:

1. Store the shared specification and contract in the main repository.
2. Use separate branches for development and documentation changes.
3. Commit changes with descriptive messages.
4. Use pull requests to propose and review important changes.
5. Review changes before merging them into the main branch.
6. Keep the contract and changelog updated whenever we make significant decisions.

## 9. Disagreements and Final Selection

After both versions are ready, we will compare their functionality, usability, security, and overall quality.

We may also use a third-party AI tool to review differences or provide an additional opinion.

However, we will review its recommendations ourselves before making the final decision.

We plan to select the stronger application as our starting point and incorporate useful features from the other version when practical.

## 10. Costs and Data

We currently use the following AI subscriptions:

- Uchenna: Claude Pro, approximately $20 per month.
- Ezana: ChatGPT Pro, accessed through a student discount.

We will avoid additional paid services unless we both approve them.

We will use fictional or non-sensitive data for testing. We will not store passwords, API keys, or private credentials in our GitHub repository.

## 11. Contract Changes

We will review changes to this contract together.

If we change a shared feature, game rule, acceptance test, or comparison criterion, we will update the relevant documentation.

Significant changes should be proposed through a GitHub pull request so that both of us can review them.

We will also record the date, version, and reason for each change in the changelog.

## 12. Changelog

| Version | Date | Author | Changes |
|---|---|---|---|
| 0.1 | November 18, 2026 | Ezana Asfaw (draft for team review) | Created the initial written Bake-off contract covering project responsibilities, shared requirements, fairness rules, acceptance tests, evaluation criteria, AI oversight, and repository workflow. |

This is our initial contract draft. We will review it together and document any agreed revisions before finalizing the project requirements.
