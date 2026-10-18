## ADDED Requirements

### Requirement: Sync the family file with git

The app SHALL offer a Sync with Git action that commits the open family file,
pulls and pushes through the repository that contains it, then reloads the file.

#### Scenario: Local change is pushed

- **WHEN** the file has uncommitted changes in a repository with a remote and the user syncs
- **THEN** the change is committed and pushed and a success message is shown

#### Scenario: Remote change is pulled

- **WHEN** the remote has a newer version of the file and the user syncs
- **THEN** the app shows the pulled data

#### Scenario: Nothing to commit

- **WHEN** the file has no local changes and the user syncs
- **THEN** no commit is made, remote changes are still pulled and a success message is shown

#### Scenario: Conflict

- **WHEN** local and remote changes cannot be rebased together
- **THEN** the rebase is aborted, nothing is lost, and an error asks the user to resolve it with git

### Requirement: Sync availability

The app SHALL show whether sync is possible and why not.

#### Scenario: Git missing

- **WHEN** git is not installed
- **THEN** the header says git was not found and offers no sync button

#### Scenario: Not a repository

- **WHEN** the file is not inside a git repository
- **THEN** the header says so and offers no sync button

#### Scenario: No remote

- **WHEN** the repository has no remote
- **THEN** the header says so and offers no sync button

### Requirement: Saves and sync do not interleave

The app SHALL run a sync only after earlier saves have finished, and run later
saves only after the sync has finished.

#### Scenario: Edit during sync

- **WHEN** the user edits while a sync runs
- **THEN** the edit is applied after the sync and is not lost
