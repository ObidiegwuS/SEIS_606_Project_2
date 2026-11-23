# GuessMoji – Project Specification

**Course:** SEIS 606 – Vibe Coding  
**Project:** Project 2  
**Team Members:** Ezana Asfaw and Uchenna Obidiegwu  
**Version:** 0.3 – Proposed Update (pending team review)  
**Date:** November 23, 2026

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
- Users must verify their email address before they can log in.
- Passwords must meet the shared password requirements.
- Accounts are locked for 24 hours after 3 failed login attempts.
- Users can reset a forgotten password using their email address.
- Users can log out.
- Each user has their own saved progress and scores.
- User data must remain available after logging out and returning.

### Account Rules

These rules apply to registration, email verification, and login in both versions.

**Registration**

1. Registration asks only for an email address, a password, and a password confirmation.
2. The email address must have a valid format and must not already be registered. Capitalization and surrounding spaces are ignored when comparing email addresses.
3. The password must contain at least 7 characters, one uppercase letter (A–Z), one lowercase letter (a–z), and one special character (for example: !, @, #, $, %, &, *). Numbers are allowed but not required.
4. The password requirements are displayed on the registration page before the user submits the form.
5. The confirmation password must match the password.
6. No account is created if any field is invalid. The server checks these rules as well as the browser.
7. Passwords are stored only as secure hashes, never as plain text.

**Email Verification**

8. After registration, a verification email containing a link is sent to the submitted address.
9. A new account stays unverified until the user opens the verification link. A valid email format alone does not verify an account.
10. Verification links expire after 24 hours and can only be used once.
11. Users can request a new verification email. Requesting a new link makes earlier links invalid.

**Login**

12. Unverified accounts cannot log in. If the user enters the correct password for an unverified account, a message explains that the email must be verified first and offers to resend the verification email.
13. An incorrect email or password shows a general "incorrect email or password" message.
14. After 3 consecutive failed login attempts, the account is locked for 24 hours. While locked, the account cannot log in, even with the correct password. A successful login resets the count.

**Forgot Password**

15. Users can request a password reset link by entering their email address. The response is the same whether or not the email is registered.
16. Password reset links expire after 1 hour and can only be used once. Requesting a new link makes earlier links invalid.
17. The new password must meet the same password requirements as registration and be entered twice to confirm.
18. Resetting the password ends all existing login sessions, lifts any login lockout, and marks the email address as verified, because the user has proven they control it.

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
| AT-01 | Register using valid information | Account is created as unverified and a verification email is sent |
| AT-02 | Register using an existing email | Duplicate account is rejected |
| AT-03 | Log in with valid credentials for a verified account | User can access their account |
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
| AT-14 | Register with a password that does not meet the password requirements | Registration is rejected and the unmet requirements are shown |
| AT-15 | Register with a confirmation password that does not match | Registration is rejected with a mismatch message |
| AT-16 | Log in to an account whose email has not been verified | Login is rejected with a message and an option to resend the verification email |
| AT-17 | Open the verification link from the email | The email address is verified and the user can log in |
| AT-18 | Request a new verification email | A new link is sent and earlier links no longer work |
| AT-19 | Enter an incorrect password 3 times in a row | The account is locked for 24 hours and the correct password is rejected during that time |
| AT-20 | Use "Forgot password" and open the reset link | The user can set a new password that meets the requirements and log in with it; the old password no longer works |

We will use these tests during development and when comparing our two applications.

## 6. Data Requirements

Our application will need to store:

- User accounts, with passwords stored only as secure hashes.
- Email verification status and verification links.
- Login sessions.
- Failed login attempts and account lockout times.
- Password reset links.
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
| 0.3 | November 23, 2026 | Uchenna Obidiegwu (draft for team review) | Added Account Rules for password requirements, email verification, resending verification emails, and blocking unverified accounts from logging in. Added login lockout after 3 failed attempts and a forgot-password option. Updated AT-01 and AT-03, added AT-14 to AT-20, and added verification, session, lockout, and password reset data to the data requirements. |

We will review these proposed revisions together before finalizing the specification.
