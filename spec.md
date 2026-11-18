# GuessMoji – Project Specification

**Course:** SEIS 606 – Vibe Coding  
**Project:** Project 2  
**Team Members:** Ezana Asfaw and Uchenna Obidiegwu  
**Version:** 0.2 – Peer Review Draft  
**Date:** November 18, 2026

## 1. Project Overview

GuessMoji is an interactive guessing game where users identify movies or countries based on emoji clues.

Our goal is to create a fun and simple game where users can test their knowledge, earn points, and track their progress.

## 2. Project Approach

We chose the Platform Bake-off approach because of our different schedules. Uchenna will be out of the country, so working independently gives us more flexibility.

We will each build our own version of GuessMoji using different AI development tools.

- **Ezana:** ChatGPT Pro
- **Uchenna:** Claude Pro

Both versions will follow the same project requirements. We will compare the completed applications using shared acceptance tests and evaluation criteria.

Each of us is responsible for reviewing and testing our own version. We will make final project decisions together.

Our specific implementation platforms and frameworks will be recorded in the contract once finalized.

## 3. Core Features

### User Accounts

- Users can register and log in.
- Users can log out.
- Each user has their own saved progress and scores.
- User data must remain available after logging out and returning.

### Emoji Guessing Game

- Users can choose between Movies and Countries.
- Each puzzle displays emojis representing a movie or country.
- Users type their answers into a text field.
- The application indicates whether an answer is correct or incorrect.
- Players can use text hints when a puzzle is unclear.

### Scoring and Progress

- Players earn points for correct answers.
- Users cannot earn points repeatedly for the same completed puzzle.
- Scores and progress are saved between sessions.
- Users can view their own progress.

## 4. Game Rules and Edge Cases

We will use consistent rules in both versions.

1. Each puzzle displays an emoji clue.
2. Players enter their answer and submit it.
3. Capitalization and extra spaces will not affect whether an answer is correct.
4. Common alternative names and spellings will be accepted when listed as valid answers.
5. Blank answers will not be submitted.
6. Incorrect answers will display a message without awarding points.
7. Players cannot receive duplicate points for a completed puzzle.
8. Each puzzle will have a text hint to help players understand unclear emojis.

We will use a shared list of puzzles and accepted answers so that both applications are evaluated fairly.

## 5. Acceptance Tests

| Test ID | Action | Expected Result |
|---|---|---|
| AT-01 | Register using valid information | Account is created successfully |
| AT-02 | Register using an existing email | Duplicate account is rejected |
| AT-03 | Log in with valid credentials | User can access their account |
| AT-04 | Log in with incorrect credentials | Login is rejected with an appropriate message |
| AT-05 | Select Movies | Movie emoji puzzles appear |
| AT-06 | Select Countries | Country emoji puzzles appear |
| AT-07 | Submit a correct answer | Correct answer is accepted and points are awarded |
| AT-08 | Submit an incorrect answer | Incorrect-answer message appears and no points are awarded |
| AT-09 | Submit an answer with different capitalization or extra spaces | Answer is evaluated correctly |
| AT-10 | Submit a blank answer | Submission is rejected |
| AT-11 | Attempt to earn points again for a completed puzzle | No duplicate points are awarded |
| AT-12 | Log out and log back in | Saved scores and progress remain available |
| AT-13 | Attempt to access another user's private progress | Access is denied |

We will use these tests during development and when comparing our two applications.

## 6. Data Requirements

Our application will need to store:

- User accounts.
- Emoji puzzles and accepted answers.
- Scores.
- Completed puzzles and player progress.

We will store user progress persistently rather than only in the browser.

We will limit the personal information collected and ensure that users cannot access another player's private account information.

## 7. Scope Limitations

To keep our project manageable, we will not include the following features in the initial version:

- Real-time multiplayer.
- Paid subscriptions.
- External movie or geography APIs.
- Complex AI models during gameplay.

We may reconsider additional features if both applications meet the core requirements and we have enough time.

## 8. Risks & Governance

We created our initial Risks & Governance assessment on November 11, 2026. After reviewing feedback from Adam and Ryan, we identified areas that needed clearer explanations.

We revised our risk assessment to address user accounts, data protection, code licensing, agent permissions, and application reliability.

The responsibilities and mitigations below are our proposed updates for team review. A risk remains Open until we implement and verify its mitigation.

| Risk | Likelihood | Impact | Mitigation | Owner | Status |
|---|---|---|---|---|---|
| **Data:** User account information or private progress could be exposed. | Medium | High | Collect minimal personal information, protect stored account data, and restrict access to each user's private progress. | Both, for their respective builds | Open |
| **People:** Emojis may display differently across devices or be unclear to players. | High | Medium | Provide text hints, support keyboard input, and test puzzles on different devices. | Both | Open |
| **Decisions:** Correct answers may be rejected because of capitalization, spelling, or alternative names. | High | Low | Normalize answers and maintain a list of accepted alternatives. | Both | Open |
| **Code:** AI-generated code may contain bugs or introduce dependencies with incompatible licenses. | Medium | Medium | Review generated code, check third-party dependencies and their licenses, and test important features before accepting changes. | Each partner for their build | Open |
| **Agents:** AI agents may make unexpected changes or modify important files. | Medium | Medium | Limit agent permissions, review important changes, and use commits and pull requests to maintain a record of changes. | Each partner for their build | Open |
| **Security:** Authentication or user data may be handled incorrectly. | Medium | High | Use secure authentication, protect credentials, and test unauthorized access and invalid login attempts. | Each partner for their build | Open |
| **Failure:** The application may stop working or fail during the class demonstration. | Medium | High | Maintain a tested working version, review deployment changes, and prepare a backup demonstration. | Both | Open |

### AI Governance Rules

We are responsible for the work produced by our AI tools.

Our rules are:

- We will review significant AI-generated code changes.
- We will test features before accepting them.
- We will not give agents access to passwords or private credentials.
- We will document important AI mistakes and corrections in our agent logs.
- We will require human approval for deployment and major project decisions.
- We will use GitHub commits and pull requests to track changes.

We plan to add an `AGENTS.md` file to make our shared instructions and constraints visible to coding agents.

### Governance Decisions Following Peer Review

We reviewed Adam and Ryan's concerns about privacy risks, unclear responsibilities, agent oversight, and code licensing.

We propose keeping a data privacy risk, but changing its focus from public nicknames to private account information. Even when users choose to share nicknames, account information still needs protection.

We also clarified that each of us will review our own AI-generated application and that major project decisions require human approval.

## 9. Changelog

| Version | Date | Author | Changes |
|---|---|---|---|
| 0.1 | November 18, 2026 | Ezana Asfaw | Created the initial specification draft with core features, game rules, and acceptance tests. |
| 0.2 | November 18, 2026 | Ezana Asfaw (draft for team review) | Added the full Risks & Governance table, clarified responsibilities and AI oversight, expanded acceptance tests for edge cases and security, and updated data requirements following peer review. |

We will review these proposed revisions together before finalizing the specification.
