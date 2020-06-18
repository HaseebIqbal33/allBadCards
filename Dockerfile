FROM node:12

WORKDIR /usr/src/allbadcards
COPY . .
RUN /usr/src/allbadcards/build_prod.sh
WORKDIR /usr/src/allbadcards/builds/output

EXPOSE 5000
CMD ["yarn", "start"]