import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './lib/firebase';

// Pages
import Login from './pages/Login';
import Home from './pages/Home';
import AdminDashboard from './pages/AdminDashboard';
import InitDatabase from './pages/InitDatabase'; // File sakti yang baru dibuat

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Memantau status login Firebase secara Real-time
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          if (userDoc.exists()) {
            setUser({ id: firebaseUser.uid, ...userDoc.data() });
          } else {
            // Jika user ada di Auth tapi belum ada di Firestore
            setUser({ id: firebaseUser.uid, role: 'user', is_verified: '0' });
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Tampilan Loading yang Clean (Swiss Style)
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-black rounded-full animate-spin"></div>
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Loading System</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* RUTE SAKTI: Jalankan ini sekali di browser: website-anda.com/init-magic */}
        <Route path="/init-magic" element={<InitDatabase />} />

        {/* Auth Guard: Jika sudah login, lempar ke Home */}
        <Route 
          path="/login" 
          element={!user ? <Login /> : <Navigate to="/" />} 
        />
        
        {/* Protected Home: Hanya untuk user yang login */}
        <Route 
          path="/" 
          element={user ? <Home user={user} /> : <Navigate to="/login" />} 
        />
        
        {/* Protected Admin: Hanya jika role === 'admin' */}
        <Route 
          path="/admin" 
          element={
            user?.role === 'admin' 
              ? <AdminDashboard user={user} /> 
              : <Navigate to="/" />
          } 
        />

        {/* Fallback: Jika rute tidak ada, lempar ke Home */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}