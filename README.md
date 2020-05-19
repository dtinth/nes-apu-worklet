# nes-apu-worklet

[NES APU](https://wiki.nesdev.com/w/index.php/APU) exposed as HTML5 AudioWorklet. Generate 8-bit sounds fom Web Audio API! Powered by [Takahiro’s nes-js](https://github.com/takahirox/nes-js/blob/master/src/Apu.js)’s [APU](https://github.com/takahirox/nes-js/blob/master/src/Apu.js) code (imported directly!).

## Usage

```js
import { NesApuNode } from './nes-apu-node.js'
const context = new AudioContext()
```

### Add a worklet module to your `AudioContext`

```js
await context.audioWorklet.addModule('nes-apuworklet.js')
```

### Create a `NesApuNode`

```js
let apu = new NesApuNode(context)
apu.connect(context.destination)
```

### Write register

```js
//                      * Status register
//                      |            * Disable DMC channel
//                      |            |* Disable Noise channel
//                      |            ||* Disable Triangle channel
//                      |            |||* Disable Pulse 2 channel
//                      |            ||||* Enable Pulse 1 channel
apu.storeRegisterAtTime(0x4015, 0b00000001, context.currentTime)
//                      * Pulse 1
//                      |         ** Duty cycle 12.5%
//                      |         ||* Disable length counter (do not silence notes automatically)
//                      |         |||* Use constant volume (no decay)
//                      |         ||||**** Volume 15/15
apu.storeRegisterAtTime(0x4000, 0b00111111)
//                      |         ******** = Timer low = 251
apu.storeRegisterAtTime(0x4002, 0b11111011)
//                      |         ***** Length counter (disabled)
//                      |         |||||*** = Timer high = 1
apu.storeRegisterAtTime(0x4003, 0b00000001)
//                      Timer = 1 * 256 + 251 = 507
//                      Frequency = 1789773 [CPU speed hz] / (16 * (507 [Timer] + 1))
//                                = 220.1984498031496 hz (~A below Middle C)
```

## API

### `const apu = new NesApuNode(audioContext)`

Creates a new NES APU node.

### `apu.storeRegisterAtTime(address, value, time)`

Enqueues a command to write a value to the APU registers. Check out [Nesdev wiki](https://wiki.nesdev.com/w/index.php/APU#Registers) for reference of each register.

### `apu.port.onmessage = fn`

Be notified when data is written to the APU register. `fn` is called with `event` object.

- `event.data.address` — Register address
- `event.data.value` — Register value
- `event.data.time` — Audio time
