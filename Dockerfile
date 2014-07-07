FROM sc5io/ubuntu:14.04

RUN rm $HOME/.npmrc

# Dirs
RUN mkdir -p /wwwroot/devicewall
WORKDIR /wwwroot/devicewall

# Install dependencies
RUN npm install -g gulp

# Install modules
ADD package.json /wwwroot/devicewall/package.json
RUN npm install --dev

# Build app
ADD . /wwwroot/devicewall
RUN npm build

# Start
EXPOSE 80
CMD npm start