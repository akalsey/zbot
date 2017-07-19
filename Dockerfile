FROM node:latest

ENV DEBIAN_FRONTEND noninteractive
ARG docker_port=3000
ENV PORT ${docker_port}
ENV NODE_PATH /root

EXPOSE ${PORT}

RUN useradd --user-group --create-home --shell /bin/false app
RUN npm install supervisor -g
COPY package.json npm-shrinkwrap.json $NODE_PATH/
RUN chown -R app:app $NODE_PATH
USER app
WORKDIR $NODE_PATH
RUN npm install

COPY index.js $NODE_PATH/

CMD ["supervisor","index.js"]