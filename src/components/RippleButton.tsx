import { useState, useEffect } from 'react';
import Link from 'next/link';

interface RippleButtonProps {
  onClick?: () => void;
  href?: string;
  children: React.ReactNode;
  className?: string;
}

export default function RippleButton({ onClick, href, children, className = '' }: RippleButtonProps) {
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);

  useEffect(() => {
    // Clean up ripples after animation
    const timeouts = ripples.map((ripple) => {
      return setTimeout(() => {
        setRipples((prevRipples) =>
          prevRipples.filter((r) => r.id !== ripple.id)
        );
      }, 850); // Match this with the CSS animation duration
    });

    return () => {
      timeouts.forEach((timeout) => clearTimeout(timeout));
    };
  }, [ripples]);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
    const element = event.currentTarget;
    const rect = element.getBoundingClientRect();
    
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    setRipples([...ripples, { x, y, id: Date.now() }]);
    
    if (onClick) {
      onClick();
    }
  };

  const content = (
    <>
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="animate-ripple"
          style={{
            left: ripple.x,
            top: ripple.y,
            transform: `translate(-50%, -50%)`,
          }}
        />
      ))}
      {children}
    </>
  );

  if (href) {
    return (
      <Link 
        href={href}
        className={`relative overflow-hidden ${className}`}
        onClick={handleClick}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={`relative overflow-hidden ${className}`}
    >
      {content}
    </button>
  );
} 