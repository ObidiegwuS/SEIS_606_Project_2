# GuessMoji – Project 2 Peer-Review Report

**Course:** SEIS 606 – Vibe Coding  
**Project:** GuessMoji  
**Team Members:** Ezana Asfaw and Uchenna Obidiegwu  
**Peer-Review Date:** November 11, 2026  
**Collaborating Reviewers:** Adam Levonian and Ryan  
**Collaborating Team Name:** [Enter team name if different from reviewer names]

## 1. Project Overview

GuessMoji is an emoji guessing game where players identify movies or countries based on emoji clues.

We selected the Platform Bake-off approach because of our different schedules. We are each developing our own version of the application using ChatGPT Pro and Claude Pro.

Both versions will follow the same project requirements. We will compare them using shared acceptance tests and evaluation criteria.

## 2. Peer-Review Summary

During the November 11 peer-review activity, we received feedback from Adam and Ryan.

They pointed out that our original documentation did not clearly explain our individual responsibilities or how much decision-making authority we planned to give AI agents.

They also raised concerns about code licensing, privacy risks, and the instructions provided to our agents.

Based on this feedback, we revised our specification and contract and created an AGENTS.md file to clarify how we will manage AI-assisted development.

## 3. Responses to Peer Review

| Feedback | Decision | Reason | Where It Changed |
|---|---|---|---|
| Our individual responsibilities were unclear. | Accepted | We clarified that each of us is responsible for developing, testing, and reviewing our own version of GuessMoji. Shared decisions require agreement from both of us. | contract.md – Section 2 |
| Our approach to AI oversight was unclear. | Accepted | We clarified that AI agents can generate code and suggest improvements, but humans must review important changes and make final decisions. | contract.md – Section 7; AGENTS.md – Sections 2–3 |
| Errors and edge cases could not be evaluated from our documentation. | Accepted | We added clearer rules for blank answers, incorrect answers, capitalization, duplicate scoring, and unauthorized access. | spec.md – Sections 4–5; contract.md – Section 5 |
| Reviewers could not determine whether the contract matched the specification. | Accepted | We aligned the acceptance tests and shared requirements across both documents. We also added a process for checking future changes. | spec.md – Section 5; contract.md – Sections 5 and 9 |
| Reviewers could not determine whether the changelog was up to date. | Accepted | We added version histories describing the initial drafts and peer-review revisions. | spec.md – Section 9; contract.md – Section 13 |
| Add an AGENTS.md file to help agents identify contract discrepancies. | Accepted | We agreed that a shared instruction file would help clarify agent behavior and guide consistency checks. Human review is still required. | AGENTS.md – Sections 3, 7, and 9 |
| Player nickname exposure may not be a meaningful privacy risk because nicknames are optional. | Partially accepted; rejected removing the data privacy risk entirely | We agreed that voluntarily sharing a nickname is not necessarily a significant privacy risk. However, our application requires user accounts and saved progress, so protecting private account information remains important. We revised the risk rather than removing it. | spec.md – Section 8 |
| Our mitigation for AI-generated code did not address software licensing. | Accepted | We expanded our mitigation to include reviewing third-party dependencies and checking their licenses before using them. | spec.md – Section 8; AGENTS.md – Section 6 |
| Instructions and constraints for coding agents were not visible. | Accepted | We created AGENTS.md to document agent permissions, restrictions, testing expectations, and human approval requirements. | AGENTS.md; contract.md – Section 7 |

## 4. Summary of Changes

Following the peer review, we made three main documentation updates.

### Specification

We updated the specification to clarify the game's requirements and acceptance tests. We also added the full Risks & Governance section.

We revised our privacy risk to focus on protecting user account information rather than optional public nicknames.

We also clarified who is responsible for reviewing risks and how we plan to address them.

### Contract

We clarified our individual responsibilities, AI oversight rules, and GitHub workflow.

We updated the acceptance tests to match our revised specification and added a process for checking whether future changes affect the contract.

### AI Agent Instructions

We created an AGENTS.md file after receiving the suggestion from Adam and Ryan.

This file explains what our AI agents are allowed to do, what requires human approval, and how agents should review the specification and contract before proposing changes.

## 5. GitHub Pull Request

**Pull Request:** To be added after creating the pull request.

We will use the pull request to show the differences between our original documentation and the revised versions.

The pull request will include the updated specification, contract, and AGENTS.md file, along with this peer-review report.

## 6. Reflection

The peer review helped us identify areas where our project documentation was unclear.

One important takeaway was that even though we are using AI tools to build the application, we still need to clearly define our responsibilities and review the work ourselves.

We also learned that our specification and contract need to be detailed enough for someone else to understand and evaluate both versions of GuessMoji.

Overall, the feedback helped us improve our documentation before continuing development.
