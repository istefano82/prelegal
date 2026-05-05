#!/bin/bash

CONTAINER_NAME="prelegal_app"

if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "Stopping PreLegal..."
    docker rm -f "$CONTAINER_NAME" > /dev/null
    echo "PreLegal stopped."
else
    echo "PreLegal is not running."
fi
