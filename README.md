# calberry
A small touchscreen calendar-focused kiosk, meant to run on raspberry pi with a touchscreen

## Development Setup

To get started with development, you'll need Docker and Docker Compose installed on your system.

### Prerequisites

- An up-to-date Docker installation with Docker Compose support. [Install Docker Compose](https://docs.docker.com/compose/install)

### Getting Started

To start the development environment, run the following command from the project root:

```bash
docker compose -f docker-compose.yml -f docker-compose-dev.yml up --build
```

This will build and start all services in development mode.