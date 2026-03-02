import { useState, useEffect } from 'react';
import { User, Candidate, ElectionStatus } from '../types';
import { 
  Trash2, Shield, Users, BarChart2, 
  AlertTriangle, CheckCircle, X, Trophy, Clock, 
  Loader2, Save
} from 'lucide-react';
import { toast } from 'sonner';

// Firebase Imports
import { db } from '../lib/firebase';
import { 
  collection, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  setDoc
} from 'firebase/firestore';

export default function AdminDashboard({ user }: { user: User }) {
  const [stats, setStats] = useState({ users: 0, candidates: 0 });
  const [users, setUsers] = useState<User[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [electionStatus, setElectionStatus] = useState<ElectionStatus>('not_started');
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [electionEndDate, setElectionEndDate] = useState<string>('');

  useEffect(() => {
    setLoading(true);

    // 1. Sync Users secara Real-time
    const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      const userData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any;
      setUsers(userData);
      setStats(prev => ({ ...prev, users: userData.length }));
    });

    // 2. Sync Candidates & Leaderboard secara Real-time
    const qCandidates = query(collection(db, "candidates"), orderBy("votes", "desc"));
    const unsubCandidates = onSnapshot(qCandidates, (snapshot) => {
      const candData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any;
      setCandidates(candData);
      setStats(prev => ({ ...prev, candidates: candData.length }));
    });

    // 3. Sync Settings (PENTING: Menggunakan dokumen 'general' agar sinkron dengan Home)
    const unsubSettings = onSnapshot(doc(db, "settings", "general"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setElectionStatus(data.status || 'not_started');
        setElectionEndDate(data.endDate || '');
      }
    });

    setLoading(false);
    return () => {
      unsubUsers();
      unsubCandidates();
      unsubSettings();
    };
  }, []);

  // FUNGSI: Update Status Pemilihan
  const updateElectionStatus = async (status: ElectionStatus) => {
    setUpdatingStatus(true);
    try {
      await setDoc(doc(db, "settings", "general"), { status }, { merge: true });
      toast.success(`Sistem sekarang: ${status.replace('_', ' ').toUpperCase()}`);
    } catch (err) {
      toast.error("Gagal memperbarui status di Cloud Firestore.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  // FUNGSI: Simpan Deadline
  const updateEndDate = async () => {
    try {
      await setDoc(doc(db, "settings", "general"), { endDate: electionEndDate }, { merge: true });
      toast.success("Deadline pemilihan telah diperbarui.");
    } catch (err) {
      toast.error("Gagal menyimpan jadwal.");
    }
  };

  // FUNGSI: Hapus User
  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Hapus pengguna ini secara permanen dari database?')) return;
    try {
      await deleteDoc(doc(db, "users", userId));
      toast.success("Pengguna berhasil dihapus.");
    } catch (err) {
      toast.error("Gagal menghapus pengguna.");
    }
  };

  // FUNGSI: Toggle Verifikasi
  const toggleVerifyUser = async (userId: string, currentStatus: any) => {
    try {
      const newStatus = currentStatus === "1" || currentStatus === 1 ? "0" : "1";
      await updateDoc(doc(db, "users", userId), { is_verified: newStatus });
      toast.success("Status verifikasi diperbarui.");
    } catch (err) {
      toast.error("Gagal mengubah status verifikasi.");
    }
  };

  if (loading) return <div className="p-10 text-center animate-pulse">Memuat Data Lab...</div>;

  if (user.role !== 'admin') {
    return (
      <div className="p-12 text-center bg-white min-h-screen flex flex-col items-center justify-center">
        <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-black tracking-tighter uppercase">Akses Ditolak</h1>
        <p className="text-slate-500">Hanya administrator resmi yang dapat mengakses Control Center.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 bg-slate-50 min-h-screen font-sans">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center text-white shadow-xl">
          <Shield className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase italic text-slate-900">Control Center</h1>
          <p className="text-slate-500 font-medium text-xs tracking-widest uppercase">Acapella Studio Lab • Management</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg"><Users /></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Pemilih</p>
            <p className="text-2xl font-black text-slate-900">{stats.users}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5">
          <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center text-white shadow-lg"><Trophy /></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kandidat</p>
            <p className="text-2xl font-black text-slate-900">{stats.candidates}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5">
          <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg"><BarChart2 /></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status Sistem</p>
            <p className="text-sm font-black text-emerald-600 uppercase italic">{electionStatus.replace('_', ' ')}</p>
          </div>
        </div>
      </div>

      {/* Controller */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h2 className="font-bold text-slate-900 flex items-center gap-2 tracking-tight">
            <Clock className="w-5 h-5 text-blue-600" /> Pengaturan Alur Pemilihan
          </h2>
          {updatingStatus && <Loader2 className="w-5 h-5 animate-spin text-blue-600" />}
        </div>
        <div className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button onClick={() => updateElectionStatus('not_started')} 
              className={`p-5 rounded-2xl border-2 transition-all text-left ${electionStatus === 'not_started' ? 'border-black bg-slate-900 text-white' : 'border-slate-100 hover:border-slate-300'}`}>
              <span className={`text-[10px] font-black uppercase tracking-widest ${electionStatus === 'not_started' ? 'text-slate-400' : 'text-slate-400'}`}>Tahap 1</span>
              <p className="font-bold">Persiapan</p>
            </button>
            <button onClick={() => updateElectionStatus('in_progress')}
              className={`p-5 rounded-2xl border-2 transition-all text-left ${electionStatus === 'in_progress' ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-100 hover:border-emerald-200'}`}>
              <span className={`text-[10px] font-black uppercase tracking-widest ${electionStatus === 'in_progress' ? 'text-emerald-200' : 'text-emerald-500'}`}>Tahap 2</span>
              <p className="font-bold">Mulai Voting</p>
            </button>
            <button onClick={() => updateElectionStatus('closed')}
              className={`p-5 rounded-2xl border-2 transition-all text-left ${electionStatus === 'closed' ? 'border-red-500 bg-red-500 text-white' : 'border-slate-100 hover:border-red-200'}`}>
              <span className={`text-[10px] font-black uppercase tracking-widest ${electionStatus === 'closed' ? 'text-red-200' : 'text-red-500'}`}>Tahap 3</span>
              <p className="font-bold">Selesai</p>
            </button>
          </div>

          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col md:flex-row items-end gap-4">
            <div className="flex-1 w-full">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Set Waktu Deadline (Optional)</label>
              <input type="datetime-local" value={electionEndDate} onChange={(e) => setElectionEndDate(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-black outline-none font-medium" />
            </div>
            <button onClick={updateEndDate} className="bg-black text-white px-8 py-3 rounded-xl font-bold hover:scale-105 transition-all flex items-center gap-2 shadow-lg shadow-black/20">
              <Save className="w-4 h-4" /> Simpan
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-900 flex items-center gap-2 tracking-tight">
            <Users className="w-5 h-5 text-blue-600" /> Database Pemilih
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Status Akun</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u: any) => (
                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={`https://ui-avatars.com/api/?name=${u.name}&background=random`} className="rounded-full w-10 h-10 border border-slate-200" alt="" />
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{u.name}</p>
                        <p className="text-xs text-slate-400">@{u.username} • <span className="uppercase text-[9px] font-black">{u.role}</span></p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => toggleVerifyUser(u.id, u.is_verified)} 
                      className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border transition-all ${u.is_verified === "1" || u.is_verified === 1 ? 'border-emerald-200 bg-emerald-50 text-emerald-600' : 'border-slate-200 bg-slate-50 text-slate-400'}`}>
                      {u.is_verified === "1" || u.is_verified === 1 ? <CheckCircle className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                      {u.is_verified === "1" || u.is_verified === 1 ? 'Verified' : 'Unverified'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleDeleteUser(u.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}