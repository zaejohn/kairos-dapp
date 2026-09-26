"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "motion/react";
import { KairosApp } from "@/components/kairos-app";

export function GarageEntry({ initialContractAddress }: { initialContractAddress: string }) {
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const [garageArtworkLoaded, setGarageArtworkLoaded] = useState(false);
  const [revealElapsed, setRevealElapsed] = useState(false);
  const [loadingWaitElapsed, setLoadingWaitElapsed] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [showGarage, setShowGarage] = useState(false);
  const [entryComplete, setEntryComplete] = useState(false);
  const reducedMotion = useReducedMotion();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const garageRef = useRef<HTMLDivElement>(null);
  const ready = logoLoaded && garageArtworkLoaded && revealElapsed;
  const canEnterWhileLoading = !ready && loadingWaitElapsed;

  useEffect(() => {
    let cancelled = false;
    const artwork = new window.Image();
    artwork.src = "/reference/home-image.png";
    const finishPreload = () => {
      if (!cancelled) setGarageArtworkLoaded(true);
    };
    void artwork.decode().then(finishPreload, finishPreload);
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setRevealElapsed(true), reducedMotion ? 150 : 1500);
    return () => window.clearTimeout(timer);
  }, [reducedMotion]);

  useEffect(() => {
    if (ready) return;
    const timer = window.setTimeout(() => setLoadingWaitElapsed(true), 8000);
    return () => window.clearTimeout(timer);
  }, [ready]);

  useEffect(() => {
    if (entryComplete) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [entryComplete]);

  useEffect(() => {
    if ((ready || canEnterWhileLoading) && showIntro) buttonRef.current?.focus();
  }, [canEnterWhileLoading, ready, showIntro]);

  return (
    <MotionConfig reducedMotion="user">
      {showGarage && (
        <div
          ref={garageRef}
          className="garage-content"
          tabIndex={-1}
          inert={!entryComplete}
          aria-hidden={!entryComplete}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: reducedMotion ? 0.18 : 0.75, ease: "easeOut" }}
          >
            <KairosApp initialContractAddress={initialContractAddress} />
          </motion.div>
        </div>
      )}

      <AnimatePresence
        onExitComplete={() => {
          setEntryComplete(true);
          window.requestAnimationFrame(() => garageRef.current?.focus());
        }}
      >
        {showIntro && (
          <motion.section
            key="garage-intro"
            className="garage-intro"
            role="dialog"
            aria-modal="true"
            aria-label="KAIROS startup"
            initial={false}
            exit={{ opacity: 0, scale: 1.025 }}
            transition={{ duration: reducedMotion ? 0.18 : 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="garage-intro-vignette" aria-hidden="true" />
            <div className="garage-intro-topline" aria-hidden="true">
              <span>KAIROS / GARAGE</span>
              <span>POWER SEQUENCE 01</span>
            </div>

            <div className="garage-intro-center">
              <motion.div
                className="garage-intro-emblem"
                initial={{ opacity: 0, scale: 0.88 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: reducedMotion ? 0.18 : 1.1, ease: [0.22, 1, 0.36, 1] }}
              >
                {logoFailed ? (
                  <span className="garage-intro-logo-fallback">K</span>
                ) : (
                  <Image
                    src="/kairos-logo.png"
                    alt="KAIROS emblem"
                    width={1254}
                    height={1254}
                    fetchPriority="high"
                    onLoad={() => setLogoLoaded(true)}
                    onError={() => {
                      setLogoFailed(true);
                      setLogoLoaded(true);
                    }}
                  />
                )}
              </motion.div>

              <motion.div
                className="garage-intro-heading"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: reducedMotion ? 0.18 : 0.7, delay: reducedMotion ? 0 : 0.45 }}
              >
                <span className="garage-intro-rule" aria-hidden="true" />
                <h1>KAIROS</h1>
                <p>PRIVATE SIGNAL <span aria-hidden="true">·</span> PUBLIC POLICY</p>
              </motion.div>

              <div className="garage-intro-sequence">
                <div className="garage-intro-progress" aria-hidden="true">
                  <motion.span
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: ready ? 1 : 0.84 }}
                    transition={{ duration: reducedMotion ? 0 : ready ? 0.3 : 1.35, ease: "easeOut" }}
                  />
                </div>
                <p role="status">{ready ? "GARAGE READY" : "POWERING ON"}</p>
              </div>

              <div className="garage-intro-action">
                <AnimatePresence>
                  {(ready || canEnterWhileLoading) && (
                    <motion.button
                      ref={buttonRef}
                      key="enter-garage"
                      type="button"
                      className="garage-enter-button"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: reducedMotion ? 0.18 : 0.55, ease: "easeOut" }}
                      aria-describedby={canEnterWhileLoading ? "garage-entry-loading-note" : undefined}
                      onClick={() => {
                        setShowGarage(true);
                        setShowIntro(false);
                      }}
                    >
                      <span>{ready ? "Enter the Garage" : "Enter while artwork loads"}</span>
                      <span aria-hidden="true">↗</span>
                    </motion.button>
                  )}
                </AnimatePresence>
                {canEnterWhileLoading && (
                  <p
                    id="garage-entry-loading-note"
                    style={{
                      maxWidth: "36ch",
                      margin: "0 auto 14px",
                      color: "#c6ad87",
                      fontSize: "12px",
                      lineHeight: 1.5,
                    }}
                  >
                    The Garage artwork is still loading. You can enter now; the background may look incomplete until it finishes.
                  </p>
                )}
              </div>
            </div>

            <div className="garage-intro-bottomline" aria-hidden="true">
              <span>PRIVATE MARKET / PUBLIC POLICY</span>
              <span>MIDNIGHT / PREPROD</span>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </MotionConfig>
  );
}
