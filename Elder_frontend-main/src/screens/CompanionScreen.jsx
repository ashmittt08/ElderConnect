import React, { useState, useRef, useContext, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../api";
import { AuthContext } from "../context/AuthContext";

const colors = {
  bg: "#0F172A",
  card: "#1E293B",
  primary: "#4799EB",
  text: "#F1F5F9",
  muted: "#94A3B8",
  userBubble: "#2563EB",
  aiBubble: "#334155",
  danger: "#EF4444",
};

// Web Speech API helpers
const getSpeechRecognition = () => {
  if (Platform.OS !== "web") return null;
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  return SR ? new SR() : null;
};

const speakText = (text, onEnd) => {
  if (Platform.OS !== "web" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.9;
  utterance.pitch = 1.0;
  // Auto-detect Hindi (Devanagari script) vs English
  const hasHindi = /[\u0900-\u097F]/.test(text);
  utterance.lang = hasHindi ? "hi-IN" : "en-US";
  if (onEnd) {
    utterance.onend = onEnd;
  }
  window.speechSynthesis.speak(utterance);
};

export default function CompanionScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [messages, setMessages] = useState([
    {
      id: "1",
      role: "assistant",
      content: `Hello ${user?.name || "there"}! I'm your virtual companion. I'm here to chat, listen, or help gently remind you about your medicines or volunteers. How are you feeling today?`,
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const flatListRef = useRef();
  const recognitionRef = useRef(null);
  const pendingVoiceText = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation for mic
  const startPulse = useCallback(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.3, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    ).start();
  }, [pulseAnim]);

  const stopPulse = useCallback(() => {
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
  }, [pulseAnim]);

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const startListening = () => {
    const recognition = getSpeechRecognition();
    if (!recognition) {
      alert("Speech recognition is not supported in this browser. Please use Chrome.");
      return;
    }

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "hi-IN";

    recognition.onstart = () => {
      setIsListening(true);
      startPulse();
    };

    recognition.onresult = (event) => {
      let finalTranscript = "";
      for (let i = 0; i < event.results.length; i++) {
        finalTranscript += event.results[i][0].transcript;
      }
      setInputText(finalTranscript);
      pendingVoiceText.current = finalTranscript;
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      stopPulse();
      pendingVoiceText.current = null;
    };

    recognition.onend = () => {
      setIsListening(false);
      stopPulse();
      // Auto-send the voice message
      if (pendingVoiceText.current && pendingVoiceText.current.trim()) {
        setTimeout(() => {
          handleSendVoice(pendingVoiceText.current.trim());
          pendingVoiceText.current = null;
        }, 200);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    stopPulse();
  };

  const handleSendVoice = async (voiceText) => {
    if (!voiceText) return;

    const userMessage = { id: Date.now().toString(), role: "user", content: voiceText };
    const currentMessages = messages;
    const history = currentMessages.map(m => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setLoading(true);

    try {
      const response = await api.post("/elder/chat", {
        message: userMessage.content,
        history,
      });

      const aiMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.data.reply,
      };

      setMessages((prev) => [...prev, aiMessage]);
      if (voiceEnabled) {
        speakText(response.data.reply, () => {
          // Auto-restart listening after AI finishes speaking
          setTimeout(() => startListening(), 300);
        });
      }
    } catch (error) {
      console.error("Chat Error:", error);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I'm having a little trouble connecting right now. Please try again in a moment.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;
    if (isListening) stopListening();

    const userMessage = { id: Date.now().toString(), role: "user", content: inputText.trim() };
    const history = messages.map(m => ({ role: m.role, content: m.content }));
    
    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setLoading(true);

    try {
      const response = await api.post("/elder/chat", {
        message: userMessage.content,
        history,
      });

      const aiMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.data.reply,
      };

      setMessages((prev) => [...prev, aiMessage]);

      // Speak the AI response if voice mode is enabled
      if (voiceEnabled) {
        speakText(response.data.reply);
      }
    } catch (error) {
      console.error("Chat Error:", error);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I'm having a little trouble connecting right now. Please try again in a moment.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = ({ item }) => {
    const isUser = item.role === "user";
    return (
      <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.aiBubble]}>
        <Text style={styles.messageText}>{item.content}</Text>
        {!isUser && voiceEnabled && item.id !== "1" && (
          <TouchableOpacity
            style={styles.replayButton}
            onPress={() => speakText(item.content)}
          >
            <Text style={styles.replayIcon}>🔊</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom", "left", "right"]}>
      {/* Voice toggle bar */}
      <View style={styles.voiceBar}>
        <TouchableOpacity
          style={[styles.voiceToggle, voiceEnabled && styles.voiceToggleActive]}
          onPress={() => setVoiceEnabled(!voiceEnabled)}
        >
          <Text style={styles.voiceToggleIcon}>{voiceEnabled ? "🔊" : "🔇"}</Text>
          <Text style={[styles.voiceToggleText, voiceEnabled && styles.voiceToggleTextActive]}>
            {voiceEnabled ? "Voice On" : "Voice Off"}
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.listContainer}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        <View style={styles.inputContainer}>
          {/* Mic button */}
          <TouchableOpacity
            style={[styles.micButton, isListening && styles.micButtonActive]}
            onPress={toggleListening}
            disabled={loading}
          >
            {isListening ? (
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <Text style={styles.micIcon}>⏹️</Text>
              </Animated.View>
            ) : (
              <Text style={styles.micIcon}>🎤</Text>
            )}
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            placeholder={isListening ? "Listening..." : "Type or tap 🎤 to speak..."}
            placeholderTextColor={isListening ? colors.primary : colors.muted}
            value={inputText}
            onChangeText={setInputText}
            editable={!loading}
            multiline
          />

          <TouchableOpacity 
            style={[styles.sendButton, (!inputText.trim() || loading) && { opacity: 0.5 }]} 
            onPress={handleSend}
            disabled={!inputText.trim() || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.sendIcon}>⬆️</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  listContainer: { padding: 16, gap: 12 },

  // Voice bar
  voiceBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderColor: colors.bg,
  },
  voiceToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.bg,
  },
  voiceToggleActive: {
    backgroundColor: colors.primary + "25",
  },
  voiceToggleIcon: { fontSize: 14 },
  voiceToggleText: { color: colors.muted, fontSize: 12, fontWeight: "600" },
  voiceToggleTextActive: { color: colors.primary },

  // Messages
  messageBubble: {
    maxWidth: "80%",
    padding: 14,
    borderRadius: 20,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: colors.userBubble,
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    alignSelf: "flex-start",
    backgroundColor: colors.aiBubble,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 22,
  },
  replayButton: {
    marginTop: 6,
    alignSelf: "flex-start",
  },
  replayIcon: { fontSize: 14 },

  // Input area
  inputContainer: {
    flexDirection: "row",
    padding: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderColor: colors.bg,
    alignItems: "flex-end",
  },
  input: {
    flex: 1,
    backgroundColor: colors.bg,
    color: colors.text,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 16,
    maxHeight: 120,
  },
  sendButton: {
    marginLeft: 10,
    backgroundColor: colors.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  sendIcon: {
    fontSize: 20,
  },
  micButton: {
    marginRight: 10,
    backgroundColor: colors.bg,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.muted + "40",
  },
  micButtonActive: {
    backgroundColor: colors.danger + "20",
    borderColor: colors.danger,
  },
  micIcon: {
    fontSize: 20,
  },
});
