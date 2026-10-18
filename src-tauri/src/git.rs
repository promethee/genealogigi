//! Git sync for the open family file, done by running the user's own `git`
//! (their credentials, ssh keys and config), never by talking to a remote
//! directly. Only the family file is ever staged.

use serde::Serialize;
use std::fmt;
use std::path::Path;
use std::process::Command;

#[derive(Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum GitStatus {
    NoGit,
    NotRepo,
    NoRemote,
    Ready,
}

/// A failed sync: a code the UI translates, plus git's own text when it has any.
#[derive(Debug, Serialize)]
pub struct SyncError {
    pub code: &'static str,
    pub detail: String,
}

impl SyncError {
    fn new(code: &'static str) -> Self {
        SyncError {
            code,
            detail: String::new(),
        }
    }

    fn with(code: &'static str, out: &Output) -> Self {
        let detail = if out.stderr.is_empty() {
            &out.stdout
        } else {
            &out.stderr
        };
        SyncError {
            code,
            detail: detail.clone(),
        }
    }
}

impl fmt::Display for SyncError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}: {}", self.code, self.detail)
    }
}

struct Output {
    code: Option<i32>,
    stdout: String,
    stderr: String,
}

impl Output {
    fn ok(&self) -> bool {
        self.code == Some(0)
    }
}

/// Runs `git args` in `dir`. `Err` only when git itself cannot be started.
fn run(dir: &Path, args: &[&str]) -> Result<Output, SyncError> {
    let mut cmd = Command::new("git");
    cmd.current_dir(dir).args(args);
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        cmd.creation_flags(0x0800_0000); // CREATE_NO_WINDOW
    }
    let out = cmd.output().map_err(|e| SyncError {
        code: "spawn",
        detail: e.to_string(),
    })?;
    Ok(Output {
        code: out.status.code(),
        stdout: String::from_utf8_lossy(&out.stdout).trim().to_string(),
        stderr: String::from_utf8_lossy(&out.stderr).trim().to_string(),
    })
}

fn split(file: &Path) -> Result<(&Path, &str), SyncError> {
    let dir = file.parent().ok_or(SyncError::new("bad-path"))?;
    let name = file
        .file_name()
        .and_then(|n| n.to_str())
        .ok_or(SyncError::new("bad-path"))?;
    Ok((dir, name))
}

/// Preferred remote: `origin`, else the first one listed.
fn remote_of(dir: &Path) -> Result<Option<String>, SyncError> {
    let out = run(dir, &["remote"])?;
    if !out.ok() {
        return Ok(None);
    }
    let names: Vec<&str> = out
        .stdout
        .lines()
        .map(str::trim)
        .filter(|l| !l.is_empty())
        .collect();
    Ok(names
        .iter()
        .find(|n| **n == "origin")
        .or_else(|| names.first())
        .map(|n| n.to_string()))
}

pub fn status(file: &Path) -> GitStatus {
    let Ok((dir, _)) = split(file) else {
        return GitStatus::NotRepo;
    };
    if run(dir, &["--version"]).is_err() {
        return GitStatus::NoGit;
    }
    match run(dir, &["rev-parse", "--is-inside-work-tree"]) {
        Ok(out) if out.ok() && out.stdout == "true" => {}
        Ok(_) => return GitStatus::NotRepo,
        Err(_) => return GitStatus::NoGit,
    }
    match remote_of(dir) {
        Ok(Some(_)) => GitStatus::Ready,
        _ => GitStatus::NoRemote,
    }
}

/// Commits the file if it changed, pulls with rebase, pushes. On a conflict the
/// rebase is aborted so nothing is lost and the user can resolve it with git.
pub fn sync(file: &Path) -> Result<&'static str, SyncError> {
    match status(file) {
        GitStatus::Ready => {}
        GitStatus::NoGit => return Err(SyncError::new("no-git")),
        GitStatus::NotRepo => return Err(SyncError::new("not-repo")),
        GitStatus::NoRemote => return Err(SyncError::new("no-remote")),
    }
    let (dir, name) = split(file)?;
    let remote = remote_of(dir)?.ok_or(SyncError::new("no-remote"))?;

    let add = run(dir, &["add", "--", name])?;
    if !add.ok() {
        return Err(SyncError::with("stage", &add));
    }
    // Exit code 1 = there are staged differences for this file.
    let staged = run(dir, &["diff", "--cached", "--quiet", "--", name])?;
    let committed = staged.code == Some(1);
    if committed {
        let commit = run(dir, &["commit", "-m", "Update family data", "--", name])?;
        if !commit.ok() {
            return Err(SyncError::with("commit", &commit));
        }
    }

    let branch = run(dir, &["rev-parse", "--abbrev-ref", "HEAD"])?;
    if !branch.ok() || branch.stdout == "HEAD" {
        return Err(SyncError::new("no-branch"));
    }
    let branch = branch.stdout;

    let has_upstream = run(
        dir,
        &["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}"],
    )?
    .ok();
    let remote_has_branch = !has_upstream
        && run(
            dir,
            &["ls-remote", "--exit-code", "--heads", &remote, &branch],
        )?
        .ok();
    if has_upstream || remote_has_branch {
        let pull = if has_upstream {
            run(dir, &["pull", "--rebase", "--autostash"])?
        } else {
            run(dir, &["pull", "--rebase", "--autostash", &remote, &branch])?
        };
        if !pull.ok() {
            let _ = run(dir, &["rebase", "--abort"]);
            return Err(SyncError::with("merge", &pull));
        }
    }

    let push = run(dir, &["push", "-u", &remote, "HEAD"])?;
    if !push.ok() {
        return Err(SyncError::with("push", &push));
    }
    Ok(if committed { "committed" } else { "no-changes" })
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::path::PathBuf;
    use std::sync::atomic::{AtomicUsize, Ordering};

    static COUNTER: AtomicUsize = AtomicUsize::new(0);

    fn temp_dir(label: &str) -> PathBuf {
        let n = COUNTER.fetch_add(1, Ordering::SeqCst);
        let dir = std::env::temp_dir().join(format!(
            "genealogigi-git-{}-{}-{label}",
            std::process::id(),
            n
        ));
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();
        dir
    }

    fn git_ok(dir: &Path, args: &[&str]) {
        let out = run(dir, args).unwrap();
        assert!(out.ok(), "git {args:?} failed: {}", out.stderr);
    }

    fn configure(dir: &Path) {
        git_ok(dir, &["config", "user.name", "Test"]);
        git_ok(dir, &["config", "user.email", "test@example.com"]);
    }

    /// A bare remote plus a clone with a family file path inside it.
    fn clone_of(remote: &Path, label: &str) -> (PathBuf, PathBuf) {
        let dir = temp_dir(label);
        git_ok(&dir, &["clone", remote.to_str().unwrap(), "."]);
        configure(&dir);
        git_ok(&dir, &["checkout", "-B", "main"]);
        let file = dir.join("family.json");
        (dir, file)
    }

    fn bare_remote() -> PathBuf {
        let remote = temp_dir("remote");
        git_ok(&remote, &["init", "--bare", "-b", "main"]);
        remote
    }

    #[test]
    fn status_reports_not_a_repo() {
        let dir = temp_dir("plain");
        assert_eq!(status(&dir.join("family.json")), GitStatus::NotRepo);
    }

    #[test]
    fn status_reports_no_remote_then_ready() {
        let dir = temp_dir("local");
        git_ok(&dir, &["init", "-b", "main"]);
        assert_eq!(status(&dir.join("family.json")), GitStatus::NoRemote);
        let remote = bare_remote();
        git_ok(&dir, &["remote", "add", "origin", remote.to_str().unwrap()]);
        assert_eq!(status(&dir.join("family.json")), GitStatus::Ready);
    }

    #[test]
    fn sync_refuses_without_a_remote() {
        let dir = temp_dir("noremote");
        git_ok(&dir, &["init", "-b", "main"]);
        let err = sync(&dir.join("family.json")).unwrap_err();
        assert_eq!(err.code, "no-remote");
    }

    #[test]
    fn sync_commits_and_pushes_a_new_file() {
        let remote = bare_remote();
        let (_a, file_a) = clone_of(&remote, "a");
        fs::write(&file_a, "one").unwrap();
        assert_eq!(sync(&file_a).unwrap(), "committed");

        let (_b, file_b) = clone_of(&remote, "b");
        assert_eq!(fs::read_to_string(file_b).unwrap(), "one");
    }

    #[test]
    fn sync_with_nothing_to_commit_makes_no_commit() {
        let remote = bare_remote();
        let (dir, file) = clone_of(&remote, "a");
        fs::write(&file, "one").unwrap();
        sync(&file).unwrap();
        let before = run(&dir, &["rev-list", "--count", "HEAD"]).unwrap().stdout;
        assert_eq!(sync(&file).unwrap(), "no-changes");
        assert_eq!(
            run(&dir, &["rev-list", "--count", "HEAD"]).unwrap().stdout,
            before
        );
    }

    #[test]
    fn sync_pulls_remote_changes() {
        let remote = bare_remote();
        let (_a, file_a) = clone_of(&remote, "a");
        fs::write(&file_a, "one").unwrap();
        sync(&file_a).unwrap();

        let (_b, file_b) = clone_of(&remote, "b");
        fs::write(&file_b, "two").unwrap();
        sync(&file_b).unwrap();

        sync(&file_a).unwrap();
        assert_eq!(fs::read_to_string(&file_a).unwrap(), "two");
    }

    #[test]
    fn conflict_aborts_the_rebase_and_keeps_the_local_commit() {
        let remote = bare_remote();
        let (dir_a, file_a) = clone_of(&remote, "a");
        fs::write(&file_a, "base").unwrap();
        sync(&file_a).unwrap();

        let (_b, file_b) = clone_of(&remote, "b");
        fs::write(&file_b, "from b").unwrap();
        sync(&file_b).unwrap();

        fs::write(&file_a, "from a").unwrap();
        let err = sync(&file_a).unwrap_err();
        assert_eq!(err.code, "merge");
        // Not stuck mid-rebase, local commit and content intact.
        assert!(!dir_a.join(".git/rebase-merge").exists());
        assert!(!dir_a.join(".git/rebase-apply").exists());
        assert_eq!(fs::read_to_string(&file_a).unwrap(), "from a");
        let last = run(&dir_a, &["log", "-1", "--format=%s"]).unwrap().stdout;
        assert_eq!(last, "Update family data");
    }
}
