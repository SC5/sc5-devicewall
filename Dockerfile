FROM sc5io/ubuntu:14.04

RUN mkdir /app
WORKDIR /app

# Install dependencies
ADD package.json /app/package.json
RUN npm install

# Copy files
ADD devices.json /app/devices.json
ADD instances.json /app/instances.json
ADD server.js /app/server.js
ADD dist /app/dist

# Start
EXPOSE 80
CMD npm start