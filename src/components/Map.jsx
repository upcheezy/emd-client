import React, { Component } from "react";
import "./Map.css";
import mapboxgl from "mapbox-gl";
import CountyDropdown from "./CountyDropdown";
import config from "../config";
import sat from "../images/satellite.PNG";
import st from "../images/street.PNG";
import * as turf from "@turf/turf";
const MapboxDraw = require("@mapbox/mapbox-gl-draw");
const MapboxGeocoder = require("@mapbox/mapbox-gl-geocoder");
const Parse = require("wellknown");

export default class Map extends Component {
  state = {
    error: null,
    members: [],
    grid: [],
    drawCoords: "",
    layerId: "satellite-streets-v10",
    src: sat,
  };

  fetchGrid() {
    fetch("http://gis17-01:8000/grid", {
      method: "GET",
      headers: {
        "content-type": "application/json",
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(res.status);
        }
        return res.json();
      })
      .then((data) => {
        let gridRowId = window.localStorage.getItem("id").split(",");
        // console.log(data)
        // console.log(gridRowId)
        let matching = [];
        gridRowId.map((element) => {
          const idContains = data.rows.find(
            (id_element) => id_element.id === parseInt(element)
          );
          if (typeof idContains !== "undefined") matching.push(idContains);
        });
        console.log(matching);
        let gj = {
          type: "FeatureCollection",
          features: [],
        };
        matching.forEach((element) => {
          gj.features.push({
            type: "Feature",
            properties: {
              id: element.id.toString(),
            },
            geometry: {
              type: "Polygon",
              coordinates: [Parse(element.geom).coordinates[0][0]],
            },
          });
        });
        console.log(gj);
        let gjC = {
          "type": "FeatureCollection",
          "features": []
        };
        gj.features.forEach((element) => {
          gjC.features.push({
            "type": "Feature",
            "properties": {
              "id": element.properties.id
            },
            "geometry": turf.centroid(element).geometry
          })
          // console.log(turf.centroid(element).geometry)
        })
        console.log(gjC)
        let centroid = turf.centroid(gj);
        console.log(centroid)
        // console.log(gjC.features[0].geometry)
        // Add the label point source
        console.log(centroid);
        if (window.map.getLayer("maine")) {
          window.map.getSource("maine").setData(gj);
          console.log("inside getsource");
        } else {
          window.map.addSource("maine", {
            type: "geojson",
            data: gj,
          });

          window.map.addLayer({
            id: "maine",
            type: "fill",
            source: "maine",
            paint: {
              "fill-color": "#088",
              "fill-opacity": 0.8,
            },
          });
        }
        window.map.addSource("label", {
          type: "geojson",
          data: gjC,
        });
        // Add the label style
        window.map.addLayer({
          id: "label-style",
          type: "symbol",
          source: "label",
          layout: {
            "text-field": ['get','id'],
          },
          paint: {
            "text-color": "red",
          },
        });
      })
      .catch((error) => this.setState({ error }));
  }

  componentDidMount() {
    mapboxgl.accessToken = config.MAPBOX_API_TOKEN;
    window.map = new mapboxgl.Map({
      container: "map",
      style: "mapbox://styles/mapbox/streets-v11",
      center: [-81.276855, 33.596319],
      zoom: 7,
    });

    const fetchIntersect = (datapoints, type) => {
      fetch("http://gis17-01:8000/draw", {
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
          const gridIdz = {};
          data.rows.forEach((row) => {
            // console.log(row.id_array)
            row.id_array.forEach((gid) => {
              // console.log(gid)
              if (!gridIdz[gid]) {
                console.log(gridIdz[gid]);
                gridIdz[gid] = 1;
              }
            });
          });
          console.log(Object.keys(gridIdz));
          // console.log(data);
          this.setState({
            members: Object.values(data.rows),
          });
          window.localStorage.setItem("id", null);
          if (window.localStorage.getItem("id")) {
            console.log("inside if");
            window.localStorage.removeItem("id");
          }
          window.localStorage.setItem("id", Object.keys(gridIdz));
          this.fetchGrid();
        })
        .catch((error) => this.setState({ error }));
    };

    const address = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      mapboxgl: mapboxgl,
      countries: "us",
      bbox: [-83.726807, 31.784217, -78.013916, 35.415915],
    }).on("result", function ({ result }) {
      // console.log(result.geometry.coordinates);
      fetchIntersect(result.geometry.coordinates, "point");
      // this.fetchGrid();
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
      console.log(e.features);
      // if (draw.getAll().features.length > 1) draw.delete()
      const data = draw.getAll();
      // dataId = draw.getAll().features[0].id
      console.log(data.features.length);
      console.log(data, data.features);
      if (data.features.length > 0) {
        fetchIntersect(data.features[0].geometry.coordinates[0], "draw");
      }
    };

    // let gCoords = this.state;
    window.map.on("draw.create", (ev) => {
      console.log(ev.features[0].id);
      draw.delete(this.state.drawCoords);
      this.setState({ drawCoords: ev.features[0].id });
      // let coordinates = ev.features[0].geometry.coordinates;
      // console.log([coordinates[0][0], coordinates[0][2]])
      fetchIntersect(ev.features[0].geometry.coordinates[0], "draw");
    });
    window.map.on("draw.delete", () => {
      console.log("deleted");
    });
    window.map.on("draw.update", updateArea);
  }

  countyChecker(name) {
    // console.log(name);
    fetch("http://gis17-01:8000/countyselect", {
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
        const gridIdz = {};
        data.rows.forEach((row) => {
          // console.log(row.id_array)
          row.id_array.forEach((gid) => {
            // console.log(gid)
            if (!gridIdz[gid]) {
              console.log(gridIdz[gid]);
              gridIdz[gid] = 1;
            }
          });
        });
        console.log(Object.keys(gridIdz));
        this.setState({ members: Object.values(data.rows) });
        window.localStorage.setItem("id", null);
        if (window.localStorage.getItem("id")) {
          console.log("inside if");
          window.localStorage.removeItem("id");
        }
        window.localStorage.setItem("id", Object.keys(gridIdz));
        this.fetchGrid();
      })
      .catch((error) => this.setState({ error }));
  }

  layerSwitcher(e) {
    if (this.state.layerId === "satellite-streets-v10") {
      window.map.setStyle("mapbox://styles/mapbox/satellite-streets-v10");
      this.setState({ layerId: "streets-v11" });
      this.setState({ src: st });
    }
    if (this.state.layerId === "streets-v11") {
      window.map.setStyle(`mapbox://styles/mapbox/streets-v11`);
      this.setState({ layerId: "satellite-streets-v10" });
      this.setState({ src: sat });
    }
  }

  render() {
    // console.log(this.state.grid);
    return (
      <div className="container">
        <div id="map"></div>
        {/* <input type="text" 
               onInput={(ev) => this.geocodeThis(ev)} 
               id='search' 
               placeholder='geocode here...' /> */}
        <div className="layerMenu">
          <img
            src={this.state.src}
            alt="satellite"
            classname="sat"
            id={this.state.layerId}
            onClick={(e) => this.layerSwitcher(e)}
          />
        </div>
        <CountyDropdown onAction={this.countyChecker.bind(this)} />
        <div className="sideNav">
          {/* <h1>Affected Members</h1> */}
          <section className="member_list">
            <ul>
              {console.log(this.state.members)}
              {this.state.members.map((x) => (
                // give li class to style
                <li className="member_li">
                  <span style={{ fontWeight: "bold" }}> Code: </span>
                  {x.code} <span style={{ fontWeight: "bold" }}>Org: </span>
                  {x.orgname}{" "}
                  <span style={{ fontWeight: "bold" }}>Person: </span>
                  {x.personname}{" "}
                  <span style={{ fontWeight: "bold" }}>Email: </span>
                  {x.emailaddress}{" "}
                </li>
              ))}
              {"\n"}
            </ul>
          </section>
        </div>
      </div>
    );
  }
}
