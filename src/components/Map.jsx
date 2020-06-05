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
  };

  componentDidMount() {
    mapboxgl.accessToken = config.MAPBOX_API_TOKEN;
    const map = new mapboxgl.Map({
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
    map.addControl(address);

    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        polygon: true,
        trash: true,
      },
    });
    map.addControl(draw);

    const updateArea = (e) => {
      const data = draw.getAll();
      // console.log(data);
      fetchIntersect(data.features[0].geometry.coordinates[0], "draw");
    };

    const layerSwitcher = (e) => {
      let layerId = e.target.id;
      map.setStyle('mapbox://styles/mapbox/' + layerId)
      console.log(e.target.id)
    }

    map.on("draw.create", updateArea);
    map.on("draw.delete", updateArea);
  }

  funcCheker(name) {
    console.log(name)
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
          console.log(data);
        })
        .catch((error) => this.setState({ error }));
  }

  render() {
    return (
      <div className="container">
        <div id="map"></div>
        <div className='layerMenu'>
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
            id="satellite-v9"
            name="rtoggle"
            value="satellite"
            onClick={(e) => this.layerSwitcher(e)}
          />
          <label htmlFor="satellite-v9">Satellite</label>
        </div>
        <CountyDropdown onAction={this.funcCheker} />
      </div>
    );
  }
}
