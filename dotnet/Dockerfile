# Stage 1: Build .NET 9 Application
FROM mcr.microsoft.com/dotnet/sdk:9.0-alpine AS build
WORKDIR /src

# Copy project manifest and restore
COPY HomePulse.csproj ./
RUN dotnet restore HomePulse.csproj --runtime linux-musl-x64

# Copy entire source and publish self-contained/ready-to-run
COPY . ./
RUN dotnet publish HomePulse.csproj \
    -c Release \
    -r linux-musl-x64 \
    --no-restore \
    -o /app/publish \
    /p:PublishReadyToRun=true

# Stage 2: Runtime image with network inspection utilities
FROM mcr.microsoft.com/dotnet/aspnet:9.0-alpine AS final
WORKDIR /app

# Install iproute2, ethtool, and ca-certificates for Linux ARP & network sweeping
RUN apk add --no-cache \
    iproute2 \
    ca-certificates \
    tzdata \
    curl

# Expose HTTP / SignalR port
EXPOSE 5000
ENV ASPNETCORE_URLS=http://+:5000
ENV ASPNETCORE_ENVIRONMENT=Production

COPY --from=build /app/publish .

# Run with host networking or NET_RAW capabilities
ENTRYPOINT ["./HomePulse"]
