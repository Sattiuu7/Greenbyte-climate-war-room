import {
  MapContainer,
  TileLayer,
  Circle,
  Popup,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";

function Map({ zones }) {
  const getRiskColor = (level) => {
    if (level === "Critical") return "#ff4d67";
    if (level === "High") return "#ff9b4d";
    return "#e5cf4d";
  };

  return (
    <MapContainer
      center={[18.5204, 73.8567]}
      zoom={12}
      scrollWheelZoom={true}
      style={{
        height: "355px",
        width: "100%",
      }}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {zones.map((zone) => {
        const riskColor = getRiskColor(zone.level);

        return (
          <Circle
            key={zone.id}
            center={[zone.latitude, zone.longitude]}
            radius={350}
            pathOptions={{
              color: riskColor,
              fillColor: riskColor,
              weight: zone.level === "Critical" ? 2.5 : 2,
              opacity: 0.9,
              fillOpacity: 0.20,
            }}
          >
            <Popup>
              <strong>{zone.name}</strong>
              <br />
              Crisis Score: {zone.risk}/100
              <br />
              Level: {zone.level}
              <br />
              Threat: {zone.threat}
              <br />
              People at Risk:{" "}
              {Number(zone.peopleAtRisk || 0).toLocaleString()}
            </Popup>
          </Circle>
        );
      })}
    </MapContainer>
  );
}

export default Map;
