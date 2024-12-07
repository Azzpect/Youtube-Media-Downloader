import { useEffect, useState, useRef } from "react"
import "./styles/App.css"
import io, { Socket } from "socket.io-client"


function App() {

  const [media, setMedia] = useState<{ id: string, status: "valid" | "invalid" }>({ id: "", status: "invalid" })
  const [download, setDownload] = useState<{status: undefined | "complete" | "failed", url: string}>()
  const inputRef = useRef<HTMLInputElement>(null)
  const wsRef = useRef<Socket>()


  useEffect(() => {

    if(wsRef.current === undefined && media.status === "valid") {
      wsRef.current = io(import.meta.env.VITE_API_SERVER as string)
    }


    wsRef.current?.on("download-complete", ({status, url}) => {
      setDownload({status: status, url: `${import.meta.env.VITE_API_SERVER as string}/${url}`})
    })


    wsRef.current?.on("download-started", () => {
      console.log("started");
    })


    return () => {
      wsRef.current?.disconnect()
      wsRef.current = undefined
    }

  }, [media])

  return (
    <>
      <div className="bg-primary w-screen h-screen">
        <div className="w-[85vw] mx-auto flex flex-col items-center">
          <h1 className="text-3xl text-white font-bold my-8">Download Your Favourite Youtube Videos</h1>
          <div className="w-[90%] flex justify-center items-center">
            <input ref={inputRef} type="text" className="outline-none bg-[#313131] text-white text-sm px-2 py-1 w-1/2 rounded-lg" placeholder="Enter Youtube Video URL...."/>
            <button className="bg-white text-background text-sm rounded-lg p-2 mx-3" onClick={ async () => {
              const res = await fetch(`${import.meta.env.VITE_API_SERVER as string}/get-url-data?url=${inputRef.current?.value}`)
              const data = await res.json()
              setMedia(data)
            }}>Search</button>
            <button className="bg-white text-background text-sm rounded-lg p-2 mx-3" onClick={() => {
              if(inputRef.current !== null) {
                inputRef.current.value = ""
                setMedia({ id: "", status: "invalid" })
                setDownload({status: undefined, url: ""})
              }

            }}>Reset</button>
          </div>
          {media.status === "valid" &&
          <div className="flex flex-col items-center my-8">
            <iframe src={`https://www.youtube.com/embed/${media.id}`} width="560" height="315"></iframe>
            {download?.status !== "complete" && <a className="bg-white text-background text-sm rounded-lg p-2 my-3" onClick={() => {
              wsRef.current?.emit("start-processing", media.id)
            }}>Start Processing</a>}
            {download?.status === "complete" && <a href={download.url} className="bg-white text-background text-sm rounded-lg p-2 my-3" download={true}>Download</a>}
            {download?.status === "failed" && <a className="bg-red-500 text-white text-background text-sm rounded-lg p-2 my-3" download={true}>Failed</a>}
          </div>
          }
        </div>
      </div>
    </>
  )
}

export default App
