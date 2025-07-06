FROM denoland/deno:latest

ARG BUILD_REVISION
ENV DENO_DEPLOYMENT_ID=${BUILD_REVISION}

WORKDIR /app

COPY . .

# [Ahead-of-time Builds](https://fresh.deno.dev/docs/concepts/ahead-of-time-builds)
RUN deno task build

# Run with necessary permissions
CMD ["deno", "run", "-A", "main.ts"]