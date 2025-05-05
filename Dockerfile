# Build stage
FROM denoland/deno:latest AS builder

WORKDIR /app

# set default envs, to let deno build. These are not sensitive and can be hardcoded.
ARG GOOGLE_CLIENT_ID
ARG GOOGLE_CLIENT_SECRET
ENV GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
ENV GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}

COPY . .

# Install necessary dependencies
RUN deno cache main.ts dev.ts

# Build with full permissions and proper environment variables
# This will generate the Tailwind CSS output
RUN deno task build --allow-env --allow-read

# Production stage
FROM denoland/deno:latest

WORKDIR /app
COPY --from=builder /app .

# Run with necessary permissions
CMD ["deno", "run", "--allow-net", "--allow-env", "--allow-read", "main.ts"]