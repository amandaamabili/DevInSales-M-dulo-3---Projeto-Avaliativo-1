FROM node:16.3.0-alpine
WORKDIR /usr/app
COPY package.json .
RUN npm install --quiet
COPY . .
ENV  DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres
ENV  NODE_ENV=development
ENV  PORT=9000

EXPOSE 9000

CMD [ "npm", "run", "start"]