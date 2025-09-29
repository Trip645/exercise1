# Use the official Node.js runtime as the base image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm install --only=production

# Copy the rest of the application code
COPY . .

# Create the data directory that the application uses
RUN mkdir -p /data

# Expose the port the app runs on
EXPOSE 5001

# Define the command to run the application
CMD ["npm", "start"]


