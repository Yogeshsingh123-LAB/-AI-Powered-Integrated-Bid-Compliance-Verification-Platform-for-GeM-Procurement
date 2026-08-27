import React, { useState, useEffect } from "react";
import "./Click3DEffect.css";

export default function Click3DEffect() {
  const [effects, setEffects] = useState([]);

  useEffect(() => {
    const handleClick = (e) => {
      const id = Date.now() + Math.random();
      const x = e.clientX;
      const y = e.clientY;

      // Generate 8 3D particles moving outward in a circle
      const particles = Array.from({ length: 8 }).map((_, index) => {
        const angle = (index / 8) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
        const velocity = 40 + Math.random() * 60;
        const tx = Math.cos(angle) * velocity;
        const ty = Math.sin(angle) * velocity;
        
        // Random 3D rotations for the cube/particles
        const rx = Math.random() * 360;
        const ry = Math.random() * 360;
        const rz = Math.random() * 360;
        const size = 6 + Math.random() * 8;
        
        // Colors palette (cyan, teal, green, blue) matching redesigned theme
        const colors = ["#06b6d4", "#0d9488", "#3b82f6", "#10b981", "#67e8f9", "#2dd4bf"];
        const color = colors[Math.floor(Math.random() * colors.length)];

        return {
          id: `${id}-${index}`,
          tx,
          ty,
          rx,
          ry,
          rz,
          size,
          color,
        };
      });

      const newEffect = {
        id,
        x,
        y,
        particles,
      };

      setEffects((prev) => [...prev, newEffect]);

      // Remove effect when animation finishes
      setTimeout(() => {
        setEffects((prev) => prev.filter((effect) => effect.id !== id));
      }, 800);
    };

    window.addEventListener("click", handleClick);
    return () => {
      window.removeEventListener("click", handleClick);
    };
  }, []);

  return (
    <div className="click-3d-container">
      {effects.map((effect) => (
        <div
          key={effect.id}
          className="click-3d-origin"
          style={{ left: effect.x, top: effect.y }}
        >
          {/* Tilted 3D ripple rings */}
          <div className="click-3d-ring"></div>
          <div className="click-3d-ring-alt"></div>

          {/* Flying 3D particles */}
          {effect.particles.map((p) => (
            <div
              key={p.id}
              className="click-3d-particle"
              style={{
                "--tx": `${p.tx}px`,
                "--ty": `${p.ty}px`,
                "--rx": `${p.rx}deg`,
                "--ry": `${p.ry}deg`,
                "--rz": `${p.rz}deg`,
                width: `${p.size}px`,
                height: `${p.size}px`,
                backgroundColor: p.color,
                boxShadow: `0 0 8px ${p.color}`,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
