
# 🚮 Garbage Detection Project

This project detects roadside garbage using **MobileNetV2** and sends notifications when garbage is detected.  
The system stores images in **MongoDB**, processes them using a trained model, and triggers email alerts if garbage is found.  

## 🛠 Setup Instructions

### 1️⃣ Install Dependencies
Run the following command to install required packages:
```
pip install -r requirements.txt
```

### 2️⃣ Configure Environment Variables
Create a `.env` file in the project root and add the following details:
```
# MongoDB Configuration  
MONGO_URI=mongodb+srv://username:password@your-cluster.mongodb.net/?retryWrites=true&w=majority  
DB_NAME=garbage_detection  

# Email Notification Configuration  
FROM_EMAIL=your-email@gmail.com  
EMAIL_PASSWORD=your-email-password  
TO_EMAIL=receiver-email@gmail.com  
```
