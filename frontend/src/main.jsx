import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import ChatBot from './ChatBot.jsx'
import DogForm from './Breeds.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ChatBot/>
  </React.StrictMode>,
)
