import { createContext, useContext, useState } from "react";
import { useToast } from "../hooks/useToast";
import useLocation from "../hooks/useLocation";

const AppContext = createContext();

export const AppProvider = ({ children }) => {
    const { toast } = useToast();
    const { getLocation } = useLocation();
    
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            if (preview) URL.revokeObjectURL(preview);
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));
            setError(null);
        } else {
            setError("Please select a valid image file.");
        }
    };

    const handleFileInputClick = () => {
        if (preview) URL.revokeObjectURL(preview);
        setFile(null);
        setPreview(null);
        setResult(null);
    };

    const handleUpload = async () => {
        if (!file) {
            toast({ title: "No file selected", description: "Please select an image first!", variant: "destructive" });
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const locationData = await getLocation();
            const formData = new FormData();
            formData.append("image", file);
            formData.append("latitude", locationData.latitude);
            formData.append("longitude", locationData.longitude);

            const response = await fetch("http://localhost:5000/upload", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) throw new Error("Upload failed");
            
            const data = await response.json();
            setResult(data);
            toast({
                title: "Analysis Complete",
                description: `Classification: ${data.prediction} (${(data.confidence * 100).toFixed(2)}%)`,
                variant: data.prediction === "Garbage" ? "destructive" : "default"
            });

        } catch (err) {
            setError(err.message || "An error occurred");
            toast({
                title: "Error",
                description: err.message || "Upload failed",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <AppContext.Provider value={{
            file,
            preview,
            result,
            loading,
            error,
            handleFileChange,
            handleFileInputClick,
            handleUpload
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => useContext(AppContext);