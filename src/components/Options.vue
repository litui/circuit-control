<template>
  <v-card>
    <v-card-title class="headline">{{ currentSection }}</v-card-title>
    <v-card-text>
      <v-row>
        <v-col
          v-for="(control, controlName) in getMidiMappingBySection(currentSection)"
          :key="controlName"
          cols="12"
          md="3"
        >
          <div v-if="control.dispType === 'radio'">
            <span>{{ control.label }}</span>
            <v-radio-group
              :value="midiSettings[currentSynth][controlName]"
              @change="sendMidiMessage({name: controlName, value: $event})"
              :disabled="!connected"
              column
            >
              <v-radio
                v-for="option in control.options"
                :key="option.value"
                :label="option.text"
                :value="String(option.value)"
              >
              </v-radio>
            </v-radio-group>
          </div>
          <div v-if="control.dispType === 'select'">
            <span>{{ control.label }}</span>
            <v-select
              dense
              :items="control.options"
              :value="parseInt(midiSettings[currentSynth][controlName])"
              :disabled="!connected"
              @change="sendMidiMessage({name: controlName, value: $event})"
            >
            </v-select>
          </div>
          <div v-if="control.dispType === 'slider'">
            <span>{{ control.label }}</span>
            <v-slider
              :value="midiSettings[currentSynth][controlName]"
              @change="sendMidiMessage({name: controlName, value: $event})"
              :disabled="!connected"
              :min="control.min"
              :max="control.max"
              :hint="'Range: '+control.min+'-'+control.max+', Default: '+control.default"
              persistent-hint
              step=1
              ticks=always>
            </v-slider>
          </div>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script>
import { mapState, mapActions, mapGetters } from 'vuex'

export default {
  name: "Options",

  computed: {
    ...mapGetters([
      'getMidiMappingBySection'
    ]),
    ...mapState([
      'connected',
      'currentSection',
      'currentSynth',
      'midiMapping',
      'midiSettings'
    ])
  },

  methods: {
    ...mapActions([
      'sendMidiMessage'
    ])
  },

  data: () => ({
  }),

  created() {
  }
}
</script>