"use client";

import { useEffect, useRef } from "react";

/**
 * WebGL "duman" shader arkaplanı — login ekranının imza görsel öğesi.
 * Fare hareketine tepki veren, sürekli akan bir dalga/glow efekti (fragman
 * shader'da katmanlı kosinüs distorsiyonu). Marka rengiyle (jade) parametrik.
 */

const VERTEX_SOURCE = `
  attribute vec4 a_position;
  void main() {
    gl_Position = a_position;
  }
`;

const FRAGMENT_SOURCE = `
  precision mediump float;

  uniform vec2 iResolution;
  uniform float iTime;
  uniform vec2 iMouse;
  uniform vec3 u_color;

  void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 centeredUV = (2.0 * fragCoord - iResolution.xy) / min(iResolution.x, iResolution.y);
    float time = iTime * 0.35;

    vec2 mouse = iMouse / iResolution;
    vec2 rippleCenter = 2.0 * mouse - 1.0;

    vec2 distortion = centeredUV;
    for (float i = 1.0; i < 8.0; i++) {
      distortion.x += 0.5 / i * cos(i * 2.0 * distortion.y + time + rippleCenter.x * 3.1415);
      distortion.y += 0.5 / i * cos(i * 2.0 * distortion.x + time + rippleCenter.y * 3.1415);
    }

    float wave = abs(sin(distortion.x + distortion.y + time));
    float glow = smoothstep(0.9, 0.15, wave);

    fragColor = vec4(u_color * glow, 1.0);
  }

  void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
  }
`;

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return [r, g, b];
}

export function SmokeyBackground({
  color = "#12C99E",
  className = "",
}: {
  color?: string;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const hoveringRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl");
    if (!gl) {
      console.error("SmokeyBackground: bu tarayıcıda WebGL desteklenmiyor.");
      return;
    }

    const compileShader = (type: number, source: string): WebGLShader | null => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("SmokeyBackground shader derleme hatası:", gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertexShader = compileShader(gl.VERTEX_SHADER, VERTEX_SOURCE);
    const fragmentShader = compileShader(gl.FRAGMENT_SHADER, FRAGMENT_SOURCE);
    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("SmokeyBackground program link hatası:", gl.getProgramInfoLog(program));
      return;
    }
    gl.useProgram(program);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const positionLocation = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const iResolutionLoc = gl.getUniformLocation(program, "iResolution");
    const iTimeLoc = gl.getUniformLocation(program, "iTime");
    const iMouseLoc = gl.getUniformLocation(program, "iMouse");
    const uColorLoc = gl.getUniformLocation(program, "u_color");

    const [r, g, b] = hexToRgb(color);
    gl.uniform3f(uColorLoc, r, g, b);

    const startTime = Date.now();
    let frameId: number;

    const render = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      gl.viewport(0, 0, width, height);

      const elapsed = (Date.now() - startTime) / 1000;
      gl.uniform2f(iResolutionLoc, width, height);
      gl.uniform1f(iTimeLoc, elapsed);
      gl.uniform2f(
        iMouseLoc,
        hoveringRef.current ? mouseRef.current.x : width / 2,
        hoveringRef.current ? height - mouseRef.current.y : height / 2,
      );

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      frameId = requestAnimationFrame(render);
    };

    const handleMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    };
    const handleMouseEnter = () => {
      hoveringRef.current = true;
    };
    const handleMouseLeave = () => {
      hoveringRef.current = false;
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseenter", handleMouseEnter);
    canvas.addEventListener("mouseleave", handleMouseLeave);
    render();

    return () => {
      cancelAnimationFrame(frameId);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseenter", handleMouseEnter);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [color]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={`h-full w-full ${className}`}
    />
  );
}
