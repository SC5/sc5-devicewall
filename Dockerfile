FROM sc5io/ubuntu:14.04

# Install dependencies
RUN npm install -g gulp
RUN apt-get install -y rbenv
RUN gem install sass compass

# Setup app
RUN mkdir /root/devicewall
ADD . /root/devicewall
RUN cd /root/devicewall; npm install; npm build

# Start
EXPOSE 80
CMD cd /root/devicewall; npm start