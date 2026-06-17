import Plus from './plus'
import './FileUpload.css'
import { useState, useRef } from 'react'
export function FileUpload() {
    
    const [file, setFile] = useState();
    const uploader = useRef<HTMLInputElement>(null);
    return (
        <div className="fileContainer">
            <div className="plusIcon" onClick={clickUploader}><Plus/></div>
            <input type="file" ref={uploader} onChangeCapture={uploadFile} style={{"display": "none"}}/>
        </div>
    )
    function clickUploader() {
        if (uploader.current) {
            uploader.current.click()
        }
    }
    function uploadFile() {
        console.log("hi2");
        if (uploader.current !== null && uploader.current.files !== null) {
            console.log("hi");
            const formData = new FormData();
            formData.append("file", uploader.current.files[0])
            const request = fetch("/csv", {
                "method": "POST",
                "body": formData
            })
        }
    }

}