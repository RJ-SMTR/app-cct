FROM node:18.11-alpine as build-stage
RUN apk update && apk add --no-cache --virtual build-deps git
WORKDIR /app
COPY . . 
RUN npm ci
COPY . ./
# Builds for environments without their own GitHub secret (ex.: stag, which only has ENV_PROD
# available) pass the right values via --build-arg instead of a "Mount env" step writing .env.
# Overwrites, not appends: a workspace reused across workflow runs (ex.: self-hosted runner) can
# still have another environment's .env on disk from a previous build - this prevents it from
# leaking into this image (found 2026-10-29: stag's build-time REACT_APP_BASE_URL_CCT was
# production's, routing the staging frontend to the production API).
ARG REACT_APP_BASE_URL_CCT
RUN if [ -n "$REACT_APP_BASE_URL_CCT" ]; then printf "REACT_APP_BASE_URL_CCT=%s\n" "$REACT_APP_BASE_URL_CCT" > .env; fi
RUN ls -la
RUN npm run build

FROM nginx:stable-alpine as production-stage
COPY --from=build-stage /app/build /usr/share/nginx/html
COPY nginx.conf /temp/nginx.conf
RUN envsubst /app < /temp/nginx.conf > /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
