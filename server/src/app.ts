import express, { Request, Response } from "express";
import { Server, Socket } from "socket.io";
import { createServer } from "http";
import cors from "cors";
import ytdl from "@distube/ytdl-core";
import { downloadFile } from "./download";
import { downloads } from "./data";
import { existsSync } from "fs";
import path from "path";

const app = express();
const server = createServer(app);
const port = process.env.PORT || 5500;
app.use(express.json());
app.use(cors());



//reading downloads data from json file
downloads.init();

app.get("/", (req: Request, res: Response) => {
  // res.sendFile("./index.html")
  const {id} = req.query;
  res.json({ message: downloads.getDownload(id as string) });
});

app.get("/get-url-data", (req: Request, res: Response) => {
  const url = req.query.url as string;
  let id = "";
  let status = "invalid";
  if (ytdl.validateURL(url)) {
    id = ytdl.getURLVideoID(url);
    status = "valid";
    const existingDownload = downloads.getDownload(id)
    if(existingDownload === undefined) {
        downloads.addDownload(id, url);
    }
  }
  res.json({ id: id, status: status });
});

app.get("/download/:filename", (req: Request, res: Response) => {

  const filename = req.params.filename;
  console.log(filename);
  if(existsSync(path.join(__dirname, `../downloads/${filename}`))) {
    res.download(path.join(__dirname, `../downloads/${filename}`), (err) => {
      if(err) {
        console.log("Error downloading file: ");
        res.status(500).send("Error downloading file");
      }
    })
  }
  else {
    res.status(500).send("Error downloading file");
  }

})

const ws = new Server(server, {
  cors: {
    origin: "*",
  },
});

type SocketList = {
  [id: string]: Socket[]
}

let socketList: SocketList = {}

ws.on("connection", (socket) => {
  console.log(`User connected with socket id: ${socket.id}`);

  socket.on("start-processing", async (id: string) => {

    if(id in socketList) {
      socketList[id].push(socket)
    }
    else {
      socketList[id] = [socket]
    }

    console.log(`Processing started for video id: ${id}`);
    const downloadObj = downloads.getDownload(id)
    if(downloadObj !== undefined && (downloadObj.status === "not started" || downloadObj.status === "failed")) {
        await downloadFile(id, downloadObj.url)
        downloads.updateDownloadStatus(id, "complete")
        socketList[id].forEach(s => s.emit("download-complete", { status: "complete", url: `download/${id}.mp4` }))
        delete socketList[id];
    }
    else if(downloadObj !== undefined && downloadObj.status === "complete")
      socket.emit("download-complete", { status: "complete", url: `download/${id}.mp4` })
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

server.listen(port, () => {
  console.log("Server started on port: ", port);
});
