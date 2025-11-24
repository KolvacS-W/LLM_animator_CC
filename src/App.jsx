import { useState, useRef, useCallback, useEffect } from "react";
import "./App.css";

// Configuration: Define prompt and response content with tokens
const CONFIG = {
  prompt:
    "give me 5 bullet points of what should and shouldn't say on a first date",
  response: `Sure! Here are 5 quick dos and don'ts for what to say on a first date:

✅ What You Should Say:

· Ask open-ended questions – "What's something you're passionate about lately?"

· Share light personal stories – enough to be real, but not overly intense.

· Give genuine compliments – "I like how you think about that."

· Show curiosity – "I've never tried that! How did you get into it?"

· Express enjoyment – "I'm really glad we met up."

❌ What You Shouldn't Say:

Avoid ex talk – Don't dive into your past relationships.

Don't overshare heavy topics – Illness, trauma, financial woes.

No interview mode – Don't rapid-fire questions like a job interview.

Don't brag or self-promote too much – Confidence ≠ arrogance.

Avoid controversial topics too early – Politics, religion, etc. unless mutually welcomed.

Want a cheat-sheet version to keep in your notes?`,
  promptToken: "what should",
  responseToken: `· Ask open-ended questions – "What's something you're passionate about lately?"

· Share light personal stories – enough to be real, but not overly intense.

· Give genuine compliments – "I like how you think about that."

· Show curiosity – "I've never tried that! How did you get into it?"

· Express enjoyment – "I'm really glad we met up."`,
  // Sketch content options:
  // - Text: "🤔 Processing..."
  // - Remote image: "image:https://example.com/image.png"
  // - Local image (put in /public folder): "/sketch.png"
  // - Uploaded image: handled via upload button
  sketchContent: "🤔 Processing...",
};

function App() {
  // State for token configuration
  const [promptToken, setPromptToken] = useState(CONFIG.promptToken);
  const [responseToken, setResponseToken] = useState(CONFIG.responseToken);
  const [promptText] = useState(CONFIG.prompt);
  const [responseText] = useState(CONFIG.response);
  const [sketchContent, setSketchContent] = useState(CONFIG.sketchContent);

  // Animation state
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationPhase, setAnimationPhase] = useState("idle"); // idle, highlight, sketch, move, reveal, expand
  const [ghostStyle, setGhostStyle] = useState({});
  const [ghostContent, setGhostContent] = useState(null); // Can be string or React element

  // Refs for DOM elements
  const promptTokenRef = useRef(null);
  const responseTokenRef = useRef(null);
  const ghostRef = useRef(null);
  const responseContainerRef = useRef(null);
  const fileInputRef = useRef(null);

  // Handle image upload
  const handleImageUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSketchContent(event.target.result); // Set as data URL
      };
      reader.readAsDataURL(file);
    }
  }, []);

  // Handle scroll and resize to keep ghost in sync with page
  useEffect(() => {
    if (!isAnimating || !ghostContent) return;

    const updateGhostPosition = () => {
      if (animationPhase === "highlight") {
        // During highlight, ghost follows prompt token position
        if (promptTokenRef.current && responseContainerRef.current) {
          const promptRect = promptTokenRef.current.getBoundingClientRect();
          const containerRect =
            responseContainerRef.current.getBoundingClientRect();
          const availableWidth = containerRect.right - promptRect.left;

          setGhostStyle((prev) => ({
            ...prev,
            left: promptRect.left,
            top: promptRect.top,
            maxWidth: availableWidth,
          }));
        }
      } else if (animationPhase === "move") {
        // During move, only update left/top to follow prompt position
        // DON'T update transform - it's being animated by CSS
        if (promptTokenRef.current) {
          const promptRect = promptTokenRef.current.getBoundingClientRect();
          setGhostStyle((prev) => ({
            ...prev,
            left: promptRect.left,
            top: promptRect.top,
          }));
        }
      } else if (animationPhase === "sketch") {
        // During sketch, ghost is at response position (has transform from move)
        // Update left/top to follow prompt position
        if (promptTokenRef.current) {
          const promptRect = promptTokenRef.current.getBoundingClientRect();
          setGhostStyle((prev) => ({
            ...prev,
            left: promptRect.left,
            top: promptRect.top,
          }));
        }
      } else if (animationPhase === "expand") {
        // During expand, ghost is positioned directly at container (no transform)
        // Safe to update all position properties
        if (responseContainerRef.current) {
          const containerRect =
            responseContainerRef.current.getBoundingClientRect();
          setGhostStyle((prev) => ({
            ...prev,
            left: containerRect.left,
            top: containerRect.top,
            width: containerRect.width,
            maxWidth: containerRect.width,
          }));
        }
      }
    };

    window.addEventListener("scroll", updateGhostPosition, true);
    window.addEventListener("resize", updateGhostPosition);

    return () => {
      window.removeEventListener("scroll", updateGhostPosition, true);
      window.removeEventListener("resize", updateGhostPosition);
    };
  }, [isAnimating, animationPhase, ghostContent]);

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

      // Helper to render sketch content (text or image)
      const renderSketchContent = (className) => {
        // Support: "image:url", data URLs, or local paths starting with "/" or "./"
        const isImage =
          sketchContent.startsWith("image:") ||
          sketchContent.startsWith("data:image") ||
          sketchContent.startsWith("/") ||
          sketchContent.startsWith("./");

        if (isImage) {
          const imageUrl = sketchContent.startsWith("image:")
            ? sketchContent.slice(6)
            : sketchContent;
          return (
            <img
              src={imageUrl}
              alt="sketch"
              className={`sketch-image ${className}`}
            />
          );
        }
        return (
          <span className={`sketch-text ${className}`}>{sketchContent}</span>
        );
      };

      // Phase 2: Move to response position
      setAnimationPhase("move");

      setTimeout(() => {
        // Recalculate positions
        const currentPromptRect =
          promptTokenRef.current.getBoundingClientRect();
        const currentResponseRect =
          responseTokenRef.current.getBoundingClientRect();
        const currentContainerRect =
          responseContainerRef.current.getBoundingClientRect();
        const deltaX = currentResponseRect.left - currentPromptRect.left;
        const deltaY = currentResponseRect.top - currentPromptRect.top;
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

        // Phase 3: Sketch phase - at response position
        setTimeout(() => {
          setAnimationPhase("sketch");

          // Get positions for expand phase
          const expandContainerRect =
            responseContainerRef.current.getBoundingClientRect();
          const tokenIndex = responseText.indexOf(responseToken);
          const beforeToken = responseText.slice(0, tokenIndex);
          const afterToken = responseText.slice(
            tokenIndex + responseToken.length
          );

          // Show promptToken at response position (visible)
          setGhostContent(
            <span className="sketch-token sketch-token-normal">
              {promptToken}
            </span>
          );
          setGhostStyle((prev) => ({
            ...prev,
            color: "#10a37f",
            backgroundColor: "rgba(16, 163, 127, 0.15)",
            transition: "none",
          }));

          // Step 1: Shrink promptToken
          setTimeout(() => {
            setGhostContent(
              <span className="sketch-token sketch-token-shrunk">
                {promptToken}
              </span>
            );
          }, 100);

          // Step 2: Show sketch content growing
          setTimeout(() => {
            setGhostContent(renderSketchContent("sketch-content-growing"));
            setGhostStyle((prev) => ({
              ...prev,
              backgroundColor: "transparent",
            }));
          }, 600);

          // Step 3: Sketch content fully grown
          setTimeout(() => {
            setGhostContent(renderSketchContent("sketch-content-normal"));
          }, 650);

          // Step 4: Shrink sketch content
          setTimeout(() => {
            setGhostContent(renderSketchContent("sketch-content-shrunk"));
          }, 1600);

          // Phase 4: Expand - sketch shrinks into responseToken
          setTimeout(() => {
            setAnimationPhase("expand");

            // Show full text: beforeToken (invisible) + responseToken (growing) + afterToken (invisible)
            setGhostContent(
              <>
                <span className="expand-text-invisible">{beforeToken}</span>
                <span className="expand-token-growing">{responseToken}</span>
                <span className="expand-text-invisible">{afterToken}</span>
              </>
            );

            // Position at container
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

            // Trigger responseToken grow animation
            setTimeout(() => {
              setGhostContent(
                <>
                  <span className="expand-text-invisible">{beforeToken}</span>
                  <span className="expand-token-grown">{responseToken}</span>
                  <span className="expand-text-invisible">{afterToken}</span>
                </>
              );
            }, 50);

            // Reveal surrounding text smoothly
            setTimeout(() => {
              setGhostContent(
                <>
                  <span className="expand-text-revealing">{beforeToken}</span>
                  <span className="expand-token-grown">{responseToken}</span>
                  <span className="expand-text-revealing">{afterToken}</span>
                </>
              );
            }, 900);
          }, 2100);

          // Clean up after animation completes
          setTimeout(() => {
            setIsAnimating(false);
            setAnimationPhase("idle");
            setGhostStyle({});
            setGhostContent(null);
          }, 5000);
        }, 1200); // Wait for move animation to complete
      }, 100);
    }, 500);
  }, [isAnimating, promptToken, responseToken, responseText, sketchContent]);

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
        <div className="control-group sketch-control">
          <label htmlFor="sketchContent">Sketch Content:</label>
          <div className="sketch-input-row">
            <input
              id="sketchContent"
              type="text"
              value={
                sketchContent.startsWith("data:image")
                  ? "(uploaded image)"
                  : sketchContent
              }
              onChange={(e) => setSketchContent(e.target.value)}
              disabled={isAnimating || sketchContent.startsWith("data:image")}
              placeholder="Text, /local.png, or image:URL"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={isAnimating}
              style={{ display: "none" }}
            />
            <button
              type="button"
              className="upload-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={isAnimating}
              title="Upload image"
            >
              Upload
            </button>
            {(sketchContent.startsWith("data:image") ||
              sketchContent.startsWith("/") ||
              sketchContent.startsWith("./")) && (
              <button
                type="button"
                className="clear-btn"
                onClick={() => setSketchContent(CONFIG.sketchContent)}
                disabled={isAnimating}
                title="Clear image"
              >
                Clear
              </button>
            )}
          </div>
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
        <div ref={ghostRef} className="ghost-token" style={ghostStyle}>
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
