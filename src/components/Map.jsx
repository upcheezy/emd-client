import React, { Component } from "react";
import "./Map.css";
import mapboxgl from "mapbox-gl";
import CountyDropdown from "./CountyDropdown";
import config from "../config";
import sat from "../images/satellite.PNG";
import st from "../images/street.PNG";
import * as turf from "@turf/turf";
import orange from "../images/orange.png";
import red from "../images/red.png";
import yellow from "../images/yellow.png";
import green from "../images/green.png";
import blue from "../images/blue.png";
import purple from "../images/purple.png";
const MapboxDraw = require("@mapbox/mapbox-gl-draw");
const MapboxGeocoder = require("@mapbox/mapbox-gl-geocoder");
const Parse = require("wellknown");

export default class Map extends Component {
  state = {
    error: null,
    members: {},
    filteredMember: {},
    grid: [],
    drawCoords: "",
    layerId: "satellite-streets-v10",
    src: sat,
    bottomNav: "hidden",
    map: "map",
    img: "sat",
    mbcntrl: "mapboxgl-ctrl-top-right .mapboxgl-ctrl",
  };

  fetchGrid() {
    this.toggleBottomNav();
    fetch("http://gis17-01:8000/grid", {
      method: "GET",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${window.localStorage.getItem("token")}`,
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
        let matching = [];
        gridRowId.map((element) => {
          const idContains = data.rows.find(
            (id_element) => id_element.id === parseInt(element)
          );
          if (typeof idContains !== "undefined") matching.push(idContains);
        });
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
        let bounds = turf.bbox(gj);
        window.map.fitBounds(bounds, { padding: 20 });
        let gjC = {
          type: "FeatureCollection",
          features: [],
        };
        gj.features.forEach((element) => {
          gjC.features.push({
            type: "Feature",
            properties: {
              id: element.properties.id,
            },
            geometry: turf.centroid(element).geometry,
          });
        });
        console.log(gj);
        // Add the label point source
        if (window.map.getLayer("maine")) {
          window.map.getSource("maine").setData(gj);
          window.map.getSource("label").setData(gjC);
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
              "fill-opacity": [
                "case",
                ["boolean", ["feature-state", "hover"], false],
                1,
                0.5,
              ],
            },
          });

          window.map.on("click", "maine", (ev) => {
            console.log(ev.features[0].properties.id);
            console.log(this.state.filteredMember);
            let matchId = ev.features[0].properties.id;
            // const members = this.state.members;
            const filtered = Object.keys(this.state.members)
              .filter((key) => matchId.includes(key))
              .reduce((obj, key) => {
                obj[key] = this.state.members[key];
                return obj;
              }, {});
            this.setState({ filteredMember: filtered });
          });

          let hoverId = null;

          // Change the cursor to a pointer when the mouse is over the places layer.
          window.map.on("mouseenter", "maine", (ev) => {
            window.map.getCanvas().style.cursor = "pointer";
            if (ev.features.length > 0) {
              if (hoverId) {
                window.map.setFeatureState(
                  { source: "maine", id: hoverId },
                  { hover: false }
                );
              }
              hoverId = ev.features[0].id;
              window.map.setFeatureState(
                { source: "maine", id: hoverId },
                { hover: true }
              );
            }
          });

          // Change it back to a pointer when it leaves.
          window.map.on("mouseleave", "maine", () => {
            let hoverId = null;
            window.map.getCanvas().style.cursor = "";
            window.map.setFeatureState(
              { source: "maine", id: hoverId },
              { hover: false }
            );
          });

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
              "text-field": ["get", "id"],
              "text-size": 30,
            },
            paint: {
              "text-color": "red",
              "text-halo-width": 1,
              "text-halo-color": "white",
            },
          });
        }
      })
      .catch((error) => this.setState({ error }));
  }

  componentDidMount() {
    mapboxgl.accessToken = config.REACT_APP_MAPBOX_API_TOKEN;
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
          Authorization: `Bearer ${window.localStorage.getItem("token")}`,
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
          const gridIdz = {};
          data.rows.forEach((row) => {
            row.id_array.forEach((gid) => {
              if (!gridIdz[gid]) {
                gridIdz[gid] = 1;
              }
            });
          });

          let obj = {};
          data.rows.forEach((member) => {
            member.id_array.forEach((id) => {
              if (!obj[id]) {
                obj[id] = {};
              }
            });
          });

          Object.keys(obj).forEach((i) => {
            data.rows.forEach((member) => {
              if (member.id_array.includes(+i)) {
                if (!obj[i][member.faciltype]) {
                  obj[i][member.faciltype] = {
                    orgname: {},
                  };
                }
                let memObj = {
                  name: member.personname,
                  email: member.email,
                  phone: member.number,
                };

                obj[i][member.faciltype]["orgname"][member.orgname] = memObj;
              }
            });
          });
          this.setState({
            members: obj,
            filteredMember: obj
          });
          window.localStorage.setItem("id", null);
          if (window.localStorage.getItem("id")) {
            window.localStorage.removeItem("id");
          }
          window.localStorage.setItem("id", Object.keys(gridIdz));
          this.fetchGrid();
        })
        .catch((error) => this.setState({ error }));
    };

    const address = new MapboxGeocoder({
      accessToken: config.REACT_APP_MAPBOX_API_TOKEN,
      mapboxgl: mapboxgl,
      countries: "us",
      bbox: [-83.726807, 31.784217, -78.013916, 35.415915],
    }).on("result", function ({ result }) {
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
      if (data.features.length > 0) {
        fetchIntersect(data.features[0].geometry.coordinates[0], "draw");
      }
    };

    window.map.on("draw.create", (ev) => {
      draw.delete(this.state.drawCoords);
      this.setState({ drawCoords: ev.features[0].id });
      fetchIntersect(ev.features[0].geometry.coordinates[0], "draw");
    });
    window.map.on("draw.delete", () => {
      console.log("deleted");
    });
    window.map.on("draw.update", updateArea);
  }

  countyChecker(name) {
    fetch("http://gis17-01:8000/countyselect", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${window.localStorage.getItem("token")}`,
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
        const gridIdz = {};
        data.rows.forEach((row) => {
          row.id_array.forEach((gid) => {
            if (!gridIdz[gid]) {
              gridIdz[gid] = 1;
            }
          });
        });
        let obj = {};
        data.rows.forEach((member) => {
          member.id_array.forEach((id) => {
            if (!obj[id]) {
              obj[id] = {};
            }
          });
        });

        Object.keys(obj).forEach((i) => {
          data.rows.forEach((member) => {
            if (member.id_array.includes(+i)) {
              if (!obj[i][member.faciltype]) {
                obj[i][member.faciltype] = {
                  orgname: {},
                };
              }
              let memObj = {
                name: member.personname,
                email: member.email,
                phone: member.number,
              };

              obj[i][member.faciltype]["orgname"][member.orgname] = memObj;
            }
          });
        });
        this.setState({
          members: obj,
          filteredMember: obj
        });
        // this.setState({ members: Object.values(data.rows) });
        window.localStorage.setItem("id", null);
        if (window.localStorage.getItem("id")) {
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

  toggleBottomNav() {
    if (this.state.bottomNav === "hidden") {
      this.setState({ bottomNav: "sideNav" });
    }
    if (this.state.map === "map") {
      this.setState({ map: "short-map" });
    }
    if (this.state.img === "sat") {
      this.setState({ img: "sat-short" });
    }

    const node = document.querySelector(".mapboxgl-ctrl-group");
    // this is what we need to access the class and style .mapboxgl-ctrl-group.short
    node.classList.add("short");
  }

  TodoList(x) {
    return Object.entries(x).map((obj) => {
      return (
        <>
          <div className="member-card">
            <p className="orgname-text">{obj[0]}</p>
            <ul>
              {Object.entries(obj[1]).map((x) => {
                let contact;
                if (x[0] === "email" && x[1] !== "NULL") {
                  contact = (
                    <>
                      {`${x[0]}: `} <a href={`mailto:${x[1]}`}> {x[1]} </a>
                    </>
                  );
                } else if (x[0] === "phone" && x[1] !== "NULL") {
                  contact = (
                    <>
                      {`${x[0]}: `} <a href={`tel:${x[1]}`}> {x[1]} </a>
                    </>
                  );
                } else if (x[1] === "NULL") {
                  contact = <>{`${x[0]}: `}</>;
                } else {
                  contact = <>{`${x[0]}: ${x[1]}`}</>;
                }
                return <li>{contact}</li>;
              })}
            </ul>
          </div>
        </>
      );
    });
  }

  render() {
    let memberList = [];
    for (let [key, value] of Object.entries(this.state.filteredMember)) {
      let member = (
        <div className="member-cont">
          <p className="grid-heading">Grid: {key}</p>
          <hr />
          {Object.entries(value).map((x) => {
            let facilColor = {
              "Buried Environmental Transmitters": red,
              "Propane Gas": yellow,
              "Petroleum Pipeline": yellow,
              Telecommunications: orange,
              Water: blue,
              "Diesel Fuel": yellow,
              Communications: red,
              Steam: yellow,
              "Land Use Control": blue,
              "Chilled Water": blue,
              "Storm Drain": green,
              Electric: red,
              Traffic: orange,
              "Groundwater Recovery Lines": blue,
              "Waste Water": blue,
              "Natural Gas": yellow,
              "Storm Water": blue,
              Phone: orange,
              Sewer: green,
              "JETA Fuel": yellow,
              Irrigation: blue,
              Gas: yellow,
              Fiber: orange,
              Pipeline: yellow,
              Cable: orange,
            };
            return (
              <>
                <div style={{ display: "flex", "margin-left": "5%" }}>
                  <div
                    style={{
                    //   backgroundColor: facilColor[x[0]],
                      // height: "18px",
                      // width: "18px",
                    //   "border-radius": "50%",
                      margin: "auto 0",
                    //   border: "1.5px solid black",
                    }}
                  >
                    <img src={facilColor[x[0]]} style={{height: "30px"}} alt=""/>
                  </div>
                  <p className="facil-type">{x[0]}</p>
                </div>
                {Object.values(x[1]).map((x) => {
                  for (let [k, v] of Object.entries(x)) {
                    return this.TodoList(x);
                  }
                })}
              </>
            );
          })}
        </div>
      );
      memberList.push(member);
    }
    return (
      <div className="container">
        <div id={this.state.map}></div>
        <div className="layerMenu">
          <img
            src={this.state.src}
            alt="satellite"
            className={this.state.img}
            id={this.state.layerId}
            onClick={(e) => this.layerSwitcher(e)}
          />
        </div>
        <CountyDropdown onAction={this.countyChecker.bind(this)} />
        <div className={this.state.bottomNav}>
          <h1>Affected Members</h1>
          {memberList.map((x) => x)}
        </div>
      </div>
    );
  }
}
