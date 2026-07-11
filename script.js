// Stars effect
if (window.tsParticles) {
  tsParticles.load({
    id: 'stars',
    options: {
      fullScreen: { enable: false },
      particles: {
        number: {
          value: 100,
          density: { enable: true, area: 800 }
        },
        shape: { type: 'circle' },
        color: { 
          value: ['#ffffff', '#e0f2fe', '#fef08a', '#fbcfe8']
        },
        opacity: {
          value: { min: 0.2, max: 0.6 },
          animation: {
            enable: true,
            speed: 1,
            sync: false,
            startValue: 'random'
          }
        },
        size: { 
          value: { min: 1, max: 2 },
          animation: {
            enable: true,
            speed: 2,
            sync: false
          }
        },
        move: {
          enable: true,
          speed: 0.3,
          direction: 'none',
          outModes: { default: 'out' }
        }
      }
    }
  });
}
