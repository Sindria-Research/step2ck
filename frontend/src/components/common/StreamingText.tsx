import { useState, useEffect } from 'react';

interface StreamingTextProps {
  /** Full text to reveal character by character */
  text: string;
  /** Delay between characters (ms) */
  charDelay?: number;
  /** Show blinking cursor at the end while streaming and optionally after */
  cursor?: boolean;
  /** Class name for the container */
  className?: string;
}

/**
 * Renders text with a streaming (typewriter) effect and optional cursor.
 */
export function StreamingText({
  text,
  charDelay = 25,
  cursor = true,
  className = '',
}: StreamingTextProps) {
  const [visibleLength, setVisibleLength] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!text) {
      setVisibleLength(0);
      setDone(true);
      return;
    }
    setVisibleLength(0);
    setDone(false);
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setVisibleLength(i);
      if (i >= text.length) {
        clearInterval(id);
        setDone(true);
      }
    }, charDelay);
    return () => clearInterval(id);
  }, [text, charDelay]);

  return (
    <span className={className}>
      {text.slice(0, visibleLength)}
      {cursor && !done && (
        <span className="streaming-cursor" aria-hidden />
      )}
    </span>
  );
}
