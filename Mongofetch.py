import tensorflow as tf  
import numpy as np
from PIL import Image
import smtplib
import os
from dotenv import load_dotenv
from pymongo import MongoClient
import gridfs
import io

# Load environment variables from .env file
load_dotenv()

# Environment Configurations
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")  # Default to localhost if not set
DB_NAME = os.getenv("DB_NAME", "garbage_detection")  # Default DB name
FROM_EMAIL = os.getenv("FROM_EMAIL")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")
TO_EMAIL = os.getenv("TO_EMAIL")

# Connect to MongoDB
client = MongoClient(MONGO_URI)
db = client[DB_NAME]
fs = gridfs.GridFS(db)

# Load the trained MobileNetV2 model
try:
    model = tf.keras.models.load_model("model_deep.keras")
    print("✅ Model loaded successfully.")
except Exception as e:
    print(f"❌ Failed to load model: {e}")
    model = None

# Function to send an email notification
def send_email(subject, body):
    try:
        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls()
            server.login(FROM_EMAIL, EMAIL_PASSWORD)
            msg = f"Subject: {subject}\n\n{body}"
            server.sendmail(FROM_EMAIL, TO_EMAIL, msg)
        print("📧 Email notification sent successfully.")
    except Exception as e:
        print(f"❌ Failed to send email: {e}")

# Function to load and preprocess image
def load_image(image_bytes):
    try:
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")  
        img = img.resize((224, 224))  
        img_array = np.array(img) / 255.0  
        return np.expand_dims(img_array, axis=0)  
    except Exception as e:
        print(f"❌ Error loading image: {e}")
        return None

# Function to predict and notify
def predict_and_notify(image_bytes, location):
    try:
        img = load_image(image_bytes)
        if img is None:
            return {"error": "Image processing failed"}

        prediction = model.predict(img)
        class_idx = np.argmax(prediction)  
        class_label = "Garbage" if class_idx == 1 else "Clean"
        confidence = float(prediction[0][class_idx])  

        print(f"📢 Prediction: {class_label} ({confidence:.2f}) at {location}")

        if class_label == "Garbage":
            subject = "🚨 Garbage Detected!"
            body = f"Garbage detected at {location} with confidence {confidence:.2f}. Immediate action required."
            send_email(subject, body)

        return {"classification": class_label, "confidence": confidence, "location": location}
    
    except Exception as e:
        print(f"❌ Error processing image: {e}")
        return {"error": str(e)}

# Function to process images from MongoDB
def process_images_from_mongo():
    try:
        # Fetch latest images from MongoDB
        latest_images = db.fs.files.find().sort("uploadDate", -1).limit(10)  # Get latest 10 images

        for image_doc in latest_images:
            file_id = image_doc["_id"]
            location = image_doc.get("metadata", {}).get("location", "Unknown Location")
            
            # Retrieve image bytes
            image_bytes = fs.get(file_id).read()
            
            # Run prediction and notify if needed
            result = predict_and_notify(image_bytes, location)
            print(result)

    except Exception as e:
        print(f"❌ Error fetching images from MongoDB: {e}")

# Run the image processing function
if __name__ == "__main__":
    process_images_from_mongo()
