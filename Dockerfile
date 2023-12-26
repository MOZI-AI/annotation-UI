FROM node:alpine as builder

RUN mkdir /root/react
WORKDIR /root/react
ARG GRPC_ADDR
ENV GRPC_ADDR $GRPC_ADDR
ARG RESULT_ADDR
ENV RESULT_ADDR $RESULT_ADDR
ENV NODE_OPTIONS '--openssl-legacy-provider' #for webpack to work with legacy openssl
COPY . ./

RUN npm install
RUN npm run-script build

#production environment
FROM nginx:alpine
COPY --from=builder /root/react/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]