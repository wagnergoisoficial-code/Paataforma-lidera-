import React, { useState } from 'react';
import { firebaseService } from '../services/firebase';
import { User, UserRole } from '../types';
import { signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

interface WelcomeViewProps {
  onStart: (user: User) => void;
}

export const WelcomeView: React.FC<WelcomeViewProps> = ({ onStart }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [birthdayDate, setBirthdayDate] = useState('');
    const [loading, setLoading] = useState(false);

    const handleGoogleLogin = async () => {
        const auth = firebaseService.getAuthInstance();
        if (!auth) return;
        setLoading(true);
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            
            // Buscar ou criar perfil para garantir transição imediata
            if (!firebaseService.db) throw new Error("Database not initialized");
            const userRef = doc(firebaseService.db, 'users', result.user.uid);
            const snapshot = await getDoc(userRef);
            
            if (snapshot.exists()) {
                onStart(snapshot.data() as User);
            } else {
                const isAdminEmail = result.user.email === "wagnergoisoficial@gmail.com";
                const newUser: User = {
                    uid: result.user.uid,
                    name: result.user.displayName || result.user.email?.split('@')[0] || 'Usuário',
                    email: result.user.email || '',
                    birthday: '01/01',
                    role: (isAdminEmail ? 'Dono' : 'Membro') as UserRole,
                    photo: result.user.photoURL || '',
                    communityId: 'umadw',
                    status: 'Ativo',
                    level: 1,
                    experience: 0,
                    streak: 0,
                    badges: [],
                    contributions: {
                        posts: 0,
                        comments: 0,
                        likes: 0,
                        ritualsCompleted: 0
                    }
                };
                await firebaseService.saveUserProfile(newUser);
                onStart(newUser);
            }
        } catch (error: any) {
            console.error("Erro Google Login:", error);
            alert("Erro ao entrar com Google: " + error.message);
            setLoading(false);
        }
    };

    const handleEmailAuth = async () => {
        if (!email.trim() || !password.trim()) {
            alert("Preencha e-mail e senha!");
            return;
        }
        
        setLoading(true);
        try {
            const auth = firebaseService.getAuthInstance();
            if (!auth) {
                throw new Error("O serviço de autenticação não foi inicializado. Verifique sua conexão.");
            }
            
            if (isLogin) {
                console.log("Tentando login para:", email.trim());
                const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
                console.log("Login bem-sucedido para UID:", userCredential.user.uid);
                
                // Buscar perfil para garantir que temos os dados completos (communityId, etc)
                if (!firebaseService.db) throw new Error("Banco de dados não inicializado");
                
                const userRef = doc(firebaseService.db, 'users', userCredential.user.uid);
                console.log("Buscando perfil no Firestore...");
                const snapshot = await getDoc(userRef);
                
                if (snapshot.exists()) {
                    const userData = snapshot.data() as User;
                    console.log("Perfil encontrado:", userData);
                    setLoading(false);
                    onStart(userData);
                } else {
                    console.log("Perfil não encontrado, usando fallback...");
                    // Fallback se o perfil não existir no banco mas o auth sim
                    const isAdminEmail = userCredential.user.email === "wagnergoisoficial@gmail.com";
                    const fallbackUser: User = {
                        uid: userCredential.user.uid,
                        name: userCredential.user.displayName || userCredential.user.email?.split('@')[0] || 'Usuário',
                        email: userCredential.user.email || email,
                        birthday: '01/01',
                        role: isAdminEmail ? 'Dono' : 'Membro',
                        photo: userCredential.user.photoURL || '',
                        communityId: 'umadw',
                        status: 'Ativo',
                        level: 1,
                        experience: 0,
                        streak: 0,
                        badges: [],
                        contributions: {
                            posts: 0,
                            comments: 0,
                            likes: 0,
                            ritualsCompleted: 0
                        }
                    };
                    setLoading(false);
                    onStart(fallbackUser);
                }
            } else {
                console.log("Tentando criar conta para:", email.trim());
                if (!name.trim() || !birthdayDate) {
                    alert("Preencha todos os campos para criar a conta!");
                    setLoading(false);
                    return;
                }
                const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
                const uid = userCredential.user.uid;
                console.log("Conta criada com UID:", uid);
                
                // Processar Data de Nascimento (YYYY-MM-DD -> DD/MM)
                const dateObj = new Date(birthdayDate);
                const day = String(dateObj.getUTCDate()).padStart(2, '0');
                const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
                const formattedBirthday = `${day}/${month}`;
                
                // Gerar Avatar Automático com Iniciais
                const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=FDB813&color=001220&size=150`;

                const isAdminEmail = email.toLowerCase().trim() === "wagnergoisoficial@gmail.com";
                const userData: User = { 
                    uid,
                    name, 
                    email: email.toLowerCase().trim(), 
                    birthday: formattedBirthday, 
                    role: isAdminEmail ? 'Dono' : 'Membro', 
                    photo: avatarUrl,
                    communityId: 'umadw',
                    status: 'Ativo',
                    level: 1,
                    experience: 0,
                    streak: 0,
                    badges: [],
                    contributions: {
                        posts: 0,
                        comments: 0,
                        likes: 0,
                        ritualsCompleted: 0
                    }
                };
                
                console.log("Salvando perfil no banco...");
                await firebaseService.saveUserProfile(userData); 
                console.log("Perfil salvo, iniciando app...");
                setLoading(false);
                onStart(userData);
            }
        } catch (error: any) {
            console.error("Erro detalhado auth:", error);
            let message = "Erro na autenticação: ";
            if (error.code === 'auth/user-not-found') message += "Usuário não encontrado.";
            else if (error.code === 'auth/wrong-password') message += "Senha incorreta.";
            else if (error.code === 'auth/email-already-in-use') message += "Este e-mail já está em uso.";
            else if (error.code === 'auth/invalid-email') message += "E-mail inválido.";
            else if (error.code === 'auth/weak-password') message += "Senha muito fraca.";
            else message += error.message;
            
            alert(message);
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] bg-[#001220] flex flex-col items-center justify-center p-8 animate-appear overflow-y-auto">
            <div className="text-center mb-8 mt-10">
                <h1 className="font-brand text-5xl font-black text-white mb-2">UMADW</h1>
                <p className="text-2xl text-[#FDB813] font-light tracking-widest">JUVENTUDE</p>
            </div>
            <div className="w-full max-w-sm space-y-4 bg-white/5 p-6 rounded-[32px] border border-white/10 backdrop-blur-sm mb-10">
                
                <div className="flex gap-2 mb-6 bg-black/20 p-1 rounded-xl">
                    <button onClick={() => setIsLogin(true)} className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-colors ${isLogin ? 'bg-[#FDB813] text-[#001220]' : 'text-white/50'}`}>Entrar</button>
                    <button onClick={() => setIsLogin(false)} className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-colors ${!isLogin ? 'bg-[#FDB813] text-[#001220]' : 'text-white/50'}`}>Criar Conta</button>
                </div>

                {!isLogin && (
                    <div>
                        <label className="text-[10px] font-bold text-white/50 uppercase ml-2">Nome Completo</label>
                        <input value={name} onChange={e => setName(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-[#FDB813]" />
                    </div>
                )}
                
                <div>
                    <label className="text-[10px] font-bold text-white/50 uppercase ml-2">Seu E-mail</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-[#FDB813]" />
                </div>
                
                <div>
                    <label className="text-[10px] font-bold text-white/50 uppercase ml-2">Senha</label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-[#FDB813]" />
                </div>

                {!isLogin && (
                    <div>
                        <label className="text-[10px] font-bold text-white/50 uppercase ml-2">Data de Nascimento</label>
                        <input type="date" value={birthdayDate} onChange={e => setBirthdayDate(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-[#FDB813]" />
                    </div>
                )}
                
                <button onClick={handleEmailAuth} disabled={loading} className="w-full bg-[#FDB813] py-4 rounded-xl font-brand font-black text-[#001220] text-lg active:scale-95 transition-transform mt-4 shadow-lg shadow-[#FDB813]/20 disabled:opacity-50">
                    {loading ? 'AGUARDE...' : (isLogin ? 'ENTRAR' : 'CRIAR CONTA')}
                </button>

                <div className="relative flex items-center py-4">
                    <div className="flex-grow border-t border-white/10"></div>
                    <span className="flex-shrink-0 mx-4 text-white/30 text-xs font-bold uppercase">OU</span>
                    <div className="flex-grow border-t border-white/10"></div>
                </div>

                <button onClick={handleGoogleLogin} disabled={loading} className="w-full bg-white py-4 rounded-xl font-brand font-black text-slate-800 text-sm active:scale-95 transition-transform shadow-lg disabled:opacity-50 flex items-center justify-center gap-3">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    CONTINUAR COM GOOGLE
                </button>
            </div>
        </div>
    );
};
