# Build stage
FROM denoland/deno:latest AS builder

WORKDIR /app

# TODO: was here. en gros les .env sont pas transférés par le rsync je crois, donc deja
# le build de docker y arrive pas, et quand on lance l'app évidemment non plus. 
# a voir aussi si on peut pas : compresser et transferer OU transferer uniquement certaines parties (pas
# sûr vu qu'on doit build)
# voir aussi les ahead of time build de fresh

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