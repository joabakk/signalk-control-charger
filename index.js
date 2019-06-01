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
const _ = require('lodash');
var charging


module.exports = function(app, options) {
  'use strict';
  var client;
  var context = "vessels.self";

  return {
    id: "signalk-control-charger",
    name: "Control Charger limits",
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
        tripBool: {
          type: "boolean",
          title: "Charge to extended limits?",
          default: false
        },
        batteryInstance: {
          type: "string",
          title: "Battery Instance (House, 0, 1 etc)",
          default: "House"
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
          default: 0.99
        },
        pathToBattery: {
          type: "string",
          title: "Signal K path to battery instance (only instance e.g. electrical.batteries.House). Boolean 'commandCharge' will be added under here",
          default: "electrical.batteries.House"
        }
      }
    },

    start: function(options) {
      app.setProviderStatus("Started")

      var regularCheck = setInterval(function(){
        //app.debug("checking for soc")
        if (app.streambundle.getAvailablePaths().includes(options.pathToBattery + ".capacity.stateOfCharge")){
          app.setProviderStatus("Started, found battery SOC")
          app.debug("found SOC")
          var soc = app.getSelfPath(options.pathToBattery + ".capacity.stateOfCharge.value")
          app.debug("SOC = " + soc)
          var lowerLimit, upperLimit
          if (options.tripBool){ //charging to extended limits
            lowerLimit = options.extendedLowerLimit
            upperLimit = options.extendedUpperLimit
          } else {
            lowerLimit = options.normalLowerLimit
            upperLimit = options.normalUpperLimit
          }
          if (soc < lowerLimit){
            charging = true
          }
          if (soc > upperLimit){
            charging = false
          }

          var delta = {
            context: context,
            updates: [
              {
                values: [
                  {
                    path: options.pathToBattery + ".commandCharge",
                    value: charging
                  }
                ]
              }
            ]
          }
          app.handleMessage(app.id, delta)

        } else {
          app.setProviderError("could not find state of charge at " + options.pathToBattery + ".capacity.stateOfCharge")
        }
      }, 3000);

    },
    stop: function() {
      app.setProviderStatus("Stopped")
      clearInterval(regularCheck)
    }
  }
}
