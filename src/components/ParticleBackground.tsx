import { useEffect, useRef } from 'react';
import './ParticleBackground.css';

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
}

export const ParticleBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number>();
  const particleIdRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const updateCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    // Initialize particles
    const colors = ['#ff00ff', '#00ffff', '#ff0080', '#00ff88'];
    const createParticle = (): Particle => ({
      id: particleIdRef.current++,
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      size: Math.random() * 3 + 1,
      opacity: Math.random() * 0.5 + 0.3,
      color: colors[Math.floor(Math.random() * colors.length)],
    });

    // Initialize with particles
    for (let i = 0; i < 100; i++) {
      particlesRef.current.push(createParticle());
    }

    // Animation loop
    const animate = () => {
      // Clear canvas with fade effect
      ctx.fillStyle = 'rgba(10, 10, 30, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      particlesRef.current.forEach((particle, index) => {
        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Wrap around screen
        if (particle.x < -10) particle.x = canvas.width + 10;
        if (particle.x > canvas.width + 10) particle.x = -10;
        if (particle.y < -10) particle.y = canvas.height + 10;
        if (particle.y > canvas.height + 10) particle.y = -10;

        // Pulse opacity
        particle.opacity += (Math.random() - 0.5) * 0.02;
        particle.opacity = Math.max(0.1, Math.min(0.7, particle.opacity));

        // Draw particle with glow
        ctx.shadowColor = particle.color;
        ctx.shadowBlur = 15;
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = particle.opacity;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();

        // Add connection lines between nearby particles
        for (let j = index + 1; j < Math.min(index + 5, particlesRef.current.length); j++) {
          const other = particlesRef.current[j];
          const dx = other.x - particle.x;
          const dy = other.y - particle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 150) {
            ctx.globalAlpha = (particle.opacity + other.opacity) * 0.2 * (1 - distance / 150);
            ctx.strokeStyle = particle.color;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(other.x, other.y);
            ctx.stroke();
          }
        }
      });

      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      // Add new particles occasionally
      if (Math.random() < 0.3 && particlesRef.current.length < 150) {
        particlesRef.current.push(createParticle());
      }

      // Remove old particles if too many
      if (particlesRef.current.length > 200) {
        particlesRef.current = particlesRef.current.slice(-150);
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, []);

  return <canvas ref={canvasRef} className="particle-background" />;
};
