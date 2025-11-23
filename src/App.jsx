import { useState, useRef, useCallback } from "react";
import "./App.css";

// Configuration: Define prompt and response content with tokens
const CONFIG = {
  prompt:
    "what are the good things to ask to get to know a girl when you go on a second date?",
  response: `A second date is usually when you move from first-impression chemistry to genuine connection — so your questions should feel curious, personal, and emotionally open, but not like an interrogation. Here are some great directions and examples:`,
  promptToken: "good things to ask",
  responseToken: "genuine connection — so your questions should feel",
};

function App() {
  // State for token configuration
  const [promptToken, setPromptToken] = useState(CONFIG.promptToken);
  const [responseToken, setResponseToken] = useState(CONFIG.responseToken);
  const [promptText] = useState(CONFIG.prompt);
  const [responseText] = useState(CONFIG.response);

  // Animation state
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationPhase, setAnimationPhase] = useState("idle"); // idle, highlight, move, reveal, expand
  const [ghostStyle, setGhostStyle] = useState({});
  const [ghostContent, setGhostContent] = useState(null); // Can be string or React element
  const [surroundingTextVisible, setSurroundingTextVisible] = useState(false);

  // Refs for DOM elements
  const promptTokenRef = useRef(null);
  const responseTokenRef = useRef(null);
  const ghostRef = useRef(null);
  const responseContainerRef = useRef(null);

  // Function to wrap ONLY the first occurrence of token in text with a span for highlighting
  const wrapTokenInText = useCallback((text, token, ref, isHighlighted) => {
    if (!token || !text.includes(token)) {
      return text;
    }

    const firstIndex = text.indexOf(token);
    if (firstIndex === -1) {
      return text;
    }

    const before = text.slice(0, firstIndex);
    const match = text.slice(firstIndex, firstIndex + token.length);
    const after = text.slice(firstIndex + token.length);

    return (
      <>
        {before}
        <span
          ref={ref}
          className={`token ${isHighlighted ? "token-highlighted" : ""}`}
        >
          {match}
        </span>
        {after}
      </>
    );
  }, []);

  // Main animation function
  const runAnimation = useCallback(() => {
    if (isAnimating) return;

    setIsAnimating(true);
    setAnimationPhase("highlight");

    // Phase 1: Highlight the prompt token
    setTimeout(() => {
      if (
        !promptTokenRef.current ||
        !responseTokenRef.current ||
        !responseContainerRef.current
      ) {
        setIsAnimating(false);
        setAnimationPhase("idle");
        return;
      }

      // Get initial positions
      const promptRect = promptTokenRef.current.getBoundingClientRect();
      // Calculate available width from token position to container edge (for text wrapping)
      const containerRect =
        responseContainerRef.current.getBoundingClientRect();
      const availableWidth = containerRect.right - promptRect.left;

      // Set initial ghost position (at prompt token)
      setGhostContent(promptToken);
      setGhostStyle({
        position: "fixed",
        left: promptRect.left,
        top: promptRect.top,
        maxWidth: availableWidth,
        fontSize: window.getComputedStyle(promptTokenRef.current).fontSize,
        fontWeight: "600",
        color: "#10a37f",
        opacity: 1,
        transform: "scale(1)",
        transition: "none",
        pointerEvents: "none",
        zIndex: 1000,
        backgroundColor: "rgba(16, 163, 127, 0.15)",
        padding: "2px 4px",
        borderRadius: "4px",
      });

      setAnimationPhase("move");

      // Phase 2: Move to response position with fade
      setTimeout(() => {
        // Recalculate positions fresh to account for any text reflow/wrapping
        const currentPromptRect =
          promptTokenRef.current.getBoundingClientRect();
        const currentResponseRect =
          responseTokenRef.current.getBoundingClientRect();
        const currentContainerRect =
          responseContainerRef.current.getBoundingClientRect();
        const deltaX = currentResponseRect.left - currentPromptRect.left;
        const deltaY = currentResponseRect.top - currentPromptRect.top;
        // Calculate the maxWidth for response area (from response token position to container edge)
        const responseMaxWidth =
          currentContainerRect.right - currentResponseRect.left;

        setGhostStyle((prev) => ({
          ...prev,
          transform: `translate(${deltaX}px, ${deltaY}px) scale(1)`,
          maxWidth: responseMaxWidth,
          opacity: 1,
          color: "transparent",
          transition:
            "transform 1.2s cubic-bezier(0.4, 0, 0.2, 1), opacity 1.2s ease-in-out, color 1.2s ease-in-out, max-width 1.2s cubic-bezier(0.4, 0, 0.2, 1)",
        }));

        // Phase 3: Transform to response token (morph in place, no repositioning)
        setTimeout(() => {
          setAnimationPhase("reveal");
          setGhostContent(responseToken);
          // Keep the same translated position, just fade in the new text
          // maxWidth is already set correctly from Phase 2
          setGhostStyle((prev) => ({
            ...prev,
            color: "#10a37f",
            opacity: 1,
            transition: "opacity 0.4s ease-out, color 0.4s ease-out",
          }));

          // Phase 4: Hold briefly, then fade out before expansion
          setTimeout(() => {
            // Step 1: Fade out the current ghost (responseToken only)
            setGhostStyle((prev) => ({
              ...prev,
              opacity: 0,
              transition: "opacity 0.3s ease-out",
            }));

            // Step 2: After fade out completes, switch to full text content
            setTimeout(() => {
              setAnimationPhase("expand");
              setSurroundingTextVisible(false);

              // Get positions for the transition
              const expandContainerRect =
                responseContainerRef.current.getBoundingClientRect();

              // Create the full response with token highlighted and rest hidden
              const tokenIndex = responseText.indexOf(responseToken);
              const beforeToken = responseText.slice(0, tokenIndex);
              const afterToken = responseText.slice(
                tokenIndex + responseToken.length
              );

              // Update content to full text
              setGhostContent(
                <>
                  <span className="ghost-surrounding">{beforeToken}</span>
                  <span className="ghost-token-highlight">{responseToken}</span>
                  <span className="ghost-surrounding">{afterToken}</span>
                </>
              );

              // Position ghost at the container location, initially invisible
              setGhostStyle({
                position: "fixed",
                left: expandContainerRect.left,
                top: expandContainerRect.top,
                width: expandContainerRect.width,
                maxWidth: expandContainerRect.width,
                fontSize: window.getComputedStyle(responseTokenRef.current)
                  .fontSize,
                fontWeight: "normal",
                color: "#ececf1",
                opacity: 0,
                transform: "none",
                transition: "none",
                pointerEvents: "none",
                zIndex: 1000,
                backgroundColor: "transparent",
                padding: "0",
                borderRadius: "0",
                lineHeight: "1.7",
              });

              // Step 3: Fade in the new content
              setTimeout(() => {
                setGhostStyle((prev) => ({
                  ...prev,
                  opacity: 1,
                  transition: "opacity 0.4s ease-out",
                }));

                // Step 4: Start revealing surrounding text after fade in starts
                setTimeout(() => {
                  setSurroundingTextVisible(true);
                }, 200);
              }, 50);

              // Phase 6: Clean up after reveal completes
              setTimeout(() => {
                setIsAnimating(false);
                setAnimationPhase("idle");
                setGhostStyle({});
                setGhostContent(null);
                setSurroundingTextVisible(false);
              }, 2500);
            }, 350); // Wait for fade out to complete
          }, 800);
        }, 1200);
      }, 100);
    }, 500);
  }, [isAnimating, promptToken, responseToken, responseText]);

  // Determine which tokens should be highlighted based on animation phase
  const isPromptHighlighted =
    animationPhase === "highlight" || animationPhase === "move";
  // const isResponseHighlighted = animationPhase === "reveal";
  const isResponseHighlighted = false;

  return (
    <div className="app">
      <header className="header">
        <h1>LLM Token Animator</h1>
        <p className="subtitle">
          Visualize token transformations between prompts and responses
        </p>
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
          {isAnimating ? "Animating..." : "Run Animation"}
        </button>
      </div>

      <div className="chat-container">
        {/* User Message (Prompt) */}
        <div className="message user-message">
          <div className="avatar user-avatar">U</div>
          <div className="message-content">
            <div className="message-text">
              {wrapTokenInText(
                promptText,
                promptToken,
                promptTokenRef,
                isPromptHighlighted
              )}
            </div>
          </div>
        </div>

        {/* Assistant Message (Response) */}
        <div className="message assistant-message">
          <div className="avatar assistant-avatar">A</div>
          <div className="message-content">
            <div
              className={`message-text ${isAnimating ? "response-hidden" : ""}`}
              ref={responseContainerRef}
            >
              {wrapTokenInText(
                responseText,
                responseToken,
                responseTokenRef,
                isResponseHighlighted
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Ghost element for animation */}
      {ghostContent && (
        <div
          ref={ghostRef}
          className={`ghost-token ${
            surroundingTextVisible ? "surrounding-visible" : ""
          }`}
          style={ghostStyle}
        >
          {ghostContent}
        </div>
      )}

      <footer className="footer">
        <p>Click "Run Animation" to see the token transformation effect</p>
      </footer>
    </div>
  );
}

export default App;
