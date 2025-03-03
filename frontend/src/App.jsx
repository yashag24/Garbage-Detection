import {} from "./context/AppContext";
import Header from "./components/Header/Header";
import MainCard from "./components/MainCard/MainCard";
import Footer from "./components/Footer/Footer";

function App() {
  return (
    <>
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-50 p-6">
        <Header />
        <MainCard />
        <Footer />
      </div>
    </>
  );
}

export default App;
