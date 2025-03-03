import UploadArea from "../UploadArea/UploadArea";
import UploadButton from "../UploadButton/UploadButton";
import ErrorMessage from "../ErrorMessage/ErrorMessage";
import AnalysisResults from "../AnalysisResults/AnalysisResults";

import { useAppContext } from "../../context/AppContext";
const MainCard = () => {
    const { preview, result, error } = useAppContext();

    return (
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
                <UploadArea />
                <div className="mt-6">
                    <UploadButton />
                </div>
                {error && <ErrorMessage />}
            </section>

            {/* Results Section */}
            {result && <AnalysisResults />}
        </main>
    );
};

export default MainCard;