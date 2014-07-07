FROM sc5io/ubuntu:14.04

# Dirs
RUN mkdir /root/devicewall
WORKDIR /root/devicewall

# Install dependencies
RUN npm install -g gulp
RUN apt-get install -y rbenv
RUN gem install sass compass

# Setup app
ADD . /root/devicewall
RUN npm install
RUN npm build

# Start
EXPOSE 80
CMD npm start