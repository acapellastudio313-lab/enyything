import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import Login from './pages/Login';
import Home from './pages/Home';
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Memantau apakah user sudah login atau belum secara real-time
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        if (userDoc.exists()) {
          setUser({ id: firebaseUser.uid, ...userDoc.data() });
        } else {
          setUser(null); // Jika data profil di Firestore belum dibuat
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div className="p-10 text-center text-slate-500">Memuat Aplikasi...</div>;

  return (
    <Router>
      <Routes>
        {/* Jika Belum Login, Paksa ke Halaman Login */}
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
        
        {/* Halaman Utama Hanya untuk yang Sudah Login */}
        <Route path="/" element={user ? <Home user={user} /> : <Navigate to="/login" />} />
        
        {/* Halaman Admin Hanya untuk Role Admin */}
        <Route path="/admin" element={user?.role === 'admin' ? <AdminDashboard user={user} /> : <Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}