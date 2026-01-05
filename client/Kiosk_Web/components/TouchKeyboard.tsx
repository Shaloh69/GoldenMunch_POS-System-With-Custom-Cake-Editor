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
            z-index: 999999;
            background: transparent;
            padding: 1rem;
            box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.1);
            border-top: 1px solid rgba(0, 0, 0, 0.1);
            animation: slideUp 0.3s ease-out;
            pointer-events: auto;
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
            background: #ffffff;
            color: #000000;
            border: 2px solid rgba(0, 0, 0, 0.1);
            border-radius: 10px;
            font-size: 22px;
            font-weight: 700;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
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
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
            background: #f0f0f0;
          }

          .hg-theme-kiosk .hg-button:hover {
            background: #f5f5f5;
            border-color: rgba(0, 0, 0, 0.15);
          }

          /* Primary Button (Enter/Done) */
          .hg-theme-kiosk .hg-primary-button {
            background: rgba(34, 197, 94, 0.3);
            color: #000000;
            border: 2px solid rgba(34, 197, 94, 0.5);
            font-weight: 800;
            min-width: 120px;
          }

          .hg-theme-kiosk .hg-primary-button:active {
            background: rgba(34, 197, 94, 0.5);
          }

          .hg-theme-kiosk .hg-primary-button:hover {
            background: rgba(34, 197, 94, 0.4);
            box-shadow: 0 6px 20px rgba(34, 197, 94, 0.3);
          }

          /* Danger Button (Backspace) */
          .hg-theme-kiosk .hg-danger-button {
            background: #ffffff;
            color: #000000;
            border: 2px solid rgba(0, 0, 0, 0.1);
            font-weight: 800;
            min-width: 100px;
          }

          .hg-theme-kiosk .hg-danger-button:active {
            background: #f0f0f0;
          }

          .hg-theme-kiosk .hg-danger-button:hover {
            background: #f5f5f5;
            border-color: rgba(0, 0, 0, 0.15);
          }

          /* Shift Button */
          .hg-theme-kiosk .hg-shift-button {
            background: #ffffff;
            color: #000000;
            border: 2px solid rgba(0, 0, 0, 0.1);
            font-weight: 700;
            min-width: 80px;
          }

          .hg-theme-kiosk .hg-shift-button:active {
            background: #f0f0f0;
          }

          .hg-theme-kiosk .hg-shift-button:hover {
            background: #f5f5f5;
            border-color: rgba(0, 0, 0, 0.15);
          }

          /* Space Button */
          .hg-theme-kiosk .hg-space-button {
            background: #9ca3af;
            color: #000000;
            border: 2px solid rgba(0, 0, 0, 0.1);
            font-weight: 700;
            min-width: 300px;
            flex: 1;
          }

          .hg-theme-kiosk .hg-space-button:active {
            background: #6b7280;
          }

          .hg-theme-kiosk .hg-space-button:hover {
            background: #6b7280;
          }

          /* Active State for Shift */
          .hg-theme-kiosk .hg-activeButton {
            background: #e5e7eb !important;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.2) !important;
            border-color: rgba(0, 0, 0, 0.2) !important;
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
