FROM node:24.11.1

WORKDIR /back

COPY package*.json ./

RUN npm i

COPY ./ ./

EXPOSE 3000

CMD ["sh", "-c", "npm run build && npm start"]
 


