# Git Workflow & Push Command Rule

## Trigger Keyword
Whenever the user requests a **"push"** (or uses the keyword "push"):

## Execution Protocol
1. **Create Feature Branch**: Switch to / create a dedicated feature branch (e.g. `feat/<task-name>` or `dev/<task-name>`).
2. **Commit & Push Branch**: Commit all changes to the feature branch and push to `origin <feature-branch>`.
3. **Merge to Main & Push**: Checkout `main`, merge the feature branch into `main`, and push `main` to `origin/main`.
