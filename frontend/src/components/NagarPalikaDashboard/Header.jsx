import { Upload } from 'lucide-react';

const Header = ({ handleImageUpload }) => {
  return (
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <div className="px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-indigo-800">Garbage Detection Dashboard</h1>
          <p className="text-blue-600">AI-powered waste monitoring system</p>
        </div>

        <button
          onClick={handleImageUpload}
          className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-blue-600 text-white rounded-lg hover:from-emerald-700 hover:to-blue-700 flex items-center"
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload New Image
        </button>
      </div>
    </header>
  );
};

export default Header;