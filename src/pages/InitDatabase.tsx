import { db } from '../lib/firebase';
import { doc, setDoc, collection } from 'firebase/firestore';
import { toast } from 'sonner';
import { Shield, Rocket, Database } from 'lucide-react';

export default function InitDatabase() {
  const runMagicInit = async () => {
    try {
      // 1. Setup Akun Admin (Gunakan UID Anda jika sudah tahu, atau biarkan ini)
      await setDoc(doc(db, "users", "admin_default_id"), {
        name: "Admin Utama",
        username: "adminlab",
        email: "admin@gmail.com",
        role: "admin",
        is_verified: "1",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Admin"
      });

      // 2. Setup Settings (Agar Home & Admin Sinkron)
      await setDoc(doc(db, "settings", "general"), {
        status: "not_started",
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 hari dari sekarang
        title: "Pemilihan Ketua Lab 2026"
      });

      // 3. Setup Kandidat Contoh
      const candidates = [
        { id: "cand_1", name: "Budi Santoso", vision: "Maju bersama teknologi.", votes: 0, image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Budi" },
        { id: "cand_2", name: "Siti Aminah", vision: "Inovasi tanpa batas.", votes: 0, image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Siti" },
        { id: "cand_3", name: "Andi Wijaya", vision: "Lab bersih, kerja nyaman.", votes: 0, image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Andi" }
      ];

      for (const c of candidates) {
        await setDoc(doc(db, "candidates", c.id), c);
      }

      toast.success("MAGIC! Database berhasil diisi otomatis.");
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengisi database. Cek koneksi internet.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-6 text-center font-sans">
      <div className="w-20 h-20 bg-blue-500 rounded-3xl flex items-center justify-center mb-6 shadow-2xl shadow-blue-500/50 animate-bounce">
        <Rocket className="w-10 h-10" />
      </div>
      <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">Auto-Link System</h1>
      <p className="text-slate-400 mb-8 max-w-md">Klik tombol di bawah untuk menghubungkan aplikasi Anda ke database secara otomatis tanpa manual lagi.</p>
      
      <button 
        onClick={runMagicInit}
        className="group relative px-8 py-4 bg-white text-black font-black rounded-2xl hover:scale-105 transition-all flex items-center gap-3 overflow-hidden"
      >
        <Database className="w-5 h-5" />
        HUBUNGKAN SEKARANG
        <div className="absolute inset-0 bg-blue-400/20 translate-y-full group-hover:translate-y-0 transition-transform"></div>
      </button>
    </div>
  );
}