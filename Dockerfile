FROM --platform=${BUILDPLATFORM} node:18-alpine AS build
WORKDIR /opt/app

# Copy monorepo files needed to build frontend
COPY excalidraw/package.json excalidraw/yarn.lock ./excalidraw/
WORKDIR /opt/app/excalidraw
COPY excalidraw/ ./

# Install and build
RUN yarn --network-timeout 600000 && yarn build:app:docker

FROM --platform=${TARGETPLATFORM} nginx:1.27-alpine
COPY --from=build /opt/app/excalidraw/excalidraw-app/build /usr/share/nginx/html
COPY --from=build /opt/app/excalidraw/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK CMD wget -q -O /dev/null http://localhost/health || exit 1