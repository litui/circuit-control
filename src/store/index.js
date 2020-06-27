import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    circuitInput: null,
    circuitOutput: null,
    currentSection: "voice",
    currentSynth: 0,
    connected: false,
    midiAccess: null,
    midiSettings: [{}, {}],  // Two synth dictionaries
    midiMapping: require('./midiMapping.json')
  },
  mutations: {
    assignCircuitInput (state, circuitInput) {
      state.circuitInput = circuitInput
    },
    assignCircuitOutput (state, circuitOutput) {
      state.circuitOutput = circuitOutput
    },
    assignMidiAccess (state, midiAccess) {
      state.midiAccess = midiAccess
    },
    bulkLoadMidiSettings (state, data) {
      let mappingTable = {}
      Object.keys(state.midiMapping).map(function(key) {
        mappingTable[state.midiMapping[key].patchAddress] = key
      })

      let synth = 0
      if (data[7] === 1) {
        synth = 1
      }
      let patch = data.slice(9,350) // Align slice with reference guide
      let patchName = String.fromCharCode.apply(String, patch.slice(0,15))
      // let patchCategory = patch[16]
      // let patchGenre = patch[17]
      
      // Load patch settings into state, for settings we know about
      for (let i = 0; i < patch.length; i++) {
        if (mappingTable[i]) {
          state.midiSettings[synth][mappingTable[i]] = String(patch[i])
        }
      }
      console.log("Loaded:  Synth: "+synth+", Patch: "+patchName)
      console.log(state.midiSettings)
    },
    changeMidiSetting (state, {name, value}) {
      state.midiSettings[state.currentSynth][name] = String(value)
    },
    setConnectionState (state) {
      if (state.circuitInput === null || state.circuitOutput === null) {
        state.connected = false
      } else if (state.circuitInput.state === "connected" && state.circuitOutput.state === "connected") {
        state.connected = true
      } else {
        state.connected = false
      }
    },
    setCurrentSection (state, section) {
      state.currentSection = section
    },
    setMidiDefaults (state) {
      // Iterate over midi mapping to populate midiSettings with defaults
      console.log("Started setting Midi Defaults")
      for (let i = 0; i < 2; i++) {
        Object.keys(state.midiMapping).map(function(key) {
          // Using Vue.set to populate defaults so state is updated
          // Otherwise, vuex fails to track changes
          Vue.set(state.midiSettings[i], key, String(state.midiMapping[key].default))
        })
      }
      console.log(state.midiSettings)
    }
  },
  actions: {
    async sendMidiMessage ({commit, state}, {name, value}) {
      console.log('Setting Midi '+name+' to value '+value)

      if (state.connected) {
        if (state.midiMapping[name]) {
          if (state.midiMapping[name].midiType === 'cc') {
            // MIDI CC Messages
            let messageType = 0xB0 + state.currentSynth

            let message = [messageType, parseInt(state.midiMapping[name].midiId), parseInt(value)]

            state.circuitOutput.send(message)
            console.log('Sent midi CC message: ' + JSON.stringify(message))
          } else if (state.midiMapping[name].midiType === 'nrpn') {
            // MIDI NRPN Messages
            let messageType = 0xB0 + state.currentSynth

            let bytes = state.midiMapping[name].midiId.split(":")
            console.log('Bytes: ' + bytes)

            let messages = [
              [messageType, 99, parseInt(bytes[0])],
              [messageType, 98, parseInt(bytes[1])],
              [messageType, 6, parseInt(value)]
            ]

            for (let message of messages) {
              state.circuitOutput.send(message)
            }
            console.log('Sent midi NRPN messages: ' + JSON.stringify(messages))
          }
        }
      }

      commit('changeMidiSetting', {name: name, value: value})
    }
  },
  getters: {
    getMIDIAccess: state => {
      return state.midiAccess
    },
    getMidiMappingBySection: (state) => (section) => {
      let result = {}

      Object.keys(state.midiMapping).map(function(key) {
        if (state.midiMapping[key].section === section) {
          result[key] = state.midiMapping[key]
        }
      })

      return result
    }
  },
  modules: {
  }
})
