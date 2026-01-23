// ================= CONFIG =================
const API_KEY = "AIzaSyCf1qgpX_tWRndi1JoIA2UHzDvLD1nisAI"; 
const MODEL = "gemini-3-flash-preview";

// ================= JARVIS PERSONA =================
const SYSTEM_INSTRUCTION = {
    parts: [{ text: `You are JARVIS, Sir's advanced AI assistant. 
    Rules: Address user as "Sir", be professional/calm, no emojis, 
    concise responses, never mention being an AI or Google.` }]
};

// ================= DOM ELEMENTS =================
const chat = document.getElementById("chat");
const input = document.getElementById("input");
const sendBtn = document.getElementById("sendBtn");
const voiceBtn = document.getElementById("voiceBtn");
const imageBtn = document.getElementById("imageBtn");
const imageInput = document.getElementById("imageInput");

let selectedImageBase64 = null;
let selectedImageMime = null;

// ================= UI HELPERS =================
function addMessage(text, sender) {
    const div = document.createElement("div");
    div.className = `message ${sender}`;
    div.innerText = `${sender === "you" ? "Sir" : "Jarvis"}: ${text}`;
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
}

// Convert File to Base64 for the API
const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = e => reject(e);
});

// ================= MAIN SEND LOGIC =================
async function sendMessage() {
    const text = input.value.trim();
    if (!text && !selectedImageBase64) return;

    addMessage(text || (selectedImageBase64 ? "[Image Sent]" : ""), "you");
    input.value = "";
    addMessage("Analyzing, Sir...", "jarvis");

    // Prepare content parts
    const parts = [];
    if (text) parts.push({ text: text });
    if (selectedImageBase64) {
        parts.push({
            inline_data: {
                mime_type: selectedImageMime,
                data: selectedImageBase64
            }
        });
    }

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    system_instruction: SYSTEM_INSTRUCTION,
                    contents: [{ role: "user", parts: parts }]
                })
            }
        );

        const data = await response.json();
        chat.lastChild.remove(); // Remove "Analyzing..."

        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "I am unable to process that request, Sir.";
        addMessage(reply, "jarvis");

        // Reset image state after sending
        selectedImageBase64 = null;
        imageBtn.style.color = "white"; 

    } catch (err) {
        chat.lastChild.remove();
        addMessage("A system error has occurred, Sir.", "jarvis");
        console.error("API Error:", err);
    }
}

// ================= FEATURE EVENTS =================

// Voice Input
voiceBtn.addEventListener("click", () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Browser not supported, Sir.");
    
    const recognition = new SpeechRecognition();
    recognition.onresult = (e) => {
        input.value = e.results[0][0].transcript;
        sendMessage();
    };
    recognition.start();
});

// Image Input Handling
imageBtn.addEventListener("click", () => imageInput.click());
imageInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (file) {
        selectedImageMime = file.type;
        selectedImageBase64 = await fileToBase64(file);
        imageBtn.style.color = "#00e5ff"; // Highlight button when image loaded
        addMessage(`Visual data uploaded: ${file.name}, Sir.`, "jarvis");
    }
});

// Controls
sendBtn.addEventListener("click", sendMessage);
input.addEventListener("keydown", (e) => e.key === "Enter" && sendMessage());