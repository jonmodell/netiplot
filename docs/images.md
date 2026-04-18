# Images & Icons

Display images inside nodes using the `images` prop and the `image` field on node definitions.

## Passing images

```ts
const serverIcon = new Image()
serverIcon.src = '/icons/server.svg'

<NetiPlotReact
  graph={graph}
  images={{ server: serverIcon }}
/>
```

## Using an image on a node

```ts
{ id: 'n1', label: 'Web Server', shape: 'image', image: 'server' }
```

Setting `shape: 'image'` removes the default circle background, rendering only the image. Omit it to render the image on top of the default node circle.

## Image definition — `NetiPlotImageDefinition`

Images can be passed as a raw element or with positioning options:

```ts
// Raw element
images={{ logo: imgElement }}

// With scale and offset
images={{
  logo: {
    element: imgElement,
    scale: 0.8,       // scale relative to node size (default 1.0)
    offsetX: 0,       // horizontal offset in pixels
    offsetY: -2,      // vertical offset in pixels
  }
}}
```

Accepted element types: `HTMLImageElement`, `SVGImageElement`, `HTMLCanvasElement`.

## Pre-loading images

Images must be loaded before they can render. Use the `onload` event or a Promise:

```ts
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

// In a component:
const [images, setImages] = useState<NetiPlotImageMap>({})

useEffect(() => {
  loadImage('/icons/server.svg').then((img) => {
    setImages({ server: img })
  })
}, [])
```
