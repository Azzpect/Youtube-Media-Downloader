import express, { Request, Response } from "express";
import { Server } from "socket.io";
import { createServer } from "http";
import cors from "cors";
import ytdl from "@distube/ytdl-core";

const app = express();
const server = createServer(app);
const port = process.env.PORT || 5500;
app.use(express.json());
app.use(cors())


app.get("/", (req: Request, res: Response) => {
    // res.sendFile("./index.html")
    res.json({ message: "Hello World!" });
})

app.get("/get-url-data", (req: Request, res: Response) => {
    const url = req.query.url as string;
    let id = ""
    let status = "invalid"
    if(ytdl.validateURL(url)) {
        id = ytdl.getURLVideoID(url);
        status = "valid"
    }
    res.json({id: id, status: status});
})

const ws = new Server(server);

ws.on("connection", (socket) => {
    console.log(`User connected with socket id: ${socket.id}`);

})



server.listen(port, () => {
    console.log("Server started on port: ", port);
})