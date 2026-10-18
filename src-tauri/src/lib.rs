mod git;

use std::path::Path;

#[tauri::command]
fn git_status(file_path: String) -> git::GitStatus {
    git::status(Path::new(&file_path))
}

// Runs git, which can take a while (network), so keep it off the UI thread.
#[tauri::command]
async fn git_sync(file_path: String) -> Result<&'static str, git::SyncError> {
    tauri::async_runtime::spawn_blocking(move || git::sync(Path::new(&file_path)))
        .await
        .map_err(|e| git::SyncError {
            code: "unknown",
            detail: e.to_string(),
        })?
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .invoke_handler(tauri::generate_handler![git_status, git_sync])
        .run(tauri::generate_context!())
        .expect("error while running Genealogigi");
}
