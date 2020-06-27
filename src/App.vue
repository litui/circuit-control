<template>
  <v-app id="sandbox">
    <v-navigation-drawer
      v-model="primaryDrawer.model"
      :clipped="primaryDrawer.clipped"
      :floating="primaryDrawer.floating"
      :mini-variant="primaryDrawer.mini"
      :permanent="primaryDrawer.type === 'permanent'"
      :temporary="primaryDrawer.type === 'temporary'"
      app
      overflow
    >
      <v-list dense>
        <v-list-item
          link
          @click="setCurrentSection('misc')"
          active-class="highlighted"
          :class="currentSection === 'misc' ? 'highlighted' : ''">
          <v-list-item-content>
            <v-list-item-title>Misc</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item link @click="setCurrentSection('voice')">
          <v-list-item-content>
            <v-list-item-title>Voice</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item link @click="setCurrentSection('osc1')">
          <v-list-item-content>
            <v-list-item-title>Oscillator 1</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item link @click="setCurrentSection('osc2')">
          <v-list-item-content>
            <v-list-item-title>Oscillator 2</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item link>
          <v-list-item-content>
            <v-list-item-title>Mixer</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item link>
          <v-list-item-content>
            <v-list-item-title>Filter</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item link>
          <v-list-item-content>
            <v-list-item-title>Envelope 1</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item link>
          <v-list-item-content>
            <v-list-item-title>Envelope 2</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item link>
          <v-list-item-content>
            <v-list-item-title>LFO 1</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item link>
          <v-list-item-content>
            <v-list-item-title>LFO 2</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item link>
          <v-list-item-content>
            <v-list-item-title>Effects and EQ</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item link>
          <v-list-item-content>
            <v-list-item-title>Modulation Matrix</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item link>
          <v-list-item-content>
            <v-list-item-title>Macros</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item link>
          <v-list-item-content>
            <v-list-item-title>Drums</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-app-bar
      :clipped-left="primaryDrawer.clipped"
      app
    >
      <v-app-bar-nav-icon
        v-if="primaryDrawer.type !== 'permanent'"
        @click.stop="primaryDrawer.model = !primaryDrawer.model"
      ></v-app-bar-nav-icon>
      <v-toolbar-title>MIDI Circuit Control</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn icon @click="getCurrentPatch">
        <v-icon>
          mdi-download
        </v-icon>
      </v-btn>
      <v-btn icon @click="requestMIDIAccess">
        <v-icon v-if="connected"
          color="green"
        >
          mdi-lan-connect
        </v-icon>
        <v-icon v-else
          color="red"
        >
          mdi-lan-disconnect
        </v-icon>
      </v-btn>
    </v-app-bar>

    <v-main>
      <v-container fluid>
        <v-row>
          <v-col cols="12">
            <options></options>
          </v-col>
        </v-row>
      </v-container>
    </v-main>

    <v-footer
      :inset="footer.inset"
      app
    >
      <span class="px-4">&copy; {{ new Date().getFullYear() }}</span>
    </v-footer>
  </v-app>
</template>

<script>
  import { mapState, mapMutations } from 'vuex'
  import Options from '@/components/Options.vue'

  export default {
    name: 'App',

    components: {
      'options': Options
    },

    computed: {
      ...mapState([
        'circuitInput',
        'circuitInputState',
        'circuitOutput',
        'circuitOutputState',
        'currentSynth',
        'currentSection',
        'connected',
        'midiSettings'
      ])
    },

    data: () => ({
      drawers: ['Default (no property)', 'Permanent', 'Temporary'],
      primaryDrawer: {
        model: null,
        type: 'permanent',
        clipped: true,
        floating: false,
        mini: false,
      },
      footer: {
        inset: false,
      },
    }),

    created () {
      this.$vuetify.theme.dark = true
      this.$store.commit('setMidiDefaults')
      this.requestMIDIAccess()
    },
    
    methods: {
      ...mapMutations([
        'setCurrentSection'
      ]),
      getCurrentPatch() {
        let sysexMessage = [
          0xF0, // Sysex
          0x00, 0x20, 0x29, // Manufacturer ID (Novation)
          0x01, // Novation Product Type (Synth)
          0x60, // Novation Product Number (Circuit)
          0x40, // Circuit Command - Current Patch Dump Request
          this.currentSynth, // Synth 1 or 2
          0xF7 // End of sysex
        ]

        if (this.connected) {
          this.circuitOutput.send(sysexMessage)
        }

        // Retrieval of patch is done in the getMIDIMessage hook.
      },
      getMIDIMessage(midiMessage) {
        if (midiMessage.data && midiMessage.data[0] === 0xF0) {
          this.$store.commit('bulkLoadMidiSettings', midiMessage.data)
        }
      },
      onMIDIStateChange(inOutMidi) {
        if (inOutMidi.currentTarget.type === "input") {
          inOutMidi.currentTarget.onmidimessage = this.getMIDIMessage
          this.$store.commit('assignCircuitInput', inOutMidi.currentTarget)
        } else if (inOutMidi.currentTarget.type === "output") {
          this.$store.commit('assignCircuitOutput', inOutMidi.currentTarget)
        }
        this.$store.commit('setConnectionState')
      },
      onMIDISuccess(midiAccess) {
        this.$store.commit('assignMidiAccess', midiAccess)
        console.log(midiAccess)

        for (var input of midiAccess.inputs.values()) {
          if (input.name === 'Circuit') {
            input.onstatechange = this.onMIDIStateChange
            input.onmidimessage = this.getMIDIMessage
            this.$store.commit('assignCircuitInput', input)
          }
        }

        for (var output of midiAccess.outputs.values()) {
          if (output.name === 'Circuit') {
            output.onstatechange = this.onMIDIStateChange
            this.$store.commit('assignCircuitOutput', output)
            console.log(output)
          }
        }
        this.$store.commit('setConnectionState')
        this.getCurrentPatch()
      },
      onMIDIFailure() {
        console.log('Could not access your MIDI devices.')
      },
      requestMIDIAccess() {  
        navigator.requestMIDIAccess({sysex: true})
          .then(this.onMIDISuccess, this.onMIDIFailure)
      }
    }
  }
</script>