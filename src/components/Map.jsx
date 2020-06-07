import React, { Component } from "react";
import "./Map.css";
import mapboxgl from "mapbox-gl";
import CountyDropdown from "./CountyDropdown";
import config from "../config";
const MapboxDraw = require("@mapbox/mapbox-gl-draw");
const MapboxGeocoder = require("@mapbox/mapbox-gl-geocoder");

export default class Map extends Component {
  state = {
    error: null,
    members: []
  };

  componentDidMount() {
    mapboxgl.accessToken = config.MAPBOX_API_TOKEN;
    window.map = new mapboxgl.Map({
      container: "map",
      style: "mapbox://styles/mapbox/streets-v11",
      center: [-81.276855, 33.596319],
      zoom: 7,
    });

    const fetchIntersect = (datapoints, type) => {
      fetch("http://localhost:8000/draw", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          coords: datapoints,
          geomtype: type,
        }),
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error(res.status);
          }
          return res.json();
        })
        .then((data) => {
          console.log(data);
        })
        .catch((error) => this.setState({ error }));
    };
    // console.log(map)
    const address = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      mapboxgl: mapboxgl,
    }).on("result", function ({ result }) {
      console.log(result.geometry.coordinates);
      fetchIntersect(result.geometry.coordinates, "point");
    });
    window.map.addControl(address);

    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        polygon: true,
        trash: true,
      },
    });
    window.map.addControl(draw);

    const updateArea = (e) => {
      const data = draw.getAll();
      // console.log(data);
      fetchIntersect(data.features[0].geometry.coordinates[0], "draw");
    };

    window.map.on("draw.create", updateArea);
    window.map.on("draw.delete", updateArea);
  }

  countyChecker(name) {
    console.log(name);
    fetch("http://localhost:8000/countyselect", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        countyname: name,
      }),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(res.status);
        }
        return res.json();
      })
      .then((data) => {
        console.log(Object.values(data.rows));
        // console.log(typeof data.values)
        this.setState({members: Object.values(data.rows)})
      })
      .catch((error) => this.setState({ error }));
  }

  layerSwitcher(e) {
    let layerId = e.target.id;
    window.map.setStyle("mapbox://styles/mapbox/" + layerId);
  }

  render() {
    console.log(this.state)
    return (
      <div className="container">
        <div id="map"></div>
        <div className="flex-container">
          <div className="layerMenu">
            <input
              type="radio"
              id="streets-v11"
              value="streets"
              checked="checked"
              name="rtoggle"
              onClick={(e) => this.layerSwitcher(e)}
            />
            <label htmlFor="streets-v11">Streets</label>
            <input
              type="radio"
              id="satellite-streets-v10"
              name="rtoggle"
              value="satellite"
              onClick={(e) => this.layerSwitcher(e)}
            />
            <label htmlFor="satellite-streets-v10">Satellite</label>
          </div>
          <CountyDropdown onAction={this.countyChecker} />
        </div>
        <div className="sideNav">
          <h1>Affected Members</h1>
        </div>
      </div>
    );
  }
}
