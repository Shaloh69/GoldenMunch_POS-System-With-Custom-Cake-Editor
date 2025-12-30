"use client";

import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import Keyboard from "react-simple-keyboard";
import "react-simple-keyboard/build/css/index.css";

export interface TouchKeyboardHandle {
  setInput: (input: string) => void;
  clearInput: () => void;
}

interface TouchKeyboardProps {
  onChangeAll?: (inputs: { [inputName: string]: string }) => void;
  onChange?: (input: string) => void;
  onKeyPress?: (button: string) => void;
  inputName?: string;
  layoutName?: string;
  placeholder?: string;
  theme?: string;
  maxLength?: number;
}

const TouchKeyboard = forwardRef<TouchKeyboardHandle, TouchKeyboardProps>(
  (
    {
      onChangeAll,
      onChange,
      onKeyPress,
      inputName = "default",
      layoutName = "default",
      placeholder,
      theme = "hg-theme-default hg-theme-kiosk",
      maxLength,
    },
    ref
  ) => {
    const keyboardRef = useRef<any>(null);

    useImperativeHandle(ref, () => ({
      setInput: (input: string) => {
        if (keyboardRef.current) {
          keyboardRef.current.setInput(input, inputName);
        }
      },
      clearInput: () => {
        if (keyboardRef.current) {
          keyboardRef.current.clearInput(inputName);
        }
      },
    }));

    const handleChange = (input: string) => {
      // Enforce max length if specified
      if (maxLength && input.length > maxLength) {
        input = input.slice(0, maxLength);
        if (keyboardRef.current) {
          keyboardRef.current.setInput(input, inputName);
        }
      }

      onChange?.(input);
    };

    const handleKeyPress = (button: string) => {
      onKeyPress?.(button);
    };

    return (
      <div className="touch-keyboard-wrapper">
        <Keyboard
          keyboardRef={(r) => (keyboardRef.current = r)}
          inputName={inputName}
          layoutName={layoutName}
          onChange={handleChange}
          onChangeAll={onChangeAll}
          onKeyPress={handleKeyPress}
          theme={theme}
          layout={{
            default: [
              "1 2 3 4 5 6 7 8 9 0 {bksp}",
              "Q W E R T Y U I O P",
              "A S D F G H J K L",
              "{shift} Z X C V B N M {shift}",
              "{space} @ . {enter}",
            ],
            shift: [
              "! @ # $ % ^ & * ( ) {bksp}",
              "Q W E R T Y U I O P",
              "A S D F G H J K L",
              "{shift} Z X C V B N M {shift}",
              "{space} - _ {enter}",
            ],
          }}
          display={{
            "{bksp}": "⌫ Delete",
            "{enter}": "✓ Done",
            "{shift}": "⇧ Shift",
            "{space}": "Space",
          }}
          buttonTheme={[
            {
              class: "hg-primary-button",
              buttons: "{enter}",
            },
            {
              class: "hg-danger-button",
              buttons: "{bksp}",
            },
            {
              class: "hg-shift-button",
              buttons: "{shift}",
            },
            {
              class: "hg-space-button",
              buttons: "{space}",
            },
          ]}
          preventMouseDownDefault={true}
          stopMouseDownPropagation={true}
          enableLayoutCandidates={true}
          physicalKeyboardHighlight={false}
          syncInstanceInputs={true}
          mergeDisplay={true}
        />
        <style jsx global>{`
          /* Keyboard Container Styling */
          .touch-keyboard-wrapper {
            width: 100%;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            z-index: 9999;
            background: linear-gradient(135deg, hsl(45 100% 51%) 0%, hsl(39 100% 50%) 100%);
            padding: 1rem;
            box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.3);
            border-top: 3px solid rgba(255, 255, 255, 0.3);
            animation: slideUp 0.3s ease-out;
          }

          @keyframes slideUp {
            from {
              transform: translateY(100%);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }

          /* Keyboard Theme */
          .hg-theme-kiosk {
            background: transparent;
            border-radius: 12px;
            padding: 0.5rem;
          }

          .hg-theme-kiosk .hg-row {
            margin-bottom: 8px;
            display: flex;
            justify-content: center;
            gap: 6px;
          }

          /* Button Styling */
          .hg-theme-kiosk .hg-button {
            height: 65px;
            min-width: 60px;
            background: linear-gradient(145deg, #ffffff, #e6e6e6);
            color: #333;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-radius: 10px;
            font-size: 22px;
            font-weight: 700;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            transition: all 0.15s ease;
            cursor: pointer;
            user-select: none;
            display: flex;
            align-items: center;
            justify-content: center;
            text-transform: uppercase;
          }

          .hg-theme-kiosk .hg-button:active {
            transform: scale(0.95);
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
            background: linear-gradient(145deg, #e6e6e6, #cccccc);
          }

          .hg-theme-kiosk .hg-button:hover {
            background: linear-gradient(145deg, #f0f0f0, #d9d9d9);
            border-color: rgba(255, 255, 255, 0.5);
          }

          /* Primary Button (Enter/Done) */
          .hg-theme-kiosk .hg-primary-button {
            background: linear-gradient(145deg, #4ade80, #22c55e);
            color: white;
            border-color: rgba(255, 255, 255, 0.4);
            font-weight: 800;
            min-width: 120px;
          }

          .hg-theme-kiosk .hg-primary-button:active {
            background: linear-gradient(145deg, #22c55e, #16a34a);
          }

          .hg-theme-kiosk .hg-primary-button:hover {
            background: linear-gradient(145deg, #22c55e, #16a34a);
            box-shadow: 0 6px 20px rgba(34, 197, 94, 0.4);
          }

          /* Danger Button (Backspace) */
          .hg-theme-kiosk .hg-danger-button {
            background: linear-gradient(145deg, #f87171, #ef4444);
            color: white;
            border-color: rgba(255, 255, 255, 0.4);
            font-weight: 800;
            min-width: 100px;
          }

          .hg-theme-kiosk .hg-danger-button:active {
            background: linear-gradient(145deg, #ef4444, #dc2626);
          }

          .hg-theme-kiosk .hg-danger-button:hover {
            background: linear-gradient(145deg, #ef4444, #dc2626);
            box-shadow: 0 6px 20px rgba(239, 68, 68, 0.4);
          }

          /* Shift Button */
          .hg-theme-kiosk .hg-shift-button {
            background: linear-gradient(145deg, hsl(39 100% 50%), hsl(33 100% 50%));
            color: white;
            border-color: rgba(255, 255, 255, 0.4);
            font-weight: 700;
            min-width: 80px;
          }

          .hg-theme-kiosk .hg-shift-button:active {
            background: linear-gradient(145deg, hsl(33 100% 50%), hsl(33 100% 45%));
          }

          .hg-theme-kiosk .hg-shift-button:hover {
            background: linear-gradient(145deg, hsl(33 100% 50%), hsl(33 100% 45%));
            box-shadow: 0 6px 20px rgba(255, 153, 0, 0.4);
          }

          /* Space Button */
          .hg-theme-kiosk .hg-space-button {
            background: linear-gradient(145deg, #cbd5e1, #94a3b8);
            color: #1e293b;
            border-color: rgba(255, 255, 255, 0.4);
            font-weight: 700;
            min-width: 300px;
            flex: 1;
          }

          .hg-theme-kiosk .hg-space-button:active {
            background: linear-gradient(145deg, #94a3b8, #64748b);
          }

          .hg-theme-kiosk .hg-space-button:hover {
            background: linear-gradient(145deg, #94a3b8, #64748b);
          }

          /* Active State for Shift */
          .hg-theme-kiosk .hg-activeButton {
            background: linear-gradient(145deg, hsl(33 100% 50%), hsl(33 100% 45%)) !important;
            box-shadow: 0 0 20px rgba(255, 153, 0, 0.6) !important;
          }

          /* Responsive adjustments for smaller screens */
          @media (max-width: 768px) {
            .hg-theme-kiosk .hg-button {
              height: 55px;
              min-width: 50px;
              font-size: 18px;
            }

            .hg-theme-kiosk .hg-space-button {
              min-width: 200px;
            }

            .hg-theme-kiosk .hg-primary-button,
            .hg-theme-kiosk .hg-danger-button {
              min-width: 80px;
            }
          }
        `}</style>
      </div>
    );
  }
);

TouchKeyboard.displayName = "TouchKeyboard";

export default TouchKeyboard;
