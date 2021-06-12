FROM node:15-alpine
LABEL name "sphinx"
LABEL version "0.0.0"
LABEL maintainer "almostSouji <https://github.com/almostSouji>"
ENV DISCORD_TOKEN=\
	FORCE_COLOR=1
WORKDIR /usr/sphinx
COPY package.json ./
RUN apk add --update \
	&& apk add --no-cache ca-certificates \
	&& apk add --no-cache --virtual .build-deps git curl build-base python g++ make \
	&& npm i \
	&& apk del .build-deps
COPY . .
RUN npm run build
CMD ["npm", "run", "start"]