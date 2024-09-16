// constants
DISPLAY_WIDTH = 800
PI = 3.14159
let offset = {
    x: 0,
    y: 0,
}
let gridSize = {
    w: 40,
    h: 40,
}
const colorRatio = 0.1
let colors = {
    "theme": { r: 106, g: 181, b: 255 },
    // "b1": { r: 192, g: 255, b: 0 },
    // "b2": { r: 128, g: 192, b: 0 },
    // "f1": { r: 32, g: 64, b: 0 },
    // "f2": { r: 224, g: 255, b: 0 },
}
let cross = {
    hw: 9,
    hh: 3,
    vw: 3,
    vh: 9,
}
let crossRatio = 0.2

let canvas = document.getElementById("maincanvas")
let ctx = canvas.getContext("2d")

let tmpCanvas = document.createElement('canvas');
let tmpCanvasCtx = tmpCanvas.getContext('2d')

function colorDictToHex(color) {
    let padInt = (num) => num.toString(16).padStart(2, '0')
    return "#" + padInt(color.r) + padInt(color.g) + padInt(color.b)
}
function RGBToHSL(color) {
    let r = color.r / 255
    let g = color.g / 255
    let b = color.b / 255
    let max = Math.max(r, g, b)
    let min = Math.min(r, g, b)
    let h, s, l = (max + min) / 2
    if (max == min) {
        h = s = 0
    } else {
        let d = max - min
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break
            case g: h = (b - r) / d + 2; break
            case b: h = (r - g) / d + 4; break
        }
        h /= 6
    }
    return { h: h, s: s, l: l }
}
function HSLToRGB(color) {
    let r, g, b
    if (color.s == 0) {
        r = g = b = color.l
    } else {
        let hue2rgb = (p, q, t) => {
            if (t < 0) t += 1
            if (t > 1) t -= 1
            if (t < 1 / 6) return p + (q - p) * 6 * t
            if (t < 1 / 2) return q
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
            return p
        }
        let q = color.l < 0.5 ? color.l * (1 + color.s) : color.l + color.s - color.l * color.s
        let p = 2 * color.l - q
        r = hue2rgb(p, q, color.h + 1 / 3)
        g = hue2rgb(p, q, color.h)
        b = hue2rgb(p, q, color.h - 1 / 3)
    }
    return { r: r * 255, g: g * 255, b: b * 255 }
}

function colorLight(color) {
    let hsl = RGBToHSL(color)
    hsl.l = Math.min(1, hsl.l + colorRatio)
    return HSLToRGB(hsl)
}
function colorDark(color) {
    let hsl = RGBToHSL(color)
    hsl.l = Math.max(0, hsl.l - colorRatio)
    return HSLToRGB(hsl)
}
function updateThemeColor() {
    colors.b1 = colors.theme
    colors.b2 = colorDark(colors.theme)
    colors.f1 = colorLight(colorLight(colors.theme))
    colors.f2 = colorDark(colorDark(colors.b2))
}
function colorClick(key) {
    const currentColor = colors[key]
    let newElement = document.createElement("input")
    newElement.type = "color"
    newElement.value = colorDictToHex(currentColor)
    newElement.onchange = function () {
        const newColor = newElement.value
        const newColorDict = {
            r: parseInt(newColor.substring(1, 3), 16),
            g: parseInt(newColor.substring(3, 5), 16),
            b: parseInt(newColor.substring(5, 7), 16),
        }
        colors[key] = newColorDict
        if (key == "theme") updateThemeColor()
        updateColorSelector()
        redraw()
    }
    newElement.click()
    newElement.remove()
}

function redraw() {
    const starti = Math.floor(-offset.x / gridSize.w)
    const startj = Math.floor(-offset.y / gridSize.h)
    for (let i = starti; i * gridSize.w + offset.x < canvas.width + gridSize.w; i++) {
        for (let j = startj; j * gridSize.h + offset.y < canvas.height + gridSize.h; j++) {
            let x = i * gridSize.w + offset.x
            let y = j * gridSize.h + offset.y
            let ctx = canvas.getContext("2d")

            // draw a filled rectangle
            {
                const color = (i + j) % 2 == 0 ? colors.b1 : colors.b2
                ctx.fillStyle = `rgb(${color.r},${color.g},${color.b})`
                ctx.fillRect(x, y, gridSize.w, gridSize.h)
            }

            // draw a cross
            {
                const step = (i + j) % 8;
                const isf1 = step == 0 || step == 1 || step == 3 || step == 6
                const color = isf1 ? colors.f1 : colors.f2
                ctx.fillStyle = `rgb(${color.r},${color.g},${color.b})`
                let h = cross.hh
                let w = cross.hw
                ctx.fillRect(x - w / 2, y - h / 2, w, h)
                h = cross.vh
                w = cross.vw
                ctx.fillRect(x - w / 2, y - h / 2, w, h)
            }

        }
    }
}

function reloadDrawSizes() {
    gridSize.w = parseInt(document.getElementById("inputGridW").value)
    gridSize.h = parseInt(document.getElementById("inputGridH").value)
    let offsetX = parseInt(document.getElementById("inputOffsetX").value)
    let offsetY = parseInt(document.getElementById("inputOffsetY").value)
    offset.x = offsetX
    offset.y = offsetY
    cross.hw = parseInt(document.getElementById("inputCrossHW").value)
    cross.hh = parseInt(document.getElementById("inputCrossHH").value)
    cross.vw = parseInt(document.getElementById("inputCrossVW").value)
    cross.vh = parseInt(document.getElementById("inputCrossVH").value)
    redraw()
}

function resizeCanvasClick() {
    let newWidth = document.getElementById("inputCanvasWidth").value
    let newHeight = document.getElementById("inputCanvasHeight").value
    canvas.height = newHeight
    canvas.width = newWidth
    const newAspectRatio = newWidth / newHeight
    const newDisplayHeight = DISPLAY_WIDTH / newAspectRatio
    canvas.style.width = `${DISPLAY_WIDTH}px`
    canvas.style.height = `${newDisplayHeight}px`
    redraw()
}

function updateColorSelector() {
    for (let key in colors) {
        let color = colors[key]
        let colorString = `rgb(${color.r},${color.g},${color.b})`
        const elementKey = "inputColor" + key
        document.getElementById(elementKey).style.backgroundColor = colorString
    }
}

{
    let newWidth = document.getElementById("inputCanvasWidth").value
    let newHeight = document.getElementById("inputCanvasHeight").value
    canvas.height = newHeight
    canvas.width = newWidth
    const newAspectRatio = newWidth / newHeight
    const newDisplayHeight = DISPLAY_WIDTH / newAspectRatio
    canvas.style.width = `${DISPLAY_WIDTH}px`
    canvas.style.height = `${newDisplayHeight}px`
    updateThemeColor()
    updateColorSelector()
    reloadDrawSizes()
}