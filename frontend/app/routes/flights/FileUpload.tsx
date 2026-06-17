import Plus from './plus'
import './FileUpload.css'
import { useState, useRef } from 'react'
export function FileUpload() {
    const [file, setFile] = useState();
    const uploader = useRef<HTMLInputElement>(null);
    return (
        <div className="fileContainer">
            <div className="plusIcon" onClick={clickUploader}><Plus/></div>
            <input type="file" ref={uploader} style={{"display": "none"}}/>
        </div>
    )
    function clickUploader() {
        if (uploader.current) {
            uploader.current.click()
        }
    }
}