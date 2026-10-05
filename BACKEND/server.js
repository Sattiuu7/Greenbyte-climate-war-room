const express = require("express");
const cors = require("cors");
const https = require("https");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = 5000;

// ==========================================
// DISASTER ZONES
// ==========================================

const zones = [
  {
    id: "A",
    name: "Zone A",

    threatSeverity: 95,
    populationRisk: 90,
    vulnerability: 85,
    timeCriticality: 92,
    resourceGap: 88,

    threat: "Flood + Heavy Rain",
    peopleAtRisk: 8200,

    latitude: 18.5204,
    longitude: 73.8567
  },

  {
    id: "B",
    name: "Zone B",

    threatSeverity: 82,
    populationRisk: 72,
    vulnerability: 70,
    timeCriticality: 75,
    resourceGap: 68,

    threat: "Flood Risk",
    peopleAtRisk: 6100,

    latitude: 18.5074,
    longitude: 73.8077
  },

  {
    id: "C",
    name: "Zone C",

    threatSeverity: 65,
    populationRisk: 58,
    vulnerability: 55,
    timeCriticality: 60,
    resourceGap: 50,

    threat: "Heavy Rain",
    peopleAtRisk: 4100,

    latitude: 18.5679,
    longitude: 73.9143
  }
];

// ==========================================
// CRISIS SCORE ENGINE
// ==========================================

function calculateCrisisScore(zone, weatherImpact = 0) {
  const baseScore =
    zone.threatSeverity * 0.30 +
    zone.populationRisk * 0.25 +
    zone.vulnerability * 0.20 +
    zone.timeCriticality * 0.15 +
    zone.resourceGap * 0.10;

  const finalScore = baseScore + weatherImpact;

  return Math.min(Math.round(finalScore), 100);
}

function getRiskLevel(score) {
  if (score >= 81) return "Critical";
  if (score >= 61) return "High";
  if (score >= 31) return "Moderate";
  return "Low";
}

// ==========================================
// WEATHER IMPACT
// ==========================================

function calculateWeatherImpact(weather) {
  let impact = 0;

  if (weather.rain >= 10) {
    impact += 15;
  } else if (weather.rain >= 5) {
    impact += 10;
  } else if (weather.rain >= 2) {
    impact += 5;
  }

  if (weather.windSpeed >= 50) {
    impact += 10;
  } else if (weather.windSpeed >= 30) {
    impact += 6;
  } else if (weather.windSpeed >= 20) {
    impact += 3;
  }

  return Math.min(impact, 25);
}

// ==========================================
// FALLBACK PROCESSED ZONES
// ==========================================

const processedZones = zones.map((zone) => {
  const risk = calculateCrisisScore(zone, 0);

  return {
    ...zone,
    risk,
    level: getRiskLevel(risk)
  };
});

// ==========================================
// RESOURCES
// ==========================================

let resources = {
  ambulances: 12,
  rescueTeams: 8,
  shelters: 5,

  availableAmbulances: 7,
  availableRescueTeams: 4,
  availableShelters: 3
};

// ==========================================
// HOME
// ==========================================

app.get("/", (req, res) => {
  res.json({
    message: "Greenbyte Backend is running!"
  });
});

// ==========================================
// DISASTER ZONES
// ==========================================

app.get("/api/zones", (req, res) => {
  res.json(processedZones);
});

// ==========================================
// LIVE WEATHER
// ==========================================

app.get("/api/weather", (req, res) => {
  const latitude = 18.5204;
  const longitude = 73.8567;

  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${latitude}` +
    `&longitude=${longitude}` +
    `&current=temperature_2m,relative_humidity_2m,precipitation,rain,showers,wind_speed_10m` +
    `&timezone=Asia%2FKolkata`;

  https
    .get(url, (response) => {
      let data = "";

      response.on("data", (chunk) => {
        data += chunk;
      });

      response.on("end", () => {
        try {
          const weather = JSON.parse(data);

          if (!weather.current) {
            return res.status(500).json({
              message: "Weather data unavailable."
            });
          }

          res.json({
            location: "Pune",

            temperature:
              weather.current.temperature_2m,

            humidity:
              weather.current.relative_humidity_2m,

            precipitation:
              weather.current.precipitation,

            rain:
              weather.current.rain,

            showers:
              weather.current.showers,

            windSpeed:
              weather.current.wind_speed_10m,

            weatherImpact:
              calculateWeatherImpact({
                rain: weather.current.rain,
                windSpeed: weather.current.wind_speed_10m
              }),

            unit: {
              temperature:
                weather.current_units?.temperature_2m,

              precipitation:
                weather.current_units?.precipitation,

              windSpeed:
                weather.current_units?.wind_speed_10m
            }
          });
        } catch (error) {
          console.error("Weather JSON error:", error);

          res.status(500).json({
            message: "Unable to process weather data."
          });
        }
      });
    })
    .on("error", (error) => {
      console.error("Weather API error:", error);

      res.status(500).json({
        message: "Unable to fetch live weather data."
      });
    });
});

// ==========================================
// RESOURCES
// ==========================================

app.get("/api/resources", (req, res) => {
  res.json(resources);
});

// ==========================================
// DEPLOY RESOURCES
// ==========================================

app.post("/api/resources/deploy", (req, res) => {
  const {
    ambulances = 0,
    rescueTeams = 0
  } = req.body;

  if (
    typeof ambulances !== "number" ||
    typeof rescueTeams !== "number"
  ) {
    return res.status(400).json({
      message: "Resource values must be numbers."
    });
  }

  if (
    ambulances < 0 ||
    rescueTeams < 0
  ) {
    return res.status(400).json({
      message: "Resource values cannot be negative."
    });
  }

  if (
    ambulances >
    resources.availableAmbulances
  ) {
    return res.status(400).json({
      message: "Not enough ambulances available."
    });
  }

  if (
    rescueTeams >
    resources.availableRescueTeams
  ) {
    return res.status(400).json({
      message: "Not enough rescue teams available."
    });
  }

  resources.availableAmbulances -= ambulances;
  resources.availableRescueTeams -= rescueTeams;

  res.json({
    message: "Resources deployed successfully.",

    deployed: {
      ambulances,
      rescueTeams
    },

    resources
  });
});

// ==========================================
// START SERVER
// ==========================================

app.listen(PORT, () => {
  console.log(
    `Greenbyte backend running on http://localhost:${PORT}`
  );
});