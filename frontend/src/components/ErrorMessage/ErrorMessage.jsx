import { useAppContext } from "../../context/AppContext";

const ErrorMessage = () => {
    const { error } = useAppContext();

    return (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-start">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2 mt-0.5 text-red-500 flex-shrink-0"
                viewBox="0 0 20 20"
                fill="currentColor"
            >
                <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                />
            </svg>
            <p>{error}</p>
        </div>
    );
};

export default ErrorMessage;