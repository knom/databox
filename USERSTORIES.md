# 📖 User Stories for Databox

## 🧑‍💻 Submitter

### 1. Request Submission

As a submitter, I want to enter my email and get a verification code so I can securely send files and a message.

### 2. Verify Submission

As a submitter, I want to verify my submission using the code so I can proceed to upload.

### 3. Upload Data

As a submitter, I want to write a message and drag-and-drop files so I can send them.

### 4. Confirm Submission

As a submitter, I want my data and message to be sent to the recipient automatically.

## 📥 Recipient

### 5. Receive Email

As a recipient, I want to receive a formatted email with message and files so I can process submissions efficiently.

## 🧹 System

### 6. Cleanup Unverified

As the system, I want to delete unverified submissions after 48 hours so the database stays clean.

### 7. Cleanup Temporary Uploads

As the system, I want to delete temporary uploaded files, that have not been used after 1 hour so the upload folder on the server stays clean.

## 🛠️ Admin

### 8. Configuration

As an admin, I want to set base URL, email, and DB provider from config or env so I can deploy easily.

### 9. Docker Deployment

As an admin, I want to run the app in Docker using release mode so I can deploy it anywhere.
