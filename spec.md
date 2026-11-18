# GuessMoji – Project Specification

**Course:** SEIS 606 – Vibe Coding  
**Project:** Project 2  
**Team Members:** Ezana Asfaw and Uchenna Obidiegwu  
**Version:** 0.1 (Initial Draft)  
**Date:** November 18, 2026

## 1. Project Overview

GuessMoji is an interactive guessing game where users identify movies or countries based on emoji clues.

The goal is to create a fun and simple game that allows users to test their knowledge.

## 2. Project Approach

We selected the Platform Bake-off approach because of our different schedules.

Each team member will independently develop a version of GuessMoji using a different AI development tool.

- **Ezana:** ChatGPT Pro
- **Uchenna:** Claude Pro

Both versions will follow the same project specification. We will compare the results and decide which features to include in the final application.

## 3. Core Features

### User Accounts
- Users can create an account.
- Users can log in and log out.
- Game scores and progress are saved to each user's account.

### Emoji Guessing Game
- Users can choose between Movies and Countries.
- The app displays emoji clues representing the correct answer.
- Users type their answers into an input field.
- The app tells users whether their answers are correct or incorrect.

### Scoring and Progress
- Users earn points for correct answers.
- Scores are saved between sessions.
- Users can view their previous scores and progress.

## 4. Initial Game Rules

The following rules are proposed for the initial version and will be finalized by both partners.

1. The game displays one emoji puzzle at a time.
2. Users enter an answer and submit it.
3. Answers are checked without considering capitalization or extra spaces.
4. Common alternative names may be accepted.
5. Correct answers earn points.
6. Users cannot earn points repeatedly for the same completed puzzle.

## 5. Initial Acceptance Tests

| Test | Expected Result |
|---|---|
| User creates an account | Account is successfully created |
| User logs in | User can access their game progress |
| User selects Movies | Movie-related emoji puzzles appear |
| User selects Countries | Country-related emoji puzzles appear |
| User submits a correct answer | The answer is accepted and points are awarded |
| User submits an incorrect answer | The game displays an incorrect-answer message |
| User logs out and returns | Previously saved scores remain available |

## 6. Data Requirements

The application will store user accounts, puzzle information, scores, and progress.

User progress must be saved persistently so that multiple users can access their own information across sessions.

## 7. Initial Scope Limitations

To keep development manageable, the initial application will not require:

- Real-time multiplayer gameplay.
- Paid services or subscriptions.
- External movie or geography APIs.
- Complex AI models during gameplay.

These features may be reconsidered if time permits.

## 8. Risks & Governance

We created our initial Risks & Governance assessment on November 11, 2026. We identified six potential risks related to data, accessibility, answer validation, code, AI agents, and application failures.

Based on the feedback we received during peer review, we plan to update our risk assessment, assign responsibilities for each risk, and clarify how we will monitor AI-generated code and protect user information.

We will include these changes in our updated specification and document them in the changelog.

## 9. Changelog

| Version | Date | Changes | Author |
|---|---|---|---|
| 0.1 | November 18, 2026 | Created initial specification describing the proposed GuessMoji features, game rules, data requirements, and acceptance tests. | Ezana Asfaw |
