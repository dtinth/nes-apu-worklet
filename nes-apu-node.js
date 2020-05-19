export class NesApuNode extends AudioWorkletNode {
  constructor(context) {
    super(context, 'nes-apu')
  }
  storeRegisterAtTime(address, value, time) {
    this.port.postMessage({ address, value, time })
  }
}