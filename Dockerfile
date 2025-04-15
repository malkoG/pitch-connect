FROM denoland/deno:alpine-2.2.10

WORKDIR /app

COPY . .

ENV DENO_DIR=/deno-dir
VOLUME ["/deno-dir"]

EXPOSE 8000

CMD ["deno", "task", "start"]
