import tensorflow as tf  # Import TensorFlow
import numpy as np
import cv2
from PIL import Image

# Function to load and preprocess images properly
def load_image(image_path):
    """
    Load and preprocess an image for prediction.
    Args:
        image_path (str): Path to the image file.
    Returns:
        np.array: Preprocessed image as a numpy array.
    """
    img = Image.open(image_path)
    if img.mode != 'RGB':
        img = img.convert('RGB')  # Convert to RGB if not already
    img = img.resize((224, 224))  # Resize to match model input size
    return np.array(img) / 255.0  # Normalize pixel values

# Function to predict and visualize the result
def predict_and_visualize(image_path, model):
    """
    Predict the class of an image and visualize the result.
    Args:
        image_path (str): Path to the image file.
        model (tf.keras.Model): Trained model for prediction.
    """
    try:
        # Load and preprocess the image
        img = load_image(image_path)
        img_display = cv2.imread(image_path)
        img_display = cv2.resize(img_display, (224, 224))
        img = np.expand_dims(img, axis=0)  # Add batch dimension

        # Predict the class
        prediction = model.predict(img)
        class_idx = np.argmax(prediction)
        class_label = "Garbage" if class_idx == 1 else "Clean"
        confidence = prediction[0][class_idx]

        # Overlay prediction on the image
        cv2.putText(img_display, f"{class_label} ({confidence:.2f})", (10, 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        cv2.imshow("Prediction", img_display)
        cv2.waitKey(0)
        cv2.destroyAllWindows()
    except Exception as e:
        print(f"Error processing image: {e}")

# Load the saved model
model = tf.keras.models.load_model("model_deep.keras")

# Test the model on a single image
predict_and_visualize("456.jpg", model)