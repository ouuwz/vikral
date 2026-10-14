import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import Navigation from '../components/Navigation';

const BACKGROUND_VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260508_215831_c6a8989c-d716-4d8d-8745-e972a2eec711.mp4';
const easeOut = [0.16, 1, 0.3, 1] as [number, number, number, number];

export default function HomePage() {
  const reduceMotion = useReducedMotion();
  const [videoFailed, setVideoFailed] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  useEffect(() => {
    if (!showHowItWorks) return undefined;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowHowItWorks(false);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showHowItWorks]);

  return (
    <main className="landing-shell" id="home">
      <motion.div
        className={`background-film${videoFailed ? ' background-film--fallback' : ''}`}
        aria-hidden="true"
        initial={reduceMotion ? false : { opacity: 0, scale: 1.05 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: reduceMotion ? 0 : 1.8, ease: easeOut }}
      >
        {!videoFailed && (
          <video
            className="background-video"
            src={BACKGROUND_VIDEO_URL}
            autoPlay={!reduceMotion}
            muted
            playsInline
            loop={!reduceMotion}
            preload={reduceMotion ? 'metadata' : 'auto'}
            onError={() => setVideoFailed(true)}
            aria-hidden="true"
          />
        )}
        {videoFailed && <div className="video-fallback-art" />}
      </motion.div>

      <div className="bottom-wash" aria-hidden="true" />
      <Navigation />

      <section className="hero" aria-labelledby="hero-heading">
        <div className="hero-inner">
          <div className="hero-copy">
            <motion.p
              className="hero-eyebrow"
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.8, delay: reduceMotion ? 0 : 0.6, ease: easeOut }}
            >
              <span className="eyebrow-dot" aria-hidden="true" />
              Digital Risk Protection Platform
            </motion.p>

            <motion.h1
              className="hero-heading"
              id="hero-heading"
              initial={reduceMotion ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.8, delay: reduceMotion ? 0 : 0.8, ease: easeOut }}
            >
              <span>Protect Your Brand.</span>
              <span>Detect Digital Threats.</span>
            </motion.h1>
          </div>

          <motion.div
            className="hero-footer"
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 1, delay: reduceMotion ? 0 : 0.5, ease: easeOut }}
          >
            <p className="hero-description">
              Discover suspicious profiles, impersonating pages, and potentially malicious apps from one unified workspace.
            </p>

            <motion.div
              className="hero-actions"
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.8, delay: reduceMotion ? 0 : 1, ease: easeOut }}
            >
              <a className="button button-primary" href="/brands">
                Explore Platform
                <ArrowUpRight size={16} strokeWidth={1.8} aria-hidden="true" />
              </a>
              <button className="button button-secondary" type="button" onClick={() => setShowHowItWorks(true)}>
                How It Works
              </button>
            </motion.div>

            <div className="capability-tags" id="capabilities" aria-label="Platform capability areas">
              <span className="capability-tag">Social Monitoring</span>
              <span className="capability-tag">App Intelligence</span>
              <span className="capability-tag">Risk Analysis</span>
            </div>
          </motion.div>
        </div>
        <p className="hero-note">A clearer view of your digital presence.</p>
      </section>

      <AnimatePresence>
        {showHowItWorks && (
          <motion.div
            className="dialog-backdrop"
            role="presentation"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.2 }}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setShowHowItWorks(false);
            }}
          >
            <motion.section
              className="how-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="how-dialog-title"
              initial={reduceMotion ? false : { opacity: 0, y: 14, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.99 }}
              transition={{ duration: reduceMotion ? 0 : 0.28, ease: easeOut }}
            >
              <button
                className="dialog-close"
                type="button"
                autoFocus
                aria-label="Close dialog"
                onClick={() => setShowHowItWorks(false)}
              >
                <X size={18} aria-hidden="true" />
              </button>
              <p className="dialog-eyebrow">Vikral · How it works</p>
              <h2 id="how-dialog-title">From brand identity to review priority.</h2>
              <p>
                First, register the official brand identity and its trusted domains, social accounts, and apps. Then submit a profile you want to assess from Social Monitoring or the Detection Lab.
              </p>
              <p className="dialog-footnote">
                Vikral compares the submitted name, handle, URL, and description with the saved brand profile and explains the signals it finds. Scores indicate review priority, not proof of fraud. Profile URLs are not fetched, and no live platform monitoring or automated response is active.
              </p>
              <a className="button button-primary dialog-action" href="/social-monitoring" onClick={() => setShowHowItWorks(false)}>
                Open Social Monitoring
                <ArrowUpRight size={16} strokeWidth={1.8} aria-hidden="true" />
              </a>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
