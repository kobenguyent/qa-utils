/**
 * Voice Interface for Kobean AI Assistant
 * Uses Web Speech API for voice input/output
 */

// Web Speech API type declarations
interface SpeechRecognitionEvent extends Event {
    resultIndex: number;
    results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
    error: string;
    message: string;
}

interface SpeechRecognitionInterface extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onstart: (() => void) | null;
    onend: (() => void) | null;
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    start(): void;
    stop(): void;
    abort(): void;
}

declare global {
    interface Window {
        SpeechRecognition: new () => SpeechRecognitionInterface;
        webkitSpeechRecognition: new () => SpeechRecognitionInterface;
    }
}

export interface VoiceConfig {
    language?: string;
    continuous?: boolean;
    interimResults?: boolean;
    wakeWord?: string;
    voiceName?: string;
    rate?: number;
    pitch?: number;
}

export interface VoiceState {
    isListening: boolean;
    isSpeaking: boolean;
    isSupported: boolean;
    transcript: string;
    interimTranscript: string;
    error?: string;
}

type VoiceCallback = (transcript: string) => void;
type StateChangeCallback = (state: Partial<VoiceState>) => void;

/**
 * Voice Interface Class
 */
export class VoiceInterface {
    private recognition: SpeechRecognitionInterface | null = null;

    private synthesis: SpeechSynthesis | null = null;
    private config: VoiceConfig;
    private state: VoiceState;
    private onTranscript: VoiceCallback | null = null;
    private onStateChange: StateChangeCallback | null = null;
    private voices: SpeechSynthesisVoice[] = [];

    constructor(config: VoiceConfig = {}) {
        this.config = {
            language: config.language || 'en-US',
            continuous: config.continuous ?? false,
            interimResults: config.interimResults ?? true,
            wakeWord: config.wakeWord || 'kobean',
            voiceName: config.voiceName,
            rate: config.rate ?? 1.0,
            pitch: config.pitch ?? 1.0,
        };

        this.state = {
            isListening: false,
            isSpeaking: false,
            isSupported: this.checkSupport(),
            transcript: '',
            interimTranscript: '',
        };

        if (this.state.isSupported) {
            this.initRecognition();
            this.initSynthesis();
        }
    }

    /**
     * Check if speech APIs are supported
     */
    private checkSupport(): boolean {
        const hasSpeechRecognition =
            'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
        const hasSpeechSynthesis = 'speechSynthesis' in window;
        return hasSpeechRecognition && hasSpeechSynthesis;
    }

    /**
     * Initialize speech recognition
     */
    private initRecognition(): void {
        const SpeechRecognitionAPI =
            window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognitionAPI) return;

        this.recognition = new SpeechRecognitionAPI();
        this.recognition.continuous = this.config.continuous!;
        this.recognition.interimResults = this.config.interimResults!;
        this.recognition.lang = this.config.language!;


        this.recognition.onstart = () => {
            this.updateState({ isListening: true, error: undefined });
        };

        this.recognition.onend = () => {
            this.updateState({ isListening: false });
        };

        this.recognition.onerror = (event) => {
            this.updateState({
                isListening: false,
                error: `Speech recognition error: ${event.error}`
            });
        };

        this.recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }

            if (finalTranscript) {
                this.updateState({ transcript: finalTranscript, interimTranscript: '' });

                // Check for wake word or direct command
                const cleanTranscript = this.processTranscript(finalTranscript);
                if (cleanTranscript && this.onTranscript) {
                    this.onTranscript(cleanTranscript);
                }
            } else {
                this.updateState({ interimTranscript });
            }
        };
    }

    /**
     * Initialize speech synthesis
     */
    private initSynthesis(): void {
        this.synthesis = window.speechSynthesis;

        // Load voices
        const loadVoices = () => {
            this.voices = this.synthesis?.getVoices() || [];
        };

        loadVoices();

        if (this.synthesis.onvoiceschanged !== undefined) {
            this.synthesis.onvoiceschanged = loadVoices;
        }
    }

    /**
     * Process transcript (remove wake word, clean up)
     */
    private processTranscript(transcript: string): string | null {
        const cleaned = transcript.trim().toLowerCase();

        // Check for wake word
        const wakeWord = this.config.wakeWord?.toLowerCase() || 'kobean';

        if (cleaned.startsWith(wakeWord)) {
            // Remove wake word and return the rest
            const afterWakeWord = transcript.substring(wakeWord.length).trim();
            return afterWakeWord || null;
        }

        // If continuous mode, allow commands without wake word
        if (this.config.continuous) {
            return transcript.trim();
        }

        return transcript.trim();
    }

    /**
     * Update state and notify listeners
     */
    private updateState(updates: Partial<VoiceState>): void {
        this.state = { ...this.state, ...updates };
        if (this.onStateChange) {
            this.onStateChange(updates);
        }
    }

    /**
     * Start listening for voice input
     */
    startListening(): void {
        if (!this.recognition || this.state.isListening) return;

        try {
            this.recognition.start();
        } catch (error) {
            this.updateState({
                error: error instanceof Error ? error.message : 'Failed to start listening'
            });
        }
    }

    /**
     * Stop listening
     */
    stopListening(): void {
        if (!this.recognition || !this.state.isListening) return;

        try {
            this.recognition.stop();
        } catch (error) {
            // Ignore errors when stopping
        }
    }

    /**
     * Toggle listening state
     */
    toggleListening(): void {
        if (this.state.isListening) {
            this.stopListening();
        } else {
            this.startListening();
        }
    }

    /**
     * Speak text using text-to-speech
     */
    speak(text: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.synthesis) {
                reject(new Error('Speech synthesis not supported'));
                return;
            }

            // Cancel any ongoing speech
            this.synthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = this.config.language!;
            utterance.rate = this.config.rate!;
            utterance.pitch = this.config.pitch!;

            // Find preferred voice
            if (this.config.voiceName) {
                const voice = this.voices.find(v =>
                    v.name.toLowerCase().includes(this.config.voiceName!.toLowerCase())
                );
                if (voice) {
                    utterance.voice = voice;
                }
            } else {
                // Try to find an English voice
                const englishVoice = this.voices.find(v =>
                    v.lang.startsWith('en') && v.name.includes('Google')
                ) || this.voices.find(v => v.lang.startsWith('en'));

                if (englishVoice) {
                    utterance.voice = englishVoice;
                }
            }

            utterance.onstart = () => {
                this.updateState({ isSpeaking: true });
            };

            utterance.onend = () => {
                this.updateState({ isSpeaking: false });
                resolve();
            };

            utterance.onerror = (event) => {
                this.updateState({ isSpeaking: false });
                reject(new Error(`Speech synthesis error: ${event.error}`));
            };

            this.synthesis.speak(utterance);
        });
    }

    /**
     * Stop speaking
     */
    stopSpeaking(): void {
        if (this.synthesis) {
            this.synthesis.cancel();
            this.updateState({ isSpeaking: false });
        }
    }

    /**
     * Set callback for when transcript is ready
     */
    setOnTranscript(callback: VoiceCallback): void {
        this.onTranscript = callback;
    }

    /**
     * Set callback for state changes
     */
    setOnStateChange(callback: StateChangeCallback): void {
        this.onStateChange = callback;
    }

    /**
     * Get current state
     */
    getState(): VoiceState {
        return { ...this.state };
    }

    /**
     * Get available voices
     */
    getVoices(): SpeechSynthesisVoice[] {
        return [...this.voices];
    }

    /**
     * Update configuration
     */
    updateConfig(config: Partial<VoiceConfig>): void {
        this.config = { ...this.config, ...config };

        if (this.recognition) {
            this.recognition.lang = this.config.language!;
            this.recognition.continuous = this.config.continuous!;
            this.recognition.interimResults = this.config.interimResults!;
        }
    }

    /**
     * Clean up resources
     */
    destroy(): void {
        this.stopListening();
        this.stopSpeaking();
        this.recognition = null;
        this.synthesis = null;
        this.onTranscript = null;
        this.onStateChange = null;
    }
}

// Export singleton instance
let voiceInstance: VoiceInterface | null = null;

export function getVoiceInterface(config?: VoiceConfig): VoiceInterface {
    if (!voiceInstance) {
        voiceInstance = new VoiceInterface(config);
    }
    return voiceInstance;
}

export function resetVoiceInterface(): void {
    if (voiceInstance) {
        voiceInstance.destroy();
        voiceInstance = null;
    }
}
