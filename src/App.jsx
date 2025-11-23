import { useState, useRef, useCallback } from 'react'
import './App.css'

// Configuration: Define prompt and response content with tokens
const CONFIG = {
  prompt: "Tell me a story about a rabbit running through the forest.",
  response: "On a moonless night, a fox darted through the forest, heart pounding.",
  promptToken: "rabbit",
  responseToken: "fox"
}

function App() {
  // State for token configuration
  const [promptToken, setPromptToken] = useState(CONFIG.promptToken)
  const [responseToken, setResponseToken] = useState(CONFIG.responseToken)
  const [promptText] = useState(CONFIG.prompt)
  const [responseText] = useState(CONFIG.response)

  // Animation state
  const [isAnimating, setIsAnimating] = useState(false)
  const [animationPhase, setAnimationPhase] = useState('idle') // idle, highlight, move, reveal
  const [ghostStyle, setGhostStyle] = useState({})
  const [ghostText, setGhostText] = useState('')

  // Refs for DOM elements
  const promptTokenRef = useRef(null)
  const responseTokenRef = useRef(null)
  const ghostRef = useRef(null)

  // Function to wrap token in text with a span for highlighting
  const wrapTokenInText = useCallback((text, token, ref, isHighlighted) => {
    if (!token || !text.includes(token)) {
      return text
    }

    const parts = text.split(new RegExp(`(${token})`, 'g'))
    return parts.map((part, index) => {
      if (part === token) {
        return (
          <span
            key={index}
            ref={ref}
            className={`token ${isHighlighted ? 'token-highlighted' : ''}`}
          >
            {part}
          </span>
        )
      }
      return part
    })
  }, [])

  // Main animation function
  const runAnimation = useCallback(() => {
    if (isAnimating) return

    setIsAnimating(true)
    setAnimationPhase('highlight')

    // Phase 1: Highlight the prompt token
    setTimeout(() => {
      if (!promptTokenRef.current || !responseTokenRef.current) {
        setIsAnimating(false)
        setAnimationPhase('idle')
        return
      }

      // Get positions
      const promptRect = promptTokenRef.current.getBoundingClientRect()
      const responseRect = responseTokenRef.current.getBoundingClientRect()

      // Set initial ghost position (at prompt token)
      setGhostText(promptToken)
      setGhostStyle({
        position: 'fixed',
        left: promptRect.left,
        top: promptRect.top,
        fontSize: window.getComputedStyle(promptTokenRef.current).fontSize,
        fontWeight: '600',
        color: '#10a37f',
        opacity: 1,
        transform: 'scale(1)',
        transition: 'none',
        pointerEvents: 'none',
        zIndex: 1000,
        backgroundColor: 'rgba(16, 163, 127, 0.15)',
        padding: '2px 4px',
        borderRadius: '4px',
      })

      setAnimationPhase('move')

      // Phase 2: Move to response position with fade
      setTimeout(() => {
        const deltaX = responseRect.left - promptRect.left
        const deltaY = responseRect.top - promptRect.top

        setGhostStyle(prev => ({
          ...prev,
          transform: `translate(${deltaX}px, ${deltaY}px) scale(1)`,
          opacity: 0,
          color: 'transparent',
          transition: 'transform 1.2s cubic-bezier(0.4, 0, 0.2, 1), opacity 1.2s ease-in-out, color 1.2s ease-in-out',
        }))

        // Phase 3: Transform to response token
        setTimeout(() => {
          setAnimationPhase('reveal')
          setGhostText(responseToken)
          setGhostStyle(prev => ({
            ...prev,
            opacity: 1,
            color: '#10a37f',
            transform: `translate(${deltaX}px, ${deltaY}px) scale(1.1)`,
            transition: 'opacity 0.4s ease-out, color 0.4s ease-out, transform 0.4s ease-out',
          }))

          // Phase 4: Scale back and finish
          setTimeout(() => {
            setGhostStyle(prev => ({
              ...prev,
              transform: `translate(${deltaX}px, ${deltaY}px) scale(1)`,
              transition: 'transform 0.3s ease-out',
            }))

            // Clean up
            setTimeout(() => {
              setIsAnimating(false)
              setAnimationPhase('idle')
              setGhostStyle({})
              setGhostText('')
            }, 500)
          }, 400)
        }, 1200)
      }, 100)
    }, 500)
  }, [isAnimating, promptToken, responseToken])

  // Determine which tokens should be highlighted based on animation phase
  const isPromptHighlighted = animationPhase === 'highlight' || animationPhase === 'move'
  const isResponseHighlighted = animationPhase === 'reveal'

  return (
    <div className="app">
      <header className="header">
        <h1>LLM Token Animator</h1>
        <p className="subtitle">Visualize token transformations between prompts and responses</p>
      </header>

      <div className="controls">
        <div className="control-group">
          <label htmlFor="promptToken">Prompt Token:</label>
          <input
            id="promptToken"
            type="text"
            value={promptToken}
            onChange={(e) => setPromptToken(e.target.value)}
            disabled={isAnimating}
          />
        </div>
        <div className="control-group">
          <label htmlFor="responseToken">Response Token:</label>
          <input
            id="responseToken"
            type="text"
            value={responseToken}
            onChange={(e) => setResponseToken(e.target.value)}
            disabled={isAnimating}
          />
        </div>
        <button
          className="animate-btn"
          onClick={runAnimation}
          disabled={isAnimating}
        >
          {isAnimating ? 'Animating...' : 'Run Animation'}
        </button>
      </div>

      <div className="chat-container">
        {/* User Message (Prompt) */}
        <div className="message user-message">
          <div className="avatar user-avatar">U</div>
          <div className="message-content">
            <div className="message-text">
              {wrapTokenInText(promptText, promptToken, promptTokenRef, isPromptHighlighted)}
            </div>
          </div>
        </div>

        {/* Assistant Message (Response) */}
        <div className="message assistant-message">
          <div className="avatar assistant-avatar">A</div>
          <div className="message-content">
            <div className="message-text">
              {wrapTokenInText(responseText, responseToken, responseTokenRef, isResponseHighlighted)}
            </div>
          </div>
        </div>
      </div>

      {/* Ghost element for animation */}
      {ghostText && (
        <div
          ref={ghostRef}
          className="ghost-token"
          style={ghostStyle}
        >
          {ghostText}
        </div>
      )}

      <footer className="footer">
        <p>Click "Run Animation" to see the token transformation effect</p>
      </footer>
    </div>
  )
}

export default App
