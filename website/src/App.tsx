import { useEffect, useState, useRef } from "react"
import "./styles/App.css"
import io, { Socket } from "socket.io-client"


function App() {

  const [media, setMedia] = useState<{ id: string, status: "valid" | "invalid" }>({ id: "", status: "invalid" })
  const [download, setDownload] = useState<{status: undefined | "complete" | "failed", url: string}>()
  const [showProgress, setShowProgress] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const typeRef = useRef<HTMLSelectElement>(null)
  const wsRef = useRef<Socket>()


  useEffect(() => {

    if(wsRef.current === undefined && media.status === "valid") {
      wsRef.current = io(import.meta.env.VITE_API_SERVER as string)
    }


    wsRef.current?.on("download-complete", ({status, url}) => {
      setDownload({status: status, url: `/${url}`})
      setShowProgress(false)
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
          <div className="w-[90%] flex flex-wrap gap-[1.2rem] justify-center items-center">
            <input ref={inputRef} type="text" className="outline-none bg-[#313131] text-white text-sm px-2 py-1 min-w-[50vw] max-w-[70vw] rounded-lg" placeholder="Enter Youtube Video URL...."/>
            <button className="bg-white text-background text-sm rounded-lg p-2 mx-3" onClick={ async () => {
              const res = await fetch(`/get-url-data?url=${inputRef.current?.value}`)
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
          <div className="flex flex-col items-center my-8 w-[90vw] sm:w-[50vw] h-[50vh]">
            <iframe src={`https://www.youtube.com/embed/${media.id}`} className="w-[90%] h-[80%]"></iframe>
            {showProgress &&
            <div className="w-full h-[2rem] my-4 relative">
              <div className="progress"></div>
              <p className="text-lg font-semibold absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">Progress</p>
            </div>
            }
            <div className="flex items-center justify-between w-full">
              <select ref={typeRef} className="py-1 px-2 rounded-lg" onChange={() => {setDownload({status: undefined, url: ""})}}>
                <option value="video">Video</option>
                <option value="Audio">Audio</option>
              </select>
              {download?.status !== "complete" && <button className="bg-white text-background text-sm rounded-lg p-2 my-3" onClick={() => {
                wsRef.current?.emit("start-processing", media.id, typeRef.current?.value)
                setShowProgress(true)
              }}>Start Processing</button>}
              {download?.status === "complete" && <a href={download.url} className="bg-white text-background text-sm rounded-lg p-2 my-3" download={true}>Download</a>}
              {download?.status === "failed" && <button className="bg-red-500 text-white text-background text-sm rounded-lg p-2 my-3">Failed</button>}
            </div>
          </div>
          }
        </div>
      </div>
    </>
  )
}

export default App
