import { useRef } from 'react';
import gsap from 'gsap';

export default function MagneticButton({
  children,
  className = '',
  strength = 0.35,
  textStrength = 0.2,
  onClick,
  ...props
}) {
  const btnRef = useRef(null);
  const textRef = useRef(null);

  const handleMouseMove = (e) => {
    const btn = btnRef.current;
    if (!btn) return;

    const rect = btn.getBoundingClientRect();
    const x = e.clientX - (rect.left + rect.width / 2);
    const y = e.clientY - (rect.top + rect.height / 2);

    // Pull button container
    gsap.to(btn, {
      x: x * strength,
      y: y * strength,
      duration: 0.3,
      ease: 'power2.out',
    });

    // Pull nested text slightly independently for depth
    if (textRef.current) {
      gsap.to(textRef.current, {
        x: x * textStrength,
        y: y * textStrength,
        duration: 0.3,
        ease: 'power2.out',
      });
    }
  };

  const handleMouseLeave = () => {
    const btn = btnRef.current;
    if (!btn) return;

    // Return container to zero position
    gsap.to(btn, {
      x: 0,
      y: 0,
      duration: 0.7,
      ease: 'elastic.out(1, 0.3)',
    });

    // Return text to zero position
    if (textRef.current) {
      gsap.to(textRef.current, {
        x: 0,
        y: 0,
        duration: 0.7,
        ease: 'elastic.out(1, 0.3)',
      });
    }
  };

  return (
    <button
      ref={btnRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      data-magnetic="true"
      className={`relative inline-flex items-center justify-center will-change-transform ${className}`}
      {...props}
    >
      <span ref={textRef} className="inline-flex items-center gap-2 will-change-transform pointer-events-none">
        {children}
      </span>
    </button>
  );
}   