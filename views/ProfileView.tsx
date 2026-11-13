import React, { useState } from 'react';
import { LogOut, Camera, Edit3, MapPin, Calendar, Shield, Save, X } from 'lucide-react';
import { firebaseService } from '../services/firebase';
import { User } from '../types';

interface ProfileViewProps {
  user: User;
  onLogout: () => void;
  onUpdate: (user: User) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ user, onLogout, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(user.name);
    const [bio, setBio] = useState(user.bio || '');
    const [photo, setPhoto] = useState(user.photo || '');

    const handleSave = async () => {
        const updatedUser = { ...user, name, bio, photo };
        await firebaseService.saveUserProfile(updatedUser);
        onUpdate(updatedUser);
        setIsEditing(false);
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] pt-24 pb-20 animate-appear">
            {/* Header / Cover */}
            <div className="h-40 bg-[#001220] relative">
                <div className="absolute -bottom-16 left-8">
                    <div className="relative group">
                        <div className="w-32 h-32 rounded-[40px] border-4 border-white shadow-2xl overflow-hidden bg-white">
                            <img src={photo} alt={user.name} className="w-full h-full object-cover" />
                        </div>
                        {isEditing && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-[40px]">
                                <Camera size={24} className="text-white" />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="px-8 pt-20 space-y-8">
                {/* User Info */}
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        {isEditing ? (
                            <div className="space-y-4 w-full">
                                <input 
                                    value={name} 
                                    onChange={e => setName(e.target.value)}
                                    placeholder="Seu Nome"
                                    className="font-brand font-black text-2xl uppercase tracking-tighter bg-slate-100 border-none rounded-xl px-3 py-1 outline-none w-full"
                                />
                                <input 
                                    value={photo} 
                                    onChange={e => setPhoto(e.target.value)}
                                    placeholder="URL da Foto"
                                    className="text-xs bg-slate-100 border-none rounded-xl px-3 py-2 outline-none w-full"
                                />
                            </div>
                        ) : (
                            <h2 className="font-brand font-black text-3xl uppercase tracking-tighter">{user.name}</h2>
                        )}
                        <div className="flex items-center gap-2 text-[#FDB813] font-black text-[10px] uppercase tracking-widest">
                            <Shield size={12} />
                            {user.role} • {user.communityId?.toUpperCase() || 'UMADW'}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {isEditing ? (
                            <>
                                <button onClick={() => setIsEditing(false)} className="bg-slate-100 p-3 rounded-2xl text-slate-400">
                                    <X size={20} />
                                </button>
                                <button onClick={handleSave} className="bg-[#001220] p-3 rounded-2xl text-[#FDB813]">
                                    <Save size={20} />
                                </button>
                            </>
                        ) : (
                            <button onClick={() => setIsEditing(true)} className="bg-slate-100 p-3 rounded-2xl text-slate-600">
                                <Edit3 size={20} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Bio */}
                <div className="space-y-2">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sobre mim</h4>
                    {isEditing ? (
                        <textarea 
                            value={bio}
                            onChange={e => setBio(e.target.value)}
                            placeholder="Conte um pouco sobre você..."
                            className="w-full bg-slate-100 border-none rounded-2xl p-4 text-sm outline-none h-24 resize-none"
                        />
                    ) : (
                        <p className="text-slate-600 text-sm leading-relaxed">
                            {user.bio || "Nenhuma biografia adicionada ainda. Clique em editar para contar sua história!"}
                        </p>
                    )}
                </div>

                {/* Stats / Details */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-4">
                        <div className="bg-indigo-50 p-3 rounded-2xl">
                            <Calendar size={20} className="text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Niver</p>
                            <p className="text-sm font-black">{user.birthday}</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-4">
                        <div className="bg-emerald-50 p-3 rounded-2xl">
                            <MapPin size={20} className="text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Status</p>
                            <p className="text-sm font-black">{user.status || 'Ativo'}</p>
                        </div>
                    </div>
                </div>

                {/* Logout Button */}
                <button 
                    onClick={onLogout}
                    className="w-full bg-rose-50 text-rose-600 py-5 rounded-[32px] font-brand font-black uppercase text-sm flex items-center justify-center gap-3 active:scale-95 transition-transform"
                >
                    <LogOut size={20} />
                    Sair da Conta
                </button>
            </div>
        </div>
    );
};
