import { createWriteStream, unlink, unlinkSync } from "fs";
import ytdl from "@distube/ytdl-core";
import { spawn } from "child_process";
import { downloads } from "./data";

const ffmpegPath = "./ffmpeg.exe";

export async function downloadVideoFile(id: string, url: string) {

    const audioFilePath = `./downloads/${id}-audio.mp4`;
    const videoFilePath = `./downloads/${id}-video.mp4`;
    const outputFilePath = `./downloads/${id}.mp4`;
    
    try {
        const videofileStream = createWriteStream(videoFilePath)
        
        downloads.updateDownloadStatus(id, "downloading")

        const videoDownload = new Promise<void>((resolve, reject) => {
            console.log("starting video download");
            const downstream = ytdl(url)
            downstream.pipe(videofileStream)
            downstream.on("error", reject)
            videofileStream.on("finish", resolve)
            videofileStream.on("error", reject)
            console.log("video download complete");
        })

        

        await Promise.all([videoDownload, downloadAudioFile(id, url)])
        downloads.updateDownloadStatus(id, "merging")
        await mergeVideoAndAudio(audioFilePath, videoFilePath, outputFilePath)
        
    }
    catch(err) {
        console.log("Error: ", err);
    }
    finally {
        console.log("closing stream");
        unlinkSync(videoFilePath)
    }
}

export async function downloadAudioFile(id: string, url: string) {
    
    const audioFilePath = `./downloads/${id}-audio.mp4`;

    const audiofileStream = createWriteStream(audioFilePath)
    return new Promise<void>((resolve, reject) => {
        console.log("starting audio download");
        const downstream = ytdl(url, {
            quality: "highestaudio",
            filter: "audioonly",
        })
        downstream.pipe(audiofileStream)
        downstream.on("error", reject)
        audiofileStream.on("finish", resolve)
        audiofileStream.on("error", reject)
        console.log("audio download complete");
    })
}

async function mergeVideoAndAudio(audioFilePath: string, videoFilePath: string, outputFilePath: string) {
    return new Promise<void>((resolve, reject) => {
        try {
            console.log("starting merge process");
    
            const ffmpeg = spawn(ffmpegPath as string, [
                "-i", videoFilePath,
                "-i", audioFilePath,
                "-c:v", "copy",
                "-c:a", "aac",
                "-map", "0:v", 
                "-map", "1:a",
                outputFilePath
            ])
    
            ffmpeg.on("close", (code) => {
                if(code === 0) {
                    console.log("merge process complete")
                    resolve()
                }
                else {
                    console.log("merge process failed")
                    reject()
                }
            })

            ffmpeg.on("error", (err) => {
                console.log("Error: ", err);
                reject()
            })
        }
        catch(err) {
            console.log("Error: ", err);
            reject()
        }
    })
}