import React, { useEffect, useRef } from 'react';

const CustomCursor: React.FC = () => {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dot = dotRef.current;
    const ring = ringRef.current;

    if (!dot || !ring) return;

    let ringX = 0;
    let ringY = 0;
    let mouseX = 0;
    let mouseY = 0;

    const moveCursor = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      dot.style.transform = `translate3d(${mouseX - 4}px, ${mouseY - 4}px, 0)`;
    };

    const trailCursor = () => {
      const stiffness = 0.2;
      ringX += (mouseX - ringX) * stiffness;
      ringY += (mouseY - ringY) * stiffness;
      ring.style.transform = `translate3d(${ringX - 17.5}px, ${ringY - 17.5}px, 0)`;
      requestAnimationFrame(trailCursor);
    };

    const handleMouseOver = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('button, a, [role="button"], input')) {
        ring.classList.add('zoom');
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('button, a, [role="button"], input')) {
        ring.classList.remove('zoom');
      }
    };
    
    window.addEventListener('mousemove', moveCursor);
    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);
    
    requestAnimationFrame(trailCursor);

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
    };
  }, []);

  return (
    <>
      <div ref={dotRef} className="custom-cursor-dot"></div>
      <div ref={ringRef} className="custom-cursor-ring"></div>
    </>
  );
};

export default CustomCursor;
