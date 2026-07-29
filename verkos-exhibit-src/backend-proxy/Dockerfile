# Nginx CORS Proxy - Production Ready Dockerfile
FROM nginx:1.25-alpine

# Install dependencies
RUN apk add --no-cache curl gettext

# Set default backend URL (can be overridden at runtime)
ENV BACKEND_URL=api-dev.flytbase.com

# Copy nginx configuration template
COPY nginx.conf /etc/nginx/nginx.conf.template

# Create log directory (nginx.conf logs directly to /dev/stdout and stderr)
RUN mkdir -p /var/log/nginx

# Expose proxy port
EXPOSE 8888

# Create entrypoint script to substitute environment variables and show config
RUN echo '#!/bin/sh' > /docker-entrypoint.sh && \
    echo 'set -e' >> /docker-entrypoint.sh && \
    echo 'echo "================================"' >> /docker-entrypoint.sh && \
    echo 'echo "Backend URL: ${BACKEND_URL}"' >> /docker-entrypoint.sh && \
    echo 'echo "Generating nginx config..."' >> /docker-entrypoint.sh && \
    echo 'echo "================================"' >> /docker-entrypoint.sh && \
    echo 'envsubst "\$BACKEND_URL" < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf' >> /docker-entrypoint.sh && \
    echo 'echo "Testing nginx configuration..."' >> /docker-entrypoint.sh && \
    echo 'nginx -t' >> /docker-entrypoint.sh && \
    echo 'echo "Starting nginx..."' >> /docker-entrypoint.sh && \
    echo 'exec nginx -g "daemon off;"' >> /docker-entrypoint.sh && \
    chmod +x /docker-entrypoint.sh

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8888/health || exit 1

ENTRYPOINT ["/docker-entrypoint.sh"]
