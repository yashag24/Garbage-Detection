import { useState } from "react";

function App() {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [location, setLocation] = useState({ 
        latitude: null, 
        longitude: null 
    });

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));
            setError(null);
        } else {
            setError("Please select a valid image file.");
        }
    };

    const handleFileInputClick = () => {
        setFile(null);
        setPreview(null);
        setResult(null);
    };

    const getLocation = () => {
        return new Promise((resolve, reject) => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        setLocation({
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                        });
                        resolve();
                    },
                    (error) => {
                        console.error("Error fetching location:", error);
                        setError("Unable to fetch location. Please enable location services.");
                        reject(error);
                    }
                );
            } else {
                setError("Geolocation is not supported by your browser.");
                reject(new Error("Geolocation not supported"));
            }
        });
    };

    const handleUpload = async () => {
        if (!file) {
            setError("Please select an image first!");
            return;
        }

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            await getLocation();
            
            if (!location.latitude || !location.longitude) {
                throw new Error("Location not available");
            }

            const formData = new FormData();
            formData.append("image", file);
            formData.append("latitude", location.latitude);
            formData.append("longitude", location.longitude);

            const response = await fetch("http://localhost:5000/upload", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Error processing image.");
            }

            setResult(data);

        } catch (err) {
            setError(err.message || "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-br from-blue-50 to-green-50">
            <h1 className="text-4xl font-bold mb-8 text-gray-800 text-center">
                Roadside Garbage Detection
            </h1>

            <div className="w-full max-w-[1000px] bg-white rounded-lg shadow-xl p-6">
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    onClick={handleFileInputClick}
                    className="w-full mb-4 p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:border-blue-400 hover:border-blue-400 transition-colors duration-300"
                    aria-label="Upload an image"
                />

                <button
                    onClick={handleUpload}
                    disabled={loading || !file}
                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-400 to-green-500 text-white font-semibold rounded-lg hover:from-blue-500 hover:to-green-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                >
                    {loading ? (
                        <span className="flex items-center justify-center">
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
                            Processing...
                        </span>
                    ) : (
                        "Upload & Classify"
                    )}
                </button>

                {error && (
                    <div className="mt-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg">
                        <p>{error}</p>
                    </div>
                )}

                {result && (
                    <div className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg shadow-md text-center">
                        <h3 className="text-2xl font-semibold text-gray-800">
                            Prediction: {result.prediction}
                        </h3>
                        <div className="mt-4">
                            <p className="text-lg text-gray-600 mb-2">
                                Confidence: {result.confidence?.toFixed(2) ?? "N/A"}
                            </p>
                            <div className="w-full bg-gray-200 rounded-full h-6">
                                <div
                                    className="bg-gradient-to-r from-blue-400 to-green-500 h-6 rounded-full"
                                    style={{
                                        width: `${(result.confidence ?? 0) * 100}%`,
                                    }}
                                ></div>
                            </div>
                        </div>
                        {result.latitude && result.longitude && (
                            <div className="mt-4">
                                <p className="text-lg text-gray-600">
                                    Coordinates: {Number(result.latitude).toFixed(6)}, {Number(result.longitude).toFixed(6)}
                                </p>
                            </div>
                        )}
                        {result.location_name && (
                            <div className="mt-4">
                                <p className="text-lg text-gray-600">
                                    Address: {result.location_name}
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {result && preview && (
                <div className="mt-8 w-full max-w-[1000px]">
                    <div className="border border-gray-300 rounded-lg shadow-lg overflow-hidden">
                        <img
                            src={preview}
                            alt="Uploaded preview"
                            className="w-full h-auto object-cover rounded-lg"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;