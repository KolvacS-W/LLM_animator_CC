import { useState, useRef, useCallback, useEffect } from "react";
import "./App.css";

// Configuration: Define prompt and response content with tokens
// const CONFIG = {
//   prompt:
//     "give me 5 bullet points of what should and shouldn't say on a first date",
//   response: `Sure! Here are 5 quick dos and don'ts for what to say on a first date:

// ✅ What You Should Say:

// · Ask open-ended questions – "What's something you're passionate about lately?"

// · Share light personal stories – enough to be real, but not overly intense.

// · Give genuine compliments – "I like how you think about that."

// · Show curiosity – "I've never tried that! How did you get into it?"

// · Express enjoyment – "I'm really glad we met up."

// ❌ What You Shouldn't Say:

// Avoid ex talk – Don't dive into your past relationships.

// Don't overshare heavy topics – Illness, trauma, financial woes.

// No interview mode – Don't rapid-fire questions like a job interview.

// Don't brag or self-promote too much – Confidence ≠ arrogance.

// Avoid controversial topics too early – Politics, religion, etc. unless mutually welcomed.

// Want a cheat-sheet version to keep in your notes?`,
//   promptToken: "what should",
//   responseToken: `· Ask open-ended questions – "What's something you're passionate about lately?"

// · Share light personal stories – enough to be real, but not overly intense.

// · Give genuine compliments – "I like how you think about that."

// · Show curiosity – "I've never tried that! How did you get into it?"

// · Express enjoyment – "I'm really glad we met up."`,
//   // Sketch content options:
//   // - Text: "🤔 Processing..."
//   // - Remote image: "image:https://example.com/image.png"
//   // - Local image (put in /public folder): "/sketch.png"
//   // - Uploaded image: handled via upload button
//   sketchContent: `🤔 a good date should encourage:
//   🙋
//   👏
//   📖
//   🧐
//   ♥️`,
//   sketchSize: 1.5,
// };

const CONFIG = {
  prompt:
    "Do small proofread for this text to make it more professional: I'm sorry and understand that the current policy is not optimistic for funding, especially in certain domains. You mentioned external fellowships, does the school have requirements on the source and form of external funding? If not I think I will be able to fund myself for one year or two.",
  //   response: `Here's a more professionally worded version:
  // I apologize and acknowledge that the current funding landscape appears challenging, particularly in specific research domains. Regarding external fellowships, could you clarify if the school imposes any restrictions on the source or format of external funding? If no such limitations exist, I am prepared to self-fund my research for one to two years.`,
  response: `Here's a more professionally worded version: 
  
  
  I'm so sorry I understand that the current situation is not optimistic for fundings, especially in certain domains. You mentioned external fellowships, does the school have requirements on the source and form of external funding? If not I will be able to fund myself for one year or two, thanks. Hope you like the result!`,

  promptToken:
    "I'm sorry and understand that the current policy is not optimistic for funding, especially in certain domains. You mentioned external fellowships, does the school have requirements on the source and form of external funding? If not I think I will be able to fund myself for one year or two.",
  responseToken: `I'm so sorry I understand that the current situation is not optimistic for fundings, especially in certain domains. You mentioned external fellowships, does the school have requirements on the source and form of external funding? If not I will be able to fund myself for one year or two, thanks`,

  sketchContent: `🤔 thinking......`,
  sketchSize: 1.5,
};
function App() {
  // State for token configuration
  const [promptToken, setPromptToken] = useState(CONFIG.promptToken);
  const [responseToken, setResponseToken] = useState(CONFIG.responseToken);
  const [promptText] = useState(CONFIG.prompt);
  const [responseText] = useState(CONFIG.response);
  const [sketchContent, setSketchContent] = useState(CONFIG.sketchContent);
  const [sketchSize, setSketchSize] = useState(CONFIG.sketchSize);
  const [animationMode, setAnimationMode] = useState("diff");

  // Animation state
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationPhase, setAnimationPhase] = useState("idle"); // idle, highlight, sketch, move, reveal, expand
  const [ghostStyle, setGhostStyle] = useState({});
  const [ghostContent, setGhostContent] = useState(null); // Can be string or React element
  const [sketchAnimClass, setSketchAnimClass] = useState(""); // Controls sketch grow/shrink animation
  const [ghostBeforeWidth, setGhostBeforeWidth] = useState(0);
  const [ghostAfterWidth, setGhostAfterWidth] = useState(0);

  const GHOST_COLOR = "#c5c6d0";
  const GHOST_BG = "rgba(142, 142, 160, 0.2)";

  // Refs for DOM elements
  const promptTokenRef = useRef(null);
  const promptContainerRef = useRef(null);
  const responseTokenRef = useRef(null);
  const ghostRef = useRef(null);
  const responseContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const measureCanvasRef = useRef(null);

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
      const promptRect = promptContainerRef.current
        ? promptContainerRef.current.getBoundingClientRect()
        : null;
      const responseRect = responseContainerRef.current
        ? responseContainerRef.current.getBoundingClientRect()
        : null;

      if (animationPhase === "highlight") {
        // During highlight, ghost follows prompt container position
        if (promptRect) {
          setGhostStyle((prev) => ({
            ...prev,
            left: promptRect.left,
            top: promptRect.top,
            width: promptRect.width,
            maxWidth: promptRect.width,
          }));
        }
      } else if (animationPhase === "move") {
        // During move, keep ghost anchored to prompt but translate toward response using token positions
        if (
          promptRect &&
          responseRect &&
          promptTokenRef.current &&
          responseTokenRef.current
        ) {
          const promptTokenRect =
            promptTokenRef.current.getBoundingClientRect();
          const responseTokenRect =
            responseTokenRef.current.getBoundingClientRect();
          const deltaX = responseTokenRect.left - promptTokenRect.left;
          const deltaY = responseTokenRect.top - promptTokenRect.top;
          setGhostStyle((prev) => ({
            ...prev,
            left: promptRect.left,
            top: promptRect.top,
            width: promptRect.width,
            maxWidth: promptRect.width,
            transform: `translate(${deltaX}px, ${deltaY}px) scale(1)`,
          }));
        }
      } else if (animationMode === "diff" && responseRect) {
        // For diff mode after move completes, lock ghost to response container
        setGhostStyle((prev) => ({
          ...prev,
          left: responseRect.left,
          top: responseRect.top,
          width: responseRect.width,
          maxWidth: responseRect.width,
          transform: "none",
        }));
      } else if (animationPhase === "sketch") {
        // Local sketch mode keeps following prompt
        if (promptRect) {
          setGhostStyle((prev) => ({
            ...prev,
            left: promptRect.left,
            top: promptRect.top,
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

  const getFontFromElement = useCallback((el) => {
    if (!el) return "16px sans-serif";
    const style = window.getComputedStyle(el);
    return `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  }, []);

  const measureTextWidth = useCallback((text, font) => {
    const normalized = typeof text === "string" ? text : "";
    const lines = normalized.split("\n");
    const lastLine = lines[lines.length - 1] || "";

    if (!measureCanvasRef.current) {
      measureCanvasRef.current = document.createElement("canvas");
    }
    const ctx = measureCanvasRef.current.getContext("2d");
    ctx.font = font || "16px sans-serif";
    return ctx.measureText(lastLine).width;
  }, []);

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

  const diffSegments = useCallback((fromToken, toToken) => {
    const debugLog = (label, data) => {
      if (
        (fromToken || "").includes("funding") ||
        (toToken || "").includes("funding")
      ) {
        // eslint-disable-next-line no-console
        console.log(`[diff-debug] ${label}`, data);
      }
    };

    const buildGroupedDiff = (a, b) => {
      const n = a.length;
      const m = b.length;
      const dp = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));

      for (let i = 1; i <= n; i += 1) {
        for (let j = 1; j <= m; j += 1) {
          if (a[i - 1] === b[j - 1]) {
            dp[i][j] = dp[i - 1][j - 1] + 1;
          } else {
            dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
          }
        }
      }

      const segments = [];
      let i = n;
      let j = m;
      while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
          segments.push({ type: "same", value: a[i - 1] });
          i -= 1;
          j -= 1;
        } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
          segments.push({ type: "add", value: b[j - 1] });
          j -= 1;
        } else {
          segments.push({ type: "del", value: a[i - 1] });
          i -= 1;
        }
      }

      segments.reverse();

      const grouped = [];
      for (const seg of segments) {
        const last = grouped[grouped.length - 1];
        if (last && last.type === seg.type) {
          last.value += seg.value;
        } else {
          grouped.push({ ...seg });
        }
      }
      return grouped;
    };

    const refineSubstitution = (segments) => {
      const refined = [];
      let idx = 0;
      while (idx < segments.length) {
        const current = segments[idx];
        const next = segments[idx + 1];

        if (current?.type === "del" && next?.type === "add") {
          const delVal = current.value;
          const addVal = next.value;
          const prefixLen = (() => {
            const max = Math.min(delVal.length, addVal.length);
            let l = 0;
            while (l < max && delVal.charAt(l) === addVal.charAt(l)) l += 1;
            return l;
          })();
          const suffixLen = (() => {
            const max = Math.min(
              delVal.length - prefixLen,
              addVal.length - prefixLen
            );
            let l = 0;
            while (
              l < max &&
              delVal.charAt(delVal.length - 1 - l) ===
                addVal.charAt(addVal.length - 1 - l)
            ) {
              l += 1;
            }
            return l;
          })();

          const commonPre = delVal.slice(0, prefixLen);
          const commonSuf = suffixLen
            ? delVal.slice(delVal.length - suffixLen)
            : "";
          const delMid = delVal.slice(prefixLen, delVal.length - suffixLen);
          const addMid = addVal.slice(prefixLen, addVal.length - suffixLen);

          // Only apply refinement if we found shared prefix/suffix (i.e., change is local)
          if (commonPre || commonSuf) {
            if (commonPre) refined.push({ type: "same", value: commonPre });
            if (delMid) refined.push({ type: "del", value: delMid });
            if (addMid) refined.push({ type: "add", value: addMid });
            if (commonSuf) refined.push({ type: "same", value: commonSuf });
            idx += 2;
            continue;
          }
        }

        refined.push(current);
        idx += 1;
      }

      // Merge adjacent same-type entries after refinement
      const merged = [];
      for (const seg of refined) {
        const last = merged[merged.length - 1];
        if (last && last.type === seg.type) {
          last.value += seg.value;
        } else {
          merged.push({ ...seg });
        }
      }
      return merged;
    };

    // If both strings are a single word (optionally wrapped with matching punctuation/spacing), diff at character level
    const wordMatch = (str = "") => str.match(/^(\W*)(\w+)(\W*)$/);
    const fromMatch = wordMatch(fromToken || "");
    const toMatch = wordMatch(toToken || "");
    const canCharDiff =
      fromMatch &&
      toMatch &&
      fromMatch[1] === toMatch[1] &&
      fromMatch[3] === toMatch[3];

    if (canCharDiff) {
      const prefix = fromMatch[1];
      const suffix = fromMatch[3];
      const aCore = fromMatch[2] || "";
      const bCore = toMatch[2] || "";

      // Prefix/suffix diff so we don't break interior characters
      let preLen = 0;
      const maxPre = Math.min(aCore.length, bCore.length);
      while (preLen < maxPre && aCore.charAt(preLen) === bCore.charAt(preLen)) {
        preLen += 1;
      }

      let sufLen = 0;
      const maxSuf = Math.min(aCore.length - preLen, bCore.length - preLen);
      while (
        sufLen < maxSuf &&
        aCore.charAt(aCore.length - 1 - sufLen) ===
          bCore.charAt(bCore.length - 1 - sufLen)
      ) {
        sufLen += 1;
      }

      const aMid = aCore.slice(preLen, aCore.length - sufLen);
      const bMid = bCore.slice(preLen, bCore.length - sufLen);

      const result = [];
      if (prefix) result.push({ type: "same", value: prefix });
      if (preLen) result.push({ type: "same", value: aCore.slice(0, preLen) });
      if (aMid) result.push({ type: "del", value: aMid });
      if (bMid) result.push({ type: "add", value: bMid });
      if (sufLen)
        result.push({
          type: "same",
          value: aCore.slice(aCore.length - sufLen),
        });
      if (suffix) result.push({ type: "same", value: suffix });

      const refined = refineSubstitution(result);
      debugLog("char-diff", {
        from: fromToken,
        to: toToken,
        preLen,
        sufLen,
        aMid,
        bMid,
        result,
        refined,
      });
      return refined;
    }

    // Fallback: word-aware diff to avoid mid-word splits
    const tokenize = (str) => str.match(/\w+|\s+|[^\w\s]+/g) || [];
    const grouped = buildGroupedDiff(
      tokenize(fromToken || ""),
      tokenize(toToken || "")
    );
    const refined = refineSubstitution(grouped);
    debugLog("word-diff", { from: fromToken, to: toToken, grouped, refined });
    return refined;
  }, []);

  const runLocalAnimation = useCallback(() => {
    if (isAnimating) return;

    setIsAnimating(true);
    setAnimationPhase("highlight");

    // Phase 1: Highlight the prompt token
    setTimeout(() => {
      if (
        !promptTokenRef.current ||
        !promptContainerRef.current ||
        !responseTokenRef.current ||
        !responseContainerRef.current
      ) {
        setIsAnimating(false);
        setAnimationPhase("idle");
        return;
      }

      // Get initial positions
      const promptContainerRect =
        promptContainerRef.current?.getBoundingClientRect();
      const containerRect =
        responseContainerRef.current.getBoundingClientRect();
      const availableWidth = containerRect.right - containerRect.left;

      // Set initial ghost position (aligned with prompt text container) and show token only
      setGhostContent(promptToken);
      setGhostStyle({
        position: "fixed",
        left: promptContainerRect?.left ?? 0,
        top: promptContainerRect?.top ?? 0,
        width: promptContainerRect?.width,
        maxWidth: promptContainerRect?.width ?? availableWidth,
        fontSize: window.getComputedStyle(promptTokenRef.current).fontSize,
        fontWeight: "normal",
        color: GHOST_COLOR,
        opacity: 1,
        transform: "scale(1)",
        transition: "none",
        pointerEvents: "none",
        zIndex: 1000,
        backgroundColor: GHOST_BG,
        padding: "2px 4px",
        borderRadius: "4px",
      });

      // Mark that we're showing sketch content (actual rendering uses sketchAnimClass state)
      const showSketchContent = () => {
        setGhostContent("__SKETCH__"); // Special marker for sketch content
      };

      // Phase 2: Move to response position
      setAnimationPhase("move");

      setTimeout(() => {
        // Recalculate positions
        const currentPromptRect =
          promptContainerRef.current.getBoundingClientRect();
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
            color: GHOST_COLOR,
            backgroundColor: GHOST_BG,
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

          // Step 2: Show sketch content growing (starts at font-size 0)
          setTimeout(() => {
            setSketchAnimClass("sketch-content-growing");
            showSketchContent();
            setGhostStyle((prev) => ({
              ...prev,
              backgroundColor: "transparent",
            }));
          }, 600);

          // Step 3: Sketch content grows to full size
          setTimeout(() => {
            setSketchAnimClass("sketch-content-normal");
          }, 700); // 100ms gap to let browser render initial state

          // Step 4: Shrink sketch content before expand
          // Timing: 700ms (normal starts) + display duration = shrink time
          // Increase this value to show sketch longer (e.g., 2700 = 2 seconds display)
          setTimeout(() => {
            setSketchAnimClass("sketch-content-shrunk");
          }, 2700); // Display for ~2 seconds before shrinking

          // Phase 4: Expand - sketch shrinks into responseToken
          // Timing: shrink time + 500ms (transition duration)
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
          }, 3200); // Wait for shrink animation to complete (2700 + 500ms transition)

          // Clean up after animation completes with blur/fade-out
          setTimeout(() => {
            setGhostStyle((prev) => {
              const extraTransition =
                "opacity 0.6s ease, filter 0.6s ease, transform 0.6s ease";
              return {
                ...prev,
                opacity: 0,
                filter: "blur(6px)",
                transform: `${prev.transform || "none"} scale(0.985)`,
                transition: prev.transition
                  ? `${prev.transition}, ${extraTransition}`
                  : extraTransition,
              };
            });
            // Let response text fade in while ghost blurs/fades out
            setTimeout(() => {
              setIsAnimating(false);
            }, 250);
            setTimeout(() => {
              setAnimationPhase("idle");
              setGhostStyle({});
              setGhostContent(null);
              setSketchAnimClass("");
            }, 650);
          }, 6100); // Adjusted for new timing (3200 + ~2900ms for expand phase)
        }, 1200); // Wait for move animation to complete
      }, 100);
    }, 500);
  }, [
    isAnimating,
    promptToken,
    responseToken,
    responseText,
    sketchContent,
    sketchSize,
  ]);

  const runDiffAnimation = useCallback(() => {
    if (isAnimating) return;

    setIsAnimating(true);
    setAnimationPhase("highlight");

    setTimeout(() => {
      if (
        !promptTokenRef.current ||
        !promptContainerRef.current ||
        !responseTokenRef.current ||
        !responseContainerRef.current
      ) {
        setIsAnimating(false);
        setAnimationPhase("idle");
        return;
      }

      const promptContainerRect =
        promptContainerRef.current.getBoundingClientRect();
      const containerRect =
        responseContainerRef.current.getBoundingClientRect();
      const availableWidth = containerRect.right - containerRect.left;

      const promptTokenIndex = promptText.indexOf(promptToken);
      const promptBefore =
        promptTokenIndex >= 0 ? promptText.slice(0, promptTokenIndex) : "";
      const promptAfter =
        promptTokenIndex >= 0
          ? promptText.slice(promptTokenIndex + promptToken.length)
          : "";
      const promptFont = getFontFromElement(promptContainerRef.current);
      const promptBeforeWidth = measureTextWidth(promptBefore, promptFont);
      const promptAfterWidth = measureTextWidth(promptAfter, promptFont);
      setGhostBeforeWidth(promptBeforeWidth);
      setGhostAfterWidth(promptAfterWidth);

      setGhostContent(
        promptTokenIndex >= 0 ? (
          <>
            <span
              className="ghost-text-invisible ghost-width-span"
              style={{
                width: `${promptBeforeWidth}px`,
                transition: "none",
              }}
            >
              {promptBefore}
            </span>
            <span
              style={{
                backgroundColor: GHOST_BG,
                padding: "2px 4px",
                borderRadius: "4px",
                color: GHOST_COLOR,
              }}
            >
              {promptToken}
            </span>
            <span
              className="ghost-text-invisible ghost-width-span"
              style={{
                width: `${promptAfterWidth}px`,
                transition: "none",
              }}
            >
              {promptAfter}
            </span>
          </>
        ) : (
          <span
            style={{
              backgroundColor: GHOST_BG,
              padding: "2px 4px",
              borderRadius: "4px",
              color: GHOST_COLOR,
            }}
          >
            {promptToken}
          </span>
        )
      );
      setGhostStyle({
        position: "fixed",
        left: promptContainerRect.left,
        top: promptContainerRect.top,
        width: promptContainerRect.width,
        maxWidth: promptContainerRect.width ?? availableWidth,
        fontSize: window.getComputedStyle(promptTokenRef.current).fontSize,
        fontWeight: "normal",
        color: GHOST_COLOR,
        opacity: 1,
        transform: "scale(1)",
        transition: "none",
        pointerEvents: "none",
        zIndex: 1000,
        backgroundColor: "transparent",
        padding: "2px 4px",
        borderRadius: "4px",
      });

      setAnimationPhase("move");

      setTimeout(() => {
        const currentPromptRect =
          promptContainerRef.current.getBoundingClientRect();
        const currentPromptTokenRect =
          promptTokenRef.current.getBoundingClientRect();
        const currentResponseTokenRect =
          responseTokenRef.current.getBoundingClientRect();
        const currentContainerRect =
          responseContainerRef.current.getBoundingClientRect();
        const deltaX =
          currentResponseTokenRect.left - currentPromptTokenRect.left;
        const deltaY =
          currentResponseTokenRect.top - currentPromptTokenRect.top;
        const responseMaxWidth = currentContainerRect.width;
        const responseTokenIndex = responseText.indexOf(responseToken);
        const responseBefore =
          responseTokenIndex >= 0
            ? responseText.slice(0, responseTokenIndex)
            : "";
        const responseAfter =
          responseTokenIndex >= 0
            ? responseText.slice(responseTokenIndex + responseToken.length)
            : "";
        const responseFont = getFontFromElement(responseContainerRef.current);
        const responseBeforeWidth = measureTextWidth(
          responseBefore,
          responseFont
        );
        const responseAfterWidth = measureTextWidth(
          responseAfter,
          responseFont
        );

        // Update ghost invisible spans to morph to response widths
        setGhostBeforeWidth(responseBeforeWidth);
        setGhostAfterWidth(responseAfterWidth);
        setGhostContent((prev) => {
          // Rebuild content with transitioning widths while preserving token styling
          const promptTokenIndex = promptText.indexOf(promptToken);
          const promptBefore =
            promptTokenIndex >= 0 ? promptText.slice(0, promptTokenIndex) : "";
          const promptAfter =
            promptTokenIndex >= 0
              ? promptText.slice(promptTokenIndex + promptToken.length)
              : "";

          return (
            <>
              <span
                className="ghost-text-invisible ghost-width-span"
                style={{
                  width: `${responseBeforeWidth}px`,
                  transition: "width 1.2s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              >
                {promptBefore}
              </span>
              <span
                style={{
                  backgroundColor: GHOST_BG,
                  padding: "2px 4px",
                  borderRadius: "4px",
                  color: GHOST_COLOR,
                }}
              >
                {promptToken}
              </span>
              <span
                className="ghost-text-invisible ghost-width-span"
                style={{
                  width: `${responseAfterWidth}px`,
                  transition: "width 1.2s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              >
                {promptAfter}
              </span>
            </>
          );
        });

        setGhostStyle((prev) => ({
          ...prev,
          transform: `translate(${deltaX}px, ${deltaY}px) scale(1)`,
          maxWidth: responseMaxWidth,
          opacity: 1,
          color: "transparent",
          transition:
            "transform 1.2s cubic-bezier(0.4, 0, 0.2, 1), opacity 1.2s ease-in-out, color 1.2s ease-in-out, max-width 1.2s cubic-bezier(0.4, 0, 0.2, 1)",
        }));
        //move phase is over, now to the next phase

        setTimeout(() => {
          const expandContainerRect =
            responseContainerRef.current.getBoundingClientRect();
          const tokenIndex = responseText.indexOf(responseToken);
          const beforeToken = responseText.slice(0, tokenIndex);
          const afterToken = responseText.slice(
            tokenIndex + responseToken.length
          );
          const groupedSegments = diffSegments(promptToken, responseToken);
          const hasDiff = groupedSegments.some(
            (seg) => seg.type === "add" || seg.type === "del"
          );

          // Align to container and show full text scaffold before diff
          setGhostStyle({
            position: "fixed",
            left: expandContainerRect.left,
            top: expandContainerRect.top,
            width: expandContainerRect.width,
            maxWidth: expandContainerRect.width,
            fontSize: window.getComputedStyle(responseTokenRef.current)
              .fontSize,
            fontWeight: "normal",
            color: GHOST_COLOR,
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

          setGhostContent(
            <span className="diff-wrapper">
              <span className="full-text-growing">{beforeToken}</span>
              <span className="diff-token diff-token-placeholder">
                {promptToken}
              </span>
              <span className="full-text-growing">{afterToken}</span>
            </span>
          );

          const renderDiffState = (phase) => (
            <span className="diff-wrapper">
              <span className="diff-context-invisible">{beforeToken}</span>
              <span className="diff-token">
                {groupedSegments.map((seg, idx) => {
                  if (seg.type === "same") {
                    return (
                      <span key={`${idx}-same`} className="diff-common">
                        {seg.value}
                      </span>
                    );
                  }

                  if (seg.type === "del") {
                    return (
                      <span
                        key={`${idx}-del`}
                        className={`diff-from ${
                          phase === "swap"
                            ? "diff-from-shrinking"
                            : "diff-from-normal"
                        }`}
                      >
                        {seg.value}
                      </span>
                    );
                  }

                  return (
                    <span
                      key={`${idx}-add`}
                      className={`diff-to ${
                        phase === "swap"
                          ? "diff-to-growing"
                          : "diff-to-collapsed"
                      }`}
                    >
                      {seg.value}
                    </span>
                  );
                })}
              </span>
              <span className="diff-context-invisible">{afterToken}</span>
            </span>
          );

          // Start diff only after scaffold growth completes
          const scaffoldGrowDuration = 600;
          const scaffoldSwapDelay = 120;
          const diffStartDelay = scaffoldSwapDelay + scaffoldGrowDuration + 50;
          const swapDuration = 600; // matches diff-from/diff-to transition

          // Phase: diff static state (context hidden) after scaffold grows
          setTimeout(() => {
            setAnimationPhase("diff");
            setGhostContent(renderDiffState("static"));
            setGhostStyle((prev) => ({
              ...prev,
              color: "transparent", // avoid tinting before/after
              backgroundColor: "transparent",
              transition: "none",
            }));
          }, diffStartDelay);

          // Phase: perform diff swap
          setTimeout(() => {
            if (hasDiff) {
              setGhostContent(renderDiffState("swap"));
            }
          }, diffStartDelay + 120);

          // // Phase: reveal surrounding text smoothly only after swap is done
          setTimeout(() => {
            setGhostContent(
              <>
                <span className="expand-text-revealing">{beforeToken}</span>
                <span className="expand-token-grown">{responseToken}</span>
                <span className="expand-text-revealing">{afterToken}</span>
              </>
            );
          }, diffStartDelay + swapDuration + 500);

          setTimeout(
            () => {
              const fadeDuration = 1600; // match expand-text-revealing timing
              const renderFinalToken = (
                tokenColor,
                tokenBg,
                extraClass = ""
              ) => (
                <>
                  <span className="expand-text-revealing">{beforeToken}</span>
                  <span
                    className={`final-token final-token-transition ${extraClass}`}
                    style={{ color: tokenColor, backgroundColor: tokenBg }}
                  >
                    {responseToken}
                  </span>
                  <span className="expand-text-revealing">{afterToken}</span>
                </>
              );

              // Fade out the highlighted token/background + surrounding text
              setGhostContent(
                renderFinalToken("#c5c6d0", "rgba(142, 142, 160, 0.2)")
              );
              setTimeout(() => {
                setGhostContent(
                  <span className="final-wrap final-wrap-fade-out">
                    <span className="expand-text-revealing">{beforeToken}</span>
                    <span
                      className="final-token final-token-transition"
                      style={{
                        color: "transparent",
                        backgroundColor: "transparent",
                      }}
                    >
                      {responseToken}
                    </span>
                    <span className="expand-text-revealing">{afterToken}</span>
                  </span>
                );
              }, 40);

              // Fade in a plain response token (no background)
              // setTimeout(() => {
              //   setGhostContent(
              //     renderFinalToken(
              //       "transparent",
              //       "transparent",
              //       "final-token-plain"
              //     )
              //   );
              //   setTimeout(() => {
              //     setGhostContent(
              //       renderFinalToken(
              //         "#ececf1",
              //         "transparent",
              //         "final-token-plain"
              //       )
              //     );
              //   }, 40);
              // }, fadeDuration + 120);

              setTimeout(() => {
                setIsAnimating(false);
              }, 0);
              setTimeout(() => {
                setAnimationPhase("idle");
                setGhostStyle({});
                setGhostContent(null);
                setSketchAnimClass("");
              }, fadeDuration * 2 + 200);
            },
            hasDiff ? 3200 : 2600
          );
        }, 1200);
      }, 100);
    }, 500);
  }, [diffSegments, isAnimating, promptToken, responseToken, responseText]);

  // Main animation function
  const runAnimation = useCallback(() => {
    if (animationMode === "local") {
      runLocalAnimation();
    } else {
      runDiffAnimation();
    }
  }, [animationMode, runDiffAnimation, runLocalAnimation]);

  // Determine which tokens should be highlighted based on animation phase
  // const isPromptHighlighted =
  //   animationPhase === "highlight" || animationPhase === "move";
  //remove prompt highlight
  const isPromptHighlighted = false;
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
        <div className="control-group">
          <label htmlFor="animationMode">Animation Method:</label>
          <select
            id="animationMode"
            value={animationMode}
            onChange={(e) => setAnimationMode(e.target.value)}
            disabled={isAnimating}
          >
            <option value="local">Local</option>
            <option value="diff">Diff</option>
          </select>
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
              disabled={
                isAnimating ||
                animationMode === "diff" ||
                sketchContent.startsWith("data:image")
              }
              placeholder="Text, /local.png, or image:URL"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={isAnimating || animationMode === "diff"}
              style={{ display: "none" }}
            />
            <button
              type="button"
              className="upload-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={isAnimating || animationMode === "diff"}
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
                disabled={isAnimating || animationMode === "diff"}
                title="Clear image"
              >
                Clear
              </button>
            )}
          </div>
        </div>
        <div className="control-group sketch-size-control">
          <label htmlFor="sketchSize">Sketch Size: {sketchSize}rem</label>
          <input
            id="sketchSize"
            type="range"
            min="1"
            max="10"
            step="0.5"
            value={sketchSize}
            onChange={(e) => setSketchSize(parseFloat(e.target.value))}
            disabled={isAnimating || animationMode === "diff"}
          />
        </div>
        <button
          className="animate-btn"
          onClick={runAnimation}
          disabled={isAnimating}
        >
          {isAnimating
            ? "Animating..."
            : `Run ${animationMode === "local" ? "Local" : "Diff"} Animation`}
        </button>
      </div>

      <div className="chat-container">
        {/* User Message (Prompt) */}
        <div className="message user-message">
          <div className="avatar user-avatar">U</div>
          <div className="message-content">
            <div className="message-text" ref={promptContainerRef}>
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
          {ghostContent === "__SKETCH__"
            ? // Render sketch content with animation class from state
              (() => {
                const isImage =
                  sketchContent.startsWith("image:") ||
                  sketchContent.startsWith("data:image") ||
                  sketchContent.startsWith("/") ||
                  sketchContent.startsWith("./");
                const sizeStyle = { "--sketch-size": `${sketchSize}rem` };

                if (isImage) {
                  const imageUrl = sketchContent.startsWith("image:")
                    ? sketchContent.slice(6)
                    : sketchContent;
                  return (
                    <img
                      src={imageUrl}
                      alt="sketch"
                      className={`sketch-image ${sketchAnimClass}`}
                      style={sizeStyle}
                    />
                  );
                }
                return (
                  <span
                    className={`sketch-text ${sketchAnimClass}`}
                    style={sizeStyle}
                  >
                    {sketchContent}
                  </span>
                );
              })()
            : ghostContent}
        </div>
      )}

      <footer className="footer">
        <p>Click "Run Animation" to see the token transformation effect</p>
      </footer>
    </div>
  );
}

export default App;
