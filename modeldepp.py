import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.models import Model
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D
import numpy as np
import cv2
from PIL import Image
import os

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

# Dataset paths
train_dir = "dataset/train"
val_dir = "dataset/val"
img_size = (224, 224)
batch_size = 32

# Data Augmentation for training data
train_datagen = ImageDataGenerator(
    rescale=1.0/255.0,
    rotation_range=20,
    width_shift_range=0.2,
    height_shift_range=0.2,
    horizontal_flip=True,
    zoom_range=0.2,
    shear_range=0.2,
    brightness_range=[0.8, 1.2]
)

# Data preprocessing for validation data (no augmentation)
val_datagen = ImageDataGenerator(rescale=1.0/255.0)

# Load training and validation data
train_generator = train_datagen.flow_from_directory(
    train_dir,
    target_size=img_size,
    batch_size=batch_size,
    class_mode="categorical"
)

val_generator = val_datagen.flow_from_directory(
    val_dir,
    target_size=img_size,
    batch_size=batch_size,
    class_mode="categorical"
)

# Print class indices
print("Class indices:", train_generator.class_indices)

# Load MobileNetV2 without the top layers
base_model = MobileNetV2(weights="imagenet", include_top=False, input_shape=(224, 224, 3))

# Freeze the base model layers
base_model.trainable = False

# Add custom layers on top of the base model
x = base_model.output
x = GlobalAveragePooling2D()(x)  # Global pooling layer
x = Dense(128, activation="relu")(x)  # Hidden dense layer
x = Dense(2, activation="softmax")(x)  # Output layer (2 classes: clean, garbage)

# Define the model
model = Model(inputs=base_model.input, outputs=x)

# Compile the model
model.compile(optimizer="adam", loss="categorical_crossentropy", metrics=["accuracy"])

# Train the model
history = model.fit(
    train_generator,
    validation_data=val_generator,
    epochs=10
)

# Fine-tuning: Unfreeze some layers and recompile
base_model.trainable = True
for layer in base_model.layers[:100]:  # Freeze the first 100 layers
    layer.trainable = False

# Recompile the model with a lower learning rate
model.compile(optimizer=tf.keras.optimizers.Adam(learning_rate=1e-5),
              loss="categorical_crossentropy",
              metrics=["accuracy"])

# Fine-tune the model
history_fine = model.fit(
    train_generator,
    validation_data=val_generator,
    epochs=5
)

# Save the model in Keras format
model.save("model_deep.keras")
print("Model training complete and saved as 'model_deep.keras'")

# Evaluate the model on the validation set
val_loss, val_accuracy = model.evaluate(val_generator)
print(f"Validation Loss: {val_loss:.4f}, Validation Accuracy: {val_accuracy:.4f}")

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
predict_and_visualize("test_image.jpg", model)