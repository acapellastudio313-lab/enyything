import { User } from '../types';
import { useState, FormEvent, useEffect } from 'react';
import { UserPlus, ArrowLeft, Loader2, LogIn } from 'lucide-react';
// Import Firebase
import { auth, db } from '../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile 
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

interface LoginProps {
  onLogin: (user: User) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [formData, setFormData] = useState({ name: '', username: '', password: '', bio: '' });
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [branding, setBranding] = useState({ name: 'Acapella Studio Lab', subtitle: 'Creative & AI Studio', logo: '' });

  // Sinkronisasi Branding tetap dari Firestore (Opsional)
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'general');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          setBranding({
            name: data.appName || 'Acapella Studio Lab',
            subtitle: data.appSubtitle || 'Creative & AI Studio',
            logo: data.appLogoUrl || ''
          });
        }
      } catch (err) {
        console.error('Gagal memuat branding', err);
      }
    };
    fetchSettings();
  }, []);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Login via Firebase Auth (Username diasumsikan email atau format email)
      // Jika sistem Anda murni username, tambahkan "@studio.com" dibelakangnya secara otomatis
      const email = loginData.username.includes('@') ? loginData.username : `${loginData.username}@studio.com`;
      const userCredential = await signInWithEmailAndPassword(auth, email, loginData.password);
      const fbUser = userCredential.user;

      // 2. Ambil data profil dari Firestore
      const userDoc = await getDoc(doc(db, "users", fbUser.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data() as User;
        localStorage.setItem('userId', fbUser.uid);
        onLogin(userData);
      } else {
        setError('Data profil tidak ditemukan di database.');
      }
    } catch (err: any) {
      setError('Username atau Password salah.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const email = `${formData.username}@studio.com`;
      
      // 1. Buat User di Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, formData.password);
      const fbUser = userCredential.user;

      // 2. Update Profile Auth
      await updateProfile(fbUser, { displayName: formData.name });

      // 3. Simpan Detail ke Firestore (OTOMATIS)
      const newUser: any = {
        id: fbUser.uid,
        name: formData.name,
        username: formData.username,
        bio: formData.bio,
        role: 'user', // Default sebagai user
        avatar: `https://ui-avatars.com/api/?name=${formData.name}&background=random`,
        createdAt: serverTimestamp()
      };

      await setDoc(doc(db, "users", fbUser.uid), newUser);

      setSuccessMsg('Pendaftaran berhasil! Silakan login.');
      setIsRegistering(false);
      setFormData({ name: '', username: '', password: '', bio: '' });
    } catch (err: any) {
      setError(err.message.includes('email-already-in-use') ? 'Username sudah digunakan.' : 'Gagal mendaftar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* UI tetap sama sesuai permintaan Anda agar estetik */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {branding.logo && (
          <div className="flex justify-center mb-4">
            <img src={branding.logo} alt="Logo" className="h-20 w-auto object-contain" />
          </div>
        )}
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          {branding.name}
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          {branding.subtitle}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl border border-slate-100 sm:rounded-2xl sm:px-10">
          {isRegistering ? (
            <form onSubmit={handleRegister} className="space-y-5">
              <div className="flex items-center mb-2">
                <button type="button" onClick={() => setIsRegistering(false)} className="text-slate-400 hover:text-slate-600">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h3 className="text-lg font-bold text-slate-900 ml-2">Daftar Akun Baru</h3>
              </div>
              
              {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-medium">{error}</div>}

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Lengkap</label>
                <input type="text" required className="mt-1 block w-full border border-slate-200 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-emerald-500 outline-none transition-all" 
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Username</label>
                <input type="text" required className="mt-1 block w-full border border-slate-200 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-emerald-500 outline-none transition-all" 
                  value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Password</label>
                <input type="password" required className="mt-1 block w-full border border-slate-200 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-emerald-500 outline-none transition-all" 
                  value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
              </div>

              <button type="submit" disabled={loading} className="w-full flex justify-center py-3 px-4 rounded-xl text-white bg-slate-900 hover:bg-black font-bold transition-all disabled:opacity-50">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Buat Akun'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-5">
              <h3 className="text-lg font-bold text-slate-900 text-center mb-2">Selamat Datang Kembali</h3>
              
              {successMsg && <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl text-xs text-center font-medium">{successMsg}</div>}
              {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-medium">{error}</div>}

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Username</label>
                <input type="text" required className="mt-1 block w-full border border-slate-200 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-emerald-500 outline-none transition-all" 
                  value={loginData.username} onChange={e => setLoginData({...loginData, username: e.target.value})} />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Password</label>
                <input type="password" required className="mt-1 block w-full border border-slate-200 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-emerald-500 outline-none transition-all" 
                  value={loginData.password} onChange={e => setLoginData({...loginData, password: e.target.value})} />
              </div>

              <button type="submit" disabled={loading} className="w-full flex justify-center py-3 px-4 rounded-xl text-white bg-slate-900 hover:bg-black font-bold transition-all">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><LogIn className="w-4 h-4 mr-2" /> Masuk</>}
              </button>
              
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="px-2 bg-white text-slate-400 font-bold">Atau</span></div>
              </div>

              <button type="button" onClick={() => setIsRegistering(true)} className="w-full flex justify-center items-center py-3 px-4 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all">
                <UserPlus className="w-4 h-4 mr-2" /> Daftar Baru
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}