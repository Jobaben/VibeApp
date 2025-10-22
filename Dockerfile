# Build stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy solution and project files
COPY VibeApp.sln ./
COPY src/VibeApp.API/VibeApp.API.csproj ./src/VibeApp.API/
COPY tests/VibeApp.Tests.Unit/VibeApp.Tests.Unit.csproj ./tests/VibeApp.Tests.Unit/
COPY tests/VibeApp.Tests.Integration/VibeApp.Tests.Integration.csproj ./tests/VibeApp.Tests.Integration/
COPY tests/VibeApp.Tests.Functional/VibeApp.Tests.Functional.csproj ./tests/VibeApp.Tests.Functional/

# Restore dependencies
RUN dotnet restore

# Copy the rest of the source code
COPY . .

# Build the API project
WORKDIR /src/src/VibeApp.API
RUN dotnet build -c Release -o /app/build

# Publish stage
FROM build AS publish
RUN dotnet publish -c Release -o /app/publish /p:UseAppHost=false

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

# Copy published files from publish stage
COPY --from=publish /app/publish .

ENTRYPOINT ["dotnet", "VibeApp.API.dll"]
