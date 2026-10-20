/**
 * Once-per-session flag for the intro trailer. sessionStorage can throw (private mode,
 * blocked storage), so every access is wrapped. `?intro=1` forces a replay, `?intro=0` skips.
 */
export const INTRO_FLAG = 'iiw-intro-seen';
const INTRO_EVENT = 'iiw-intro-change';

export type IntroMode = 'play' | 'skip';

/** Client only. Pure over (location.search, sessionStorage), so it is safe as a store snapshot. */
export function readIntroMode(): IntroMode {
  try {
    const q = new URLSearchParams(window.location.search).get('intro');
    if (q === '1') return 'play';
    if (q === '0') return 'skip';
  } catch {
    /* ignore */
  }
  try {
    return window.sessionStorage.getItem(INTRO_FLAG) === '1' ? 'skip' : 'play';
  } catch {
    return 'play';
  }
}

export function markIntroSeen() {
  try {
    window.sessionStorage.setItem(INTRO_FLAG, '1');
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(INTRO_EVENT));
}

export function subscribeIntro(cb: () => void) {
  window.addEventListener(INTRO_EVENT, cb);
  window.addEventListener('storage', cb);
  return () => {
    window.removeEventListener(INTRO_EVENT, cb);
    window.removeEventListener('storage', cb);
  };
}

/**
 * Inline script that runs while the page is still being parsed: a returning visitor never
 * sees a frame of the trailer, because the server-rendered overlay is hidden before first paint.
 * Mirrors readIntroMode.
 */
export const INTRO_BOOT_SCRIPT = `(function(){try{var m=location.search.match(/[?&]intro=([01])/);var seen=false;try{seen=sessionStorage.getItem('${INTRO_FLAG}')==='1'}catch(e){}var skip=m?m[1]==='0':seen;if(skip){var e=document.querySelector('[data-intro-root]');if(e)e.style.display='none'}}catch(e){}})();`;
