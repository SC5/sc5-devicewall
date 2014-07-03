FROM sc5io/ubuntu:14.04

RUN npm install

RUN gulp clean; gulp

EXPOSE 8888
RUN node server.js 8888