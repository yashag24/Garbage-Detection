import tensorflow as tf  
import numpy as np
from PIL import Image
import smtplib
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Email Configuration
FROM_EMAIL = os.getenv("FROM_EMAIL")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")
TO_EMAIL = os.getenv("TO_EMAIL")
STREET_NAME = os.getenv("STREET_NAME", "Unknown Location")  # Default if not set

# Function to send an email
def send_email(subject, body):
    try:
        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls()
            server.login(FROM_EMAIL, EMAIL_PASSWORD)
            msg = f"Subject: {subject}\n\n{body}"
            server.sendmail(FROM_EMAIL, TO_EMAIL, msg)
        print("Email notification sent successfully.")
    except Exception as e:
        print(f"Failed to send email: {e}")

# Function to load and preprocess image
def load_image(image_path):
    try:
        img = Image.open(image_path).convert("RGB")  
        img = img.resize((224, 224))  
        img_array = np.array(img) / 255.0  
        return np.expand_dims(img_array, axis=0)  
    except Exception as e:
        print(f"Error loading image: {e}")
        return None

# Function to predict and print result
def predict_and_print(image_path, model):
    try:
        img = load_image(image_path)
        if img is None:
            return

        prediction = model.predict(img)
        class_idx = np.argmax(prediction)  
        class_label = "Garbage" if class_idx == 1 else "Clean"
        confidence = float(prediction[0][class_idx])  

        print(f"Prediction: {class_label} ({confidence:.2f})")

        if class_label == "Garbage":
            subject = "Garbage Detected!"
            body = f"Street - {STREET_NAME} is found to be unclean with confidence {confidence:.2f}."
            send_email(subject, body)
    except Exception as e:
        print(f"Error processing image: {e}")

# Load the saved model
try:
    model = tf.keras.models.load_model("model_deep.keras")
    print("Model loaded successfully.")
except Exception as e:
    print(f"Failed to load model: {e}")
    model = None

# Test the model on a single image
if model:
    predict_and_print("438.jpg", model)
