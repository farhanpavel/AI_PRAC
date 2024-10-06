"use client";
import React, { useState, useRef } from "react";
import "regenerator-runtime/runtime";
import Tesseract from "tesseract.js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FaMicrophone } from "react-icons/fa";
import { FaUpload } from "react-icons/fa6";
import { IoSend } from "react-icons/io5";
import { HiOutlineSpeakerWave } from "react-icons/hi2";
import { MdClose } from "react-icons/md";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

export default function Home() {
  const [input, setInput] = useState("");

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [conversation, setConversation] = useState([
    {
      role: "gpt",
      content:
        "Hi there! I'm happy to help with anything you need. What can I assist you with today?",
    },
  ]);

  const { transcript, listening, resetTranscript } = useSpeechRecognition();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleSend = async () => {
    const finalInput = input.trim() || transcript.trim();

    if (!finalInput && !selectedImage) return;

    let ocrText = "";

    if (selectedImage) {
      try {
        const { data } = await Tesseract.recognize(selectedImage, "eng");
        ocrText = data.text.trim();
      } catch (error) {
        console.error("OCR Error:", error);
      }
    }

    const combinedInput = `${finalInput} ${ocrText}`.trim();
    if (!combinedInput) return;

    const userMessage = { role: "user", content: `Pavel: ${combinedInput}` };
    const updatedConversation = [...conversation, userMessage];

    const url =
      "https://cheapest-gpt-4-turbo-gpt-4-vision-chatgpt-openai-ai-api.p.rapidapi.com/v1/chat/completions";
    const options = {
      method: "POST",
      headers: {
        "x-rapidapi-key": "80b8e7c34bmsh1f0bfbf85488416p17102ajsn7b6fecce7b54",
        "x-rapidapi-host":
          "cheapest-gpt-4-turbo-gpt-4-vision-chatgpt-openai-ai-api.p.rapidapi.com",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: updatedConversation.map((msg) => ({
          role: msg.role === "user" ? "user" : "assistant",
          content: msg.content.replace(/^Pavel: /, ""),
        })),
        model: "gpt-4o",
        max_tokens: 100,
        temperature: 0.9,
      }),
    };

    try {
      const res = await fetch(url, options);
      const result = await res.json();
      const gptResponse =
        result.choices[0]?.message?.content || "No response from the API";

      const gptMessage = { role: "gpt", content: `GPT: ${gptResponse}` };
      setConversation((prev) => [...prev, userMessage, gptMessage]);
    } catch (error) {
      console.error(error);
      const errorMessage = { role: "gpt", content: "Error fetching response" };
      setConversation((prev) => [...prev, userMessage, errorMessage]);
    }

    setInput("");
    resetTranscript();
    setSelectedImage(null);
  };

  const speak = (text: string) => {
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = "en-US";
    window.speechSynthesis.speak(speech);
  };

  const handleMicrophoneToggle = () => {
    if (listening) {
      SpeechRecognition.stopListening();
      setInput(transcript);
    } else {
      SpeechRecognition.startListening();
    }
  };

  const handleFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(URL.createObjectURL(file));
    }
  };
  const handleRemoveImage = () => {
    setSelectedImage(null);
  };

  return (
    <div className="bg-blue-50 min-h-screen flex flex-col items-center p-6 pb-20">
      {/* Response Container */}
      <div className="bg-white rounded-lg shadow w-full max-w-2xl p-6 mt-6 space-y-4">
        {conversation.map((msg, index) => (
          <div key={index} className="flex items-center">
            <p
              className={
                msg.role === "user" ? "text-blue-600" : "text-gray-800"
              }
            >
              {msg.content}
            </p>
            {msg.role === "gpt" && (
              <button
                onClick={() => speak(msg.content.replace(/^GPT: /, ""))}
                className="ml-2 text-xl text-gray-600"
              >
                <HiOutlineSpeakerWave />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Input Container - Fixed at the Bottom */}
      <div className="fixed bottom-0 left-0 w-full bg-blue-50 p-4 border-t border-gray-300">
        <div className="flex items-center justify-center w-full max-w-2xl mx-auto">
          <div className="flex items-center w-full relative">
            <Input
              type="text"
              value={input || transcript}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter Prompt Here"
              className="w-full pr-20" // Add padding to make space for the image
            />
            {selectedImage && (
              <div className="absolute right-[2rem] top-1/2 transform -translate-y-1/2 flex items-center">
                <img
                  src={selectedImage}
                  alt="Selected"
                  className="w-8 h-8 border-[1px] border-gray-300 object-cover rounded"
                />
                <button
                  onClick={handleRemoveImage}
                  className="-mt-7 -ms-2 text-red-500 text-md"
                >
                  <MdClose />
                </button>
              </div>
            )}
            <div className="relative">
              <HoverCard>
                <HoverCardTrigger asChild>
                  <button
                    onMouseDown={handleMicrophoneToggle}
                    onMouseUp={handleMicrophoneToggle}
                    className="text-xl absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    <FaMicrophone />
                  </button>
                </HoverCardTrigger>
                <HoverCardContent className="w-50">
                  <div className="flex justify-between space-x-4">
                    <div className="space-y-1">
                      <p className="text-sm">Press & Hold To Speak</p>
                    </div>
                  </div>
                </HoverCardContent>
              </HoverCard>
            </div>
          </div>

          <div className="mx-3">
            <Button
              variant="outline"
              size="icon"
              className="border-muted-foreground"
              onClick={handleFileSelect}
            >
              <FaUpload className="h-4 w-4" />
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: "none" }}
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>
          <div>
            <Button
              variant="outline"
              size="icon"
              className="border-muted-foreground"
              onClick={handleSend}
            >
              <IoSend className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
