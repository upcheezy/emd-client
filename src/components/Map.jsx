import React, { Component } from "react";
import ReactDOM from "react-dom";
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
    members: {},
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
          // console.log(turf.centroid(element).geometry)
        });
        console.log(gjC);
        let centroid = turf.centroid(gj);
        console.log(centroid);
        // console.log(gjC.features[0].geometry)
        // Add the label point source
        console.log(centroid);
        if (window.map.getLayer("maine")) {
          window.map.getSource("maine").setData(gj);
          window.map.getSource("label").setData(gjC);
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
            },
            paint: {
              "text-color": "red",
            },
          });
          // let coordinates = gj.features[0].geometry.coordinates;
          // console.log(coordinates);
          // const bounds = coordinates.reduce(function (bounds, coord) {
          //   return bounds.extend(coord);
          // }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));

          // window.map.fitBounds(bounds, {
          //   padding: 20,
          // });
        }
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
          console.log(data);

          let obj = {};
          data.rows.forEach((member) => {
            member.id_array.forEach((id) => {
              if (!obj[id]) {
                obj[id] = {};
              }
            });
          });

          // console.log(obj);

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
      draw.delete(this.state.drawCoords);
      this.setState({ drawCoords: ev.features[0].id });
      // let coordinates = ev.features[0].geometry.coordinates;
      console.log(ev.features[0].geometry.coordinates[0]);
      // var bounds = ev.features[0].geometry.coordinates[0];
      console.log(ev);
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
              gridIdz[gid] = 1;
            }
          });
        });
        console.log(Object.keys(gridIdz));
        let obj = {};
        data.rows.forEach((member) => {
          member.id_array.forEach((id) => {
            if (!obj[id]) {
              obj[id] = {};
            }
          });
        });

        // console.log(obj);

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
        });
        // this.setState({ members: Object.values(data.rows) });
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
    console.log(node);
  }

  TodoList(x) {
    return Object.entries(x).map((obj) => {

      return (
        <>
          <div className="member-card">
            <p className="orgname-text">{obj[0]}</p>
            <ul>
              {Object.entries(obj[1]).map((x) => (
                <li>
                  {(() => {
                    switch (x[0]) {
                      case 'email': return x[0] + ':' + <a href={"maito:" + x[1]}> x[1] </a>;
                      case 'phone': return x[0] + ':' + <a href={"tel:" + x[1]}>x[1]</a>;
                      default: return `${x[0]}: ${x[1]}`
                    }
                  })()}
                  {/* {console.log(x)} */}
                  
                </li>
              ))}
            </ul>
          </div>
        </>
      );
    });
  }

  facilSwitcher(x) {
    switch (x) {
      case 'email': return x[0] + ':' + <a href={"maito:" + x[1]}> x[1] </a>;
      case 'phone': return x[0] + ':' + <a href={"tel:" + x[1]}>x[1]</a>;
      default: return `${x[0]}: ${x[1]}`
    }
  }

  render() {
    let memberList = [];
    for (let [key, value] of Object.entries(this.state.members)) {
      let member = (
        <div className="member-cont">
          <p className="grid-heading">Grid: {key}</p>
          <hr />
          {Object.entries(value).map((x) => {
            // console.log(x)
            return (
              <>
                <p className="facil-type">{x[0]}</p>
                {Object.values(x[1]).map((x) => {
                  for (let [k, v] of Object.entries(x)) {
                    console.log(k);
                    console.log(v);
                    return this.TodoList(x);
                  }
                })}
              </>
            );
          })}
        </div>
      );
      // console.log(key, value);
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
        {/* {console.log(this.state.bottomNav)} */}
        <div className={this.state.bottomNav}>
          <h1>Affected Members</h1>
          {/* {console.log(this.state.members)} */}
          {memberList.map((x) => x)}
        </div>
      </div>
    );
  }
}
