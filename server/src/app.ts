import express, { Request, Response } from "express";
import { Server } from "socket.io";
import { createServer } from "http";
import cors from "cors";
import ytdl from "@distube/ytdl-core";
import { readFileSync, writeFileSync } from "fs";
import { download } from "./download";

const app = express();
const server = createServer(app);
const port = process.env.PORT || 5500;
app.use(express.json());
app.use(cors());

interface Downloads {
  downloads: Download;
  getDownload: (id: string) => DownloadObj | undefined;
  addDownload: (id: string, url: string, status?: DownloadStatus) => void;
  updateDownloadStatus: (id: string, status: DownloadStatus) => void;
  saveDownloads: () => void;
  init: () => void;
}

type Download = {
  [id: string]: DownloadObj;
};

type DownloadObj = {
  url: string;
  status: DownloadStatus;
};
type DownloadStatus =
  | "downloading"
  | "complete"
  | "failed"
  | "merging"
  | "not started";

const downloads: Downloads = {
    downloads: {},
    getDownload: (id: string) => {
        return downloads.downloads[id];
    },
    addDownload: (id: string, url: string, status: DownloadStatus = "not started") => {
        downloads.downloads[id] = { url: url, status: status };
        downloads.saveDownloads();
    },
    updateDownloadStatus: (id: string, status: DownloadStatus) => {
        downloads.downloads[id].status = status;
        downloads.saveDownloads();
    },
    saveDownloads: () => {
        writeFileSync("./downloads.json", JSON.stringify(downloads.downloads, null, 2))
    },
    init: () => {
        const data = JSON.parse(readFileSync("./downloads.json", "utf-8"));
        downloads.downloads = data;
    }
}

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

const ws = new Server(server, {
  cors: {
    origin: "*",
  },
});

ws.on("connection", (socket) => {
  console.log(`User connected with socket id: ${socket.id}`);

  socket.on("start-processing", async (id: string) => {
    console.log(`Processing started for video id: ${id}`);
    const downloadObj = downloads.getDownload(id)
    if(downloadObj !== undefined && downloadObj.status === "not started") {
        console.log("Starting download");

        await download(id, downloadObj.url)
    }
    else
        console.log("Error starting download");
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

server.listen(port, () => {
  console.log("Server started on port: ", port);
});
