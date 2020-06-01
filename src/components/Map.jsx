import React, { Component } from "react";
import "./Map.css";
import mapboxgl from "mapbox-gl";
// import ReactMapboxGl from "react-mapbox-gl";
// import * as MapboxDraw from '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw';
// import ReactMapGL from 'react-map-gl';
import config from "../config";
import * as turf from '@turf/turf';
const MapboxDraw = require("@mapbox/mapbox-gl-draw");
const MapboxGeocoder = require("@mapbox/mapbox-gl-geocoder");


const coords = "-83.2922310761724 34.6804605315986,-83.2897522288653 34.5903530258363,-83.3987056853352 34.5882589805737,-83.4013022139495 34.6783594756033,-83.2922310761724 34.6804605315986";

var poly1 = turf.polygon([[
  [-122.801742, 45.48565],
  [-122.801742, 45.60491],
  [-122.584762, 45.60491],
  [-122.584762, 45.48565],
  [-122.801742, 45.48565]
]]);

var poly2 = turf.polygon([[
  [-122.520217, 45.535693],
  [-122.64038, 45.553967],
  [-122.720031, 45.526554],
  [-122.669906, 45.507309],
  [-122.723464, 45.446643],
  [-122.532577, 45.408574],
  [-122.487258, 45.477466],
  [-122.520217, 45.535693]
]]);

var intersection = turf.intersect(poly1, poly2);

console.log(intersection)

export default class Map extends Component {
  componentDidMount() {
    mapboxgl.accessToken = config.MAPBOX_API_TOKEN;
    const map = new mapboxgl.Map({
      container: "map",
      style: "mapbox://styles/mapbox/streets-v11",
      center: [-81.276855, 33.596319],
      zoom: 7,
    });
    // console.log(map)
    const address = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      mapboxgl: mapboxgl,
    }).on("result", function ({ result }) {
      console.log(result.geometry.coordinates);
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

    map.on("draw.create", updateArea);
    map.on("draw.delete", updateArea);

    // this logs the geometry of the polygon
    // todo: need to retern this geom and feed to POST
    function updateArea(e) {
      const data = draw.getAll();
      console.log(data);
    }

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

  render() {
    return <div id="map"></div>;
  }
}
