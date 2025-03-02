import tensorflow as tf
import numpy as np
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import smtplib
import os
import logging
from dotenv import load_dotenv
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import email.utils

# Load environment variables
load_dotenv()

# Configuration
FROM_EMAIL = os.getenv("FROM_EMAIL")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")
TO_EMAIL = os.getenv("TO_EMAIL")
STREET_NAME = os.getenv("STREET_NAME", "Unknown Location")

app = Flask(__name__)
CORS(app)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load TensorFlow model
try:
    model = tf.keras.models.load_model("model_deep.keras")
    logger.info("Model loaded successfully")
except Exception as e:
    logger.error(f"Model loading failed: {e}")
    model = None

def get_location_name(lat, lon):
    """Get human-readable address using OpenStreetMap"""
    try:
        response = requests.get(
            f"https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lon}",
            headers={'User-Agent': 'RoadsideGarbageDetection/1.0'},
            timeout=10
        )
        data = response.json()
        address = data.get('address', {})
        return ", ".join(filter(None, [
            address.get('road'),
            address.get('city'),
            address.get('state'),
            address.get('country')
        ])) or "Unknown Location"
    except Exception as e:
        logger.error(f"Location lookup failed: {str(e)}")
        return None

def send_email(subject, body):
    """Send email notification with proper Unicode handling"""
    try:
        msg = MIMEMultipart()
        msg['From'] = FROM_EMAIL
        msg['To'] = TO_EMAIL
        msg['Subject'] = subject
        msg['Date'] = email.utils.formatdate(localtime=True)
        
        # Add UTF-8 encoded text part
        msg.attach(MIMEText(body, 'plain', 'utf-8'))

        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls()
            server.login(FROM_EMAIL, EMAIL_PASSWORD)
            server.sendmail(FROM_EMAIL, TO_EMAIL, msg.as_string())
            
        logger.info("Email sent successfully")
    except Exception as e:
        logger.error(f"Email failed: {str(e)}")

def preprocess_image(image):
    """Prepare image for model prediction"""
    img = image.convert("RGB")
    img = img.resize((224, 224))
    img_array = np.array(img) / 255.0
    return np.expand_dims(img_array, axis=0)

@app.route("/upload", methods=["POST"])
def upload_image():
    """Handle image upload and processing"""
    if "image" not in request.files:
        return jsonify({"error": "No image provided"}), 400

    try:
        image_file = request.files["image"]
        lat = request.form.get("latitude", type=float)
        lon = request.form.get("longitude", type=float)

        # Get human-readable location
        location_name = get_location_name(lat, lon) if lat and lon else None

        # Validate and process image
        img = Image.open(image_file)
        img.verify()
        img = Image.open(image_file)  # Reopen after verification
        img_array = preprocess_image(img)

        if not model:
            return jsonify({"error": "Model not loaded"}), 500

        # Make prediction
        prediction = model.predict(img_array)
        class_idx = np.argmax(prediction)
        class_label = "Garbage" if class_idx == 1 else "Clean"
        confidence = float(prediction[0][class_idx])

        # Send notification if garbage detected
        if class_label == "Garbage":
            email_body = (
                "🚨 Garbage Detected 🚨\n\n"
                f"Confidence: {confidence:.2%}\n"
                f"Coordinates: {lat:.6f}, {lon:.6f}\n"
                f"Address: {location_name or 'Unknown location'}\n"
                f"Street: {STREET_NAME}"
            )
            send_email("Garbage Detection Alert", email_body)

        return jsonify({
            "prediction": class_label,
            "confidence": confidence,
            "latitude": lat,
            "longitude": lon,
            "location_name": location_name
        })

    except Exception as e:
        logger.error(f"Processing error: {str(e)}")
        return jsonify({"error": f"Processing failed: {str(e)}"}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)