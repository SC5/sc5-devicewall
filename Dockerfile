FROM sc5io/ubuntu:14.04

RUN mkdir /app
WORKDIR /app

# Install dependencies
ADD package.json /app/package.json
RUN npm install

# Copy files
ADD data/devices.json /data/devices.json
ADD data/instances.json /data/instances.json
ADD server/server.js /app/server.js
ADD dist /app/dist

RUN ln -sf /data /app/data

# Start
EXPOSE 80
CMD npm start
