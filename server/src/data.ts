import { writeFileSync, readFileSync } from "fs";

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

export const downloads: Downloads = {
  downloads: {},
  getDownload: (id: string) => {
    return downloads.downloads[id];
  },
  addDownload: (
    id: string,
    url: string,
    status: DownloadStatus = "not started"
  ) => {
    downloads.downloads[id] = { url: url, status: status };
    downloads.saveDownloads();
  },
  updateDownloadStatus: (id: string, status: DownloadStatus) => {
    downloads.downloads[id].status = status;
    downloads.saveDownloads();
  },
  saveDownloads: () => {
    writeFileSync(
      "./downloads.json",
      JSON.stringify(downloads.downloads, null, 2)
    );
  },
  init: () => {
    const data = JSON.parse(readFileSync("./downloads.json", "utf-8"));
    downloads.downloads = data;
  },
};
