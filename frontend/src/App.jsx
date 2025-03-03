import { useState, useEffect } from "react";
import { useToast } from "./components/ui/use-toast";

function App() {
    const { toast } = useToast();
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [location, setLocation] = useState({ 
        latitude: null, 
        longitude: null,
        status: "idle" // idle, loading, success, error
    });

    // Clear results when unmounting
    useEffect(() => {
        return () => {
            if (preview) {
                URL.revokeObjectURL(preview);
            }
        };
    }, [preview]);

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

    const getLocation = async () => {
        setLocation(prev => ({ ...prev, status: "loading" }));
        
        return new Promise((resolve, reject) => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        setLocation({
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                            status: "success"
                        });
                        resolve({
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude
                        });
                    },
                    (error) => {
                        console.error("Error fetching location:", error);
                        setLocation(prev => ({ ...prev, status: "error" }));
                        setError("Unable to fetch location. Please enable location services.");
                        reject(error);
                    }
                );
            } else {
                setLocation(prev => ({ ...prev, status: "error" }));
                setError("Geolocation is not supported by your browser.");
                reject(new Error("Geolocation not supported"));
            }
        });
    };

    const handleUpload = async () => {
        if (!file) {
            toast({
                title: "No file selected",
                description: "Please select an image first!",
                variant: "destructive"
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
                variant: data.prediction === "Garbage" ? "destructive" : "default"
            });

        } catch (err) {
            setError(err.message || "An error occurred");
            toast({
                title: "Error",
                description: err.message || "An error occurred during processing",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-50 p-6">
            {/* Header Section */}
            <header className="w-full max-w-[1000px] text-center mb-8">
                <h1 className="text-4xl md:text-5xl font-extrabold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-blue-500 to-indigo-600">
                    Roadside Garbage Detection
                </h1>
                <p className="text-gray-600 max-w-xl mx-auto">
                    Help keep our environment clean by identifying and reporting roadside garbage
                </p>
            </header>
            
            {/* Main Card */}
            <main className="w-full max-w-[1000px] bg-white rounded-xl shadow-xl overflow-hidden backdrop-blur-sm bg-opacity-95 border border-gray-100">
                {/* Card Header */}
                <div className="bg-gradient-to-r from-emerald-500 via-blue-500 to-indigo-500 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-white font-bold text-lg">Image Analysis</h2>
                    <div className="flex space-x-1">
                        <span className="h-3 w-3 rounded-full bg-red-400"></span>
                        <span className="h-3 w-3 rounded-full bg-yellow-400"></span>
                        <span className="h-3 w-3 rounded-full bg-green-400"></span>
                    </div>
                </div>
                
                {/* Upload Section */}
                <section className="p-6">
                    <UploadArea 
                        preview={preview}
                        file={file}
                        handleFileChange={handleFileChange}
                        handleFileInputClick={handleFileInputClick}
                    />
                    
                    {/* Button Section */}
                    <div className="mt-6">
                        <button
                            onClick={handleUpload}
                            disabled={loading || !file}
                            className="w-full px-6 py-3 relative overflow-hidden group bg-gradient-to-r from-emerald-500 via-blue-500 to-indigo-600 text-white font-medium rounded-xl flex items-center justify-center shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300"
                            aria-label="Upload and analyze image"
                        >
                            <span className="absolute right-0 w-8 h-32 -mt-12 transition-all duration-1000 transform translate-x-12 bg-white opacity-10 rotate-12 group-hover:-translate-x-96 ease"></span>
                            {loading ? (
                                <LoadingSpinner text="Processing..." />
                            ) : (
                                <span className="flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                    Upload & Classify
                                </span>
                            )}
                        </button>
                    </div>
                    
                    {/* Error Message */}
                    {error && (
                        <ErrorMessage message={error} />
                    )}
                </section>
                
                {/* Results Section */}
                {result && (
                    <AnalysisResults result={result} />
                )}
            </main>
            
            {/* Footer with helper text */}
            <footer className="mt-6 text-center">
                <p className="text-sm text-gray-500">
                    Help keep our communities clean by reporting roadside garbage
                </p>
                <p className="text-xs text-gray-400 mt-2">
                    © {new Date().getFullYear()} Roadside Garbage Detection Project
                </p>
            </footer>
        </div>
    );
}

// Component for the upload area with drag and drop functionality
const UploadArea = ({ preview, file, handleFileChange, handleFileInputClick }) => {
    const [isDragging, setIsDragging] = useState(false);
    
    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };
    
    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };
    
    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isDragging) setIsDragging(true);
    };
    
    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const droppedFile = e.dataTransfer.files[0];
            if (droppedFile.type.startsWith('image/')) {
                // Create a new event-like object with the file
                const event = { target: { files: [droppedFile] } };
                handleFileChange(event);
            }
        }
    };
    
    return (
        <div className="relative group">
            <div 
                className={`relative border-2 rounded-xl transition-all duration-300 overflow-hidden ${
                    isDragging ? 'border-blue-500 bg-blue-50' : 
                    preview ? 'border-blue-200 bg-blue-50' : 
                    'border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                }`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
            >
                {!preview ? (
                    <div className="py-10 flex flex-col items-center justify-center">
                        <div className="mb-3 p-3 rounded-full bg-blue-100 text-blue-500">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                        </div>
                        <p className="text-base font-medium text-gray-700">Drag & drop an image</p>
                        <p className="text-sm text-gray-500 mb-2">or click to browse files</p>
                        <p className="text-xs text-gray-400">Supported formats: JPG, PNG, JPEG</p>
                    </div>
                ) : (
                    <div className="p-4">
                        <div className="relative w-full rounded-lg overflow-hidden shadow-md aspect-video flex items-center justify-center bg-gray-100">
                            <img 
                                src={preview} 
                                alt="Preview" 
                                className="max-h-64 max-w-full object-contain"
                            />
                            <button 
                                onClick={handleFileInputClick}
                                className="absolute top-2 right-2 bg-white p-1.5 rounded-full shadow-md hover:bg-red-100 transition-colors duration-200"
                                aria-label="Remove image"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                            <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded text-xs text-white">
                                {file?.name}
                            </div>
                        </div>
                    </div>
                )}
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    onClick={e => {
                        // Reset the input value to allow selecting the same file again
                        e.target.value = null;
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    aria-label="Upload an image"
                />
            </div>
        </div>
    );
};

// Loading spinner component
const LoadingSpinner = ({ text }) => (
    <span className="flex items-center">
        <svg
            className="animate-spin h-5 w-5 mr-3 text-white"
            viewBox="0 0 24 24"
        >
            <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
            ></circle>
            <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
        </svg>
        {text}
    </span>
);

// Error message component
const ErrorMessage = ({ message }) => (
    <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-start">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mt-0.5 text-red-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        <p>{message}</p>
    </div>
);

// Analysis results component
const AnalysisResults = ({ result }) => (
    <div className="border-t border-gray-100">
        <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Analysis Results
            </h3>
            
            <div className="space-y-6">
                {/* Prediction Card */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-5 shadow-inner">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-gray-700 font-medium">Classification</span>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            result.prediction === "Garbage" 
                                ? "bg-red-100 text-red-800" 
                                : "bg-green-100 text-green-800"
                        }`}>
                            {result.prediction}
                        </span>
                    </div>
                    
                    <div className="space-y-3">
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-sm text-gray-500">Confidence</span>
                                <span className="text-sm font-medium text-gray-700">{(result.confidence * 100).toFixed(2)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                    className={`h-2 rounded-full ${
                                        result.prediction === "Garbage" 
                                            ? "bg-gradient-to-r from-yellow-300 to-red-500" 
                                            : "bg-gradient-to-r from-blue-300 to-green-500"
                                    }`}
                                    style={{ width: `${(result.confidence ?? 0) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Location Card */}
                {(result.latitude && result.longitude) || result.location_name ? (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-5 shadow-inner">
                        <h4 className="text-gray-700 font-medium mb-4 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                            </svg>
                            Location Information
                        </h4>
                        
                        <div className="space-y-3">
                            {result.latitude && result.longitude && (
                                <div className="flex items-center">
                                    <div className="bg-white p-2 rounded-lg shadow-sm flex items-center justify-center mr-3">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <span className="text-sm text-gray-500 block">GPS Coordinates</span>
                                        <span className="text-gray-700 font-mono text-sm">
                                            {Number(result.latitude).toFixed(6)}, {Number(result.longitude).toFixed(6)}
                                        </span>
                                    </div>
                                </div>
                            )}
                            
                            {result.location_name && (
                                <div className="flex items-center">
                                    <div className="bg-white p-2 rounded-lg shadow-sm flex items-center justify-center mr-3">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                        </svg>
                                    </div>
                                    <div>
                                        <span className="text-sm text-gray-500 block">Address</span>
                                        <span className="text-gray-700 text-sm">{result.location_name}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    </div>
);

export default App;