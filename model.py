
import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.models import Model
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D
import numpy as np
import cv2
import os
from PIL import Image

# Load and preprocess image properly
def load_image(image_path):
    img = Image.open(image_path)
    if img.mode != 'RGB':
        img = img.convert('RGB')  # Fix transparency issue
    img = img.resize((224, 224))
    return np.array(img) / 255.0

# Dataset paths
train_dir = "dataset/train"
val_dir = "dataset/val"
img_size = (224, 224)
batch_size = 32

# Data Augmentation
train_datagen = ImageDataGenerator(rescale=1.0/255.0, rotation_range=20, width_shift_range=0.2,
                                   height_shift_range=0.2, horizontal_flip=True)
val_datagen = ImageDataGenerator(rescale=1.0/255.0)

train_generator = train_datagen.flow_from_directory(train_dir, target_size=img_size, batch_size=batch_size, class_mode="categorical")
val_generator = val_datagen.flow_from_directory(val_dir, target_size=img_size, batch_size=batch_size, class_mode="categorical")

# Load MobileNetV2 without top layers
base_model = MobileNetV2(weights="imagenet", include_top=False, input_shape=(224, 224, 3))
base_model.trainable = False  # Freeze base layers

# Add custom layers
x = base_model.output
x = GlobalAveragePooling2D()(x)
x = Dense(128, activation="relu")(x)
x = Dense(2, activation="softmax")(x)

# Define and compile model
model = Model(inputs=base_model.input, outputs=x)
model.compile(optimizer="adam", loss="categorical_crossentropy", metrics=["accuracy"])

# Train model
model.fit(train_generator, validation_data=val_generator, epochs=10)

# Save model in recommended Keras format
model.save("garbage_detector.keras")
print("Model training complete and saved as 'garbage_detector.keras'")

# Load and predict
model = tf.keras.models.load_model("garbage_detector.keras")

def predict_image(image_path, model):
    img = load_image(image_path)
    img = np.expand_dims(img, axis=0)
    prediction = model.predict(img)
    class_idx = np.argmax(prediction)
    class_label = "Garbage" if class_idx == 1 else "Clean"
    
    print(f"Prediction: {class_label} (Confidence: {prediction[0][class_idx]:.2f})")

predict_image("test_image.jpg", model)
