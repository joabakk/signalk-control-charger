/*
* Copyright 2019 Joachim Bakke
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*     http://www.apache.org/licenses/LICENSE-2.0
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/


const util = require('util');
const moment = require("moment")
//const utilSK = require('@signalk/nmea0183-utilities');
var obj = require("./schema.json"); //require empty schema
const _ = require('lodash');


module.exports = function(app, options) {
  'use strict';
  var client;
  var context = "vessels.*";

  return {
    id: "signalk-control-charger",
    name: "Control Charger scheme",
    description: "Plugin to control charging scheme for LiFePo4 (and other) batteries",

    schema: {
      title: "Control Charger scheme",
      type: "object",
      required: [
      "batteryInstance",
      "normalLowerLimit",
      "normalUpperLimit",
      "extendedLowerLimit",
      "extendedUpperLimit",
      "pathToBattery"
    ],
    properties: {
      batteryInstance: {
        type: "string",
        title: "Battery Instance (House, 0, 1 etc)"
      },
      normalLowerLimit: {
        type: "number",
        title: "Normal lower limit for state of charge (0-1)",
        default: 0.4
      },
      normalUpperLimit: {
        type: "number",
        title: "Normal upper limit for state of charge (0-1)",
        default: 0.8
      },
      extendedLowerLimit: {
        type: "number",
        title: "Extended lower limit for state of charge (0-1)",
        default: 0.8
      },
      extendedUpperLimit: {
        type: "number",
        title: "Extended upper limit for state of charge (0-1)",
        default: 0.4
      },
      pathToBattery: {
        type: "string",
        title: "Signal K path to battery instance (only instance e.g. electrical.batteries.House). Boolean extendedCharge will be added under here",
        default: "electrical.batteries.House"
      }
    }
    },

    start: function(options) {
      app.setProviderStatus("Started")
      plugin.properties = options
      if (app.streambundle.getAvailablePaths().includes(options.pathToBattery + ".capacity.stateOfCharge")){
        let stream
        stream = app.streambundle.getSelfStream(options.pathToBattery + ".capacity.stateOfCharge")
      } else {
        app.error("could not find state of charge at " + options.pathToBattery + ".capacity.stateOfCharge")
      }

    },

    /*registerWithRouter: function(router) {
      // http://localhost:3000/ArcGis/API/getJson
      app.get('/ArcGis/API/getJson', (req, res) => {
        res.contentType('application/json');
        obj.features = [] //initialize so it does not grow by each call

        var response = {}
        _.values(app.getPath('vessels')).map((vessel) => {
          var attributes = {} //initialize each vessel
          attributes.MMSI = parseInt(vessel.mmsi)
          attributes.IMO = parseInt(vessel.imo)
          attributes.LAT = parseFloat(_.get(vessel, 'navigation.position.value.latitude'))
          attributes.LON = parseFloat(_.get(vessel, 'navigation.position.value.longitude'))
          attributes.SPEED = parseFloat(utilSK.transform(_.get(vessel, 'navigation.speedOverGround.value'), 'ms', 'knots'))
          attributes.HEADING = parseFloat(utilSK.transform(_.get(vessel, 'navigation.headingTrue.value'), 'rad', 'deg'))
          attributes.COURSE = parseFloat(utilSK.transform(_.get(vessel, 'navigation.courseOverGroundTrue.value'), 'rad', 'deg'))
          attributes.STATUS = _.get(vessel, 'navigation.state.value')
          attributes.TIMESTAMP_ = moment(_.get(vessel, 'navigation.position.timestamp')).unix()
          attributes.SOURCE = _.get(vessel, 'navigation.position.$source')
          attributes.SHIPNAME = vessel.name
          attributes.SHIPTYPE = _.get(vessel, 'design.aisShipType.value.name')
          attributes.CALLSIGN = _.get(vessel, 'communication.callsignVhf')
          attributes.FLAG = countries.getName(vessel.flag, "en")

          var geometry = {}
          geometry.x = attributes.LON
          geometry.y = attributes.LAT

          response.attributes = attributes
          response.geometry = geometry
          obj.features.push({ attributes, geometry })
        })
        res.send(JSON.stringify(obj, null, 4))
      })
    },*/

    stop: function() {
      app.setProviderStatus("Stopped")
    }
  }
}
