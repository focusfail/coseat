import Plus from './Plus'
import './FileUpload.css'
import { useRef, useState } from 'react'
export function FileUpload() {
    const [isUploading, setIsUploading] = useState(false);
    const uploader = useRef<HTMLInputElement>(null);
    return (
        <div className="fileContainer" onClick={clickUploader}>
            <div className="plusIcon"><Plus className="plus" /></div>
            <input type="file" ref={uploader} onChange={uploadFile} style={{"display": "none"}} disabled={isUploading}/>
        </div>
    )
    function clickUploader() {
        if (uploader.current && !isUploading) {
            uploader.current.click()
        }
    }
    async function uploadFile() {
        const selectedFile = uploader.current?.files?.[0];
        if (selectedFile && !isUploading) {
            setIsUploading(true);
            const formData = new FormData();
            formData.append("file", selectedFile);
            try {
                const response = await fetch("/api/csv", {
                    method: "POST",
                    body: formData
                });
                const result = await response.json();
                if (response.ok) {
                    if (result.error) {
                        throw new Error(result.error);
                    }
                    window.location.reload()
                } else {
                    throw new Error(result.error ?? "Upload failed");
                }
            } catch (error) {
                alert("Fehler beim Hochladen der Datei.")
                console.log(error);
                setIsUploading(false);
            }
        }
    }

}
