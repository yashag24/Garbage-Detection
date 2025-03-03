import { useState } from "react";
import { useToast } from "./useToast";
import useLocation from "./useLocation";

const useFileUpload = () => {
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
            if (preview) {
                URL.revokeObjectURL(preview);
            }
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));
            setError(null);
        } else {
            setError("Please select a valid image file.");
        }
    };

    const handleFileInputClick = () => {
        if (preview) {
            URL.revokeObjectURL(preview);
        }
        setFile(null);
        setPreview(null);
        setResult(null);
    };

    const handleUpload = async () => {
        if (!file) {
            toast({
                title: "No file selected",
                description: "Please select an image first!",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const locationData = await getLocation();

            if (!locationData.latitude || !locationData.longitude) {
                throw new Error("Location not available");
            }

            const formData = new FormData();
            formData.append("image", file);
            formData.append("latitude", locationData.latitude);
            formData.append("longitude", locationData.longitude);

            const response = await fetch("http://localhost:5000/upload", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Error processing image.");
            }

            setResult(data);
            toast({
                title: "Analysis Complete",
                description: `Classification: ${data.prediction} (${(data.confidence * 100).toFixed(2)}%)`,
                variant: data.prediction === "Garbage" ? "destructive" : "default",
            });
        } catch (err) {
            setError(err.message || "An error occurred");
            toast({
                title: "Error",
                description: err.message || "An error occurred during processing",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return {
        file,
        preview,
        result,
        loading,
        error,
        handleFileChange,
        handleFileInputClick,
        handleUpload,
    };
};

export default useFileUpload;