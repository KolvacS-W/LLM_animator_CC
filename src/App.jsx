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

    // Prepare the full text structure
    const tokenIndex = responseText.indexOf(responseToken);
    const beforeToken = responseText.slice(0, tokenIndex);
    const afterToken = responseText.slice(tokenIndex + responseToken.length);

    // Phase 1: Show ghost with full structure (surrounding text at font-size 0)
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

      // Get positions
      const promptRect = promptTokenRef.current.getBoundingClientRect();
      const containerRect =
        responseContainerRef.current.getBoundingClientRect();

      // Create ghost with full structure - surrounding text starts at font-size 0
      setGhostContent(
        <>
          <span className="ghost-surrounding ghost-surrounding-collapsed">
            {beforeToken}
          </span>
          <span className="ghost-main-token">{promptToken}</span>
          <span className="ghost-surrounding ghost-surrounding-collapsed">
            {afterToken}
          </span>
        </>
      );

      setGhostStyle({
        position: "fixed",
        left: promptRect.left,
        top: promptRect.top,
        width: containerRect.width,
        maxWidth: containerRect.width,
        fontSize: window.getComputedStyle(promptTokenRef.current).fontSize,
        fontWeight: "normal",
        color: "#ececf1",
        opacity: 1,
        transform: "none",
        transition: "none",
        pointerEvents: "none",
        zIndex: 1000,
        backgroundColor: "transparent",
        padding: "0",
        borderRadius: "0",
        lineHeight: "1.7",
      });

      setAnimationPhase("move");

      // Phase 2: Move to response container position + expand surrounding text
      setTimeout(() => {
        const expandContainerRect =
          responseContainerRef.current.getBoundingClientRect();

        // Update ghost to expand surrounding text and move to container position
        setGhostContent(
          <>
            <span className="ghost-surrounding ghost-surrounding-expanded">
              {beforeToken}
            </span>
            <span className="ghost-main-token ghost-main-token-fading">
              {promptToken}
            </span>
            <span className="ghost-surrounding ghost-surrounding-expanded">
              {afterToken}
            </span>
          </>
        );

        setGhostStyle((prev) => ({
          ...prev,
          left: expandContainerRect.left,
          top: expandContainerRect.top,
          transition:
            "left 1.2s cubic-bezier(0.4, 0, 0.2, 1), top 1.2s cubic-bezier(0.4, 0, 0.2, 1)",
        }));

        // Phase 3: Morph promptToken to responseToken
        setTimeout(() => {
          setAnimationPhase("reveal");

          // Replace promptToken with responseToken (now visible)
          setGhostContent(
            <>
              <span className="ghost-surrounding ghost-surrounding-expanded">
                {beforeToken}
              </span>
              <span className="ghost-main-token ghost-main-token-visible">
                {responseToken}
              </span>
              <span className="ghost-surrounding ghost-surrounding-expanded">
                {afterToken}
              </span>
            </>
          );

          // Phase 4: Hold, then reveal surrounding text
          setTimeout(() => {
            setAnimationPhase("expand");

            // Reveal surrounding text
            setGhostContent(
              <>
                <span className="ghost-surrounding ghost-surrounding-visible">
                  {beforeToken}
                </span>
                <span className="ghost-main-token ghost-main-token-visible">
                  {responseToken}
                </span>
                <span className="ghost-surrounding ghost-surrounding-visible">
                  {afterToken}
                </span>
              </>
            );

            // Phase 5: Clean up after reveal completes
            setTimeout(() => {
              setIsAnimating(false);
              setAnimationPhase("idle");
              setGhostStyle({});
              setGhostContent(null);
              setSurroundingTextVisible(false);
            }, 2000);
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
