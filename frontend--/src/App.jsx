import { useEffect, useState } from "react";

import {
  LayoutDashboard,
  AlertTriangle,
  Truck,
  Radio,
  Settings,
  MapPin,
  Activity,
  ShieldAlert,
  Users,
  Clock,
  GitBranch,
} from "lucide-react";

import Map from "./Map";
import "./App.css";

function App() {
  // =========================
  // STATES
  // =========================

  const [zones, setZones] = useState([]);
  const [resources, setResources] = useState(null);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);

  const [activePage, setActivePage] =
    useState("Overview");

  const [simulation, setSimulation] =
    useState(null);

  const [scenario, setScenario] =
    useState("Heavy Rainfall");

  const [cascade, setCascade] =
    useState(null);

  const [emergencyMode, setEmergencyMode] =
    useState(false);

  // =========================
  // LOAD DISASTER ZONES
  // =========================

  useEffect(() => {
    Promise.all([
      fetch("http://localhost:5000/api/zones").then((res) => res.json()),
      fetch("http://localhost:5000/api/weather").then((res) => res.json()),
    ])
      .then(([zoneData, weatherData]) => {
        setZones(zoneData);
        setWeather(weatherData);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error loading dashboard data:", error);
        setLoading(false);
      });
  }, []);

  // =========================
  // LOAD RESOURCES
  // =========================

  useEffect(() => {
    fetch("http://localhost:5000/api/resources")
      .then((response) => response.json())
      .then((data) => {
        setResources(data);
      })
      .catch((error) => {
        console.error(
          "Error loading resources:",
          error
        );
      });
  }, []);

  // =========================
  // CALCULATE DASHBOARD DATA
  // =========================

  const highestRisk =
    zones.length > 0
      ? Math.max(
          ...zones.map((zone) => zone.risk)
        )
      : 0;

  const highestRiskZone =
    zones.length > 0
      ? zones.reduce((highest, zone) =>
          zone.risk > highest.risk
            ? zone
            : highest
        )
      : null;

  const criticalZones = zones.filter(
    (zone) => zone.level === "Critical"
  ).length;

  const totalPeopleAtRisk =
    zones.reduce(
      (total, zone) =>
        total + zone.peopleAtRisk,
      0
    );

  // =========================
  // DEPLOY RESOURCES
  // =========================

  const deployResources = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/resources/deploy",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            ambulances: 4,
            rescueTeams: 2,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(
          data.message ||
            "Deployment failed."
        );
        return;
      }

      setResources(data.resources);

      alert(
        "Successfully deployed 4 ambulances and 2 rescue teams."
      );
    } catch (error) {
      console.error(
        "Deployment error:",
        error
      );

      alert(
        "Could not connect to backend."
      );
    }
  };

  // =========================
  // WHAT-IF SIMULATION
  // =========================

  const runSimulation = () => {
    const currentRisk =
      highestRisk || 0;

    const currentPeople =
      totalPeopleAtRisk || 0;

    let riskIncrease = 12;
    let peopleMultiplier = 1.25;
    let extraAmbulances = 2;
    let extraRescueTeams = 1;

    if (scenario === "Major Flood") {
      riskIncrease = 20;
      peopleMultiplier = 1.5;
      extraAmbulances = 4;
      extraRescueTeams = 3;
    }

    if (scenario === "Extreme Storm") {
      riskIncrease = 16;
      peopleMultiplier = 1.35;
      extraAmbulances = 3;
      extraRescueTeams = 2;
    }

    if (scenario === "Wildfire") {
      riskIncrease = 18;
      peopleMultiplier = 1.4;
      extraAmbulances = 3;
      extraRescueTeams = 3;
    }

    setSimulation({
      scenario: scenario,

      risk: Math.min(
        currentRisk + riskIncrease,
        100
      ),

      people: Math.round(
        currentPeople *
          peopleMultiplier
      ),

      extraAmbulances:
        extraAmbulances,

      extraRescueTeams:
        extraRescueTeams,
    });
  };

  // =========================
  // CASCADING DISASTER PREDICTION
  // =========================

  const runCascadePrediction = () => {
    const baseRisk = highestRisk || 0;
    const people = totalPeopleAtRisk || 0;

    const rain = weather?.rain || 0;
    const wind = weather?.windSpeed || 0;

    const floodProbability = Math.min(
      Math.round(35 + rain * 4 + (baseRisk - 60) * 0.35),
      95
    );

    const roadImpact = Math.min(
      Math.round(20 + floodProbability * 0.55),
      90
    );

    const responseDelay = Math.min(
      Math.round(10 + roadImpact * 0.45),
      75
    );

    const projectedRisk = Math.min(
      Math.round(
        baseRisk +
        floodProbability * 0.12 +
        roadImpact * 0.08 +
        responseDelay * 0.06 +
        wind * 0.04
      ),
      100
    );

    const projectedPeople = Math.round(
      people * (1 + floodProbability / 500)
    );

    const extraAmbulances =
      projectedRisk >= 90 ? 5 :
      projectedRisk >= 80 ? 4 :
      projectedRisk >= 70 ? 3 : 2;

    const extraRescueTeams =
      projectedRisk >= 90 ? 4 :
      projectedRisk >= 80 ? 3 :
      projectedRisk >= 70 ? 2 : 1;

    setCascade({
      floodProbability,
      roadImpact,
      responseDelay,
      projectedRisk,
      projectedPeople,
      extraAmbulances,
      extraRescueTeams,
    });
  };

  // =========================
  // LIVE EMERGENCY MODE
  // =========================

  const toggleEmergencyMode = () => {
    setEmergencyMode((current) => !current);
  };

  // =========================
  // STATS
  // =========================

  const stats = [
    {
      title: "Active Threats",

      value: zones.length
        .toString()
        .padStart(2, "0"),

      change:
        "Live detected zones",

      icon: (
        <AlertTriangle size={22} />
      ),
    },

    {
      title: "Critical Zones",

      value: criticalZones
        .toString()
        .padStart(2, "0"),

      change:
        "Needs attention",

      icon: (
        <ShieldAlert size={22} />
      ),
    },

    {
      title: "Highest Risk",

      value: `${highestRisk}/100`,

      change:
        highestRiskZone
          ? highestRiskZone.name
          : "No data",

      icon: (
        <Activity size={22} />
      ),
    },

    {
      title: "People at Risk",

      value: `${(
        totalPeopleAtRisk / 1000
      ).toFixed(1)}K`,

      change: `Across ${zones.length} zones`,

      icon: (
        <Users size={22} />
      ),
    },
  ];

  // =========================
  // SIDEBAR MENU
  // =========================

  const menuItems = [
    {
      name: "Overview",
      icon: (
        <LayoutDashboard size={20} />
      ),
    },

    {
      name: "Threats",
      icon: (
        <AlertTriangle size={20} />
      ),
    },

    {
      name: "Resources",
      icon: (
        <Truck size={20} />
      ),
    },

    {
      name: "Simulation",
      icon: (
        <Activity size={20} />
      ),
    },

    {
      name: "Cascading Risk",
      icon: (
        <GitBranch size={20} />
      ),
    },

    {
      name: "Alerts",
      icon: (
        <Radio size={20} />
      ),
    },
  ];

  // =========================
  // RETURN
  // =========================

  return (
    <div className="app">

      {/* =========================
          SIDEBAR
      ========================= */}

      <aside className="sidebar">

        <div className="logo">

          <div className="logo-icon">
            G
          </div>

          <div>
            <h2>
              GREENBYTE
            </h2>

            <span>
              Climate War Room
            </span>
          </div>

        </div>

        <div className="nav-section">

          <p className="nav-title">
            COMMAND CENTER
          </p>

          {menuItems.map(
            (item) => (
              <button
                key={item.name}
                className={`nav-item ${
                  activePage ===
                  item.name
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  setActivePage(
                    item.name
                  )
                }
              >
                {item.icon}

                <span>
                  {item.name}
                </span>
              </button>
            )
          )}

        </div>

        <div className="sidebar-bottom">

          <button className="nav-item">

            <Settings size={20} />

            <span>
              Settings
            </span>

          </button>

          <div className="system-status">

            <span className="status-dot"></span>

            <div>

              <strong>
                System Online
              </strong>

              <small>
                All systems operational
              </small>

            </div>

          </div>

        </div>

      </aside>

      {/* =========================
          MAIN
      ========================= */}

      <main className="main">

        {emergencyMode && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "14px",
              padding: "11px 14px",
              marginBottom: "14px",
              borderRadius: "10px",
              background: "rgba(255, 77, 103, 0.10)",
              border: "1px solid rgba(255, 97, 117, 0.35)",
              boxShadow: "0 0 24px rgba(255, 77, 103, 0.08)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <span
                style={{
                  width: "9px",
                  height: "9px",
                  borderRadius: "50%",
                  background: "#ff6175",
                  boxShadow: "0 0 0 5px rgba(255, 97, 117, 0.10)",
                  flexShrink: 0,
                }}
              ></span>

              <div>
                <strong style={{ color: "#ff9aaa" }}>
                  EMERGENCY MODE ACTIVE
                </strong>

                <div
                  style={{
                    fontSize: "12px",
                    opacity: 0.72,
                    marginTop: "2px",
                  }}
                >
                  Multi-threat escalation protocol enabled
                </div>
              </div>
            </div>

            <span
              style={{
                fontSize: "12px",
                fontWeight: "700",
                opacity: 0.8,
              }}
            >
              {highestRiskZone
                ? `${highestRiskZone.name} · ${highestRisk}/100`
                : "Monitoring"}
            </span>
          </div>
        )}

        {/* TOP BAR */}

        <header className="topbar">

          <div>

            <p className="eyebrow">
              AI-COORDINATED
              DISASTER RESPONSE
            </p>

            <h1>
              {activePage}
            </h1>

          </div>

          <div className="location">

            <MapPin size={18} />

            <div>

              <strong>
                Pune, Maharashtra
              </strong>

              <span>
                Live monitoring
              </span>

            </div>

            <span className="live-dot"></span>

            <button
              onClick={toggleEmergencyMode}
              aria-pressed={emergencyMode}
              style={{
                marginLeft: "8px",
                padding: "8px 11px",
                borderRadius: "8px",
                border: emergencyMode
                  ? "1px solid rgba(255, 97, 117, 0.55)"
                  : "1px solid rgba(57, 217, 144, 0.30)",
                background: emergencyMode
                  ? "rgba(255, 97, 117, 0.12)"
                  : "rgba(57, 217, 144, 0.08)",
                color: emergencyMode
                  ? "#ff9aaa"
                  : "#7ee8b7",
                fontSize: "11px",
                fontWeight: "700",
                letterSpacing: "0.4px",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {emergencyMode
                ? "EXIT EMERGENCY"
                : "EMERGENCY MODE"}
            </button>

          </div>

        </header>


        {/* =====================================================
            COMMAND CENTER PAGES
        ===================================================== */}

        {activePage === "Overview" && (
          <>
        {/* =========================
            STATS
        ========================= */}

        {emergencyMode && (
          <section
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "12px",
              marginBottom: "14px",
            }}
          >
            <div className="panel" style={{ padding: "14px" }}>
              <small style={{ opacity: 0.65 }}>RESPONSE STATUS</small>
              <h3 style={{ margin: "5px 0 0", color: "#ff9aaa" }}>
                Immediate Coordination
              </h3>
            </div>

            <div className="panel" style={{ padding: "14px" }}>
              <small style={{ opacity: 0.65 }}>PRIORITY ZONE</small>
              <h3 style={{ margin: "5px 0 0" }}>
                {highestRiskZone
                  ? highestRiskZone.name
                  : "Monitoring"}
              </h3>
            </div>

            <div className="panel" style={{ padding: "14px" }}>
              <small style={{ opacity: 0.65 }}>CRISIS SCORE</small>
              <h3 style={{ margin: "5px 0 0" }}>
                {highestRisk}/100
              </h3>
            </div>
          </section>
        )}

        <section className="stats-grid">

          {stats.map(
            (stat) => (

              <div
                className="stat-card"
                key={stat.title}
              >

                <div className="stat-top">

                  <div className="stat-icon">
                    {stat.icon}
                  </div>

                  <span className="live-label">
                    LIVE
                  </span>
                </div>

                <h2>
                  {stat.value}
                </h2>

                <p>
                  {stat.title}
                </p>

                <small>
                  {stat.change}
                </small>

              </div>
            )
          )}

          {/* LIVE WEATHER */}
          <div className="stat-card">
            <div className="stat-top">
              <div className="stat-icon">🌦️</div>
              <span className="live-label">LIVE</span>
            </div>

            <h2>
              {weather ? `${weather.temperature}°C` : "Loading..."}
            </h2>

            <p>Live Weather</p>

            <small>
              {weather
                ? `Humidity ${weather.humidity}%`
                : "Fetching weather"}
            </small>

            {weather && (
              <div
                style={{
                  marginTop: "8px",
                  fontSize: "12px",
                  opacity: 0.8,
                }}
              >
                💧 Rain: {weather.rain} mm
                <br />
                💨 Wind: {weather.windSpeed} km/h
              </div>
            )}
          </div>

        </section>

        {/* =========================
            DASHBOARD GRID
        ========================= */}

        <section className="dashboard-grid">

          {/* =====================
              MAP
          ===================== */}

          <div className="panel map-panel">

            <div className="panel-header">

              <div>

                <h3>
                  Disaster
                  Intelligence Map
                </h3>

                <p>
                  Real-time threat
                  monitoring
                </p>

              </div>

              <div className="map-legend">

                <span>

                  <i className="legend critical"></i>

                  Critical

                </span>

                <span>

                  <i className="legend high"></i>

                  High

                </span>

                <span>

                  <i className="legend moderate"></i>

                  Moderate

                </span>

              </div>

            </div>

            <div className="real-map">

              {loading ? (

                <div
                  style={{
                    padding: "40px",
                    textAlign:
                      "center",
                  }}
                >
                  Loading
                  disaster zones...
                </div>

              ) : (

                <Map
                  zones={zones}
                />

              )}

            </div>

          </div>

          {/* =====================
              AI PANEL
          ===================== */}

          <div className="panel ai-panel">

            <div className="ai-header">

              <div className="ai-icon">
                ✦
              </div>

              <div>

                <h3>
                  AI Recommendation
                </h3>

                <p>
                  Priority action
                </p>

              </div>

            </div>

            <div className="priority-badge">

              {emergencyMode
                ? "EMERGENCY RESPONSE"
                : highestRiskZone
                ? `${highestRiskZone.level.toUpperCase()} PRIORITY`
                : "NO ACTIVE THREAT"}

            </div>

            <h2>

              {highestRiskZone
                ? highestRiskZone.name
                : "No Zone"}

            </h2>

            <div className="risk-score">

              <div>

                <span>
                  Crisis Score
                </span>

                <strong>
                  {highestRisk}
                </strong>

              </div>

              <div className="risk-circle">

                {highestRisk}

              </div>

            </div>

            {/* =================
                CRISIS SCORE BREAKDOWN
            ================= */}

            {highestRiskZone && (
              <div
                className="crisis-breakdown"
                style={{
                  marginTop: "15px",
                  padding: "14px",
                  borderRadius: "10px",
                  background: "rgba(255,255,255,0.04)",
                }}
              >
                <h4 style={{ margin: "0 0 12px 0" }}>
                  Crisis Score Breakdown
                </h4>

                <div style={{ display: "grid", gap: "8px" }}>
                  <div>
                    <span>Threat Severity</span>
                    <strong style={{ float: "right" }}>
                      {highestRiskZone.threatSeverity != null
                        ? (highestRiskZone.threatSeverity * 0.30).toFixed(1)
                        : "—"} / 30
                    </strong>
                  </div>

                  <div>
                    <span>Population at Risk</span>
                    <strong style={{ float: "right" }}>
                      {highestRiskZone.populationRisk != null
                        ? (highestRiskZone.populationRisk * 0.25).toFixed(1)
                        : "—"} / 25
                    </strong>
                  </div>

                  <div>
                    <span>Vulnerability</span>
                    <strong style={{ float: "right" }}>
                      {highestRiskZone.vulnerability != null
                        ? (highestRiskZone.vulnerability * 0.20).toFixed(1)
                        : "—"} / 20
                    </strong>
                  </div>

                  <div>
                    <span>Time Criticality</span>
                    <strong style={{ float: "right" }}>
                      {highestRiskZone.timeCriticality != null
                        ? (highestRiskZone.timeCriticality * 0.15).toFixed(1)
                        : "—"} / 15
                    </strong>
                  </div>

                  <div>
                    <span>Resource Gap</span>
                    <strong style={{ float: "right" }}>
                      {highestRiskZone.resourceGap != null
                        ? (highestRiskZone.resourceGap * 0.10).toFixed(1)
                        : "—"} / 10
                    </strong>
                  </div>

                  <div
                    style={{
                      marginTop: "12px",
                      paddingTop: "10px",
                      borderTop: "1px solid rgba(255,255,255,0.12)",
                      display: "flex",
                      justifyContent: "space-between",
                      fontWeight: "700",
                    }}
                  >
                    <span>Total</span>
                    <span>{highestRiskZone.risk} / 100</span>
                  </div>
                </div>
              </div>
            )}

            <div className="threat-list">

              <div>

                <span>
                  🌧
                </span>

                Heavy Rain

                <strong>
                  HIGH
                </strong>

              </div>

              <div>

                <span>
                  🌊
                </span>

                Flood Risk

                <strong>
                  HIGH
                </strong>

              </div>

              <div>

                <span>
                  ⚡
                </span>

                Power Risk

                <strong>
                  MEDIUM
                </strong>

              </div>

            </div>

            <div className="recommendation">

              <p>
                {emergencyMode
                  ? "Immediate Emergency Action"
                  : "Recommended Action"}
              </p>

              <strong>

                Deploy 4 ambulances
                + 2 rescue teams
                to{" "}

                {highestRiskZone
                  ? highestRiskZone.name
                  : "Zone A"}.

              </strong>

              <small>

                {emergencyMode
                  ? "Emergency mode prioritizes the highest-risk zone for immediate coordinated response."
                  : "Based on severity, population exposure and current resource gap."}

              </small>

            </div>

            {/* =================
                SCENARIO SELECTOR
            ================= */}

            <div
              style={{
                marginTop: "15px",
              }}
            >

              <label
                style={{
                  display: "block",
                  marginBottom:
                    "8px",
                  fontWeight:
                    "600",
                }}
              >
                What-If Scenario
              </label>

              <select
                value={scenario}
                onChange={(e) =>
                  setScenario(
                    e.target.value
                  )
                }
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius:
                    "8px",
                  border:
                    "1px solid #444",
                  background:
                    "#111",
                  color: "#fff",
                  fontSize:
                    "14px",
                }}
              >

                <option>
                  Heavy Rainfall
                </option>

                <option>
                  Major Flood
                </option>

                <option>
                  Extreme Storm
                </option>

                <option>
                  Wildfire
                </option>

              </select>

            </div>

            {/* =================
                ACTION BUTTONS
            ================= */}

            <div
              style={{
                display:
                  "flex",
                flexDirection:
                  "column",
                gap: "10px",
                marginTop:
                  "15px",
              }}
            >

              {/* DEPLOY */}

              <button
                className="simulate-btn"
                onClick={
                  deployResources
                }
              >
                Deploy Resources →
              </button>

              {/* SIMULATION */}

              <button
                className="simulate-btn"
                onClick={
                  runSimulation
                }
              >
                Run What-If
                Simulation →
              </button>

            </div>

            {/* =================
                SIMULATION RESULT
            ================= */}

            {simulation && (

              <div
                className="simulation-result"
                style={{
                  marginTop:
                    "15px",
                  padding:
                    "15px",
                  borderRadius:
                    "10px",
                  background:
                    "rgba(255,255,255,0.05)",
                }}
              >

                <h4>
                  Simulation Result
                </h4>

                <p>

                  Scenario:

                  <strong>
                    {" "}
                    {simulation.scenario}
                  </strong>

                </p>

                <p>

                  Crisis Score:

                  <strong>
                    {" "}
                    {simulation.risk}
                    /100
                  </strong>

                </p>

                <p>

                  People at Risk:

                  <strong>

                    {" "}
                    {(
                      simulation.people /
                      1000
                    ).toFixed(1)}
                    K

                  </strong>

                </p>

                <p>

                  Additional
                  Ambulances:

                  <strong>
                    {" "}
                    +
                    {
                      simulation.extraAmbulances
                    }
                  </strong>

                </p>

                <p>

                  Additional
                  Rescue Teams:

                  <strong>
                    {" "}
                    +
                    {
                      simulation.extraRescueTeams
                    }
                  </strong>

                </p>

              </div>

            )}

          </div>

        </section>

        {/* =========================
            BOTTOM GRID
        ========================= */}

        <section className="bottom-grid">

          {/* =====================
              THREAT OVERVIEW
          ===================== */}

          <div className="panel">

            <div className="panel-header">

              <div>

                <h3>
                  Threat Overview
                </h3>

                <p>
                  Current detected
                  threats
                </p>

              </div>

              <Clock size={18} />

            </div>

            {zones.length ===
            0 ? (

              <p>
                No active
                threats.
              </p>

            ) : (

              zones.map(
                (zone) => (

                  <div
                    className="threat-row"
                    key={zone.id}
                  >

                    <span className="threat-icon">

                      {zone.threat.includes(
                        "Flood"
                      )
                        ? "🌊"
                        : "🌧"}

                    </span>

                    <div>

                      <strong>
                        {zone.threat}
                      </strong>

                      <small>

                        {zone.name}
                        {" · "}
                        {zone.peopleAtRisk.toLocaleString()}
                        {" "}
                        people at risk

                      </small>

                    </div>

                    <b
                      className={
                        zone.level ===
                        "Critical"
                          ? "danger-text"
                          : zone.level ===
                            "High"
                          ? "danger-text"
                          : "warning-text"
                      }
                    >

                      {zone.level.toUpperCase()}

                    </b>

                  </div>

                )
              )

            )}

          </div>

          {/* =====================
              RESOURCES
          ===================== */}

          <div className="panel resource-panel">

            <div className="panel-header">

              <div>

                <h3>
                  Emergency
                  Resources
                </h3>

                <p>
                  Current deployment
                </p>

              </div>

              <Truck size={18} />

            </div>

            {!resources ? (

              <p>
                Loading
                resources...
              </p>

            ) : (

              <>

                {/* AMBULANCES */}

                <div className="resource">

                  <div>

                    <strong>
                      🚑 Ambulances
                    </strong>

                    <span>

                      {resources.ambulances -
                        resources.availableAmbulances}

                      {" / "}

                      {resources.ambulances}

                      {" deployed"}

                    </span>

                  </div>

                  <div className="progress">

                    <span
                      style={{
                        width: `${
                          ((resources.ambulances -
                            resources.availableAmbulances) /
                            resources.ambulances) *
                          100
                        }%`,
                      }}
                    ></span>

                  </div>

                </div>

                {/* RESCUE TEAMS */}

                <div className="resource">

                  <div>

                    <strong>
                      🚒 Rescue Teams
                    </strong>

                    <span>

                      {resources.rescueTeams -
                        resources.availableRescueTeams}

                      {" / "}

                      {resources.rescueTeams}

                      {" deployed"}

                    </span>

                  </div>

                  <div className="progress">

                    <span
                      style={{
                        width: `${
                          ((resources.rescueTeams -
                            resources.availableRescueTeams) /
                            resources.rescueTeams) *
                          100
                        }%`,
                      }}
                    ></span>

                  </div>

                </div>

                {/* SHELTERS */}

                <div className="resource">

                  <div>

                    <strong>
                      🏠 Shelters
                    </strong>

                    <span>

                      {resources.shelters -
                        resources.availableShelters}

                      {" / "}

                      {resources.shelters}

                      {" active"}

                    </span>

                  </div>

                  <div className="progress">

                    <span
                      style={{
                        width: `${
                          ((resources.shelters -
                            resources.availableShelters) /
                            resources.shelters) *
                          100
                        }%`,
                      }}
                    ></span>

                  </div>

                </div>

              </>

            )}

          </div>

        </section>

          </>
        )}

        {activePage === "Threats" && (
          <section className="panel" style={{ marginBottom: "20px" }}>
            <div className="panel-header">
              <div>
                <h3>Threat Intelligence</h3>
                <p>Detailed analysis of all detected disaster zones</p>
              </div>
              <AlertTriangle size={18} />
            </div>

            {loading ? (
              <div style={{ padding: "40px", textAlign: "center" }}>
                Loading threat intelligence...
              </div>
            ) : zones.length === 0 ? (
              <div style={{ padding: "30px", textAlign: "center" }}>
                No active threats detected.
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                  gap: "16px",
                }}
              >
                {zones.map((zone) => (
                  <div
                    key={zone.id}
                    style={{
                      padding: "18px",
                      borderRadius: "14px",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "12px",
                      }}
                    >
                      <div>
                        <small style={{ opacity: 0.7 }}>
                          {zone.level.toUpperCase()} PRIORITY
                        </small>
                        <h2 style={{ margin: "4px 0" }}>{zone.name}</h2>
                      </div>

                      <div
                        style={{
                          fontSize: "28px",
                          fontWeight: "700",
                        }}
                      >
                        {zone.risk}
                      </div>
                    </div>

                    <div
                      style={{
                        padding: "10px",
                        borderRadius: "8px",
                        background: "rgba(255,255,255,0.04)",
                        marginBottom: "14px",
                      }}
                    >
                      <strong>{zone.threat}</strong>
                    </div>

                    {[
                      ["Threat Severity", zone.threatSeverity, 0.30],
                      ["Population at Risk", zone.populationRisk, 0.25],
                      ["Vulnerability", zone.vulnerability, 0.20],
                      ["Time Criticality", zone.timeCriticality, 0.15],
                      ["Resource Gap", zone.resourceGap, 0.10],
                    ].map(([label, value, weight]) => (
                      <div key={label} style={{ marginBottom: "11px" }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: "12px",
                            marginBottom: "5px",
                          }}
                        >
                          <span>{label}</span>
                          <strong>
                            {(value * weight).toFixed(1)} / {(100 * weight).toFixed(0)}
                          </strong>
                        </div>

                        <div
                          style={{
                            height: "6px",
                            borderRadius: "99px",
                            background: "rgba(255,255,255,0.10)",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${value}%`,
                              height: "100%",
                              borderRadius: "99px",
                              background:
                                zone.level === "Critical"
                                  ? "#ff4d67"
                                  : zone.level === "High"
                                  ? "#ff9b4d"
                                  : "#e5cf4d",
                            }}
                          />
                        </div>
                      </div>
                    ))}

                    <div
                      style={{
                        marginTop: "14px",
                        paddingTop: "12px",
                        borderTop: "1px solid rgba(255,255,255,0.1)",
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <span>People at Risk</span>
                      <strong>{zone.peopleAtRisk.toLocaleString()}</strong>
                    </div>

                    <div
                      style={{
                        marginTop: "12px",
                        padding: "10px",
                        borderRadius: "8px",
                        background: "rgba(255,255,255,0.03)",
                        fontSize: "12px",
                      }}
                    >
                      <strong>Recommended response:</strong>
                      <br />
                      Prioritize this zone according to its crisis score,
                      population exposure and resource gap.
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activePage === "Resources" && (
          <section>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-top">
                  <div className="stat-icon">🚑</div>
                  <span className="live-label">LIVE</span>
                </div>
                <h2>
                  {resources
                    ? resources.availableAmbulances
                    : "--"}
                </h2>
                <p>Available Ambulances</p>
                <small>
                  {resources
                    ? `${resources.ambulances - resources.availableAmbulances} deployed`
                    : "Loading"}
                </small>
              </div>

              <div className="stat-card">
                <div className="stat-top">
                  <div className="stat-icon">🚒</div>
                  <span className="live-label">LIVE</span>
                </div>
                <h2>
                  {resources
                    ? resources.availableRescueTeams
                    : "--"}
                </h2>
                <p>Available Rescue Teams</p>
                <small>
                  {resources
                    ? `${resources.rescueTeams - resources.availableRescueTeams} deployed`
                    : "Loading"}
                </small>
              </div>

              <div className="stat-card">
                <div className="stat-top">
                  <div className="stat-icon">🏠</div>
                  <span className="live-label">LIVE</span>
                </div>
                <h2>
                  {resources
                    ? resources.availableShelters
                    : "--"}
                </h2>
                <p>Available Shelters</p>
                <small>Emergency capacity</small>
              </div>
            </div>

            <div
              className="dashboard-grid"
              style={{ marginTop: "20px" }}
            >
              <div className="panel">
                <div className="panel-header">
                  <div>
                    <h3>Resource Allocation</h3>
                    <p>Current emergency resource deployment</p>
                  </div>
                  <Truck size={18} />
                </div>

                {resources ? (
                  <div style={{ display: "grid", gap: "18px" }}>
                    {[
                      [
                        "🚑 Ambulances",
                        resources.ambulances,
                        resources.availableAmbulances,
                      ],
                      [
                        "🚒 Rescue Teams",
                        resources.rescueTeams,
                        resources.availableRescueTeams,
                      ],
                      [
                        "🏠 Shelters",
                        resources.shelters,
                        resources.availableShelters,
                      ],
                    ].map(([label, total, available]) => {
                      const deployed = total - available;
                      const percentage =
                        total > 0 ? (deployed / total) * 100 : 0;

                      return (
                        <div key={label}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              marginBottom: "7px",
                            }}
                          >
                            <strong>{label}</strong>
                            <span>
                              {deployed} / {total} deployed
                            </span>
                          </div>

                          <div className="progress">
                            <span
                              style={{
                                width: `${percentage}%`,
                              }}
                            ></span>
                          </div>

                          <small style={{ opacity: 0.7 }}>
                            {available} currently available
                          </small>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p>Loading resources...</p>
                )}
              </div>

              <div className="panel ai-panel">
                <div className="ai-header">
                  <div className="ai-icon">✦</div>
                  <div>
                    <h3>Resource Optimizer</h3>
                    <p>Priority deployment</p>
                  </div>
                </div>

                <div className="recommendation">
                  <p>Recommended Action</p>
                  <strong>
                    Deploy 4 ambulances + 2 rescue teams to{" "}
                    {highestRiskZone
                      ? highestRiskZone.name
                      : "Zone A"}.
                  </strong>
                  <small>
                    Allocation is based on current crisis score,
                    population exposure and resource gap.
                  </small>
                </div>

                <button
                  className="simulate-btn"
                  onClick={deployResources}
                  style={{ marginTop: "15px" }}
                >
                  Deploy Resources →
                </button>
              </div>
            </div>
          </section>
        )}

        {activePage === "Simulation" && (
          <section>
            <div className="panel">
              <div className="panel-header">
                <div>
                  <h3>What-If Simulation Engine</h3>
                  <p>Test how different disaster scenarios could affect the city</p>
                </div>
                <Activity size={18} />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "16px",
                  marginTop: "10px",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontWeight: "600",
                    }}
                  >
                    Select Scenario
                  </label>

                  <select
                    value={scenario}
                    onChange={(e) => setScenario(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "8px",
                      border: "1px solid #444",
                      background: "#111",
                      color: "#fff",
                    }}
                  >
                    <option>Heavy Rainfall</option>
                    <option>Major Flood</option>
                    <option>Extreme Storm</option>
                    <option>Wildfire</option>
                  </select>
                </div>

                <div
                  style={{
                    padding: "14px",
                    borderRadius: "10px",
                    background: "rgba(255,255,255,0.04)",
                  }}
                >
                  <small>Current Crisis Score</small>
                  <h2 style={{ margin: "6px 0" }}>
                    {highestRisk}/100
                  </h2>
                  <span>
                    {highestRiskZone
                      ? highestRiskZone.name
                      : "No active zone"}
                  </span>
                </div>

                <div
                  style={{
                    padding: "14px",
                    borderRadius: "10px",
                    background: "rgba(255,255,255,0.04)",
                  }}
                >
                  <small>Current People at Risk</small>
                  <h2 style={{ margin: "6px 0" }}>
                    {(totalPeopleAtRisk / 1000).toFixed(1)}K
                  </h2>
                  <span>Across {zones.length} zones</span>
                </div>
              </div>

              <button
                className="simulate-btn"
                onClick={runSimulation}
                style={{ marginTop: "18px" }}
              >
                Run What-If Simulation →
              </button>
            </div>

            {simulation && (
              <div
                className="dashboard-grid"
                style={{ marginTop: "20px" }}
              >
                <div className="panel">
                  <div className="panel-header">
                    <div>
                      <h3>Simulation Result</h3>
                      <p>{simulation.scenario}</p>
                    </div>
                    <Activity size={18} />
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(150px, 1fr))",
                      gap: "14px",
                    }}
                  >
                    <div className="stat-card">
                      <h2>{highestRisk}</h2>
                      <p>Current Risk</p>
                    </div>

                    <div className="stat-card">
                      <h2>{simulation.risk}</h2>
                      <p>Predicted Risk</p>
                    </div>

                    <div className="stat-card">
                      <h2>
                        {(totalPeopleAtRisk / 1000).toFixed(1)}K
                      </h2>
                      <p>Current People</p>
                    </div>

                    <div className="stat-card">
                      <h2>
                        {(simulation.people / 1000).toFixed(1)}K
                      </h2>
                      <p>Predicted People</p>
                    </div>
                  </div>
                </div>

                <div className="panel ai-panel">
                  <div className="ai-header">
                    <div className="ai-icon">✦</div>
                    <div>
                      <h3>Response Requirements</h3>
                      <p>Additional resources predicted</p>
                    </div>
                  </div>

                  <div className="recommendation">
                    <p>Resource Requirement</p>
                    <strong>
                      +{simulation.extraAmbulances} ambulances
                      <br />
                      +{simulation.extraRescueTeams} rescue teams
                    </strong>
                    <small>
                      Prepare additional resources before the
                      simulated scenario escalates.
                    </small>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {activePage === "Cascading Risk" && (
          <section>
            <div className="panel" style={{ marginBottom: "20px" }}>
              <div className="panel-header">
                <div>
                  <h3>Cascading Disaster Prediction</h3>
                  <p>
                    Model how one climate threat can trigger secondary
                    infrastructure and response impacts.
                  </p>
                </div>
                <GitBranch size={18} />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
                  gap: "12px",
                  marginBottom: "18px",
                }}
              >
                <div className="stat-card">
                  <div className="stat-top">
                    <div className="stat-icon">🌧️</div>
                    <span className="live-label">LIVE</span>
                  </div>
                  <h2>{weather ? `${weather.rain} mm` : "--"}</h2>
                  <p>Current Rain</p>
                  <small>
                    {weather ? `${weather.windSpeed} km/h wind` : "Loading weather"}
                  </small>
                </div>

                <div className="stat-card">
                  <div className="stat-top">
                    <div className="stat-icon">⚠️</div>
                    <span className="live-label">MODEL</span>
                  </div>
                  <h2>
                    {cascade ? `${cascade.floodProbability}%` : "--"}
                  </h2>
                  <p>Flood Probability</p>
                  <small>Estimated from current conditions</small>
                </div>

                <div className="stat-card">
                  <div className="stat-top">
                    <div className="stat-icon">🛣️</div>
                    <span className="live-label">MODEL</span>
                  </div>
                  <h2>
                    {cascade ? `${cascade.roadImpact}%` : "--"}
                  </h2>
                  <p>Road Impact</p>
                  <small>Potential connectivity disruption</small>
                </div>

                <div className="stat-card">
                  <div className="stat-top">
                    <div className="stat-icon">🚨</div>
                    <span className="live-label">MODEL</span>
                  </div>
                  <h2>
                    {cascade ? `${cascade.responseDelay}%` : "--"}
                  </h2>
                  <p>Response Delay Risk</p>
                  <small>Potential emergency response slowdown</small>
                </div>
              </div>

              <div
                style={{
                  padding: "18px",
                  borderRadius: "12px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <h4 style={{ marginTop: 0 }}>
                  Cascading Chain
                </h4>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                    gap: "10px",
                    alignItems: "center",
                  }}
                >
                  <div style={{ padding: "14px", borderRadius: "10px", background: "rgba(255,255,255,0.05)" }}>
                    🌧️ Heavy Rain
                    <br />
                    <small>Primary threat</small>
                  </div>

                  <div style={{ textAlign: "center", fontSize: "22px" }}>→</div>

                  <div style={{ padding: "14px", borderRadius: "10px", background: "rgba(255,255,255,0.05)" }}>
                    🌊 Flood Risk
                    <br />
                    <small>Secondary hazard</small>
                  </div>

                  <div style={{ textAlign: "center", fontSize: "22px" }}>→</div>

                  <div style={{ padding: "14px", borderRadius: "10px", background: "rgba(255,255,255,0.05)" }}>
                    🛣️ Road Disruption
                    <br />
                    <small>Infrastructure impact</small>
                  </div>

                  <div style={{ textAlign: "center", fontSize: "22px" }}>→</div>

                  <div style={{ padding: "14px", borderRadius: "10px", background: "rgba(255,255,255,0.05)" }}>
                    🚑 Response Delay
                    <br />
                    <small>Operational impact</small>
                  </div>
                </div>

                <button
                  className="simulate-btn"
                  onClick={runCascadePrediction}
                  style={{ marginTop: "18px", width: "100%" }}
                >
                  Run Cascading Risk Prediction →
                </button>
              </div>
            </div>

            {cascade && (
              <div className="panel">
                <div className="panel-header">
                  <div>
                    <h3>Prediction Result</h3>
                    <p>Projected impact if the cascade develops.</p>
                  </div>
                  <Activity size={18} />
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "12px",
                  }}
                >
                  <div className="stat-card">
                    <h2>{highestRisk}/100 → {cascade.projectedRisk}/100</h2>
                    <p>Crisis Score</p>
                  </div>

                  <div className="stat-card">
                    <h2>{cascade.projectedPeople.toLocaleString()}</h2>
                    <p>Projected People at Risk</p>
                  </div>

                  <div className="stat-card">
                    <h2>+{cascade.extraAmbulances}</h2>
                    <p>Ambulances Recommended</p>
                  </div>

                  <div className="stat-card">
                    <h2>+{cascade.extraRescueTeams}</h2>
                    <p>Rescue Teams Recommended</p>
                  </div>
                </div>

                <div
                  style={{
                    marginTop: "15px",
                    padding: "14px",
                    borderRadius: "10px",
                    background: "rgba(255,255,255,0.04)",
                  }}
                >
                  <strong>AI-style response recommendation:</strong>
                  <p style={{ marginBottom: 0, opacity: 0.8 }}>
                    Prepare additional emergency resources, prioritize road
                    access to the highest-risk zone, and re-evaluate shelter
                    capacity if the predicted cascade develops.
                  </p>
                </div>
              </div>
            )}
          </section>
        )}

        {activePage === "Alerts" && (
          <section className="panel">
            <div className="panel-header">
              <div>
                <h3>Alert Center</h3>
                <p>Current system alerts and priority notifications</p>
              </div>
              <Radio size={18} />
            </div>

            <div style={{ display: "grid", gap: "12px" }}>
              {zones.map((zone) => (
                <div
                  key={zone.id}
                  style={{
                    padding: "15px",
                    borderRadius: "10px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "15px",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <strong>
                      {zone.level === "Critical"
                        ? "🚨 Critical"
                        : zone.level === "High"
                        ? "⚠️ High"
                        : "ℹ️ Moderate"}{" "}
                      — {zone.name}
                    </strong>
                    <p style={{ margin: "5px 0 0", opacity: 0.75 }}>
                      {zone.threat} · {zone.peopleAtRisk.toLocaleString()} people at risk
                    </p>
                  </div>

                  <strong>{zone.risk}/100</strong>
                </div>
              ))}

              {zones.length === 0 && (
                <p>No active alerts.</p>
              )}
            </div>
          </section>
        )}

      </main>
    </div>
  );
}

export default App;
