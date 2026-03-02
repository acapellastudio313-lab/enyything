import { useState, useEffect, FormEvent } from 'react';
import { User, Post, Candidate, ElectionStatus } from '../types';
import { 
  Trash2, Shield, UserCheck, Users, FileText, BarChart2, 
  AlertTriangle, Edit3, CheckCircle, X, Trophy, Clock, 
  RefreshCw, RotateCcw, Loader2, Save
} from 'lucide-react';
import { toast } from 'sonner';

// Firebase Imports
import { db, auth } from '../lib/firebase';
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  setDoc,
  getDoc,
  serverTimestamp
} from 'firebase/firestore';

export default function AdminDashboard({ user }: { user: User }) {
  const [stats, setStats] = useState({ users: 0, posts: 0, votes: 0, candidates: 0 });
  const [users, setUsers] = useState<User[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [electionStatus, setElectionStatus] = useState<ElectionStatus>('not_started');
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [electionEndDate, setElectionEndDate] = useState<string>('');
  
  // Real-time Sync dari Firestore (Puncak Kemudahan)
  useEffect(() => {
    setLoading(true);

    // 1. Sync Users
    const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      const userData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as any;
      setUsers(userData);
      setStats(prev => ({ ...prev, users: userData.length }));
    });

    // 2. Sync Candidates & Leaderboard
    const qCandidates = query(collection(db, "candidates"), orderBy("votes", "desc"));
    const unsubCandidates = onSnapshot(qCandidates, (snapshot) => {
      const candData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as any;
      setCandidates(candData);
      setStats(prev => ({ ...prev, candidates: candData.length }));
    });

    // 3. Sync Settings (Status & End Date)
    const unsubSettings = onSnapshot(doc(db, "settings", "election"), (docSnap) => {
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

  // FUNGSI KONTROL OTOMATIS
  const updateElectionStatus = async (status: ElectionStatus) => {
    setUpdatingStatus(true);
    try {
      await setDoc(doc(db, "settings", "election"), { status }, { merge: true });
      toast.success(`Status berhasil diubah ke ${status.replace('_', ' ')}`);
    } catch (err) {
      toast.error("Gagal memperbarui status di cloud.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const updateEndDate = async () => {
    try {
      await setDoc(doc(db, "settings", "election"), { endDate: electionEndDate }, { merge: true });
      toast.success("Waktu pemilihan diperbarui.");
    } catch (err) {
      toast.error("Gagal menyimpan waktu.");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Hapus pengguna ini secara permanen?')) return;
    try {
      await deleteDoc(doc(db, "users", userId));
      toast.success("User dihapus.");
    } catch (err) {
      toast.error("Gagal menghapus user.");
    }
  };

  const toggleVerifyUser = async (userId: string, currentStatus: number) => {
    try {
      await updateDoc(doc(db, "users", userId), { is_verified: currentStatus === 1 ? 0 : 1 });
      toast.success("Status verifikasi diperbarui.");
    } catch (err) {
      toast.error("Gagal mengubah verifikasi.");
    }
  };

  if (user.role !== 'admin') {
    return (
      <div className="p-12 text-center bg-white min-h-screen flex flex-col items-center justify-center">
        <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-slate-900 mb-2 tracking-tighter">AKSES DITOLAK</h1>
        <p className="text-slate-500">Hanya Admin yang diizinkan masuk ke laboratorium ini.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 bg-slate-50 min-h-screen">
      {/* Header Swiss Design */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center text-white">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter uppercase italic">Control Center</h1>
            <p className="text-slate-500 font-medium text-sm">Acapella Studio Lab • Admin Environment</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Pemilih', val: stats.users, icon: Users, color: 'bg-blue-500' },
          { label: 'Kandidat Aktif', val: stats.candidates, icon: Trophy, color: 'bg-amber-500' },
          { label: 'Status Sistem', val: electionStatus.toUpperCase(), icon: BarChart2, color: 'bg-emerald-500' },
        ].map((s, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5">
            <div className={`w-12 h-12 ${s.color} rounded-xl flex items-center justify-center text-white shadow-lg`}>
              <s.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{s.label}</p>
              <p className="text-2xl font-black text-slate-900">{s.val}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Election Controller */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-lg flex items-center gap-2 tracking-tight">
            <Clock className="w-5 h-5" /> Manajemen Waktu & Status
          </h2>
          {updatingStatus && <Loader2 className="w-5 h-5 animate-spin text-slate-400" />}
        </div>
        <div className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button onClick={() => updateElectionStatus('not_started')} disabled={electionStatus === 'not_started'}
              className={`p-4 rounded-2xl border-2 transition-all text-left ${electionStatus === 'not_started' ? 'border-black bg-slate-50' : 'border-slate-100 hover:border-slate-300'}`}>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tahap 1</span>
              <p className="font-bold text-slate-900">Persiapan</p>
            </button>
            <button onClick={() => updateElectionStatus('in_progress')} disabled={electionStatus === 'in_progress'}
              className={`p-4 rounded-2xl border-2 transition-all text-left ${electionStatus === 'in_progress' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100 hover:border-emerald-200'}`}>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Tahap 2</span>
              <p className="font-bold text-emerald-900">Voting Dimulai</p>
            </button>
            <button onClick={() => updateElectionStatus('closed')} disabled={electionStatus === 'closed'}
              className={`p-4 rounded-2xl border-2 transition-all text-left ${electionStatus === 'closed' ? 'border-red-500 bg-red-50' : 'border-slate-100 hover:border-red-200'}`}>
              <span className="text-[10px] font-black uppercase tracking-widest text-red-400">Tahap 3</span>
              <p className="font-bold text-red-900">Selesai / Final</p>
            </button>
          </div>

          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col md:flex-row items-end gap-4">
            <div className="flex-1 w-full">
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Deadline Pemilihan</label>
              <input type="datetime-local" value={electionEndDate} onChange={(e) => setElectionEndDate(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-black outline-none font-medium" />
            </div>
            <button onClick={updateEndDate} className="bg-black text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center gap-2">
              <Save className="w-4 h-4" /> Simpan Jadwal
            </button>
          </div>
        </div>
      </div>

      {/* User Management Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100">
          <h2 className="font-bold text-lg flex items-center gap-2 tracking-tight">
            <Users className="w-5 h-5" /> Database Pemilih
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black tracking-widest">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u: any) => (
                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-200 flex-shrink-0">
                        <img src={u.avatar || `https://ui-avatars.com/api/?name=${u.name}`} className="rounded-full w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{u.name}</p>
                        <p className="text-xs text-slate-400">@{u.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${u.role === 'admin' ? 'bg-black text-white' : 'bg-slate-100 text-slate-600'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => toggleVerifyUser(u.id, u.is_verified)} className={`flex items-center gap-1 text-xs font-bold ${u.is_verified ? 'text-emerald-500' : 'text-slate-300'}`}>
                      {u.is_verified ? <CheckCircle className="w-4 h-4" /> : <X className="w-4 h-4" />}
                      {u.is_verified ? 'Terverifikasi' : 'Belum Verifikasi'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleDeleteUser(u.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-all">
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