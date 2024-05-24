import { useState } from 'react';

const DogForm = () => {
    const [breed, setBreed] = useState('');

    const handleSubmit = async (event) => {
        event.preventDefault();
        const timestamp = new Date().toISOString();

        const response = await fetch('/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ breed, timestamp }),
        });

        if (response.ok) {
            alert('Datos enviados correctamente');
        } else {
            alert('Error al enviar los datos');
        }
    };

    return (
        <form 
            onSubmit={handleSubmit} 
            className="bg-gray-800 text-white p-6 rounded-lg"
        >
            <label className="block mb-4">
                Raza del perro:
                <input
                    type="text"
                    value={breed}
                    onChange={(e) => setBreed(e.target.value)}
                    required
                    className="mt-2 p-2 bg-gray-700 text-white border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </label>
            <button 
                type="submit" 
                className="mt-4 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
            >
                Enviar
            </button>
        </form>
    );
};

export default DogForm;
