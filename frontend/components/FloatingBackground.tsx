export function FloatingBackground() {
  const logos = [
    { src: '/icons/shmon.png', size: 120, top: '10%', left: '15%', rotation: -15, opacity: 0.08 },
    { src: '/icons/space-flarry.png', size: 100, top: '20%', right: '10%', rotation: 25, opacity: 0.06 },
    { src: '/icons/shmon.png', size: 150, top: '45%', left: '5%', rotation: 10, opacity: 0.07 },
    { src: '/icons/space-flarry.png', size: 80, top: '60%', right: '20%', rotation: -20, opacity: 0.05 },
    { src: '/icons/shmon.png', size: 90, bottom: '15%', left: '25%', rotation: 30, opacity: 0.06 },
    { src: '/icons/space-flarry.png', size: 110, bottom: '25%', right: '15%', rotation: -10, opacity: 0.07 },
    { src: '/icons/shmon.png', size: 70, top: '75%', left: '50%', rotation: 45, opacity: 0.05 },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {logos.map((logo, idx) => (
        <img
          key={idx}
          src={logo.src}
          alt=""
          style={{
            position: 'absolute',
            width: logo.size,
            height: logo.size,
            top: logo.top,
            bottom: logo.bottom,
            left: logo.left,
            right: logo.right,
            transform: `rotate(${logo.rotation}deg)`,
            opacity: logo.opacity,
            filter: 'blur(0.5px)',
          }}
        />
      ))}
    </div>
  );
}