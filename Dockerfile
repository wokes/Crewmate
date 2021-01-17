FROM arm64v8/node:14

WORKDIR /server

COPY package.json ./
COPY .babelrc ./
COPY tsconfig.json ./
COPY tslint.json ./

RUN npm set registry SECRET
RUN npm install

COPY . .

RUN npm run build
CMD node dist/index.js
