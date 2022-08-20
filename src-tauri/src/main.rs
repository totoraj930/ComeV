#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

use std::process::Command;
use std::{sync::{Mutex, mpsc}, thread};

use actix_web::web::Data;
use cmd::{server::ChatServer, broadcast::Broadcaster};
use tauri::State;
use webbrowser;
pub mod cmd;

#[tauri::command]
fn start_chat_server(app_handle: tauri::AppHandle, chat_server: State<Mutex<ChatServer>>, port: u16) -> Result<(), String> {
  let mut chat_server = chat_server.lock().unwrap();
  chat_server.stop();
  let (tx, rx) = mpsc::channel::<()>();
  let (tx2, rx2) = mpsc::channel::<Data<Broadcaster>>();
  chat_server.tx_stop = Some(Mutex::new(tx));
  let path = app_handle.path_resolver().app_dir().unwrap();
  let path = path.into_os_string().into_string().unwrap();
  thread::spawn(move || {
    let i:&'static str = Box::leak(path.into_boxed_str());
    cmd::server::run(rx, port, i, tx2, app_handle);
  });
  let brs = rx2.recv().unwrap();
  chat_server.broadcaster = Some(brs);
  Ok(())
}

#[tauri::command]
fn stop_chat_server(chat_server: State<Mutex<ChatServer>>) -> Result<(), String> {
  let mut chat_server = chat_server.lock().unwrap();
  chat_server.stop();
  Ok(())
}

#[tauri::command]
fn send_chat(chat_server: State<Mutex<ChatServer>>, data: &str) -> Result<(), String> {
  // broadcaster.send("Hello");
  let chat_server = chat_server.lock().unwrap();
  let bros = chat_server.broadcaster.as_ref();

  if let Some(bros) = bros {
    bros.send(data);
    Ok(())
  } else {
    Ok(())
  }
}

#[tauri::command]
fn has_chat_server(chat_server: State<Mutex<ChatServer>>) -> Result<bool, ()> {
  let chat_server = chat_server.lock().unwrap();
  let bros = chat_server.broadcaster.as_ref();
  match bros {
    Some(_) => Ok(true),
    None => Ok(false)
  }
}

#[tauri::command]
fn open_in_browser(url: &str) -> Result<(), String> {
  if webbrowser::open(url).is_err() {
    return Err(String::from("Not Support"));
  }
  Ok(())
}

#[tauri::command]
fn open_in_explorer(path: &str) -> Result<(), String> {
  Command::new("explorer")
    .arg(path)
    .spawn()
    .unwrap();
  Ok(())
}

fn main() {
  let chat_server = Mutex::new(ChatServer::new());
  tauri::Builder::default()
    .manage(chat_server)
    .invoke_handler(tauri::generate_handler![
      start_chat_server,
      stop_chat_server,
      send_chat,
      has_chat_server,
      open_in_browser,
      open_in_explorer
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}