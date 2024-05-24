from flask import Flask, request, jsonify, send_from_directory
from azure.storage.blob import BlobServiceClient
import os
import json
from dotenv import load_dotenv

app = Flask(__name__, static_folder='dist')

# Cargar variables de entorno desde el archivo variables.env
load_dotenv(dotenv_path='variables.env')

connect_str = os.getenv('AZURE_STORAGE_CONNECTION_STRING')
if not connect_str:
    raise ValueError("No se ha encontrado AZURE_STORAGE_CONNECTION_STRING en variables.env")

blob_service_client = BlobServiceClient.from_connection_string(connect_str)
container_name = 'datos-perro'

@app.route('/')
def serve():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>', methods=['GET'])
def static_proxy(path):
    return send_from_directory(app.static_folder, path)

@app.route('/submit', methods=['POST'])
def submit():
    data = request.json
    breed = data['breed']
    timestamp = data['timestamp']

    # Crear el nombre del archivo y el contenido
    file_name = f"datos_{timestamp}.json"
    file_content = json.dumps({'breed': breed, 'timestamp': timestamp})

    # Subir el archivo a Azure Blob Storage
    blob_client = blob_service_client.get_blob_client(container=container_name, blob=file_name)
    blob_client.upload_blob(file_content)

    return jsonify({'message': 'Datos guardados correctamente'}), 200

@app.route('/uploadPrediction', methods=['POST'])
def upload_prediction():
    data = request.json

    # Crear el nombre del archivo y el contenido
    file_name = f"prediction_{data['timestamp']}.json"
    file_content = json.dumps(data)

    # Subir el archivo a Azure Blob Storage
    blob_client = blob_service_client.get_blob_client(container=container_name, blob=file_name)
    blob_client.upload_blob(file_content)

    return jsonify({'message': 'Prediction data uploaded successfully'}), 200

@app.errorhandler(404)
def not_found(e):
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    app.run(debug=True, port=5000)
