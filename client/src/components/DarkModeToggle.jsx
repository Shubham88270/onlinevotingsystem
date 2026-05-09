import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext.jsx';

export default function DarkModeToggle({ size = 'md' }) {
  const { darkMode, setDarkMode } = useTheme();
  const [hovered, setHovered] = useState(false);

  const isSmall = size === 'sm';

  const toggle = () => setDarkMode(!darkMode);

  return (
    <motion.button
      onClick={toggle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      whileTap={{ scale: 0.92 }}
      title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      style={{
        position:       'relative',
        display:        'inline-flex',
        alignItems:     'center',
        width:          isSmall ? '52px' : '64px',
        height:         isSmall ? '28px' : '34px',
        borderRadius:   '999px',
        cursor:         'pointer',
        border:         'none',
        padding:        '3px',
        outline:        'none',
        flexShrink:     0,
        background:     darkMode
          ? 'linear-gradient(135deg, #1e1b4b, #312e81)'
          : 'linear-gradient(135deg, #bfdbfe, #93c5fd)',
        boxShadow:      darkMode
          ? `0 0 0 1px rgba(99,102,241,0.4), 0 4px 20px rgba(99,102,241,0.3)${hovered ? ', 0 0 25px rgba(139,92,246,0.5)' : ''}`
          : `0 0 0 1px rgba(147,197,253,0.6), 0 4px 20px rgba(59,130,246,0.2)${hovered ? ', 0 0 25px rgba(96,165,250,0.4)' : ''}`,
        transition:     'background 0.4s ease, box-shadow 0.3s ease',
      }}>

      {/* Track stars (dark mode) */}
      <AnimatePresence>
        {darkMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ position: 'absolute', inset: 0, borderRadius: '999px', overflow: 'hidden', pointerEvents: 'none' }}>
            {[
              { top: '20%', left: '15%', size: '2px' },
              { top: '55%', left: '25%', size: '1.5px' },
              { top: '30%', left: '35%', size: '1px' },
            ].map((star, i) => (
              <motion.div
                key={i}
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.5 + i * 0.5, repeat: Infinity }}
                style={{
                  position:     'absolute',
                  top:          star.top,
                  left:         star.left,
                  width:        star.size,
                  height:       star.size,
                  borderRadius: '50%',
                  background:   '#fff',
                }} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Track clouds (light mode) */}
      <AnimatePresence>
        {!darkMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ position: 'absolute', inset: 0, borderRadius: '999px', overflow: 'hidden', pointerEvents: 'none' }}>
            <div style={{
              position: 'absolute', top: '25%', left: '10%',
              width: '12px', height: '5px', borderRadius: '999px',
              background: 'rgba(255,255,255,0.7)',
            }} />
            <div style={{
              position: 'absolute', top: '55%', left: '20%',
              width: '8px', height: '4px', borderRadius: '999px',
              background: 'rgba(255,255,255,0.5)',
            }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Thumb */}
      <motion.div
        layout
        animate={{
          x: darkMode
            ? (isSmall ? 24 : 30)
            : 0,
          rotate: darkMode ? 0 : 360,
        }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        style={{
          width:        isSmall ? '22px' : '28px',
          height:       isSmall ? '22px' : '28px',
          borderRadius: '50%',
          display:      'flex',
          alignItems:   'center',
          justifyContent: 'center',
          fontSize:     isSmall ? '12px' : '15px',
          flexShrink:   0,
          position:     'relative',
          zIndex:       1,
          background:   darkMode
            ? 'linear-gradient(135deg, #1e293b, #0f172a)'
            : 'linear-gradient(135deg, #fef3c7, #fde68a)',
          boxShadow:    darkMode
            ? '0 2px 8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)'
            : '0 2px 8px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.8)',
        }}>
        <AnimatePresence mode="wait">
          {darkMode ? (
            <motion.span
              key="moon"
              initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
              animate={{ opacity: 1, rotate: 0,   scale: 1 }}
              exit={{    opacity: 0, rotate:  90, scale: 0.5 }}
              transition={{ duration: 0.2 }}>
              🌙
            </motion.span>
          ) : (
            <motion.span
              key="sun"
              initial={{ opacity: 0, rotate: 90,  scale: 0.5 }}
              animate={{ opacity: 1, rotate: 0,   scale: 1 }}
              exit={{    opacity: 0, rotate: -90, scale: 0.5 }}
              transition={{ duration: 0.2 }}>
              ☀️
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.button>
  );
}
