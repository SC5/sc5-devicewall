FROM sc5io/ubuntu:14.04

RUN rm $HOME/.npmrc

# Dirs
RUN mkdir -p /wwwroot/devicewall
WORKDIR /wwwroot/devicewall
RUN chmod 777 .

# Install dependencies
RUN npm install -g gulp

# Setup app
ADD . /wwwroot/devicewall
RUN npm install
RUN npm build

# Start
EXPOSE 80
CMD npm start