import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Music, Play, Pause, Square, Volume2, Mic, Loader2, Share2 } from 'lucide-react';
import { BIBLE_BOOKS, AMBIENT_MUSIC_URL } from '../constants';
import { firebaseService } from '../services/firebase';

export const BibleView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [book, setBook] = useState("Gênesis");
    const [chapter, setChapter] = useState(1);
    const [text, setText] = useState("");
    const [loading, setLoading] = useState(false);
    
    // --- VOICE STATE (TTS) ---
    const [isVoicePlaying, setIsVoicePlaying] = useState(false);
    const [isVoicePaused, setIsVoicePaused] = useState(false);
    
    // --- MUSIC STATE ---
    const [isMusicPlaying, setIsMusicPlaying] = useState(false);
    const [musicVolume, setMusicVolume] = useState(0.3);
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        fetchText();
        return () => {
            window.speechSynthesis.cancel();
        };
    }, [book, chapter]);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = musicVolume;
        }
    }, [musicVolume]);

    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
            }
        }
    }, []);

    const fetchText = async () => {
        setLoading(true);
        stopVoice();
        try {
            const res = await fetch(`https://bible-api.com/${book}+${chapter}?translation=almeida`);
            const data = await res.json();
            if (data.text) {
                setText(data.text);
            } else {
                setText("Texto indisponível para esta versão.");
            }
        } catch (e) {
            setText("Erro ao carregar o texto bíblico. Verifique sua conexão.");
        } finally {
            setLoading(false);
        }
    };

    const playVoice = () => {
        if (isVoicePaused) {
            window.speechSynthesis.resume();
            setIsVoicePaused(false);
            setIsVoicePlaying(true);
        } else {
            window.speechSynthesis.cancel();
            
            // Dividir textos longos para estabilizar TTS em mobile
            const chunks = text.split(/(?<=[.!?\n])\s+/).filter(c => c.trim().length > 0);
            
            if (chunks.length === 0) return;

            chunks.forEach((chunk, index) => {
                const newUtterance = new SpeechSynthesisUtterance(chunk);
                newUtterance.lang = "pt-BR";
                
                // Tentar encontrar uma voz masculina
                const voices = window.speechSynthesis.getVoices();
                const maleVoice = voices.find(v => v.lang.includes('pt') && (v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('masculino') || v.name.toLowerCase().includes('daniel') || v.name.toLowerCase().includes('ricardo')));
                if (maleVoice) newUtterance.voice = maleVoice;

                if (index === chunks.length - 1) {
                    newUtterance.onend = () => {
                        setIsVoicePlaying(false);
                        setIsVoicePaused(false);
                    };
                }
                
                newUtterance.onerror = (e) => {
                    console.error("Erro no TTS:", e);
                    setIsVoicePlaying(false);
                    setIsVoicePaused(false);
                };

                window.speechSynthesis.speak(newUtterance);
            });
            
            setIsVoicePlaying(true);
            setIsVoicePaused(false);
        }
    };

    const pauseVoice = () => {
        window.speechSynthesis.pause();
        setIsVoicePlaying(false);
        setIsVoicePaused(true);
    };

    const stopVoice = () => {
        window.speechSynthesis.cancel();
        setIsVoicePlaying(false);
        setIsVoicePaused(false);
    };

    const toggleMusic = () => {
        if (!audioRef.current) return;
        if (isMusicPlaying) {
            audioRef.current.pause();
            setIsMusicPlaying(false);
        } else {
            audioRef.current.play().catch(e => console.error("Erro playback musica:", e));
            setIsMusicPlaying(true);
        }
    };

    const stopMusic = () => {
        if (!audioRef.current) return;
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setIsMusicPlaying(false);
    }

    const handleShare = async () => {
        if (!text) return;
        try {
            await firebaseService.shareVerse(`${book} ${chapter}`, text);
            alert("Capítulo compartilhado no feed!");
        } catch (error) {
            console.error("Erro ao compartilhar:", error);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] animate-appear pt-28 pb-10 flex flex-col">
            <audio ref={audioRef} src={AMBIENT_MUSIC_URL} loop crossOrigin="anonymous" />
            
            <div className="fixed top-24 left-0 right-0 max-w-lg mx-auto bg-white/95 backdrop-blur shadow-md z-40 p-4 border-b rounded-b-3xl">
                {/* Selector */}
                <div className="flex items-center gap-2 mb-4">
                    <button onClick={onBack} className="p-2 bg-slate-100 rounded-xl">
                        <ChevronLeft size={20} />
                    </button>
                    <select value={book} onChange={(e) => setBook(e.target.value)} className="bg-slate-100 p-2 rounded-xl text-sm font-bold outline-none flex-1">
                        {BIBLE_BOOKS.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                    <input type="number" min={1} max={150} value={chapter} onChange={(e) => setChapter(Number(e.target.value))} className="w-16 bg-slate-100 p-2 rounded-xl text-center font-bold text-sm outline-none" />
                    <button onClick={handleShare} className="p-2 bg-[#FDB813] text-[#001220] rounded-xl hover:scale-105 transition-transform active:scale-95">
                        <Share2 size={20} />
                    </button>
                </div>
                
                {/* Controls */}
                <div className="grid grid-cols-2 gap-3">
                    {/* Music */}
                    <div className="bg-[#001220] p-3 rounded-2xl flex flex-col gap-2">
                         <div className="flex items-center justify-between">
                             <div className="flex items-center gap-2">
                                <Music size={16} className={isMusicPlaying ? "text-[#FDB813] animate-pulse" : "text-white/40"} />
                                <span className="text-[9px] font-black text-white/60 uppercase">Instrumental</span>
                             </div>
                             <div className="flex gap-1">
                                <button onClick={toggleMusic} className={`p-1.5 rounded-full ${isMusicPlaying ? 'bg-[#FDB813] text-black' : 'bg-white/10 text-white'}`}>
                                    {isMusicPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                                </button>
                                <button onClick={stopMusic} className="p-1.5 rounded-full bg-white/10 text-white hover:text-rose-500">
                                    <Square size={14} fill="currentColor" />
                                </button>
                             </div>
                         </div>
                         <div className="flex items-center gap-2 px-1">
                            <Volume2 size={12} className="text-white/40" />
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={musicVolume}
                                onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
                                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#FDB813]"
                            />
                         </div>
                    </div>

                    {/* Voice */}
                    <div className="bg-slate-100 p-2 rounded-2xl flex items-center justify-between px-3">
                         <div className="flex items-center gap-2">
                            <Mic size={16} className={isVoicePlaying ? "text-indigo-600 animate-pulse" : "text-slate-400"} />
                            <span className="text-[9px] font-black text-slate-500 uppercase">Voz</span>
                         </div>
                         <div className="flex gap-1">
                            <button onClick={isVoicePlaying ? pauseVoice : playVoice} className={`p-1.5 rounded-full ${isVoicePlaying ? 'bg-indigo-600 text-white' : 'bg-slate-300 text-slate-600'}`}>
                                {isVoicePlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                            </button>
                            <button onClick={stopVoice} className="p-1.5 rounded-full bg-slate-300 text-slate-600 hover:text-rose-500">
                                <Square size={14} fill="currentColor" />
                            </button>
                         </div>
                    </div>
                </div>
            </div>
            
            {/* Text Area */}
            <div className="flex-1 px-6 pt-36">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-64 opacity-50">
                        <Loader2 className="animate-spin mb-4" size={32} />
                        <p className="text-xs uppercase font-bold tracking-widest">Carregando Escrituras...</p>
                    </div>
                ) : (
                    <div className="prose prose-lg max-w-none pb-20">
                        <h2 className="font-brand font-black text-2xl mb-4 text-[#001220] uppercase">{book} {chapter}</h2>
                        <p className="text-slate-700 text-lg leading-loose font-serif text-justify whitespace-pre-wrap">{text}</p>
                    </div>
                )}
            </div>
        </div>
    );
};
