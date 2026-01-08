import './App.css'

function App() {
    return (
        <>
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
                <div className="uppercase tracking-wide text-sm text-indigo-500 font-semibold">
                    Tailwind Test Card
                </div>
                <p className="text-gray-700 mb-6">
                    Testing current tailwind setup is working
                </p>
                <button className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
                    Hello world
                </button>
            </div>
        </>
    )
}

export default App