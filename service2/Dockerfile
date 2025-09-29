# Use the official Python runtime as the base image
FROM python:3.11-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy requirements file first for better Docker layer caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code
COPY app.py .

# Create the vstorage directory that the application uses
RUN mkdir -p /vstorage

# Expose the port the app runs on
EXPOSE 5000

# Define the command to run the application
CMD ["python", "app.py"]

