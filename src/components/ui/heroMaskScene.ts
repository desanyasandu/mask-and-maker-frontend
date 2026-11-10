import {
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  SRGBColorSpace,
  Texture,
  Vector2,
  WebGLRenderer,
} from "three";

export function mountHeroMaskScene(panel: HTMLElement, photo: HTMLImageElement) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("webgl2", { alpha: false });
  if (!context) return;

  const renderer = new WebGLRenderer({ canvas, context });
  const scene = new Scene();
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 2);
  camera.position.z = 1;

  const texture = new Texture(photo);
  texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;

  const crop = new Vector2();
  const pointer = new Vector2();
  const tilt = new Vector2();
  const geometry = new PlaneGeometry(2, 2);
  const material = new ShaderMaterial({
    uniforms: { portrait: { value: texture }, crop: { value: crop }, tilt: { value: tilt } },
    vertexShader: `
      varying vec2 portraitUv;
      void main() {
        portraitUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D portrait;
      uniform vec2 crop;
      uniform vec2 tilt;
      varying vec2 portraitUv;

      void main() {
        vec2 centered = portraitUv - 0.5;
        float depth = 1.0 - smoothstep(0.0, 0.73, length(centered));
        vec2 shift = tilt * (0.009 + 0.022 * depth);
        vec2 sampleUv = vec2(0.5, 0.7) + (portraitUv - vec2(0.5, 0.7)) * crop * 0.92 - shift * crop;
        vec3 color = texture2D(portrait, sampleUv).rgb;
        float light = dot(centered, tilt) * depth;
        gl_FragColor = vec4(color * (1.0 + light * 0.42), 1.0);
        #include <colorspace_fragment>
      }
    `,
  });
  scene.add(new Mesh(geometry, material));

  canvas.className = "pointer-events-none absolute inset-0 size-full opacity-0 transition-opacity duration-300";
  canvas.setAttribute("aria-hidden", "true");
  panel.append(canvas);

  let frame = 0;
  let stopped = false;

  function draw() {
    frame = 0;
    tilt.lerp(pointer, 0.12);
    if (tilt.distanceToSquared(pointer) < 0.00001) tilt.copy(pointer);
    renderer.render(scene, camera);
    canvas.classList.remove("opacity-0");
    if (!tilt.equals(pointer)) scheduleDraw();
  }

  function scheduleDraw() {
    if (!stopped && !frame) frame = requestAnimationFrame(draw);
  }

  function resize() {
    const { clientWidth: width, clientHeight: height } = panel;
    if (!width || !height) return;
    const aspect = width / height;
    const imageAspect = photo.naturalWidth / photo.naturalHeight;
    crop.set(Math.min(aspect / imageAspect, 1), Math.min(imageAspect / aspect, 1));
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(width, height, false);
    texture.needsUpdate = true;
    scheduleDraw();
  }

  function aim(event: PointerEvent) {
    if (event.pointerType !== "mouse") return;
    const bounds = panel.getBoundingClientRect();
    pointer.set(
      ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
      1 - ((event.clientY - bounds.top) / bounds.height) * 2,
    );
    scheduleDraw();
  }

  function center() {
    pointer.set(0, 0);
    scheduleDraw();
  }

  function dispose() {
    if (stopped) return;
    stopped = true;
    cancelAnimationFrame(frame);
    observer.disconnect();
    panel.removeEventListener("pointermove", aim);
    panel.removeEventListener("pointerleave", center);
    photo.removeEventListener("load", resize);
    canvas.removeEventListener("webglcontextlost", dispose);
    canvas.remove();
    texture.dispose();
    geometry.dispose();
    material.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
  }

  const observer = new ResizeObserver(resize);
  observer.observe(panel);
  panel.addEventListener("pointermove", aim);
  panel.addEventListener("pointerleave", center);
  photo.addEventListener("load", resize);
  canvas.addEventListener("webglcontextlost", dispose);
  resize();

  return dispose;
}
