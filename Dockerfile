FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY ["Ecommerce.API/Ecommerce.API.csproj", "Ecommerce.API/"]
COPY ["frontend/src/assets/logo.png", "frontend/src/assets/logo.png"]
RUN dotnet restore "Ecommerce.API/Ecommerce.API.csproj"

COPY Ecommerce.API/ Ecommerce.API/
COPY frontend/src/assets/logo.png frontend/src/assets/logo.png
WORKDIR /src/Ecommerce.API
RUN dotnet publish "Ecommerce.API.csproj" --configuration Release --output /app/publish --no-restore /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
RUN apt-get update \
    && apt-get install -y --no-install-recommends gosu \
    && rm -rf /var/lib/apt/lists/*
EXPOSE 8080
ENTRYPOINT ["sh", "-c", "mkdir -p /data/productos && chown $APP_UID:$APP_UID /data /data/productos && exec gosu $APP_UID dotnet Ecommerce.API.dll --urls http://0.0.0.0:${PORT:-8080}"]
