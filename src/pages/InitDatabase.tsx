import { db, auth } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { Database, Shield } from 'lucide-react';

export default function InitDatabase() {
  const runMagicInit = async () => {
    // Ambil user yang sedang login saat ini
    const currentUser = auth.currentUser;

    if (!currentUser) {
      toast.error("Silakan login dulu (meskipun error) agar sistem tahu UID Anda.");
      return;
    }

    try {
      // 1. Daftarkan UID Anda yang sedang login sebagai ADMIN
      await setDoc(doc(db, "users", currentUser.uid), {
        name: "Administrator Resmi",
        username: "admin_lab",
        email: currentUser.email,
        role: "admin",
        is_verified: "1",
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.uid}`
      });

      // 2. Setup Pengaturan Pemilihan
      await setDoc(doc(db, "settings", "general"), {
        status: "not_started",
        endDate: new Date(Date.now() + 86400000 * 7).toISOString(),
        title: "Pemilihan Lab v1.0"
      });

      toast.success("BERHASIL! Akun Anda sekarang resmi menjadi Admin.");
      setTimeout(() => window.location.href = "/", 2000);
    } catch (error) {
      toast.error("Gagal! Pastikan Firebase Rules Anda sudah 'allow write'.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white font-sans p-6">
      <Shield className="w-16 h-16 text-blue-400 mb-4 animate-pulse" />
      <h1 className="text-3xl font-black mb-2 uppercase">System Repair</h1>
      <p className="text-slate-400 mb-8">Klik tombol di bawah untuk mendaftarkan akun Anda ke database.</p>
      <button onClick={runMagicInit} className="px-10 py-4 bg-blue-600 rounded-2xl font-bold hover:bg-blue-500 transition-all flex items-center gap-2">
        <Database className="w-5 h-5" /> SYNC MY ACCOUNT
      </button>
    </div>
  );
}