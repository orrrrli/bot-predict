import { useState, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';
import { mapPredictedClass } from '../src/etiquetas';

const ChatBot = () => {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [file, setFile] = useState(null);
  const [model, setModel] = useState(null);

  useEffect(() => {
    const loadModel = async () => {
      try {
        console.log("Cargando modelo...");
        const model = await tf.loadLayersModel('/modelo/model.json');
        console.log("Modelo cargado.");
        setModel(model);
      } catch (error) {
        console.error("Error al cargar el modelo:", error);
      }
    };

    loadModel();
  }, []);

  const preprocessImage = async (image) => {
    const tfImage = tf.browser.fromPixels(image).resizeNearestNeighbor([224, 224]).toFloat();
    const meanImageNetRGB = tf.tensor1d([123.68, 116.779, 103.939]);
    return tfImage.sub(meanImageNetRGB).div(tf.scalar(255));
  };

  const predict = async () => {
    if (!file) {
      alert('Por favor, selecciona un archivo de imagen.');
      return;
    }

    if (!model) {
      console.error("El modelo no se cargó correctamente.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async function (e) {
      const img = new Image();
      img.src = e.target.result;
      img.onload = async function () {
        try {
          const preprocessedImage = await preprocessImage(img);
          const input = preprocessedImage.reshape([1, 224, 224, 3]);
          const predictions = model.predict(input);
          let predictedClass = predictions.argMax(1).dataSync()[0];
          const probability = predictions.max().dataSync()[0];
          predictedClass = mapPredictedClass(predictedClass);
          const data = {
            predictions: [
              {
                tagName: predictedClass.toString(),
                probability: probability
              }
            ]
          };
          console.log(`Predicted class: ${predictedClass}, Probability: ${probability}`);
          addMessage('user', null, e.target.result); // Agrega la imagen al historial
          sendPredictionToChatBot(data);
          setFile(null);  // Resetea el archivo después de la predicción
          document.getElementById('fileInput').value = ''; // Limpia el nombre del archivo
        } catch (error) {
          console.error("Error al realizar la predicción:", error);
        }
      };
    };
    reader.readAsDataURL(file);
  };

  const submitQuestion = () => {
    if (question !== '') {
      addMessage('user', question);
      askQuestion(question);
      setQuestion('');
    } else {
      alert('Por favor, ingrese una pregunta.');
    }
  };

  const sendPredictionToChatBot = (data) => {
    if (data.predictions && data.predictions.length > 0) {
      const sortedPredictions = data.predictions.sort((a, b) => b.probability - a.probability);
      const topPrediction = sortedPredictions[0];
      const predictionMessage = `${topPrediction.tagName}`;
      askQuestion(predictionMessage);
    } else {
      addMessage('bot', 'No se pudo realizar la predicción.');
    }
  };

  const askQuestion = async (question) => {
    var request = {
      top: 3,
      question: question,
      includeUnstructuredSources: true,
      confidenceScoreThreshold: 0.5,
      answerSpanRequest: {
        enable: true,
        topAnswersWithSpan: 1,
        confidenceScoreThreshold: 0.5
      }
    };
    try {
      const response = await fetch("https://chatbotperros.cognitiveservices.azure.com/language/:query-knowledgebases?projectName=ChatBotDePerros&api-version=2021-10-01&deploymentName=production", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Ocp-Apim-Subscription-Key": "a3bc471c4c2048f1afa5bf95c7e30f23",
        },
        body: JSON.stringify(request)
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      var answer = data.answers[0].answer;
      addMessage('bot', answer);
      console.log("Answer:", answer);
  
      // Enviar la respuesta del bot al backend
      const predictionData = {
        question: question,
        answer: answer,
        timestamp: new Date().toISOString()
      };
  
      await fetch('/uploadPrediction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(predictionData),
      });
  
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const addMessage = (sender, message, image = null) => {
    setMessages((prevMessages) => [...prevMessages, { sender, message, image }]);
  };

  return (
    <div className="w-full h-screen flex flex-col p-4 bg-white shadow-lg rounded-lg">
      <div id="chatBox" className="flex-1 overflow-y-auto p-4 bg-gray-100 rounded-lg">
        {messages.map((msg, index) => (
          <div key={index} className={`my-2 p-2 rounded-lg ${msg.sender === 'user' ? 'bg-blue-500 text-white self-end' : 'bg-gray-300 text-black self-start'}`}>
            {msg.image ? <img src={msg.image} alt="preview" className="w-48 h-48 object-cover" /> : msg.message}
          </div>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submitQuestion();
        }}
        className="flex mt-4"
      >
      </form>
      <div className="mt-4">
        <input
          type="file"
          accept="image/*"
          id="fileInput"
          onChange={(e) => setFile(e.target.files[0])}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        <button
          onClick={predict}
          id="predictButton"
          className="mt-2 w-full p-2 bg-blue-500 text-white rounded-lg"
        >
          Enviar Imagen
        </button>
      </div>
      <div id="predictionResult" className="mt-4"></div>
    </div>
  );
};

export default ChatBot;
