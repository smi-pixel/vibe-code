/**
 * --------------------------------------------
 * @file AdminLTE color-mode.ts
 * @description Color mode (light/dark/auto) manager for AdminLTE.
 * @license MIT
 * --------------------------------------------
 */

import {
  onDOMContentLoaded
} from './util/index'

/**
 * Constants
 * ============================================================================
 */
const DATA_KEY = 'lte.color-mode'
const EVENT_KEY = `.${DATA_KEY}`
const EVENT_CHANGED = `changed${EVENT_KEY}`

const STORAGE_KEY = 'lte.color-mode'
const ATTRIBUTE_THEME = 'data-bs-theme'
const ATTRIBUTE_THEME_VALUE = 'data-bs-theme-value'
const SELECTOR_TOGGLE = `[${ATTRIBUTE_THEME_VALUE}]`

type ColorModeValue = 'light' | 'dark' | 'auto'

type Config = {
  defaultMode: ColorModeValue;
  enablePersistence: boolean;
  storageKey: string;
}

const Defaults: Config = {
  defaultMode: 'auto',
  enablePersistence: true,
  storageKey: STORAGE_KEY
}

/**
 * Class Definition
 * ============================================================================
 */
class ColorMode {
  private readonly _config: Config
  private _currentMode: ColorModeValue
  private _mediaQuery: MediaQueryList | undefined

  constructor(config: Partial<Config> = {}) {
    this._config = { ...Defaults, ...config }
    this._currentMode = this._resolveStoredMode()
    this._mediaQuery = window.matchMedia?.('(prefers-color-scheme: dark)')
    this._apply(this._currentMode)
    this._bindMediaQuery()
  }

  get currentMode(): ColorModeValue {
    return this._currentMode
  }

  setMode(mode: ColorModeValue): void {
    this._currentMode = mode
    this._apply(mode)
    this._persist(mode)
    this._updateToggles(mode)
    document.dispatchEvent(new CustomEvent(EVENT_CHANGED, { detail: { mode } }))
  }

  toggle(): void {
    const next = this._currentMode === 'light' ? 'dark' : 'light'
    this.setMode(next)
  }

  getEffectiveTheme(): 'light' | 'dark' {
    if (this._currentMode === 'auto') {
      return this._mediaQuery?.matches ? 'dark' : 'light'
    }

    return this._currentMode
  }

  private _resolveStoredMode(): ColorModeValue {
    if (!this._config.enablePersistence) {
      return this._config.defaultMode
    }

    try {
      const stored = localStorage.getItem(this._config.storageKey)
      if (stored === 'light' || stored === 'dark' || stored === 'auto') {
        return stored
      }
    } catch {
      // localStorage unavailable (SSR or private browsing)
    }

    return this._config.defaultMode
  }

  private _apply(mode: ColorModeValue): void {
    const theme = mode === 'auto' ? (this._mediaQuery?.matches ? 'dark' : 'light') : mode
    document.documentElement.setAttribute(ATTRIBUTE_THEME, theme)
  }

  private _persist(mode: ColorModeValue): void {
    if (!this._config.enablePersistence) {
      return
    }

    try {
      localStorage.setItem(this._config.storageKey, mode)
    } catch {
      // localStorage unavailable
    }
  }

  private _updateToggles(mode: ColorModeValue): void {
    document.querySelectorAll<HTMLElement>(SELECTOR_TOGGLE).forEach(btn => {
      const value = btn.getAttribute(ATTRIBUTE_THEME_VALUE)
      btn.classList.toggle('active', value === mode)
      btn.setAttribute('aria-pressed', String(value === mode))
    })
  }

  private _bindMediaQuery(): void {
    this._mediaQuery?.addEventListener('change', () => {
      if (this._currentMode === 'auto') {
        this._apply('auto')
        document.dispatchEvent(new CustomEvent(EVENT_CHANGED, { detail: { mode: 'auto' } }))
      }
    })
  }
}

/**
 * Data Api implementation
 * ============================================================================
 */
onDOMContentLoaded(() => {
  const colorMode = new ColorMode()

  document.querySelectorAll<HTMLElement>(SELECTOR_TOGGLE).forEach(btn => {
    btn.addEventListener('click', () => {
      const value = btn.getAttribute(ATTRIBUTE_THEME_VALUE) as ColorModeValue | null
      if (value) {
        colorMode.setMode(value)
      }
    })
  })
})

export default ColorMode
