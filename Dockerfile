FROM node:8-slim

RUN mkdir /app
WORKDIR /app
COPY ./app /app
COPY ./package.json /app
 
RUN npm install

CMD ["node", "app.js"]