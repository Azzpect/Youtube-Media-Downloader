import path from "path";
import { downloads } from "./data";
import { unlinkSync } from "fs";


export function cleanUp(): void {
    setInterval(() => {
        const now = new Date().getTime()
        for(let id in downloads.downloads) {
            const download = downloads.downloads[id]
            if(now - download.createAt >= 1000 * 60 * 60 * 24 && download.status === "complete") {
                delete downloads.downloads[id]
                downloads.saveDownloads()
                unlinkSync(path.join(__dirname, `../downloads/${id}.mp4`))
                unlinkSync(path.join(__dirname, `../downloads/${id}-audio.mp4`))
                console.log(`${id} has been deleted`);
            }
        }
    }, 1000 * 60 * 60)
}