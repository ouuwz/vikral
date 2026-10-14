import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Plus, X } from 'lucide-react';
import { useState } from 'react';
import BrandMark from './BrandMark';

const easeOut = [0.16, 1, 0.3, 1] as [number, number, number, number];

export default function Navigation() {
  const reduceMotion = useReducedMotion();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <motion.header
      className="site-header"
      initial={reduceMotion ? false : { y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: reduceMotion ? 0 : 0.8, ease: easeOut }}
    >
      <nav className="nav-bar" aria-label="Main navigation">
        <div className="nav-left">
          <a className="brand-lockup" href="#home" aria-label="Vikral home" onClick={() => setMenuOpen(false)}>
            <BrandMark className="brand-mark" />
            <span className="brand-wordmark">Vikral</span>
          </a>

          <div className="menu-control-wrap">
            <button
              type="button"
              className="menu-pill"
              aria-expanded={menuOpen}
              aria-controls="site-menu"
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span className="menu-icon-circle">
                {menuOpen ? <X size={15} strokeWidth={1.8} /> : <Plus size={16} strokeWidth={1.8} />}
              </span>
              <span>Menu</span>
            </button>

            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  id="site-menu"
                  className="menu-popover"
                  initial={reduceMotion ? false : { opacity: 0, y: -8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  transition={{ duration: reduceMotion ? 0 : 0.22, ease: easeOut }}
                >
                  <a href="#home" onClick={() => setMenuOpen(false)}>Overview <span>01</span></a>
                  <a href="#capabilities" onClick={() => setMenuOpen(false)}>Capabilities <span>02</span></a>
                  <a href="/brands" onClick={() => setMenuOpen(false)}>Brand Profiles <span>02</span></a>
                  <a href="/detection" onClick={() => setMenuOpen(false)}>Detection Lab <span>03</span></a>
                  <a href="/social-monitoring" onClick={() => setMenuOpen(false)}>Social Monitoring <span>04</span></a>
                  <a href="/app-monitoring" onClick={() => setMenuOpen(false)}>App Monitoring <span>05</span></a>
                  <a href="/dashboard" onClick={() => setMenuOpen(false)}>Threat Dashboard <span>06</span></a>
                  <a href="/integrations" onClick={() => setMenuOpen(false)}>Data Sources <span>07</span></a>
                  <p>Phase 7 · Evidence validation</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="descriptor-pill" aria-label="Digital Risk Protection">
            <span>Digital Risk</span>
            <span className="descriptor-divider" aria-hidden="true" />
            <span>Protection</span>
          </div>
        </div>

        <a className="intelligence-pill" href="#capabilities" aria-label="Threat Intelligence capabilities">
          <span className="intelligence-icon" aria-hidden="true">
            <svg viewBox="0 0 16 16" role="presentation">
              <circle cx="4" cy="4" r="1.55" fill="currentColor" />
              <circle cx="12" cy="4" r="1.55" fill="currentColor" />
              <circle cx="4" cy="12" r="1.55" fill="currentColor" />
              <circle cx="12" cy="12" r="1.55" fill="currentColor" />
            </svg>
          </span>
          <span className="intelligence-label">Threat Intelligence</span>
        </a>
      </nav>
    </motion.header>
  );
}
