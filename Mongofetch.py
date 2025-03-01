import requests
import tensorflow as tf  
import numpy as np
from PIL import Image
import smtplib
import os
from pymongo import MongoClient
from gridfs import GridFS
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# MongoDB Configuration
MONGO_URI = os.getenv("MONGO_URI")
client = MongoClient(MONGO_URI)
db = client.get_database()
fs = GridFS(db)

# Email Configuration
FROM_EMAIL = os.getenv("FROM_EMAIL")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")
TO_EMAIL = os.getenv("TO_EMAIL")

# Reverse Geocoding (Get Address from Latitude & Longitude)
def get_address_from_coordinates(lat, lon):
    try:
        url = f"https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lon}"
        response = requests.get(url)
        data = response.json()
        return data.get("display_name", "Unknown Location")
    except Exception as e:
        print(f"Error in reverse geocoding: {e}")
        return "Unknown Location"

# Send Email Notification
def send_email(subject, body):
    try:
        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls()
            server.login(FROM_EMAIL, EMAIL_PASSWORD)
            msg = f"Subject: {subject}\n\n{body}"
            server.sendmail(FROM_EMAIL, TO_EMAIL, msg)
        print("📩 Email notification sent successfully.")
    except Exception as e:
        print(f"❌ Failed to send email: {e}")

# Load & Preprocess Image
def load_image(image_bytes):
    try:
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        img = img.resize((224, 224))  
        img_array = np.array(img) / 255.0  
        return np.expand_dims(img_array, axis=0)  
    except Exception as e:
        print(f"Error loading image: {e}")
        return None

# Predict & Notify
def predict_and_notify(image_bytes, lat, lon):
    try:
        address = get_address_from_coordinates(lat, lon)  # Convert lat/lon to address
        img = load_image(image_bytes)
        if img is None:
            return "⚠️ Failed to process image."

        prediction = model.predict(img)
        class_idx = np.argmax(prediction)  
        class_label = "Garbage" if class_idx == 1 else "Clean"
        confidence = float(prediction[0][class_idx])  

        print(f"✅ Prediction: {class_label} ({confidence:.2f}) at {address}")

        if class_label == "Garbage":
            subject = "🚨 Garbage Detected!"
            body = f"Garbage detected at {address} (Lat: {lat}, Lon: {lon}) with confidence {confidence:.2f}."
            send_email(subject, body)

        return f"🔔 Processed Image: {class_label} ({confidence:.2f}) at {address}"

    except Exception as e:
        print(f"❌ Error in prediction: {e}")
        return "⚠️ Prediction Error."

# Process Images from MongoDB
def process_images_from_mongo():
    try:
        latest_images = db.fs.files.find().sort("uploadDate", -1).limit(10)

        for image_doc in latest_images:
            file_id = image_doc["_id"]
            metadata = image_doc.get("metadata", {})
            lat, lon = metadata.get("latitude"), metadata.get("longitude")

            if lat is None or lon is None:
                print("⚠️ Skipping image: No location metadata.")
                continue

            image_bytes = fs.get(file_id).read()
            result = predict_and_notify(image_bytes, lat, lon)
            print(result)

    except Exception as e:
        print(f"❌ Error fetching images from MongoDB: {e}")

# Load Model
try:
    model = tf.keras.models.load_model("model_deep.keras")
    print("✅ Model loaded successfully.")
except Exception as e:
    print(f"❌ Failed to load model: {e}")
    model = None

# Run the image processing function
if model:
    process_images_from_mongo()
