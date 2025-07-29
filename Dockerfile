# ---- Build stage ----
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy everything and restore
COPY . .
RUN dotnet restore

# Build and publish
RUN dotnet publish -c Release -o /app/publish

# ---- Runtime stage ----
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# Copy the app from build stage
COPY --from=build /app/publish .

# Ensure SQLite data directory exists
RUN mkdir -p /app/data

# Expose HTTP (optional, depends on Kestrel settings)
EXPOSE 8080

# Start the app
ENTRYPOINT ["dotnet", "Databox.dll"]
