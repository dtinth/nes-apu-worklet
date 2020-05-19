import { Apu } from 'https://cdn.jsdelivr.net/npm/nes-js@0.0.1/src/Apu.js'

/* global sampleRate, currentTime */
class NesApuProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [{ name: 'gain', defaultValue: 1 }]
  }

  constructor() {
    super()
    this.buffer = null
    this.bufferIndex = 0
    this.bufferLength = 0
    this.cpu = {
      interrupt: () => {},
      INTERRUPTS: { IRQ: NaN },
      stallCycle: NaN,
      load: () => 0,
    }
    this.audio = {
      getSampleRate: () => sampleRate,
      push: data => {
        if (this.bufferIndex >= this.bufferLength) return
        this.buffer[this.bufferIndex++] = data
      },
    }
    this.apu = new Apu()
    this.apu.setCpu(this.cpu)
    this.apu.setAudio(this.audio)
    this.queue = []
    this.queueDirty = true
    this.port.onmessage = event => {
      if (event.data.address) {
        const { address, value, time = 0 } = event.data
        this.queue.push({ address, value, time })
        this.queueDirty = true
      }
    }
    this.lastPrint = 0
  }

  process(inputs, outputs, parameters) {
    if (Date.now() > this.lastPrint + 1000) {
      this.lastPrint = Date.now()
      // console.log('APU run', this.apu.cycle)
    }
    if (this.queueDirty) {
      this.queue.sort((a, b) => a.time - b.time)
      this.queueDirty = false
    }
    const output = outputs[0]
    const gain = parameters.gain
    let queueIndex = 0
    for (let channel = 0; channel < output.length; channel++) {
      const outputChannel = output[channel]
      if (channel === 0) {
        let lastBufferIndex = -1
        this.bufferIndex = 0
        this.buffer = outputChannel
        this.bufferLength = outputChannel.length
        while (this.bufferIndex < this.bufferLength) {
          if (this.bufferIndex > lastBufferIndex) {
            lastBufferIndex = this.bufferIndex
            const time = currentTime + this.bufferIndex / sampleRate
            for (;;) {
              const nextEvent = this.queue[queueIndex]
              if (nextEvent && (!nextEvent.time || time >= nextEvent.time)) {
                this.apu.storeRegister(nextEvent.address, nextEvent.value)
                console.log('Store', nextEvent.address.toString(16), nextEvent.value.toString(2), '@', nextEvent.time, 'actual', currentTime)
                queueIndex++
              } else {
                break
              }
            }
          }
          this.apu.runCycle()
        }
      } else {
        for (let i = 0; i < outputChannel.length; i++) {
          outputChannel[i] = output[0][i]
        }
      }
    }
    if (queueIndex) {
      this.queue.splice(0, queueIndex)
    }

    return true
  }
}

registerProcessor('nes-apu', NesApuProcessor)
