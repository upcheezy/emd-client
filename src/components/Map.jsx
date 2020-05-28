import React, { Component } from "react";
import "./Map.css";
import mapboxgl from "mapbox-gl";
import ReactMapboxGl from "react-mapbox-gl";
// import * as MapboxDraw from '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw';
import config from "../config";
const MapboxDraw = require("@mapbox/mapbox-gl-draw");
const MapboxGeocoder = require("@mapbox/mapbox-gl-geocoder");

export default class Map extends Component {
  componentDidMount() {
    mapboxgl.accessToken = config.MAPBOX_API_TOKEN;
    const map = new mapboxgl.Map({
      container: "map",
      style: "mapbox://styles/mapbox/streets-v11",
      center: [-79.4512, 43.6568],
      zoom: 13,
    });
    map.addControl(
      new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        mapboxgl: mapboxgl,
      })
    );
    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        polygon: true,
        trash: true,
      },
    });
    map.addControl(draw);
  }

  render() {
    return (
      <div id="map">
        <div className="calculation-box">
          <p>Draw a polygon using the draw tools.</p>
          <div id="calculated-area"></div>
        </div>
      </div>
    );
  }
}
