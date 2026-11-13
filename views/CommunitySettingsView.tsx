import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Palette, Image as ImageIcon, Type, Globe, Lock } from 'lucide-react';
import { firebaseService } from '../services/firebase';
import { Community } from '../types';

interface CommunitySettingsViewProps {
    onBack: () => void;
}

export const CommunitySettingsView: React.FC<CommunitySettingsViewProps> = ({ onBack }) => {
    const [community, setCommunity] = useState<Community | null>(null);
    const [name, setName] = useState('');
    const [logo, setLogo] = useState('');
    const [primaryColor, setPrimaryColor] = useState('#FDB813');
    const [secondaryColor, setSecondaryColor] = useState('#001220');
    const [leaderPin, setLeaderPin] = useState('1234');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const currentUser = firebaseService.getCurrentUser();

    useEffect(() => {
        if (currentUser?.communityId) {
            setLoading(true);
            firebaseService.getCommunity(currentUser.communityId).then(data => {
                if (data) {
                    setCommunity(data);
                    setName(data.name || '');
                    setLogo(data.logo || '');
                    setPrimaryColor(data.primaryColor || '#FDB813');
                    setSecondaryColor(data.secondaryColor || '#001220');
                    setLeaderPin(data.leaderPin || '1234');
                }
                setLoading(false);
            });
        }
    }, [currentUser]);

    const handleSave = async () => {
        if (!currentUser?.communityId) return;
        setSaving(true);
        try {
            await firebaseService.updateCommunitySettings(currentUser.communityId, {
                name,
                logo,
                primaryColor,
                secondaryColor,
                leaderPin: leaderPin.trim() || '1234'
            });
            alert('Configurações atualizadas com sucesso!');
        } catch (error) {
            console.error('Erro ao salvar configurações:', error);
            alert('Erro ao salvar configurações.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="p-20 text-center">Carregando...</div>;
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] pt-24 pb-20 animate-appear">
            <div className="px-6 mb-8 flex items-center gap-4">
                <button onClick={onBack} className="p-2 bg-white rounded-xl shadow-sm border border-slate-100">
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h2 className="font-brand font-black text-2xl uppercase tracking-tighter">Configurações</h2>
                    <p className="text-[#FDB813] text-[10px] font-black uppercase tracking-widest">Identidade Visual</p>
                </div>
            </div>

            <div className="px-6 space-y-6">
                <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 space-y-6">
                    <div>
                        <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase mb-2">
                            <Type size={14} /> Nome da Juventude
                        </label>
                        <input 
                            value={name} 
                            onChange={e => setName(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-slate-800 font-bold outline-none focus:border-[#FDB813]"
                            placeholder="Ex: UMADW"
                        />
                    </div>

                    <div>
                        <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase mb-2">
                            <ImageIcon size={14} /> URL do Logo
                        </label>
                        <input 
                            value={logo} 
                            onChange={e => setLogo(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-slate-800 font-bold outline-none focus:border-[#FDB813]"
                            placeholder="https://exemplo.com/logo.png"
                        />
                        {logo && (
                            <div className="mt-4 w-20 h-20 rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 p-2">
                                <img src={logo} alt="Preview" className="w-full h-full object-contain" />
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase mb-2">
                                <Palette size={14} /> Cor Primária
                            </label>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="color"
                                    value={primaryColor}
                                    onChange={e => setPrimaryColor(e.target.value)}
                                    className="w-10 h-10 rounded-lg border-none cursor-pointer"
                                />
                                <input 
                                    value={primaryColor}
                                    onChange={e => setPrimaryColor(e.target.value)}
                                    className="flex-1 bg-slate-50 border border-slate-100 rounded-xl py-2 px-3 text-xs font-mono outline-none"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase mb-2">
                                <Palette size={14} /> Cor Secundária
                            </label>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="color"
                                    value={secondaryColor}
                                    onChange={e => setSecondaryColor(e.target.value)}
                                    className="w-10 h-10 rounded-lg border-none cursor-pointer"
                                />
                                <input 
                                    value={secondaryColor}
                                    onChange={e => setSecondaryColor(e.target.value)}
                                    className="flex-1 bg-slate-50 border border-slate-100 rounded-xl py-2 px-3 text-xs font-mono outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase mb-2">
                            <Lock size={14} /> Senha / PIN de Acesso à Área de Liderança
                        </label>
                        <input 
                            value={leaderPin} 
                            onChange={e => setLeaderPin(e.target.value)}
                            maxLength={8}
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-slate-800 font-bold outline-none focus:border-[#FDB813] font-mono tracking-widest text-center"
                            placeholder="1234"
                        />
                        <p className="text-[11px] text-slate-400 mt-1">Essa senha é solicitada ao acessar a aba Líder e Secretaria (padrão: 1234).</p>
                    </div>

                    <div className="pt-4">
                        <button 
                            onClick={handleSave}
                            disabled={saving}
                            className="w-full bg-[#001220] text-white py-4 rounded-2xl font-brand font-black uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50"
                        >
                            <Save size={20} />
                            {saving ? 'Salvando...' : 'Salvar Alterações'}
                        </button>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase mb-4 flex items-center gap-2">
                        <Globe size={14} /> Preview da Marca
                    </h4>
                    <div className="p-6 rounded-2xl flex flex-col items-center gap-4" style={{ backgroundColor: secondaryColor }}>
                        {logo ? (
                            <img src={logo} alt="Logo" className="h-12 object-contain" />
                        ) : (
                            <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center">
                                <ImageIcon className="text-white/20" />
                            </div>
                        )}
                        <h3 className="text-xl font-black uppercase tracking-tighter" style={{ color: primaryColor }}>
                            {name || 'Nome da Juventude'}
                        </h3>
                    </div>
                </div>
            </div>
        </div>
    );
};
