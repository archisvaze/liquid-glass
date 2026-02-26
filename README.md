# Liquid Glass

An interactive demo of an **iOS 26–style Liquid Glass** effect for the web — now with two rendering engines, physics-based refraction, and a background picker.

<img width="1920" height="963" alt="Liquid Glass demo screenshot" src="https://github.com/user-attachments/assets/f67312bd-cee7-4fe2-9cc0-7e6f7b2ccdcc" />

> **Chromium-only (SVG version).** The SVG backdrop-filter approach only works in Chrome / Edge / Chromium-based browsers. The **WebGL version works in all browsers** including Safari and Firefox. Please file issues if you spot any quirks!

---

## Live Demo

[**Try it out → liquid-glass-eta.vercel.app**](https://liquid-glass-eta.vercel.app/)

---

## Two Rendering Engines

|                     | SVG Version (`index.html`)                                    | WebGL Version (`webgl.html`)                          |
| ------------------- | ------------------------------------------------------------- | ----------------------------------------------------- |
| **How it works**    | SVG `feDisplacementMap` + `backdrop-filter`                   | Three.js full-screen shader                           |
| **Refraction**      | Physics-based displacement map with configurable IOR          | Real-time GLSL ray refraction                         |
| **Browser support** | Chrome / Chromium only                                        | All modern browsers                                   |
| **Controls**        | Glass shape, refraction, appearance, inner/outer shadow, tint | Glass shape, refraction, blur, specular, tint, shadow |

## Switch between them with the button at the bottom of the page

## Features

- **Physics-Based Refraction** — configurable glass thickness, bezel width, and index of refraction (IOR)
- **Specular Highlights** — adjustable opacity and saturation for realistic light reflections
- **Inner & Outer Shadow** — color, blur, and spread controls
- **Glass Tint** — any RGB tint with opacity control
- **Background Picker** — choose from preset template images or paste a custom URL
- **Draggable Glass** — click and drag the glass pane anywhere on screen
- **Responsive** — desktop and mobile layouts

---

## Usage

1. Clone the repo and open `index.html` in a browser, or visit the **Live Demo**.
2. Use the control panel on the left to tweak every parameter in real time.
3. Pick a background from the thumbnail grid or paste your own image URL.
4. Drag the glass pane around to see refraction against different parts of the background.
5. Hit **Switch to WebGL version** at the bottom if you're not on Chromium.

---

## Browser Support

| Browser                  | SVG Version | WebGL Version |
| ------------------------ | ----------- | ------------- |
| Chrome / Edge / Chromium | ✅          | ✅            |
| Firefox                  | ❌          | ✅            |
| Safari                   | ❌          | ✅            |

---

## Inspiration

Inspired by Apple's **iOS 26 Liquid Glass** design language. Thanks to [chakachuk's CodePen demo](https://codepen.io/chakachuk/pen/QwbaYGO) for the original glass-distortion filter setup that kicked this off.

---
