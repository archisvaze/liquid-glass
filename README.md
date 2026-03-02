# Liquid Glass

An interactive demo of an **iOS 26–style Liquid Glass** effect for the web.

## Live Demo

[**Try it out → liquid-glass-eta.vercel.app**](https://liquid-glass-eta.vercel.app/)

<img width="487" height="367" alt="Screenshot 2026-03-02 at 08 49 33" src="https://github.com/user-attachments/assets/77694823-f4ce-4731-963f-c8bb47c8d7c0" />

<img width="382" height="362" alt="Screenshot 2026-03-02 at 08 49 20" src="https://github.com/user-attachments/assets/26be7540-aff0-412e-b017-877103cced5f" />

<img width="581" height="439" alt="Screenshot 2026-03-02 at 08 50 23" src="https://github.com/user-attachments/assets/682dd24a-9c56-4fb3-9271-ce9536c055a7" />

<img width="638" height="579" alt="Screenshot 2026-03-02 at 08 50 47" src="https://github.com/user-attachments/assets/287c971f-ae48-4e82-a30f-b24cd363e45f" />

<img width="1113" height="647" alt="Screenshot 2026-03-02 at 08 51 59" src="https://github.com/user-attachments/assets/f03aa6c0-2dab-4687-9d52-4cc8eec475da" />

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
