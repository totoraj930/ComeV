use std::path::PathBuf;
use std::sync::{mpsc, Mutex};
use std::thread;
use actix_files as fs;
use actix_files::NamedFile;
use actix_web::{
  http::header::{self, ContentType},
  middleware,
  web::{self, Data, Path},
  App, HttpResponse, HttpRequest, HttpServer, Responder,
};

use crate::cmd::broadcast::{Broadcaster, Client};

async fn index(req: HttpRequest) -> Result<NamedFile, std::io::Error> {
  let path: PathBuf = req.match_info().query("filename").parse().unwrap();
  Ok(NamedFile::open(path)?)
}


#[actix_web::main]
pub async fn run(rx_stop: mpsc::Receiver<()>, port: u16, path: &'static str, tx: mpsc::Sender<Data<Broadcaster>>) {
  let data = Broadcaster::create();
  tx.send(data.clone());
  let server = HttpServer::new( move || {
    App::new()
      .app_data(data.clone())
      .wrap(middleware::Logger::default())
      .route("/api", web::get().to(new_client))
      .service(fs::Files::new("/", path).show_files_listing())
  })
  .bind(("127.0.0.1", port)).unwrap().run();
  let handle = server.handle();
  println!("Start Server {}", &port);

  thread::spawn(move || {
    rx_stop.recv().unwrap();
    println!("Stop Server");
    handle.stop(false);
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
