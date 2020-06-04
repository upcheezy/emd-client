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

    map.on("draw.create", updateArea);
    map.on("draw.delete", updateArea);

    map.on("load", function () {
      map.addSource("maine", {
        type: "geojson",
        data: {
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: [
              [
                [-67.13734351262877, 45.137451890638886],
                [-66.96466, 44.8097],
                [-68.03252, 44.3252],
                [-69.06, 43.98],
                [-70.11617, 43.68405],
                [-70.64573401557249, 43.090083319667144],
                [-70.75102474636725, 43.08003225358635],
                [-70.79761105007827, 43.21973948828747],
                [-70.98176001655037, 43.36789581966826],
                [-70.94416541205806, 43.46633942318431],
                [-71.08482, 45.3052400000002],
                [-70.6600225491012, 45.46022288673396],
                [-70.30495378282376, 45.914794623389355],
                [-70.00014034695016, 46.69317088478567],
                [-69.23708614772835, 47.44777598732787],
                [-68.90478084987546, 47.184794623394396],
                [-68.23430497910454, 47.35462921812177],
                [-67.79035274928509, 47.066248887716995],
                [-67.79141211614706, 45.702585354182816],
                [-67.13734351262877, 45.137451890638886],
              ],
            ],
          },
        },
      });
      map.addLayer({
        id: "maine",
        type: "fill",
        source: "maine",
        layout: {},
        paint: {
          "fill-color": "#088",
          "fill-opacity": 0.8,
        },
      });
    });
  }

  // fetchIntersect = (datapoints, type) => {
  //   fetch("http://localhost:8000/draw", {
  //     method: "POST",
  //     headers: {
  //       "content-type": "application/json",
  //     },
  //     body: JSON.stringify({
  //       coords: datapoints,
  //       geomtype: type,
  //     }),
  //   })
  //     .then((res) => {
  //       if (!res.ok) {
  //         throw new Error(res.status);
  //       }
  //       return res.json();
  //     })
  //     .then((data) => {
  //       console.log(data);
  //     })
  //     .catch((error) => this.setState({ error }));
  // };

  render() {
    return (
      <div className="container">
        <div id="map"></div>
        <CountyDropdown />
      </div>
    );
  }
}
