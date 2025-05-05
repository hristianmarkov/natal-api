FROM node:18

# Create app directory
WORKDIR /usr/src/app

# Copy app files
COPY . .

# Install dependencies
RUN npm install

# Make ephe folder readable
RUN chmod -R 755 ephe

# Expose port
EXPOSE 8080

# Start the app
CMD [ "npm", "start" ]
