use std::sync::{mpsc, Mutex};
use actix_files as fs;
use actix_files::NamedFile;
use actix_web::{
  dev::Service as _,
  http::header::{self, HeaderValue},
  middleware,
  web::{self, Data},
  App, HttpResponse, HttpRequest, HttpServer, Responder,
};
use tauri::Manager;
use tauri::api;

use crate::cmd::broadcast::Broadcaster;

// async fn index(req: HttpRequest) -> Result<NamedFile, std::io::Error> {
//   let path: PathBuf = req.match_info().query("filename").parse().unwrap();
//   Ok(NamedFile::open(path)?)
// }

// async fn twitch_login(req: HttpRequest) -> Result<HttpResponse, actix_web::Error> {
//   let query_str = req.query_string();
//   let mut res = HttpResponse::Ok();
//   let res_str:&'static str = Box::leak(query_str.into());
//   res.body(res_str);
//   Ok(res.finish())
// }

async fn twitch_redirect(app_handle: Data<tauri::AppHandle>) -> Result<NamedFile, actix_web::Error> {
  let dir = api::path::resource_dir(&app_handle.package_info(), &app_handle.env()).unwrap();
  let path = dir.join("assets/twitch_redirect.html");
  Ok(NamedFile::open(path)?)
}

async fn twitch_token(app_handle: Data<tauri::AppHandle>, req: HttpRequest) -> impl Responder {
  let query_str = req.query_string();
  app_handle.emit_all("twitch_token", query_str).expect("failed emit twitch_token.");
  HttpResponse::Ok().content_type("text/html").body("Ok")
}

async fn come_view(app_handle: Data<tauri::AppHandle>) -> Result<NamedFile, actix_web::Error> {
  let dir = api::path::resource_dir(&app_handle.package_info(), &app_handle.env()).unwrap();
  let path = dir.join("assets/come_view.html");
  Ok(NamedFile::open(path)?)
}

#[actix_web::main]
pub async fn run(rx_stop: mpsc::Receiver<()>, port: u16, path: &'static str, tx: mpsc::Sender<Data<Broadcaster>>, app_handle: tauri::AppHandle) {
  let data = Broadcaster::create();
  tx.send(data.clone()).expect("failed send Broadcaster.");
  let server = HttpServer::new( move || {
    let tauri_app = app_handle.clone();
    App::new()
      .wrap_fn(|req, srv| {
        let fut = srv.call(req);
        async {
            let mut res = fut.await?;
            res.headers_mut()
                .insert(header::ACCESS_CONTROL_ALLOW_ORIGIN, HeaderValue::from_static("*"));
            Ok(res)
        }
      })
      .app_data(Data::new(tauri_app))
      .app_data(data.clone())
      .wrap(middleware::Logger::default())
      .route("/twitch_redirect", web::get().to(twitch_redirect))
      .route("/twitch_token", web::get().to(twitch_token))
      .route("/api", web::get().to(new_client))
      .route("/come_view", web::get().to(come_view))
      .service(fs::Files::new("/", path).show_files_listing())
  })
  .bind(("127.0.0.1", port)).unwrap().run();
  let handle = server.handle();
  println!("Start Server {}", &port);

  tokio::spawn(async move {
    rx_stop.recv().unwrap();
    println!("Stop Server");
    handle.stop(false).await;
  });

  server.await.unwrap();
}

async fn new_client(broadcaster: Data<Broadcaster>) -> impl Responder {
  let rx = broadcaster.new_client();

  println!("{:?}", rx);

  HttpResponse::Ok()
      .append_header((header::CONTENT_TYPE, "text/event-stream"))
      .append_header((header::ACCESS_CONTROL_ALLOW_ORIGIN, "*"))
      .streaming(rx)
}


pub struct ChatServer {
  pub tx_stop: Option<Mutex<mpsc::Sender<()>>>,
  pub broadcaster: Option<Data<Broadcaster>>
}

impl ChatServer {
  pub fn new() -> Self {
    Self {
      tx_stop: None,
      broadcaster: None
    }
  }

  pub fn stop(&mut self) {
    let tx = self.tx_stop.as_ref();
    match tx {
        Some(_) => {
          tx.unwrap().lock().unwrap().send(()).unwrap();
        }
        None => {

        }
    }
    self.tx_stop = None;
  }
}
